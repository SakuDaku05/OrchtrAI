import React, { useState, useEffect, useRef } from 'react';
import {
  Search, ShieldCheck, BrainCircuit, Check, X, Send, Clock,
  FileText, Calendar, TerminalSquare, AlertCircle, ChevronDown,
  MessageSquare, Image as ImageIcon, Code, Sparkles, Plus,
  Paperclip, Mic, Share, User, LayoutDashboard, Database
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

const systemCss = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

  :root {
    --bg-main: #fcfcfd;
    --bg-sidebar: #f8fafc;
    --bg-panel: #ffffff;
    --border-color: #e2e8f0;
    --border-light: #f1f5f9;
    --text-primary: #0f172a;
    --text-secondary: #64748b;
    --text-tertiary: #94a3b8;
    --accent-primary: #3b82f6;
    --accent-hover: #2563eb;
    --accent-dark: #0f172a;
    --success: #10b981;
    --danger: #ef4444;
    --font-sans: 'Inter', sans-serif;
    --font-mono: 'JetBrains Mono', Consolas, monospace;
    --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
    --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05);
    --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.05), 0 4px 6px -4px rgb(0 0 0 / 0.05);
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }
  
  body {
    font-family: var(--font-sans);
    background-color: var(--bg-main);
    color: var(--text-primary);
    height: 100vh;
    overflow: hidden;
  }

  .app-layout {
    display: flex;
    height: 100vh;
    width: 100vw;
  }

  /* --- LEFT SIDEBAR --- */
  .sidebar {
    width: 260px;
    background: var(--bg-sidebar);
    border-right: 1px solid var(--border-color);
    display: flex;
    flex-direction: column;
    padding: 20px 16px;
    flex-shrink: 0;
  }

  .sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24px;
    padding: 0 4px;
  }

  .logo {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 700;
    font-size: 18px;
    color: var(--text-primary);
  }

  .logo-icon {
    background: var(--accent-primary);
    color: white;
    padding: 4px;
    border-radius: 6px;
  }

  .btn-new-chat {
    background: var(--accent-dark);
    color: white;
    border: none;
    border-radius: 8px;
    padding: 10px 16px;
    font-size: 14px;
    font-weight: 500;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    cursor: pointer;
    width: 100%;
    margin-bottom: 24px;
    transition: opacity 0.2s;
  }
  .btn-new-chat:hover { opacity: 0.9; }

  .nav-group { margin-bottom: 24px; }
  .nav-title {
    font-size: 11px;
    font-weight: 600;
    color: var(--text-tertiary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 8px;
    padding: 0 8px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .nav-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 12px;
    border-radius: 6px;
    color: var(--text-secondary);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }
  .nav-item:hover { background: #f1f5f9; color: var(--text-primary); }
  .nav-item.active { background: white; color: var(--text-primary); box-shadow: var(--shadow-sm); font-weight: 600; }

  .upgrade-card {
    margin-top: auto;
    background: white;
    border: 1px solid var(--border-color);
    border-radius: 12px;
    padding: 16px;
    box-shadow: var(--shadow-sm);
  }
  .upgrade-header { display: flex; align-items: center; gap: 8px; font-weight: 600; font-size: 14px; margin-bottom: 4px; }
  .upgrade-desc { font-size: 12px; color: var(--text-secondary); margin-bottom: 12px; }
  .btn-upgrade {
    width: 100%;
    background: var(--accent-primary);
    color: white;
    border: none;
    border-radius: 6px;
    padding: 8px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
  }

  /* --- CENTER MAIN AREA --- */
  .main-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    background: var(--bg-main);
    position: relative;
  }

  .top-header {
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 32px;
    border-bottom: 1px solid transparent;
  }
  .breadcrumb { font-size: 14px; color: var(--text-secondary); display: flex; align-items: center; gap: 8px;}
  .header-actions { display: flex; align-items: center; gap: 16px; }
  .btn-share {
    display: flex; align-items: center; gap: 6px;
    padding: 6px 12px; border: 1px solid var(--border-color);
    border-radius: 6px; background: white; font-size: 13px; font-weight: 500;
    cursor: pointer;
  }
  .avatar {
    width: 32px; height: 32px; background: #e2e8f0; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
  }

  .content-scrollable {
    flex: 1;
    overflow-y: auto;
    padding: 0 32px 140px 32px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  /* Empty State Hero */
  .hero-section {
    margin-top: 8vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    max-width: 900px;
    width: 100%;
    animation: fadeIn 0.5s ease-out;
  }
  .hero-icon {
    width: 48px; height: 48px; background: var(--accent-primary);
    border-radius: 12px; display: flex; align-items: center; justify-content: center;
    color: white; margin-bottom: 24px;
    box-shadow: 0 8px 16px rgba(59, 130, 246, 0.2);
  }
  .hero-title { font-size: 32px; font-weight: 600; color: var(--text-primary); margin-bottom: 40px; }

  .starters-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    width: 100%;
  }

  .starter-card {
    background: white;
    border: 1px solid var(--border-color);
    border-radius: 16px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    transition: all 0.2s;
    cursor: pointer;
    box-shadow: var(--shadow-sm);
  }
  .starter-card:hover { border-color: #cbd5e1; box-shadow: var(--shadow-md); transform: translateY(-2px); }
  .sc-icon-wrap { margin-bottom: 16px; display: inline-flex; }
  .sc-title { font-size: 15px; font-weight: 600; margin-bottom: 8px; color: var(--text-primary); }
  .sc-desc { font-size: 13px; color: var(--text-secondary); line-height: 1.4; margin-bottom: 20px; flex: 1; }
  .sc-btn {
    background: #f1f5f9; color: var(--text-primary); border: none; border-radius: 8px;
    padding: 8px; font-size: 13px; font-weight: 500; width: 100%; transition: 0.2s;
  }
  .starter-card:hover .sc-btn { background: var(--accent-primary); color: white; }

  /* Active Chat Area */
  .chat-container {
    width: 100%;
    max-width: 800px;
    display: flex;
    flex-direction: column;
    gap: 32px;
    padding-top: 24px;
  }

  .message { display: flex; gap: 16px; }
  .msg-avatar {
    width: 32px; height: 32px; border-radius: 8px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
  }
  .msg-avatar.user { background: var(--text-primary); color: white; }
  .msg-avatar.ai { background: white; border: 1px solid var(--border-color); color: var(--accent-primary); }
  
  .msg-content { flex: 1; }
  .msg-author { font-size: 13px; font-weight: 600; margin-bottom: 4px; color: var(--text-primary); }
  .msg-bubble { font-size: 15px; line-height: 1.6; color: #334155; white-space: pre-wrap; }

  /* Floating Input Box */
  .input-wrapper {
    position: absolute;
    bottom: 32px;
    left: 50%;
    transform: translateX(-50%);
    width: 100%;
    max-width: 800px;
    background: white;
    border: 1px solid var(--border-color);
    border-radius: 16px;
    box-shadow: var(--shadow-lg);
    padding: 12px 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .input-row { display: flex; align-items: center; gap: 12px; }
  .input-field {
    flex: 1; border: none; font-size: 15px; font-family: var(--font-sans);
    color: var(--text-primary); outline: none; background: transparent;
  }
  .input-field::placeholder { color: var(--text-tertiary); }
  
  .icon-btn {
    background: transparent; border: none; color: var(--text-secondary);
    display: flex; align-items: center; justify-content: center; cursor: pointer; padding: 4px; border-radius: 6px;
  }
  .icon-btn:hover { background: #f1f5f9; color: var(--text-primary); }
  
  .send-btn {
    background: var(--text-primary); color: white; padding: 8px; border-radius: 8px; border: none; cursor: pointer;
  }
  .send-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .toggles-row { display: flex; gap: 8px; align-items: center; }
  .toggle-chip {
    display: flex; align-items: center; gap: 6px; padding: 6px 10px;
    background: var(--bg-main); border: 1px solid var(--border-light);
    border-radius: 6px; font-size: 12px; font-weight: 500; color: var(--text-secondary);
    cursor: pointer; transition: 0.2s;
  }
  .toggle-chip:hover, .toggle-chip.active { background: #f1f5f9; border-color: var(--border-color); color: var(--text-primary); }

  /* --- RIGHT SIDEBAR: AGENT MISSION CONTROL --- */
  .execution-pane {
    width: 380px;
    background: white;
    border-left: 1px solid var(--border-color);
    display: flex;
    flex-direction: column;
    animation: slideInRight 0.3s ease-out forwards;
    box-shadow: -4px 0 15px rgba(0,0,0,0.02);
  }

  @keyframes slideInRight {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }

  .exec-header {
    padding: 20px 24px;
    border-bottom: 1px solid var(--border-color);
    display: flex; align-items: center; gap: 12px;
  }
  .exec-title { font-size: 15px; font-weight: 600; }
  .status-badge {
    font-size: 11px; font-weight: 600; padding: 4px 8px; border-radius: 4px;
    background: #eff6ff; color: var(--accent-primary);
  }

  .exec-content {
    flex: 1; overflow-y: auto; padding: 24px; display: flex; flex-direction: column; gap: 32px;
  }

  .section-label { font-size: 12px; font-weight: 600; color: var(--text-tertiary); text-transform: uppercase; margin-bottom: 16px; letter-spacing: 0.5px;}

  /* Planner Timeline */
  .timeline { display: flex; flex-direction: column; gap: 16px; position: relative; }
  .timeline::before {
    content: ''; position: absolute; left: 15px; top: 10px; bottom: 10px;
    width: 1px; background: var(--border-color); z-index: 0;
  }

  .task-item { display: flex; gap: 16px; position: relative; z-index: 1; }
  .task-icon {
    width: 32px; height: 32px; border-radius: 50%; background: white; border: 1px solid var(--border-color);
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .task-item.active .task-icon { border-color: var(--accent-primary); color: var(--accent-primary); box-shadow: 0 0 0 4px #eff6ff; }
  .task-item.done .task-icon { background: var(--success); border-color: var(--success); color: white; }
  
  .task-info { flex: 1; padding-top: 6px; }
  .task-agent { font-size: 11px; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 4px; }
  .task-desc { font-size: 13px; color: var(--text-primary); line-height: 1.4; }

  /* Telemetry Terminal */
  .telemetry-box {
    background: #0f172a; border-radius: 8px; padding: 16px; height: 280px;
    overflow-y: auto; font-family: var(--font-mono); font-size: 11px;
    display: flex; flex-direction: column; gap: 8px; box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);
  }
  .log-line { display: flex; gap: 12px; line-height: 1.5; border-bottom: 1px solid #1e293b; padding-bottom: 6px;}
  .log-agent { font-weight: 600; min-width: 80px; }
  .l-planner { color: #60a5fa; }
  .l-researcher { color: #c084fc; }
  .l-executor { color: #facc15; }
  .l-reviewer { color: #34d399; }
  .l-user { color: #fb7185; }
  .l-system { color: #94a3b8; }
  .log-msg { color: #e2e8f0; flex: 1; white-space: pre-wrap; word-break: break-word;}

  /* HITL Card */
  .hitl-card {
    background: white; border: 1px solid var(--border-color); border-radius: 12px;
    overflow: hidden; box-shadow: var(--shadow-md); animation: fadeIn 0.4s ease;
  }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
  
  .hitl-header { background: #fffbeb; padding: 12px 16px; border-bottom: 1px solid #fde68a; display: flex; align-items: center; gap: 8px; color: #b45309; font-size: 13px; font-weight: 600; }
  .hitl-body { padding: 16px; }
  .hitl-desc { font-size: 13px; color: var(--text-secondary); margin-bottom: 12px; }
  
  .mock-ui { border: 1px solid var(--border-color); border-radius: 6px; background: #f8fafc; font-size: 13px; }
  .mock-row { padding: 8px 12px; border-bottom: 1px solid var(--border-color); display: flex; gap: 12px; }
  .mock-label { color: var(--text-tertiary); font-weight: 500; width: 60px; }
  .mock-val { color: var(--text-primary); font-weight: 500; }
  .mock-content { padding: 12px; line-height: 1.5; background: white; border-bottom-left-radius: 6px; border-bottom-right-radius: 6px;}
  
  .hitl-actions { display: flex; gap: 8px; padding: 16px; border-top: 1px solid var(--border-color); background: var(--bg-main); }
  .btn-action { flex: 1; padding: 8px; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; border: 1px solid transparent; }
  .btn-reject { background: white; border-color: var(--border-color); color: var(--text-primary); }
  .btn-reject:hover { background: #fef2f2; color: var(--danger); border-color: #fecaca; }
  .btn-approve { background: var(--text-primary); color: white; }
  .btn-approve:hover { opacity: 0.9; }
`;

export default function App() {
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [chat, setChat] = useState([]);
  const [sessionHistory, setSessionHistory] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);

  const loadHistory = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/history');
      const data = await res.json();
      setSessionHistory(data.sessions || []);
    } catch (e) {
      console.error("Failed to load history", e);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistoricalSession = async (id) => {
    try {
      const res = await fetch(`http://localhost:8000/api/workflow/${id}`);
      if (!res.ok) return;
      const data = await res.json();

      setSessionId(data.session_id);
      setSessionActive(true);
      setIsProcessing(data.status === 'ACTIVE');
      setApprovalPending(data.status === 'PAUSED_FOR_HITL');
      setWorkflowCompleted(data.status === 'COMPLETED' || data.status === 'FAILED');

      const mappedChat = (data.chat_history || [])
        .filter(item => item.role === 'user' || item.agent === 'Finalizer')
        .map((item, idx) => ({
          id: idx,
          role: item.role === 'user' ? 'user' : 'ai',
          agent: item.agent,
          content: item.content.replace('STATUS: PENDING_APPROVAL', '').trim()
        }));
      setChat(mappedChat);

      const mappedLogs = (data.chat_history || []).map(item => ({
        agent: item.agent,
        msg: item.content
      }));
      setLogs(mappedLogs);
    } catch (e) {
      console.error("Failed to load session", e);
    }
  };

  // Mission Control State
  const [tasks, setTasks] = useState([]);
  const [logs, setLogs] = useState([]);
  const [approvalPending, setApprovalPending] = useState(false);
  const [workflowCompleted, setWorkflowCompleted] = useState(false);
  const [toggles, setToggles] = useState({ pageIndex: true, deepResearch: false, humanApproval: true });

  const logsEndRef = useRef(null);

  // Ref for polling interval
  const pollInterval = useRef(null);

  useEffect(() => {
    if (logsEndRef.current) logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Polling hook for workflow state
  useEffect(() => {
    let interval;
    if (sessionActive && sessionId && (isProcessing || approvalPending)) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`http://localhost:8000/api/workflow/${sessionId}`);
          if (!res.ok) return;
          const data = await res.json();

          const mappedLogs = (data.chat_history || []).map(item => ({
            agent: item.agent,
            msg: item.content
          }));
          setLogs(mappedLogs);

          const mappedChat = (data.chat_history || [])
            .filter(item => item.role === 'user' || item.agent === 'Finalizer')
            .map((item, idx) => ({
              id: idx,
              role: item.role === 'user' ? 'user' : 'ai',
              agent: item.agent,
              content: item.content.replace('STATUS: PENDING_APPROVAL', '').trim()
            }));
          setChat(mappedChat);

          if (data.status === 'PAUSED_FOR_HITL' && !approvalPending && !workflowCompleted) {
            setApprovalPending(true);
            setIsProcessing(false);
          } else if (data.status === 'COMPLETED' || data.status === 'FAILED') {
            setWorkflowCompleted(true);
            setIsProcessing(false);
            setApprovalPending(false);
            // Refresh history sidebar when a session finishes
            loadHistory();
          }
        } catch (e) {
          console.error("Polling error:", e);
        }
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [sessionActive, sessionId, isProcessing, approvalPending, workflowCompleted]);

  // Speech Recognition Setup
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => (prev ? prev + ' ' : '') + transcript);
      };

      recognitionRef.current.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const continueWorkflow = async () => {
    if (!input.trim() || isProcessing) return;

    const currentInput = input;
    setChat(prev => [...prev, { id: Date.now(), role: 'user', content: currentInput }]);
    setInput('');
    setIsProcessing(true);
    setLogs(prev => [...prev, { agent: 'System', msg: 'Submitting follow-up prompt to existing session...' }]);
    setApprovalPending(false);
    setWorkflowCompleted(false);

    try {
      const res = await fetch('http://localhost:8000/api/workflow/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, message: currentInput })
      });
      if (!res.ok) throw new Error("Failed to send message");
    } catch (e) {
      setLogs(prev => [...prev, { agent: 'System', msg: `Failed to send message: ${e.message}` }]);
      setIsProcessing(false);
    }
  };

  const handleSubmit = () => {
    if (sessionActive && sessionId) {
      continueWorkflow();
    } else {
      startWorkflow();
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    let targetSessionId = sessionId;
    if (!targetSessionId) {
      targetSessionId = "ORCH-" + Math.random().toString(36).substring(2, 10).toUpperCase();
      setSessionId(targetSessionId);
      setSessionActive(true);
      setLogs([{ agent: 'System', msg: `Session initialized for document upload: ${targetSessionId}` }]);
    }

    setIsUploading(true);
    setChat(prev => [...prev, { id: Date.now(), role: 'user', content: `[Uploading Document: ${file.name}...]` }]);

    const formData = new FormData();
    formData.append('session_id', targetSessionId);
    formData.append('file', file);

    try {
      const res = await fetch('http://localhost:8000/api/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        setChat(prev => prev.map(m => m.content.includes(file.name) ? { ...m, content: `[Uploaded & Indexed: ${file.name} (${data.chunks_processed} pages)]` } : m));
      } else {
        throw new Error(data.detail || data.message || "Upload failed");
      }
    } catch (err) {
      setChat(prev => prev.map(m => m.content.includes(file.name) ? { ...m, content: `[Failed: ${file.name} - ${err.message}]` } : m));
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleStarterClick = (text) => {
    setInput(text);
  };

  const startWorkflow = async () => {
    if (!input.trim() || isProcessing) return;

    const currentInput = input;
    setChat([{ id: Date.now(), role: 'user', content: currentInput }]);
    setInput('');
    setIsProcessing(true);
    setSessionActive(true);
    setTasks([]);
    setLogs([{ agent: 'System', msg: 'Submitting workflow request to backend...' }]);
    setApprovalPending(false);
    setWorkflowCompleted(false);

    try {
      const res = await fetch('http://localhost:8000/api/workflow/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: currentInput })
      });
      const data = await res.json();
      setSessionId(data.session_id);
      setLogs([{ agent: 'System', msg: `Workflow initialized. Session ID: ${data.session_id}. Waiting for agent execution...` }]);
    } catch (e) {
      setLogs([{ agent: 'System', msg: `Failed to connect to backend: ${e.message}` }]);
      setIsProcessing(false);
    }
  };

  const handleApprove = async () => {
    try {
      setApprovalPending(false);
      setIsProcessing(true);
      setLogs(prev => [...prev, { agent: 'System', msg: 'HITL Override: APPROVED. Sending to backend...' }]);
      await fetch('http://localhost:8000/api/workflow/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, approved: true, feedback: '' })
      });
    } catch (e) {
      console.error(e);
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    try {
      setApprovalPending(false);
      setIsProcessing(true);
      setLogs(prev => [...prev, { agent: 'System', msg: 'HITL Override: REJECTED. Sending adjustments to backend...' }]);
      await fetch('http://localhost:8000/api/workflow/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, approved: false, feedback: 'User rejected the draft. Please adjust the plan.' })
      });
    } catch (e) {
      console.error(e);
      setIsProcessing(false);
    }
  };

  return (
    <>
      <style>{systemCss}</style>
      <div className="app-layout">

        {/* --- LEFT SIDEBAR --- */}
        <aside className="sidebar">
          <div className="sidebar-header">
            <div className="logo">
              <div className="logo-icon"><BrainCircuit size={18} /></div>
              OrchestrAI
            </div>
            <LayoutDashboard size={18} color="var(--text-secondary)" />
          </div>

          <button className="btn-new-chat" onClick={() => window.location.reload()}>
            <Plus size={16} /> New Workflow
          </button>

          <div className="nav-group">
            <div className="nav-item active"><MessageSquare size={16} /> Current Session</div>
          </div>

          <div className="sidebar-title" style={{ marginTop: '20px', padding: '0 12px', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>Recent Workflows</div>
          <div className="history-list" style={{ flex: 1, overflowY: 'auto' }}>
            {sessionHistory.map(session => (
              <div
                key={session.session_id}
                className="nav-item"
                style={{ opacity: 0.8, cursor: 'pointer', marginBottom: '4px' }}
                onClick={() => loadHistoricalSession(session.session_id)}
              >
                <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '13px' }}>
                  {session.initial_prompt}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* --- MAIN CENTER CANVAS --- */}
        <main className="main-area">
          <header className="top-header">
            <div className="breadcrumb">Workflows / Active / <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>New Session</span></div>
            <div className="header-actions">
              <button className="btn-share"><Share size={14} /> Share</button>
              <div className="avatar"><User size={18} color="var(--text-secondary)" /></div>
            </div>
          </header>

          <div className="content-scrollable">
            {!sessionActive ? (
              <div className="hero-section">
                <div className="hero-icon"><BrainCircuit size={24} /></div>
                <h1 className="hero-title">What workflow do you want to automate?</h1>

                <div className="starters-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                  {[
                    { title: 'Meeting Scheduler', desc: 'Agents coordinate to find slots and email invites automatically.', icon: Calendar, color: '#3b82f6' },
                    { title: 'Information Research', desc: 'Synthesize documentation into a summarized insight.', icon: Search, color: '#8b5cf6' },
                  ].map((card, i) => (
                    <div key={i} className="starter-card" onClick={() => handleStarterClick(card.title)}>
                      <div className="sc-icon-wrap" style={{ color: card.color }}>
                        <card.icon size={20} />
                      </div>
                      <div className="sc-title">{card.title}</div>
                      <div className="sc-desc">{card.desc}</div>
                      <button className="sc-btn">Get started</button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="chat-container">
                {chat.map(msg => (
                  <div key={msg.id} className="message" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
                    <div className={`msg-avatar ${msg.role}`}>
                      {msg.role === 'user' ? <User size={16} /> : <BrainCircuit size={16} />}
                    </div>
                    <div className="msg-content">
                      <div className="msg-author">{msg.role === 'user' ? 'You' : (msg.agent || 'OrchestrAI System')}</div>
                      <div className="msg-bubble markdown-body" style={{ whiteSpace: msg.role === 'user' ? 'pre-wrap' : 'normal', fontFamily: 'inherit' }}>
                        {msg.role === 'user' ? msg.content : <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>{msg.content}</ReactMarkdown>}
                      </div>
                    </div>
                  </div>
                ))}
                {isProcessing && !approvalPending && (
                  <div className="message">
                    <div className="msg-avatar ai"><Clock size={16} style={{ animation: 'spin 2s linear infinite' }} /></div>
                    <div className="msg-content">
                      <div className="msg-author">OrchestrAI System</div>
                      <div className="msg-bubble" style={{ color: 'var(--text-secondary)' }}>Agents are executing the workflow...</div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Floating Input Area */}
          <div className="input-wrapper">
            <div className="toggles-row">
              <div className={`toggle-chip ${toggles.humanApproval ? 'active' : ''}`} onClick={() => setToggles(p => ({ ...p, humanApproval: !p.humanApproval }))}>
                <ShieldCheck size={12} /> HITL Approval Required
              </div>
            </div>
            <div className="input-row">
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} style={{ display: 'none' }} accept=".txt,.pdf,.md,.csv" />
              <button className="icon-btn" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                <Paperclip size={18} />
              </button>
              <input
                type="text"
                className="input-field"
                placeholder="Declare workflow objective here..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                disabled={isProcessing}
              />
              <button className="icon-btn" onClick={toggleListening} title={isListening ? "Listening..." : "Click to speak"}>
                <Mic size={18} color={isListening ? "var(--danger)" : "var(--text-secondary)"} />
              </button>
              <button className="send-btn" onClick={handleSubmit} disabled={!input.trim() || isProcessing}>
                <Send size={16} />
              </button>
            </div>
          </div>
        </main>

        {/* --- RIGHT SIDEBAR: MISSION CONTROL --- */}
        {sessionActive && (
          <aside className="execution-pane">
            <div className="exec-header">
              <BrainCircuit size={18} color="var(--text-primary)" />
              <div className="exec-title">Agent Execution</div>
              <div className="status-badge" style={{ background: workflowCompleted ? 'var(--success-bg)' : '#eff6ff', color: workflowCompleted ? 'var(--success)' : 'var(--accent-primary)' }}>
                {workflowCompleted ? 'COMPLETED' : approvalPending ? 'PAUSED' : 'RUNNING'}
              </div>
            </div>

            <div className="exec-content">

              {/* Timeline */}
              <div>
                <div className="section-label">Workflow Graph</div>
                <div className="timeline">
                  {tasks.map(t => (
                    <div key={t.id} className={`task-item ${t.status}`}>
                      <div className="task-icon">
                        {t.status === 'done' ? <Check size={14} /> : <t.icon size={14} />}
                      </div>
                      <div className="task-info">
                        <div className="task-agent">{t.agent} Agent</div>
                        <div className="task-desc">{t.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Terminal */}
              <div>
                <div className="section-label">Live Telemetry</div>
                <div className="telemetry-box">
                  {logs.map((log, i) => (
                    <div key={i} className="log-line">
                      <span className={`log-agent l-${log.agent?.toLowerCase()}`}>[{log.agent}]</span>
                      <span className="log-msg">{log.msg}</span>
                    </div>
                  ))}
                  {!workflowCompleted && !approvalPending && <div className="log-line"><span className="cursor" style={{ display: 'inline-block', width: '6px', height: '12px', background: '#94a3b8', animation: 'blink 1s step-end infinite' }}></span></div>}
                  <div ref={logsEndRef} />
                </div>
              </div>

              {/* HITL Card */}
              {approvalPending && (
                <div className="hitl-card">
                  <div className="hitl-header"><AlertCircle size={14} /> ACTION REQUIRED</div>
                  <div className="hitl-body">
                    <div className="hitl-desc">Reviewer agent has staged the workflow and is requesting human approval to proceed.</div>
                  </div>
                  <div className="hitl-actions">
                    <button className="btn-action btn-reject" onClick={handleReject}><X size={14} /> Reject</button>
                    <button className="btn-action btn-approve" onClick={handleApprove}><Check size={14} /> Approve</button>
                  </div>
                </div>
              )}

            </div>
          </aside>
        )}

      </div>
    </>
  );
}
