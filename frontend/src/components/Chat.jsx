import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader2, Sparkles, CheckCircle2, ChevronRight, AlertCircle, RefreshCw } from 'lucide-react';

// ── Formatted Output Renderer (reused from HITLModal) ─────────────────────────
function FormattedOutput({ text }) {
  if (!text) return null;

  const lines = text.split('\n');
  const elements = [];
  let i = 0;

  const inlineBold = (str, key) => {
    const parts = str.split(/(\*\*[^*]+\*\*)/g);
    if (parts.length === 1) return str;
    return parts.map((part, pi) => {
      if (/^\*\*[^*]+\*\*$/.test(part)) {
        return <strong key={`${key}-${pi}`} className="font-semibold text-slate-900">{part.replace(/\*\*/g, '')}</strong>;
      }
      return part;
    });
  };

  while (i < lines.length) {
    const raw = lines[i];
    const trimmed = raw.trim();
    if (trimmed === '') { i++; continue; }

    // Section heading: "**...**" alone OR "## ..."
    if (/^\*\*(.+)\*\*$/.test(trimmed) || /^#{1,3}\s/.test(trimmed)) {
      const label = trimmed.replace(/^\*\*|\*\*$/g, '').replace(/^#+\s/, '');
      elements.push(
        <div key={i} className="flex items-center gap-2 mt-4 mb-1.5 first:mt-0">
          <div className="w-1 h-4 rounded-full bg-indigo-500" />
          <p className="font-bold text-slate-900 text-[13px] tracking-wide uppercase">{label}</p>
        </div>
      );
      i++; continue;
    }

    // Numbered item: "1. ..."
    if (/^\d+\.\s/.test(trimmed)) {
      const num = trimmed.match(/^(\d+)/)[1];
      const content = trimmed.replace(/^\d+\.\s/, '');
      elements.push(
        <div key={i} className="flex items-start gap-2.5 py-1 pl-1">
          <span className="mt-[3px] w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-[11px] font-bold flex items-center justify-center flex-shrink-0">
            {num}
          </span>
          <p className="text-slate-700 text-sm leading-relaxed">{inlineBold(content, i)}</p>
        </div>
      );
      i++; continue;
    }

    // Bullet: "- " / "• " / "* "
    if (/^[-•*]\s/.test(trimmed)) {
      const content = trimmed.replace(/^[-•*]\s/, '');
      elements.push(
        <div key={i} className="flex items-start gap-2 py-1 pl-1">
          <ChevronRight size={14} className="mt-1 text-indigo-400 flex-shrink-0" />
          <p className="text-slate-700 text-sm leading-relaxed">{inlineBold(content, i)}</p>
        </div>
      );
      i++; continue;
    }

    // Default paragraph
    elements.push(
      <p key={i} className="text-slate-700 text-sm leading-relaxed py-0.5">
        {inlineBold(trimmed, i)}
      </p>
    );
    i++;
  }

  return <div className="space-y-0.5">{elements}</div>;
}

// ── Chat Component ────────────────────────────────────────────────────────────

const Chat = ({ messages, onSend, status }) => {
  const [input, setInput] = useState('');
  const endRef = useRef(null);

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, status]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || status === 'ACTIVE') return;
    onSend(input);
    setInput('');
  };

  const isHitl = status === 'PAUSED_FOR_HITL';
  const isInputDisabled = status === 'ACTIVE';

  return (
    <div className="flex flex-col h-full min-h-[500px] border border-gray-200 bg-white rounded-3xl overflow-hidden shadow-sm">

      {/* ── Header ── */}
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-indigo-500" />
          <h2 className="font-bold text-slate-800 text-sm">Orchestration Chat</h2>
        </div>

        {status === 'ACTIVE' && (
          <span className="flex items-center gap-1.5 text-xs text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full font-medium border border-blue-100 animate-pulse">
            <Loader2 size={12} className="animate-spin" /> Agents working...
          </span>
        )}
        {status === 'PAUSED_FOR_HITL' && (
          <span className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full font-medium border border-amber-100 animate-pulse">
            <AlertCircle size={12} /> Awaiting your decision
          </span>
        )}
      </div>

      {/* ── Message History Area ── */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 bg-[#f8fafc]">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto opacity-60">
            <div className="w-16 h-16 bg-indigo-100 text-indigo-500 rounded-3xl flex items-center justify-center mb-4 transform -rotate-6">
              <Sparkles size={28} />
            </div>
            <h3 className="text-lg font-bold text-slate-700 mb-2">What should the team do?</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Describe your task, and our multi-agent team will plan, research, execute, and review the final result for you.
            </p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-3xl px-5 py-3.5 ${msg.role === 'user'
                    ? 'bg-slate-900 text-white rounded-br-sm shadow-md'
                    : 'bg-white border border-gray-200 text-slate-800 rounded-bl-sm shadow-sm'
                  }`}
              >
                {/* Format system/agent messages nicely */}
                {msg.role === 'system' ? (
                  <div className="space-y-4">
                    {/* Reusing FormattedOutput to style the Reviewer's message */}
                    <div className="prose-sm">
                      <FormattedOutput text={msg.content} />
                    </div>

                    {/* Appended HITL instruction block */}
                    {msg.isHitlPrompt && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-3 text-amber-800 text-[13px]">
                          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-semibold mb-1">Human Approval Required</p>
                            <p className="opacity-90">
                              Write <strong>"Approve"</strong> to finalize this output.<br />
                              If you write anything else, the loop will restart with your feedback.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>

      {/* ── Input Area ── */}
      <div className="p-4 bg-white border-t border-gray-100 flex-shrink-0">
        <form onSubmit={handleSubmit} className="relative flex items-center gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isInputDisabled}
            placeholder={
              isHitl
                ? "Type 'Approve' to finalize, or provide feedback to restart..."
                : "Ask the team to do something..."
            }
            className={`flex-1 pl-5 pr-12 py-3.5 rounded-2xl border text-[15px] transition-all focus:outline-none ${isHitl
                ? 'bg-amber-50/30 border-amber-200 text-amber-900 placeholder:text-amber-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20'
                : 'bg-gray-50 border-gray-200 text-slate-800 placeholder:text-gray-400 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-400/20'
              } disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200`}
          />
          <button
            type="submit"
            disabled={isInputDisabled || !input.trim()}
            className={`absolute right-2 p-2 rounded-xl transition-all ${isInputDisabled || !input.trim()
                ? 'text-gray-400 bg-transparent'
                : isHitl
                  ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-sm'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
              }`}
          >
            {isInputDisabled ? <Loader2 size={18} className="animate-spin" /> : isHitl ? <RefreshCw size={18} /> : <Send size={18} />}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chat;