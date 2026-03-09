import React, { useEffect, useRef } from 'react';
import { Terminal, MessageSquare, Sparkles, CheckCircle2, Circle, Loader2 } from 'lucide-react';

// Color maps for agent names in the terminal
const AGENT_COLORS = {
  Planner: 'text-blue-400',
  Researcher: 'text-purple-400',
  Executor: 'text-amber-400',
  Reviewer: 'text-emerald-400',
  Finalizer: 'text-indigo-400',
  System: 'text-gray-400',
};

// Maps the active agent step to task assignments for the task breakdown panel
const TASK_DEFINITIONS = [
  { id: 1, title: 'Gather context & research', assigned: 'Researcher', activeAt: 1 },
  { id: 2, title: 'Execute and generate output', assigned: 'Executor', activeAt: 2 },
  { id: 3, title: 'Validate & quality-check', assigned: 'Reviewer', activeAt: 3 },
  { id: 4, title: 'Format & summarize', assigned: 'Finalizer', activeAt: 4 },
];

const CommandLine = ({ activeStep = -1, logs = [] }) => {
  const terminalEndRef = useRef(null);

  // Auto-scroll to the bottom of the terminal as new logs arrive
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs.length]);

  // Normalise a log entry's content to a displayable string
  const formatContent = (content) => {
    if (typeof content === 'string') return content;
    if (Array.isArray(content)) {
      return content
        .map((c) => (typeof c === 'string' ? c : c?.text || c?.content || JSON.stringify(c)))
        .join(' ');
    }
    if (typeof content === 'object' && content !== null) {
      return content.text || content.content || JSON.stringify(content);
    }
    return String(content);
  };

  const getAgentColor = (agent) => AGENT_COLORS[agent] || 'text-slate-400';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full pb-8">
      {/* ── Agent Communication Terminal ── */}
      <div className="lg:col-span-2 flex flex-col">
        <div className="flex items-center gap-2 mb-3 text-slate-700 font-bold text-sm uppercase tracking-wide">
          <Terminal size={18} />
          <span>Agent Communication Logs</span>
        </div>

        <div className="bg-[#0f111a] rounded-2xl min-h-[450px] max-h-[450px] w-full p-6 shadow-inner flex flex-col font-mono text-sm overflow-y-auto relative">
          {logs.length === 0 && activeStep === -1 ? (
            <div className="flex items-center justify-center h-full">
              <span className="text-slate-500 italic">Waiting for command...</span>
            </div>
          ) : logs.length === 0 && activeStep >= 0 ? (
            <div className="flex flex-col gap-3 pt-2">
              <div className="flex items-center gap-3 text-slate-500 animate-pulse">
                <div className="w-2 h-4 bg-slate-500" />
                <span className="text-sm">Agents are processing your request… responses will appear here as each agent completes.</span>
              </div>
              <div className="space-y-2 mt-4">
                {['Initializing AutoGen team…', 'Planner is decomposing your request…', 'Waiting for first agent response…'].map((msg, i) => (
                  <div key={i} className="flex items-start gap-4 opacity-40">
                    <span className="text-gray-500 w-28 flex-shrink-0 font-bold">[System]</span>
                    <span className="text-slate-400">{msg}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log, index) => (
                <div
                  key={index}
                  className="flex items-start gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300"
                >
                  <span className={`w-28 flex-shrink-0 font-bold ${getAgentColor(log.agent)}`}>
                    [{log.agent}]
                  </span>
                  <span className="text-slate-300 flex-1 break-words">
                    {formatContent(log.content)}
                  </span>
                </div>
              ))}

              {/* Blinking cursor while still processing */}
              {activeStep >= 0 && activeStep <= 4 && (
                <div className="flex items-center gap-2 text-slate-500 pt-2 animate-pulse">
                  <div className="w-2 h-4 bg-slate-500" />
                </div>
              )}

              <div ref={terminalEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* ── Task Breakdown Panel ── */}
      <div className="lg:col-span-1 flex flex-col">
        <div className="flex items-center gap-2 mb-3 text-slate-700 font-bold text-sm uppercase tracking-wide">
          <MessageSquare size={18} />
          <span>Task Breakdown</span>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl min-h-[450px] max-h-[450px] w-full p-6 shadow-sm flex flex-col overflow-y-auto">
          {activeStep === -1 ? (
            <div className="flex flex-col items-center justify-center text-center h-full">
              <div className="text-gray-300 mb-4">
                <Sparkles size={36} />
              </div>
              <p className="text-sm text-gray-400 max-w-[220px]">
                Tasks will appear here once the Planner decomposes your request.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="pb-4 border-b border-gray-100 mb-2">
                <h3 className="font-bold text-slate-900">Generated Plan</h3>
                <p className="text-xs text-gray-500 mt-1">Decomposed by The Planner</p>
              </div>

              <div className="space-y-3">
                {TASK_DEFINITIONS.map((task) => {
                  const isPending = activeStep < task.activeAt;
                  const isActive = activeStep === task.activeAt;
                  const isDone = activeStep > task.activeAt;

                  return (
                    <div
                      key={task.id}
                      className={`p-4 rounded-xl border transition-all duration-300 flex items-start gap-3 ${isActive
                        ? 'border-blue-200 bg-blue-50 shadow-sm'
                        : isDone
                          ? 'border-gray-100 bg-gray-50/50'
                          : 'border-dashed border-gray-200 opacity-50'
                        }`}
                    >
                      <div className="mt-0.5">
                        {isDone ? (
                          <CheckCircle2 size={18} className="text-emerald-500" />
                        ) : isActive ? (
                          <Loader2 size={18} className="text-blue-500 animate-spin" />
                        ) : (
                          <Circle size={18} className="text-gray-300" />
                        )}
                      </div>
                      <div>
                        <p className={`font-bold text-sm ${isDone ? 'text-gray-600 line-through' : 'text-slate-800'}`}>
                          {task.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Assigned: {task.assigned}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommandLine;