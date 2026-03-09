// src/components/HITLModal.jsx
import React, { useState, useEffect } from 'react';
import {
    CheckCircle2, AlertTriangle, Sparkles,
    ThumbsUp, ThumbsDown, RotateCcw, ChevronRight,
    PartyPopper, X
} from 'lucide-react';

// ── Formatted Output Renderer ─────────────────────────────────────────────────

function FormattedOutput({ text }) {
    if (!text) return (
        <p className="text-slate-400 text-sm italic">No output captured — check the terminal logs.</p>
    );

    const lines = text.split('\n');
    const elements = [];
    let i = 0;

    while (i < lines.length) {
        const raw = lines[i];
        const trimmed = raw.trim();

        if (trimmed === '') { i++; continue; }

        // Section heading: "**...**" alone OR "## ..."
        if (/^\*\*(.+)\*\*$/.test(trimmed) || /^#{1,3}\s/.test(trimmed)) {
            const label = trimmed.replace(/^\*\*|\*\*$/g, '').replace(/^#+\s/, '');
            elements.push(
                <div key={i} className="flex items-center gap-2 mt-5 mb-1.5 first:mt-0">
                    <div className="w-1 h-5 rounded-full bg-indigo-500" />
                    <p className="font-bold text-slate-900 text-sm tracking-wide uppercase">{label}</p>
                </div>
            );
            i++; continue;
        }

        // Numbered item: "1. ..."
        if (/^\d+\.\s/.test(trimmed)) {
            const num = trimmed.match(/^(\d+)/)[1];
            const content = trimmed.replace(/^\d+\.\s/, '');
            const inlined = inlineBold(content, i);
            elements.push(
                <div key={i} className="flex items-start gap-3 py-1.5 pl-1">
                    <span className="mt-0.5 w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center flex-shrink-0 shadow-sm">
                        {num}
                    </span>
                    <p className="text-slate-700 text-sm leading-relaxed">{inlined}</p>
                </div>
            );
            i++; continue;
        }

        // Bullet: "- " / "• " / "* "
        if (/^[-•*]\s/.test(trimmed)) {
            const content = trimmed.replace(/^[-•*]\s/, '');
            const inlined = inlineBold(content, i);
            elements.push(
                <div key={i} className="flex items-start gap-3 py-1.5 pl-1">
                    <ChevronRight size={14} className="mt-0.5 text-indigo-400 flex-shrink-0" />
                    <p className="text-slate-700 text-sm leading-relaxed">{inlined}</p>
                </div>
            );
            i++; continue;
        }

        // Default paragraph with inline bold support
        elements.push(
            <p key={i} className="text-slate-700 text-sm leading-relaxed py-1">
                {inlineBold(trimmed, i)}
            </p>
        );
        i++;
    }

    return <div className="space-y-0.5">{elements}</div>;
}

/** Convert **word** inside a string to <strong> spans */
function inlineBold(text, key) {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    if (parts.length === 1) return text;
    return parts.map((part, pi) => {
        if (/^\*\*[^*]+\*\*$/.test(part)) {
            return <strong key={`${key}-${pi}`} className="font-semibold text-slate-900">{part.replace(/\*\*/g, '')}</strong>;
        }
        return part;
    });
}

// ── Main Modal ────────────────────────────────────────────────────────────────

/**
 * type = 'hitl'      → Approval required UI (Approve / Request Changes)
 * type = 'completed' → Workflow finished UI  (Start New Task / Close)
 */
const HITLModal = ({ isOpen, type = 'hitl', output, sessionId, onApprove, onReject, onClose }) => {
    const [view, setView] = useState('review');     // 'review' | 'reject'
    const [feedback, setFeedback] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setView('review');
            setFeedback('');
            setSubmitting(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const isCompleted = type === 'completed';

    const handleApprove = async () => {
        setSubmitting(true);
        await onApprove();
    };

    const handleReject = async () => {
        if (!feedback.trim()) return;
        setSubmitting(true);
        await onReject(feedback.trim());
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}
        >
            <div
                className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
                style={{ animation: 'hitlSlideUp 0.35s cubic-bezier(0.34,1.56,0.64,1) both' }}
            >

                {/* ── Header ─────────────────────────────────────────────────── */}
                <div className={`flex items-center gap-4 px-7 py-5 flex-shrink-0 ${isCompleted
                        ? 'bg-gradient-to-r from-emerald-700 to-teal-700'
                        : 'bg-gradient-to-r from-slate-900 to-slate-800'
                    }`}>
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${isCompleted ? 'bg-white/20' : 'bg-amber-400/20 border border-amber-400/40'
                        }`}>
                        {isCompleted
                            ? <PartyPopper size={22} className="text-white" />
                            : <AlertTriangle size={22} className="text-amber-400" />
                        }
                    </div>
                    <div>
                        <h2 className="text-white font-bold text-lg leading-tight">
                            {isCompleted ? '🎉 Workflow Complete!' : '🔔 Human Approval Required'}
                        </h2>
                        <p className="text-white/60 text-xs mt-0.5">
                            {isCompleted
                                ? 'All agents have finished. Here is the final output.'
                                : 'Review the output, then approve or request changes.'
                            }
                        </p>
                    </div>

                    {/* Status pill */}
                    <div className="ml-auto">
                        {isCompleted ? (
                            <span className="text-xs bg-white/20 text-white px-3 py-1 rounded-full font-semibold">
                                ✅ Done
                            </span>
                        ) : (
                            <span className="text-xs bg-amber-400/20 text-amber-200 border border-amber-400/30 px-3 py-1 rounded-full font-semibold animate-pulse">
                                ⏸ Awaiting Decision
                            </span>
                        )}
                    </div>

                    {/* Close (only for completed) */}
                    {isCompleted && (
                        <button onClick={onClose} className="ml-2 text-white/50 hover:text-white transition-colors">
                            <X size={20} />
                        </button>
                    )}
                </div>

                {/* ── Section label ──────────────────────────────────────────── */}
                <div className="flex items-center gap-2 px-7 pt-5 pb-2 flex-shrink-0">
                    <Sparkles size={15} className={isCompleted ? 'text-emerald-500' : 'text-indigo-500'} />
                    <span className="font-bold text-xs text-slate-600 uppercase tracking-widest">
                        {isCompleted ? 'Final Result from All Agents' : 'Reviewer Output — Pending Your Decision'}
                    </span>
                    <div className="flex-1 h-px bg-gray-100 ml-1" />
                </div>

                {/* ── Scrollable output area ─────────────────────────────────── */}
                <div className="flex-1 overflow-y-auto px-7 pb-2">
                    {/* Output box */}
                    <div className={`border rounded-2xl px-6 py-5 ${isCompleted
                            ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200'
                            : 'bg-slate-50 border-slate-200'
                        }`}>
                        <FormattedOutput text={output} />
                    </div>

                    {/* Reject → feedback area */}
                    {view === 'reject' && (
                        <div className="mt-5 animate-in fade-in slide-in-from-bottom-2 duration-200">
                            <label className="block text-sm font-semibold text-slate-800 mb-2">
                                What should the agents change or improve?
                            </label>
                            <textarea
                                autoFocus
                                rows={3}
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                                placeholder="e.g. Add a budget estimate, change the time to 10am, include a risk section…"
                                className="w-full text-sm px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white resize-none placeholder-slate-400 text-slate-800 transition-all"
                            />
                        </div>
                    )}
                </div>

                {/* ── Footer / Actions ───────────────────────────────────────── */}
                <div className="flex-shrink-0 border-t border-gray-100 bg-gray-50/80 backdrop-blur px-7 py-4">

                    {/* COMPLETED mode */}
                    {isCompleted && (
                        <div className="flex items-center gap-3">
                            <button
                                onClick={onClose}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 bg-white text-slate-600 hover:bg-gray-100 font-semibold text-sm transition-all duration-200 active:scale-95"
                            >
                                Close
                            </button>
                            <div className="flex-1" />
                            <button
                                onClick={() => { onClose(); }}
                                className="flex items-center gap-2 px-7 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-all duration-200 shadow-md hover:shadow-lg active:scale-95"
                            >
                                <CheckCircle2 size={16} />
                                Done — Start New Task
                            </button>
                        </div>
                    )}

                    {/* HITL mode — review view */}
                    {!isCompleted && view === 'review' && (
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setView('reject')}
                                disabled={submitting}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-red-200 bg-white text-red-600 hover:bg-red-50 font-semibold text-sm transition-all duration-200 active:scale-95 disabled:opacity-50"
                            >
                                <ThumbsDown size={15} />
                                Request Changes
                            </button>
                            <div className="flex-1" />
                            <button
                                onClick={handleApprove}
                                disabled={submitting}
                                className="flex items-center gap-2 px-7 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm transition-all duration-200 shadow-md hover:shadow-lg active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                <ThumbsUp size={15} />
                                {submitting ? 'Submitting…' : 'Approve & Complete'}
                            </button>
                        </div>
                    )}

                    {/* HITL mode — reject / feedback view */}
                    {!isCompleted && view === 'reject' && (
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setView('review')}
                                disabled={submitting}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-slate-600 hover:bg-gray-50 font-semibold text-sm transition-all duration-200 active:scale-95"
                            >
                                ← Back
                            </button>
                            <div className="flex-1" />
                            <button
                                onClick={handleReject}
                                disabled={submitting || !feedback.trim()}
                                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-200 disabled:cursor-not-allowed text-white font-bold text-sm transition-all duration-200 shadow-md hover:shadow-lg active:scale-95"
                            >
                                <RotateCcw size={15} />
                                {submitting ? 'Sending…' : 'Send Feedback & Restart'}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
        @keyframes hitlSlideUp {
          from { opacity: 0; transform: translateY(48px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
      `}</style>
        </div>
    );
};

export default HITLModal;
