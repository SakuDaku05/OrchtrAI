import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { getRecentLogs } from '../lib/api';
import {
  TerminalSquare, Search, Filter, Download,
  Play, Pause, AlertCircle, CheckCircle2, Info, AlertTriangle,
  Loader2, Inbox,
} from 'lucide-react';

const inferLevel = (log) => {
  const content = typeof log.content === 'string' ? log.content.toLowerCase() : '';
  if (content.includes('error') || content.includes('fail') || content.includes('fatal')) return 'ERROR';
  if (content.includes('warn') || content.includes('limit')) return 'WARN';
  if (content.includes('success') || content.includes('complete') || content.includes('passed')) return 'SUCCESS';
  return 'INFO';
};

const getLevelBadge = (level) => {
  switch (level) {
    case 'INFO': return <span className="flex items-center gap-1.5 text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider"><Info size={12} /> INFO</span>;
    case 'SUCCESS': return <span className="flex items-center gap-1.5 text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider"><CheckCircle2 size={12} /> OK</span>;
    case 'WARN': return <span className="flex items-center gap-1.5 text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider"><AlertTriangle size={12} /> WARN</span>;
    case 'ERROR': return <span className="flex items-center gap-1.5 text-red-400 bg-red-400/10 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider"><AlertCircle size={12} /> ERR</span>;
    default: return null;
  }
};

const AGENT_COLORS = {
  Planner: 'text-blue-300', Researcher: 'text-purple-300',
  Executor: 'text-amber-300', Reviewer: 'text-emerald-300',
};
const getAgentColor = (agent) => AGENT_COLORS[agent] || 'text-gray-400';

const formatContent = (content) => {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) return content.map((c) => (typeof c === 'string' ? c : c?.text || JSON.stringify(c))).join(' ');
  if (typeof content === 'object' && content !== null) return content.text || content.content || JSON.stringify(content);
  return String(content ?? '');
};

const AGENT_TABS = ['All', 'Planner', 'Researcher', 'Executor', 'Reviewer', 'System'];

const Logs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLive, setIsLive] = useState(false); // no true live stream on this page; toggle is visual
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    getRecentLogs()
      .then((data) => { setLogs(data); setLoading(false); })
      .catch((err) => { setError(err.message); setLoading(false); });
  }, []);

  const filtered = logs.filter((log) => {
    const agentMatch = activeTab === 'All' || log.agent === activeTab;
    const text = formatContent(log.content).toLowerCase();
    const searchMatch = text.includes(searchQuery.toLowerCase());
    return agentMatch && searchMatch;
  });

  const handleExport = () => {
    const text = filtered.map((l) => `[${l.session_id}] [${l.agent}] ${formatContent(l.content)}`).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'orchestrai_logs.log'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-screen bg-[#f8fafc] font-sans">
      <Sidebar />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Navbar />

        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto space-y-6 h-full flex flex-col">

            <div className="flex items-end justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2 text-slate-500 font-medium">
                  <TerminalSquare size={20} />
                  <span>Observability</span>
                </div>
                <h1 className="text-3xl font-bold text-slate-900">System &amp; Agent Logs</h1>
                <p className="text-gray-500 mt-1">Raw telemetry from recent orchestrations stored in Azure Cosmos DB.</p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsLive(!isLive)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors shadow-sm ${isLive
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100'
                      : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                    }`}
                >
                  {isLive ? <Pause size={16} className="fill-current" /> : <Play size={16} className="fill-current" />}
                  {isLive ? 'Pause Stream' : 'Resume Stream'}
                </button>
                <button
                  onClick={handleExport}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium text-slate-700 shadow-sm"
                >
                  <Download size={16} /> Export .log
                </button>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 flex-wrap">
                {AGENT_TABS.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === tab ? 'bg-black text-white' : 'text-gray-500 hover:bg-gray-100'
                      }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search payloads..."
                  className="pl-9 pr-4 py-1.5 rounded-lg border border-gray-300 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors w-64 text-sm bg-gray-50 focus:bg-white"
                />
              </div>
            </div>

            <div className="flex-1 bg-[#0f111a] rounded-2xl border border-slate-800 shadow-inner overflow-hidden flex flex-col font-mono text-sm">
              <div className="flex items-center gap-4 px-6 py-3 border-b border-slate-800/50 bg-[#151822]">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500/50" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/50" />
                </div>
                <span className="text-slate-500 text-xs font-bold tracking-widest uppercase">Azure Cosmos DB — Log Stream</span>
                {!loading && (
                  <span className="ml-auto text-slate-600 text-xs">{filtered.length} entries</span>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-3">
                {loading ? (
                  <div className="flex items-center justify-center gap-3 h-full text-slate-400">
                    <Loader2 size={20} className="animate-spin" />
                    <span>Fetching logs…</span>
                  </div>
                ) : error ? (
                  <div className="flex flex-col items-center justify-center gap-3 h-full text-red-400">
                    <AlertCircle size={28} />
                    <p>{error}</p>
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-3 h-full text-slate-500">
                    <Inbox size={32} />
                    <p>No logs available. Run an orchestration to see agent activity here.</p>
                  </div>
                ) : (
                  filtered.map((log, i) => {
                    const level = inferLevel(log);
                    return (
                      <div key={i} className="flex items-start gap-4 hover:bg-white/5 p-1 rounded transition-colors">
                        <span className="text-slate-500 w-36 flex-shrink-0 text-xs font-mono">{log.session_id?.slice(-8) || '—'}</span>
                        <div className="w-20 flex-shrink-0">{getLevelBadge(level)}</div>
                        <span className={`w-28 flex-shrink-0 font-bold ${getAgentColor(log.agent)}`}>[{log.agent}]</span>
                        <span className="text-slate-300 flex-1 break-words">{formatContent(log.content)}</span>
                      </div>
                    );
                  })
                )}

                {isLive && !loading && (
                  <div className="flex items-center gap-2 text-slate-500 pt-4 animate-pulse">
                    <div className="w-2 h-4 bg-slate-500" />
                    <span>Listening for new events…</span>
                  </div>
                )}
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
};

export default Logs;