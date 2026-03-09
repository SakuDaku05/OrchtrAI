import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { getHistory, getWorkflowDetail, deleteWorkflow } from '../lib/api';
import {
  Search, CheckCircle2, XCircle, Clock, Calendar, ChevronRight,
  Activity, Loader2, Inbox, AlertCircle, X, Bot, Terminal,
  Sparkles, ChevronLeft, Trash2
} from 'lucide-react';

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_META = {
  COMPLETED: { label: 'Completed', icon: CheckCircle2, cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  FAILED: { label: 'Failed', icon: XCircle, cls: 'bg-red-50 text-red-700 border border-red-200' },
  ACTIVE: { label: 'Active', icon: Activity, cls: 'bg-blue-50 text-blue-700 border border-blue-200' },
  PAUSED_FOR_HITL: { label: 'Awaiting Approval', icon: Clock, cls: 'bg-amber-50 text-amber-700 border border-amber-200' },
};

const AGENT_COLORS = ['bg-blue-500', 'bg-purple-500', 'bg-orange-500', 'bg-emerald-500'];
const AGENT_INITIALS = ['P', 'R', 'E', 'R'];

const AGENT_MESSAGE_COLORS = {
  Planner: { dot: 'bg-blue-500', label: 'text-blue-600', card: 'border-blue-100 bg-blue-50/40' },
  Researcher: { dot: 'bg-purple-500', label: 'text-purple-600', card: 'border-purple-100 bg-purple-50/40' },
  Executor: { dot: 'bg-orange-500', label: 'text-orange-600', card: 'border-orange-100 bg-orange-50/40' },
  Reviewer: { dot: 'bg-emerald-500', label: 'text-emerald-600', card: 'border-emerald-100 bg-emerald-50/40' },
  System: { dot: 'bg-gray-400', label: 'text-gray-500', card: 'border-gray-100 bg-gray-50/40' },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const calcDuration = (created, updated) => {
  try {
    const ms = new Date(updated) - new Date(created);
    if (ms < 0 || isNaN(ms)) return '—';
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  } catch { return '—'; }
};

const formatDate = (isoStr) => {
  try {
    return new Date(isoStr).toLocaleString('en-IN', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return isoStr || '—'; }
};

const formatContent = (content) => {
  if (typeof content === 'string') return content;
  if (Array.isArray(content))
    return content.map((c) => (typeof c === 'string' ? c : c?.text || c?.content || c?.output || JSON.stringify(c))).join('\n');
  if (content && typeof content === 'object')
    return content.text || content.content || JSON.stringify(content, null, 2);
  return String(content ?? '');
};

// ── Detail Slide-Over ─────────────────────────────────────────────────────────

const DetailPanel = ({ sessionId, task, onClose }) => {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!sessionId) return;
    setLoading(true);
    setError(null);
    getWorkflowDetail(sessionId)
      .then((data) => { setDetail(data); setLoading(false); })
      .catch((err) => { setError(err.message); setLoading(false); });
  }, [sessionId]);

  const meta = STATUS_META[task?.status] || { label: task?.status, icon: Activity, cls: 'bg-gray-100 text-gray-600' };
  const StatusIcon = meta.icon;
  const chatHistory = detail?.chat_history || [];

  return (
    <>
      {/* ── Backdrop ── */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        style={{ animation: 'fadeIn 0.2s ease both' }}
      />

      {/* ── Slide-over panel ── */}
      <div
        className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-2xl flex flex-col bg-white shadow-2xl"
        style={{ animation: 'slideInRight 0.3s cubic-bezier(0.16,1,0.3,1) both' }}
      >
        {/* Header */}
        <div className="flex items-start gap-4 px-7 py-5 border-b border-gray-100 bg-gradient-to-r from-slate-900 to-slate-800">
          <button
            onClick={onClose}
            className="mt-0.5 text-slate-400 hover:text-white transition-colors flex-shrink-0"
          >
            <ChevronLeft size={22} />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-base leading-tight truncate" title={task?.original_prompt}>
              {task?.original_prompt || sessionId}
            </p>
            <p className="text-slate-500 font-mono text-xs mt-1">{sessionId}</p>
          </div>
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold flex-shrink-0 ${meta.cls}`}>
            <StatusIcon size={13} />
            {meta.label}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors flex-shrink-0">
            <X size={20} />
          </button>
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-6 px-7 py-3 bg-slate-50 border-b border-gray-100 text-xs text-gray-500 font-medium">
          <span className="flex items-center gap-1.5"><Calendar size={13} /> {formatDate(task?.created_at)}</span>
          <span className="flex items-center gap-1.5"><Clock size={13} /> Duration: {calcDuration(task?.created_at, task?.updated_at)}</span>
          <span className="flex items-center gap-1.5"><Bot size={13} /> {chatHistory.length} messages</span>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto px-7 py-6">
          {loading ? (
            <div className="flex items-center justify-center gap-3 py-24 text-gray-400">
              <Loader2 size={22} className="animate-spin" />
              <span>Loading session…</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-3 py-24 text-red-400">
              <AlertCircle size={32} />
              <p className="font-medium">Failed to load session</p>
              <p className="text-sm text-gray-400">{error}</p>
            </div>
          ) : chatHistory.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-24 text-gray-400">
              <Terminal size={36} />
              <p className="font-medium">No messages recorded for this session.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Section heading */}
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={14} className="text-indigo-400" />
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Agent Conversation</span>
                <div className="flex-1 h-px bg-gray-100 ml-1" />
              </div>

              {chatHistory.map((msg, i) => {
                const colors = AGENT_MESSAGE_COLORS[msg.agent] || AGENT_MESSAGE_COLORS.System;
                const text = formatContent(msg.content);
                const isToolCall = msg.type === 'ToolCallRequestEvent' || msg.type === 'ToolCallExecutionEvent';

                return (
                  <div key={i} className={`rounded-2xl border p-4 transition-all ${colors.card} ${isToolCall ? 'opacity-60' : ''}`}>
                    {/* Agent badge */}
                    <div className="flex items-center gap-2 mb-2.5">
                      <div className={`w-2 h-2 rounded-full ${colors.dot} flex-shrink-0`} />
                      <span className={`text-xs font-bold uppercase tracking-wide ${colors.label}`}>{msg.agent}</span>
                      {isToolCall && (
                        <span className="text-xs bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full">tool call</span>
                      )}
                    </div>
                    {/* Content */}
                    <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap break-words">
                      {text || <span className="italic text-slate-400">No text content</span>}
                    </p>
                  </div>
                );
              })}

              {/* Reviewer final output highlight */}
              {(() => {
                const reviewerMsgs = chatHistory.filter((m) => m.agent === 'Reviewer');
                const lastReviewer = reviewerMsgs[reviewerMsgs.length - 1];
                if (!lastReviewer) return null;
                const finalText = formatContent(lastReviewer.content)
                  .replace(/STATUS:\s*PENDING_APPROVAL/gi, '').trim();
                if (!finalText) return null;
                return (
                  <div className="mt-6 rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 overflow-hidden">
                    <div className="flex items-center gap-2 px-5 py-3 border-b border-emerald-200 bg-emerald-100/60">
                      <CheckCircle2 size={15} className="text-emerald-700" />
                      <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide">Final Output</span>
                      <span className="ml-auto text-xs text-emerald-600 bg-emerald-200 px-2 py-0.5 rounded-full">Reviewer Summary</span>
                    </div>
                    <div className="px-5 py-4">
                      <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">{finalText}</p>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn      { from { opacity:0 } to { opacity:1 } }
        @keyframes slideInRight { from { transform:translateX(100%) } to { transform:translateX(0) } }
      `}</style>
    </>
  );
};

// ── History Page ──────────────────────────────────────────────────────────────

const History = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);   // { sessionId, task }
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  useEffect(() => {
    getHistory()
      .then((data) => { setTasks(data); setLoading(false); })
      .catch((err) => { setError(err.message); setLoading(false); });
  }, []);

  const filtered = tasks.filter((t) =>
    (t.original_prompt || t.session_id || '').toLowerCase().includes(search.toLowerCase())
  );

  const openDetail = useCallback((task) => {
    setSelectedTask({ sessionId: task.session_id, task });
  }, []);

  const closeDetail = useCallback(() => setSelectedTask(null), []);

  const handleDeleteClick = (e, sessionId) => {
    e.stopPropagation(); // Prevent row click
    setDeleteConfirmId(sessionId);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await deleteWorkflow(deleteConfirmId);
      setTasks(prev => prev.filter(t => t.session_id !== deleteConfirmId));
      setDeleteConfirmId(null);
    } catch (err) {
      alert("Failed to delete session: " + err.message);
      setDeleteConfirmId(null);
    }
  };

  return (
    <div className="flex h-screen bg-[#f8fafc] font-sans">
      <Sidebar />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Navbar />

        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-6xl mx-auto">

            {/* Header */}
            <div className="flex items-end justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">Task History</h1>
                <p className="text-gray-500">Click any row to see the full agent conversation.</p>
              </div>
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search tasks..."
                  className="pl-10 pr-4 py-2 rounded-xl border border-gray-300 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors w-64 text-sm"
                />
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              {loading ? (
                <div className="flex items-center justify-center gap-3 py-24 text-gray-400">
                  <Loader2 size={24} className="animate-spin" /><span>Loading history…</span>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center gap-3 py-24 text-red-400">
                  <AlertCircle size={32} />
                  <p className="font-medium">Failed to load history</p>
                  <p className="text-sm text-gray-400">{error}</p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-24 text-gray-400">
                  <Inbox size={40} />
                  <p className="font-medium">No tasks found</p>
                  <p className="text-sm">Run your first orchestration from the Dashboard.</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                      <th className="px-6 py-4">Task</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Agents</th>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Duration</th>
                      <th className="px-6 py-4" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filtered.map((task) => {
                      const meta = STATUS_META[task.status] || { label: task.status, icon: Activity, cls: 'bg-gray-100 text-gray-600 border border-gray-200' };
                      const StatusIcon = meta.icon;
                      const agentCount = task.status === 'COMPLETED' ? 4 : task.status === 'FAILED' ? 2 : 3;
                      const isSelected = selectedTask?.sessionId === task.session_id;

                      return (
                        <tr
                          key={task.id || task.session_id}
                          onClick={() => openDetail(task)}
                          className={`transition-colors group cursor-pointer ${isSelected ? 'bg-indigo-50/60' : 'hover:bg-gray-50/60'}`}
                        >
                          <td className="px-6 py-5">
                            <p className="font-bold text-slate-900 truncate max-w-xs" title={task.original_prompt}>
                              {task.original_prompt || task.session_id}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5 font-mono">{task.session_id}</p>
                          </td>

                          <td className="px-6 py-5">
                            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${meta.cls}`}>
                              <StatusIcon size={14} />{meta.label}
                            </div>
                          </td>

                          <td className="px-6 py-5">
                            <div className="flex items-center">
                              {AGENT_INITIALS.slice(0, agentCount).map((initial, i) => (
                                <div
                                  key={i}
                                  className={`w-7 h-7 rounded-full ${AGENT_COLORS[i]} text-white flex items-center justify-center text-xs font-bold border-2 border-white ${i !== 0 ? '-ml-2' : ''} shadow-sm`}
                                >
                                  {initial}
                                </div>
                              ))}
                            </div>
                          </td>

                          <td className="px-6 py-5">
                            <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                              <Calendar size={16} className="text-gray-400" />{formatDate(task.created_at)}
                            </div>
                          </td>

                          <td className="px-6 py-5">
                            <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                              <Clock size={16} className="text-gray-400" />{calcDuration(task.created_at, task.updated_at)}
                            </div>
                          </td>

                          <td className="px-6 py-5 text-right flex items-center justify-end gap-3">
                            <button
                              onClick={(e) => handleDeleteClick(e, task.session_id)}
                              className="text-gray-300 hover:text-red-500 transition-colors p-1"
                              title="Delete Session"
                            >
                              <Trash2 size={18} />
                            </button>
                            <ChevronRight size={20} className={`transition-colors ${isSelected ? 'text-indigo-500' : 'text-gray-300 group-hover:text-black'}`} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Slide-over detail panel */}
      {selectedTask && (
        <DetailPanel
          sessionId={selectedTask.sessionId}
          task={selectedTask.task}
          onClose={closeDetail}
        />
      )}
      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" style={{ animation: 'fadeIn 0.2s ease both' }}>
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 transform transition-all" style={{ animation: 'slideInRight 0.3s cubic-bezier(0.16,1,0.3,1) both' }}>
            <div className="flex items-center gap-4 mb-4 text-red-600">
              <div className="bg-red-50 p-3 rounded-full">
                <AlertCircle size={28} />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Delete Task</h3>
            </div>
            <p className="text-slate-500 mb-6">
              Are you sure you want to delete this task session? All of the agent logs and generated content will be permanently lost. This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-5 py-2.5 rounded-xl font-medium text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-5 py-2.5 rounded-xl font-medium bg-red-600 hover:bg-red-700 text-white transition-colors shadow-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default History;