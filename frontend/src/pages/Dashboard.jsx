// src/pages/Dashboard.jsx
import React, { useState, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import Chat from '../components/Chat';
import Active from '../components/Active';
import CommandLine from '../components/CommandLine';
import { startWorkflow, streamWorkflow, approveWorkflow, getMcpConfigs } from '../lib/api';

const Dashboard = () => {
  const [activeStep, setActiveStep] = useState(-1);
  const [workflowStatus, setWorkflowStatus] = useState('IDLE'); // 'IDLE' | 'ACTIVE' | 'PAUSED_FOR_HITL' | 'COMPLETED'
  const [currentSessionId, setCurrentSessionId] = useState(null);

  // Terminal logs (from SSE)
  const [liveLogs, setLiveLogs] = useState([]);
  const allLogsRef = useRef([]);

  // Chat conversation UI state
  // [{ role: 'user' | 'system', content: string, isHitlPrompt?: boolean }]
  const [chatMessages, setChatMessages] = useState([]);

  const agentMap = { Planner: 0, Researcher: 1, Executor: 2, Reviewer: 3, Finalizer: 4 };

  // ── Output Extraction ────────────────────────────────────────────────────────

  const extractText = (raw) => {
    if (!raw && raw !== 0) return '';
    if (typeof raw === 'string') return raw;
    if (Array.isArray(raw))
      return raw.map((c) => (typeof c === 'string' ? c : c?.text || c?.content || c?.output || '')).join('\n');
    if (typeof raw === 'object')
      return raw.text || raw.content || raw.output || JSON.stringify(raw, null, 2);
    return String(raw);
  };

  const extractBestOutput = (extraLogs = []) => {
    const allLogs = [...allLogsRef.current, ...extraLogs];

    // First, prioritize the Finalizer output
    const finalizerMsgs = allLogs.filter((l) => typeof l.agent === 'string' && l.agent.toLowerCase() === 'finalizer');
    if (finalizerMsgs.length > 0) {
      let text = extractText(finalizerMsgs[finalizerMsgs.length - 1].content);
      return text.replace(/COMPLETE_WORKFLOW/g, '').trim();
    }

    // Fallback: search for Executor output for older workflows
    const executorMsgs = allLogs.filter((l) => typeof l.agent === 'string' && l.agent.toLowerCase() === 'executor');
    if (executorMsgs.length > 0) {
      let text = extractText(executorMsgs[executorMsgs.length - 1].content);
      return text.replace(/STATUS:\s*PENDING_APPROVAL/gi, '').replace(/COMPLETE_WORKFLOW/g, '').trim();
    }

    // Fallback: search across all logs bottom-up and avoid tool call payloads if possible
    for (let i = allLogs.length - 1; i >= 0; i--) {
      let text = extractText(allLogs[i].content);
      if (text.trim()) {
        return text.replace(/STATUS:\s*PENDING_APPROVAL/gi, '').replace(/COMPLETE_WORKFLOW/g, '').trim();
      }
    }
    return '';
  };

  // ── SSE stream ────────────────────────────────────────────────────────────────

  const openStream = (sessionId) => {
    // Pass the start point to avoid duplicate history logs upon reconnecting
    const startIdx = allLogsRef.current.length;
    const url = `/api/workflow/${sessionId}/stream?start=${startIdx}`;

    // We recreate streamWorkflow logic manually here to append the start param since it's hardcoded in api.js
    // Assuming backend runs on same host/port if using Vite proxy, or from env.
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    const eventSource = new EventSource(`${baseUrl}${url}`);

    eventSource.onmessage = (event) => {
      let streamData;
      try { streamData = JSON.parse(event.data); } catch { return; }

      const newLogs = streamData.new_logs || [];
      const status = streamData.status;

      if (newLogs.length > 0) {
        allLogsRef.current = [...allLogsRef.current, ...newLogs];
        setLiveLogs([...allLogsRef.current]);

        const latestLog = newLogs[newLogs.length - 1];
        if (agentMap[latestLog.agent] !== undefined) {
          setActiveStep(agentMap[latestLog.agent]);
        }
      }

      setWorkflowStatus(status);

      if (status === 'PAUSED_FOR_HITL') {
        eventSource.close();
        setActiveStep(5);
        const output = extractBestOutput(newLogs) || 'The Reviewer has finished processing your request. Please review the results above.';
        setChatMessages(prev => [...prev, { role: 'system', content: output, isHitlPrompt: true }]);
        return;
      }

      if (status === 'COMPLETED') {
        eventSource.close();
        setActiveStep(5);
        const output = extractBestOutput(newLogs);

        const messagesToAdd = [{ role: 'system', content: '✨ Workflow completed successfully.', isHitlPrompt: false }];
        if (output) {
          messagesToAdd.push({ role: 'system', content: output, isHitlPrompt: false });
        }

        setChatMessages(prev => [...prev, ...messagesToAdd]);
        return;
      }

      if (status === 'FAILED') {
        eventSource.close();
        setChatMessages(prev => [...prev, { role: 'system', content: 'Workflow failed. Check terminal for details.', isHitlPrompt: false }]);
        return;
      }
    };

    eventSource.onerror = () => {
      console.error('[SSE] Stream connection lost.');
      eventSource.close();
      setWorkflowStatus('FAILED');
    };
  };

  // ── Action Handlers ───────────────────────────────────────────────────────────

  const handleChatSend = async (inputText) => {
    if (!inputText.trim()) return;

    // If we are waiting for HITL approval, this input is the Accept/Reject decision
    if (workflowStatus === 'PAUSED_FOR_HITL') {
      const text = inputText.trim();
      setChatMessages(prev => [...prev, { role: 'user', content: text }]);

      const isApproval = text.toLowerCase() === 'approve';
      setWorkflowStatus('ACTIVE'); // locks input

      try {
        await approveWorkflow(currentSessionId, isApproval, text);
        // Restart stream for both approval and rejection to get the team's final output or feedback loop
        setActiveStep(0);
        openStream(currentSessionId);
      } catch (err) {
        console.error('Approve failed:', err);
        setWorkflowStatus('FAILED');
      }
      return;
    }

    // Otherwise, this is a brand new Orchestration request
    allLogsRef.current = [];
    setLiveLogs([]);
    setChatMessages([{ role: 'user', content: inputText.trim() }]);
    setActiveStep(0);
    setWorkflowStatus('ACTIVE');

    try {
      // Fetch active MCPs so they can be injected into the backend pipeline
      const mcpConfigs = await getMcpConfigs();
      const activeMcpIds = mcpConfigs.filter(c => c.is_active).map(c => c.id);

      const data = await startWorkflow(inputText.trim(), activeMcpIds);
      setCurrentSessionId(data.session_id);
      openStream(data.session_id);
    } catch (error) {
      console.error('Failed to start workflow:', error);
      setWorkflowStatus('FAILED');
      setChatMessages(prev => [...prev, { role: 'system', content: 'Failed to start workflow. Check server connection.' }]);
    }
  };

  return (
    <div className="flex h-screen bg-[#f8fafc] font-sans">
      <Sidebar />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Navbar />

        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="w-full max-w-[1200px] mx-auto flex flex-col gap-10">

            {/* Top section: Orchestration Chat */}
            <div className="flex flex-col min-h-[500px] max-h-[800px]">
              <Chat
                messages={chatMessages}
                onSend={handleChatSend}
                status={workflowStatus}
              />
            </div>

            {/* Middle section: Active Orchestration (Graph) */}
            <div className="w-full">
              <Active activeStep={activeStep} />
            </div>

            {/* Bottom section: Log Terminal and Task Breakdown */}
            <div className="w-full mb-8">
              <CommandLine activeStep={activeStep} logs={liveLogs} />
            </div>

          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;