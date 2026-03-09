import React, { useState, useEffect, useRef } from 'react';
import {
  Search, ShieldCheck, BrainCircuit, Check, X, Send, Clock,
  FileText, Calendar, TerminalSquare, AlertCircle, ChevronDown,
  MessageSquare, Image as ImageIcon, Code, Sparkles, Plus, Flame, Wind,
  Paperclip, Mic, Share, User, LayoutDashboard, Database, Settings, Trash2, Info, Link, Music, TrendingUp
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

// Strip Qwen <think>...</think> blocks and PENDING_APPROVAL from content
const cleanContent = (raw = '') =>
  raw
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/\*?STATUS:\s*PENDING_APPROVAL\*?/g, '')
    .trim();

const systemCss = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@300;400;500;600;700&display=swap');

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
    --font-heading: 'Outfit', sans-serif;
    --font-mono: 'JetBrains Mono', Consolas, monospace;
    --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
    --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05);
    --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.05), 0 4px 6px -4px rgb(0 0 0 / 0.05);
  }

  /* --- MARKDOWN STYLING --- */
  .markdown-body {
    font-size: 15px;
    line-height: 1.6;
    color: var(--text-primary);
  }
  .markdown-body h1, .markdown-body h2, .markdown-body h3 {
    font-family: var(--font-heading);
    color: var(--accent-dark);
    margin-top: 24px;
    margin-bottom: 12px;
    font-weight: 600;
  }
  .markdown-body h1 { font-size: 22px; border-bottom: 1px solid var(--border-color); padding-bottom: 8px; }
  .markdown-body h2 { font-size: 18px; }
  .markdown-body h3 { font-size: 16px; }

  .markdown-body p { margin-bottom: 16px; }
  .markdown-body strong { font-weight: 600; color: var(--accent-dark); }
  
  .markdown-body ul, .markdown-body ol {
    margin-bottom: 16px;
    padding-left: 24px;
  }
  .markdown-body li { margin-bottom: 6px; }

  .markdown-body table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    margin: 16px 0;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    overflow: hidden;
    background: white;
  }
  .markdown-body th {
    background: #f8fafc;
    color: var(--text-secondary);
    font-weight: 600;
    font-size: 12px;
    text-transform: uppercase;
    text-align: left;
    padding: 12px;
    border-bottom: 1px solid var(--border-color);
  }
  .markdown-body td {
    padding: 12px;
    border-bottom: 1px solid var(--border-light);
    font-size: 14px;
    color: var(--text-primary);
  }
  .markdown-body tr:last-child td { border-bottom: none; }
  .markdown-body tr:hover td { background: #fcfcfd; }

  .markdown-body blockquote {
    border-left: 4px solid var(--accent-primary);
    padding: 8px 16px;
    color: var(--text-secondary);
    background: #f0f7ff;
    border-radius: 4px;
    margin: 16px 0;
  }

  .markdown-body code {
    font-family: var(--font-mono);
    background: #f1f5f9;
    padding: 2px 4px;
    border-radius: 4px;
    font-size: 0.9em;
    color: #ef4444;
  }
  .markdown-body pre {
    background: #0f172a;
    padding: 16px;
    border-radius: 8px;
    overflow-x: auto;
    margin: 16px 0;
  }
  .markdown-body pre code {
    background: transparent;
    padding: 0;
    color: #e2e8f0;
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
  .delete-action:hover { background: #fee2e2; }
  .delete-action:hover svg { stroke: var(--danger); }

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
  .toggle-chip:hover, .toggle-chip.active { background: #f1f5f9; border-color: var(--border-color); color: var(--text-primary); }

  /* Tools Dropdown - Premium Redesign */
  .tools-container { position: relative; }
  .tools-dropdown {
    position: absolute;
    bottom: calc(100% + 14px);
    left: 0;
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(12px) saturate(180%);
    -webkit-backdrop-filter: blur(12px) saturate(180%);
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 16px;
    box-shadow: 
      0 4px 6px -1px rgba(0, 0, 0, 0.1),
      0 10px 15px -3px rgba(0, 0, 0, 0.1),
      0 0 0 1px rgba(0, 0, 0, 0.05);
    width: 300px;
    padding: 12px;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    gap: 6px;
    transform-origin: bottom left;
    animation: premiumPop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  @keyframes premiumPop {
    from { opacity: 0; transform: scale(0.95) translateY(10px); }
    to { opacity: 1; transform: scale(1) translateY(0); }
  }

  .dropdown-label {
    padding: 4px 12px 8px 12px;
    font-size: 10px;
    font-weight: 700;
    color: var(--text-tertiary);
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  .tool-item {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 12px;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    font-size: 14px;
    color: var(--text-primary);
    font-weight: 500;
    border: 1px solid transparent;
  }

  .tool-item:hover {
    background: rgba(241, 245, 249, 0.8);
    transform: translateX(4px);
  }

  /* Specific Gradient States */
  .tool-item.active.spotify {
    background: linear-gradient(135deg, rgba(29, 185, 84, 0.1), rgba(29, 185, 84, 0.05));
    border-color: rgba(29, 185, 84, 0.3);
    color: #169041;
  }
  .tool-item.active.finance {
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0.05));
    border-color: rgba(59, 130, 246, 0.3);
    color: #2563eb;
  }
  .tool-item.active.generic {
    background: linear-gradient(135deg, rgba(15, 23, 42, 0.08), rgba(15, 23, 42, 0.03));
    border-color: rgba(15, 23, 42, 0.2);
    color: var(--text-primary);
  }

  .tool-icon {
    width: 38px;
    height: 38px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: white;
    box-shadow: var(--shadow-sm);
    transition: transform 0.3s ease;
    color: var(--text-secondary);
  }
  .tool-item:hover .tool-icon { transform: scale(1.1); }
  
  .tool-item.active.spotify .tool-icon { color: #1db954; box-shadow: 0 4px 12px rgba(29, 185, 84, 0.2); }
  .tool-item.active.finance .tool-icon { color: #3b82f6; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2); }

  .tool-info { flex: 1; display: flex; flex-direction: column; gap: 2px; }
  .tool-name { display: block; font-weight: 600; }
  .tool-desc { display: block; font-size: 11px; color: var(--text-tertiary); font-weight: 400; }
  .tool-check { color: currentColor; }

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
  /* Styled scrollbars - sidebar and content areas */
  ::-webkit-scrollbar { width: 5px; height: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
  ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }

  .telemetry-box::-webkit-scrollbar-thumb { background: #334155; }
  .telemetry-box::-webkit-scrollbar-thumb:hover { background: #475569; }

  /* Status Bubble & Animations */
  .status-bubble {
    display: flex;
    align-items: center;
    gap: 10px;
    background: #f8fafc;
    border: 1px solid var(--border-color);
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 13px;
    color: var(--text-secondary);
    font-weight: 500;
    width: fit-content;
    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  }

  .pulse-dot {
    width: 8px;
    height: 8px;
    background: var(--accent-primary);
    border-radius: 50%;
    position: relative;
    animation: pulse-dot 1.5s cubic-bezier(0.455, 0.03, 0.515, 0.955) infinite;
  }

  @keyframes pulse-dot {
    0% { transform: scale(0.8); opacity: 0.5; }
    50% { transform: scale(1.2); opacity: 1; }
    100% { transform: scale(0.8); opacity: 0.5; }
  }

  .pulse-icon {
    animation: pulse-icon 2s ease-in-out infinite;
    color: var(--accent-primary);
  }

  @keyframes pulse-icon {
    0% { transform: scale(1); filter: drop-shadow(0 0 0px var(--accent-primary)); }
    50% { transform: scale(1.1); filter: drop-shadow(0 0 5px var(--accent-primary)); }
    100% { transform: scale(1); filter: drop-shadow(0 0 0px var(--accent-primary)); }
  }

  @media (max-width: 1024px) {
    .execution-pane { display: none; }
  }

  /* Fabulous Global Calendar */
  .calendar-panel {
    position: absolute; top: 70px; right: 20px; bottom: 100px; width: 360px;
    background: rgba(15, 23, 42, 0.85); backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 20px;
    display: flex; flex-direction: column; z-index: 1001;
    box-shadow: 0 20px 50px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.1);
    animation: slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  }
  @keyframes slideInRight { from { transform: translateX(50px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }

  .calendar-header {
    padding: 20px; border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    display: flex; justify-content: space-between; align-items: center;
  }
  .calendar-title { display: flex; align-items: center; gap: 10px; font-weight: 700; font-size: 16px; color: white; }
  .spin-slow { animation: spin 4s linear infinite; }
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

  .calendar-content { flex: 1; overflow-y: auto; padding: 20px; position: relative; }
  .calendar-stats { display: flex; gap: 12px; margin-bottom: 24px; }
  .stat-card {
    flex: 1; background: rgba(255, 255, 255, 0.03); padding: 12px; border-radius: 12px;
    display: flex; flex-direction: column; gap: 4px; border: 1px solid rgba(255, 255, 255, 0.05);
  }
  .stat-label { font-size: 10px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.05em; }
  .stat-val { font-size: 18px; font-weight: 700; color: white; }
  
  .calendar-grid {
    display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px;
    margin-bottom: 20px; background: rgba(255, 255, 255, 0.02);
    padding: 8px; border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.05);
  }
  .grid-day-header {
    font-size: 10px; font-weight: 700; color: var(--text-tertiary);
    text-align: center; padding: 4px 0; text-transform: uppercase;
  }
  .grid-day {
    aspect-ratio: 1; display: flex; align-items: center; justify-content: center;
    font-size: 11px; border-radius: 8px; cursor: pointer; transition: all 0.2s ease;
    color: rgba(255, 255, 255, 0.4); position: relative;
  }
  .grid-day.current { color: rgba(255, 255, 255, 0.9); }
  .grid-day:hover { background: rgba(255, 255, 255, 0.1); }
  .grid-day.selected { background: #3b82f6; color: white; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4); }
  .grid-day.today { border: 1px solid #3b82f6; color: #3b82f6; }
  .grid-day.has-event::after {
    content: ''; position: absolute; bottom: 4px; width: 4px; height: 4px;
    background: #3b82f6; border-radius: 50%;
  }

  .calendar-filter-bar {
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 12px; padding: 0 4px;
  }
  .filter-info { font-size: 11px; color: var(--text-secondary); font-weight: 600; }
  .reset-filter-btn {
    font-size: 10px; color: #3b82f6; cursor: pointer;
    background: rgba(59, 130, 246, 0.1); padding: 4px 8px; border-radius: 6px;
    border: 1px solid rgba(59, 130, 246, 0.2); transition: all 0.2s;
  }
  .reset-filter-btn:hover { background: rgba(59, 130, 246, 0.2); }

  .event-list { display: flex; flex-direction: column; gap: 16px; }
  .empty-calendar {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    height: 200px; color: var(--text-tertiary); text-align: center; gap: 16px;
    font-size: 13px; opacity: 0.6;
  }

  .event-card {
    position: relative; display: flex; gap: 16px; background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 16px; padding: 16px;
    transition: all 0.3s ease; overflow: hidden;
  }
  .event-card:hover { transform: translateY(-3px); background: rgba(255, 255, 255, 0.05); border-color: rgba(255, 255, 255, 0.1); }
  
  .event-time-strip { display: flex; flex-direction: column; min-width: 50px; border-right: 1px solid rgba(255, 255, 255, 0.05); padding-right: 12px; }
  .time { font-size: 14px; font-weight: 700; color: white; }
  .date { font-size: 10px; color: var(--text-tertiary); }

  .event-body { flex: 1; display: flex; flex-direction: column; gap: 6px; }
  .event-type-badge {
    font-size: 9px; font-weight: 800; padding: 2px 6px; border-radius: 4px; width: fit-content;
    text-transform: uppercase; color: white; letter-spacing: 0.05em;
  }
  .meeting .event-type-badge { background: #3b82f6; }
  .reminder .event-type-badge { background: #8b5cf6; }
  
  .event-title { font-size: 14px; font-weight: 600; color: white; margin: 0; }
  .event-desc { font-size: 12px; color: var(--text-tertiary); line-height: 1.4; margin: 0; }

  .event-glow {
    position: absolute; top: 0; left: 0; right: 0; bottom: 0; pointer-events: none;
    background: radial-gradient(600px circle at var(--x, 0px) var(--y, 0px), rgba(255,255,255,.06), transparent 40%);
    opacity: 0; transition: opacity 0.3s;
  }
  .event-card:hover .event-glow { opacity: 1; }

  .calendar-loader { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; gap: 15px; color: var(--text-tertiary); font-size: 13px; }
  .loader-ring { width: 30px; height: 30px; border: 2px solid rgba(255,255,255,0.05); border-top-color: var(--accent-primary); border-radius: 50%; animation: spin 1s linear infinite; }

  @media (max-width: 768px) {
    .calendar-panel { width: calc(100% - 40px); left: 20px; }
  }
  @media (max-width: 768px) {
    .sidebar { display: none; }
    .top-header { padding: 0 16px; }
    .hero-title { font-size: 24px; text-align: center; }
    .starters-grid { grid-template-columns: 1fr; }
  }
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
  const [availableMcps, setAvailableMcps] = useState([]);
  const [selectedMcps, setSelectedMcps] = useState([]);
  const [toolsOpen, setToolsOpen] = useState(false);
  const toolsRef = useRef(null);
  const [currentStatus, setCurrentStatus] = useState('Agents are working...');
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [selectedFilterDate, setSelectedFilterDate] = useState(null);

  // Click away for tools dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (toolsRef.current && !toolsRef.current.contains(event.target)) {
        setToolsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchAvailableMcps = async () => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/mcp?t=${Date.now()}`);
      const data = await res.json();
      setAvailableMcps(data.configs || []);
    } catch (e) {
      console.error("Failed to fetch available MCPs", e);
    }
  };

  useEffect(() => {
    fetchAvailableMcps();
  }, []);

  const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  const generateGrid = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = getDaysInMonth(year, month);
    const prevMonthDays = getDaysInMonth(year, month - 1);
    const days = [];
    for (let i = firstDay - 1; i >= 0; i--) days.push({ day: prevMonthDays - i, current: false, month: month - 1, year });
    for (let i = 1; i <= daysInMonth; i++) days.push({ day: i, current: true, month, year });
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) days.push({ day: i, current: false, month: month + 1, year });
    return days;
  };

  const hasEventOnDay = (day, m, y) => {
    return calendarEvents.some(evt => {
      const d = new Date(evt.start_time);
      return d.getDate() === day && d.getMonth() === m && d.getFullYear() === y;
    });
  };

  const filteredEvents = selectedFilterDate
    ? calendarEvents.filter(evt => {
      const d = new Date(evt.start_time);
      return d.getDate() === selectedFilterDate.day &&
        d.getMonth() === selectedFilterDate.month &&
        d.getFullYear() === selectedFilterDate.year;
    })
    : calendarEvents;

  const loadHistory = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/history');
      const data = await res.json();
      console.log("History Fetched:", data.sessions);
      setSessionHistory(data.sessions || []);
    } catch (e) {
      console.error("Failed to load history", e);
    }
  };

  const fetchCalendarEvents = async () => {
    try {
      setCalendarLoading(true);
      const res = await fetch(`http://127.0.0.1:8000/api/calendar?t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        setCalendarEvents(data.events || []);
      }
    } catch (e) {
      console.error("Failed to fetch calendar", e);
    } finally {
      setCalendarLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
    fetchCalendarEvents();
  }, []);

  useEffect(() => {
    const interval = setInterval(fetchCalendarEvents, 10000); // 10s sync
    return () => clearInterval(interval);
  }, []);

  const loadHistoricalSession = async (id) => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/workflow/${id}`);
      if (!res.ok) return;
      const data = await res.json();

      setSessionId(data.session_id || data.id);
      setSessionActive(true);
      setIsProcessing(data.status === 'ACTIVE');
      setApprovalPending(data.status === 'PAUSED_FOR_HITL');
      setWorkflowCompleted(data.status === 'COMPLETED' || data.status === 'FAILED');

      const hasFinalizer = (data.chat_history || []).some(m => m.agent === 'Finalizer');
      const mappedChat = (data.chat_history || [])
        .filter(item => {
          const isUser = item.role === 'user' || item.agent === 'User';
          const isFinalizer = item.agent === 'Finalizer';
          const isSystem = item.agent === 'System';

          if (hasFinalizer) {
            // Show only the "Outcome" (User, Finalizer, System)
            return isUser || isFinalizer || isSystem;
          }
          // Fallback: Show all agents while still in progress
          const isAgent = ['Planner', 'Researcher', 'Executor', 'Reviewer'].includes(item.agent);
          return isUser || isAgent || isSystem || (!item.role && item.agent);
        })
        .map((item, idx) => {
          const isUser = item.role === 'user' || item.agent === 'User';
          return {
            id: idx,
            role: isUser ? 'user' : 'ai',
            agent: item.agent || (item.role === 'user' ? 'User' : 'Assistant'),
            content: cleanContent(item.content)
          };
        });
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
  const [workflowStarted, setWorkflowStarted] = useState(false); // true once a real workflow has been dispatched
  const [showSettings, setShowSettings] = useState(false);


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
          const res = await fetch(`http://127.0.0.1:8000/api/workflow/${sessionId}`);
          if (!res.ok) return;
          const data = await res.json();

          // 1. Update Telemetry Logs (Full History)
          const allHistory = data.chat_history || [];
          if (allHistory.length === 0) return; // Don't wipe UI if backend hasn't saved anything yet

          const mappedLogs = allHistory.map(item => ({
            agent: item.agent || (item.role === 'user' ? 'User' : 'Assistant'),
            msg: item.content
          }));
          setLogs(mappedLogs);

          // 2. Derive Current Status from latest agent
          if (isProcessing && allHistory.length > 0) {
            const lastAgent = allHistory[allHistory.length - 1].agent;
            if (lastAgent === 'Planner') setCurrentStatus('Planning workflow...');
            else if (lastAgent === 'Researcher') setCurrentStatus('Researching context...');
            else if (lastAgent === 'Executor') setCurrentStatus('Executing actions...');
            else if (lastAgent === 'Reviewer') setCurrentStatus('Reviewing results...');
            else if (lastAgent === 'User') setCurrentStatus('Waiting for input...');
            else setCurrentStatus('Processing request...');
          }

          // 3. Update Main Chat (Filtered)
          const hasFinalizer = allHistory.some(m => m.agent === 'Finalizer');

          const mappedChat = allHistory
            .filter(item => {
              const isUser = item.role === 'user' || item.agent === 'User';
              const isFinalizer = item.agent === 'Finalizer';
              const isSystem = item.agent === 'System';

              // ALWAYS hide intermediate agents (Planner, Researcher, etc.) from main panel
              // Only show User prompts, Finalizer answers, and System notices
              return isUser || isFinalizer || isSystem;
            })
            .map((item, idx) => {
              const isUser = item.role === 'user' || item.agent === 'User';
              return {
                id: idx,
                role: isUser ? 'user' : 'ai',
                agent: item.agent || (item.role === 'user' ? 'User' : 'Assistant'),
                content: cleanContent(item.content)
              };
            });
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
      const res = await fetch('http://127.0.0.1:8000/api/workflow/chat', {
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
    // workflowStarted = true means a real workflow session exists in Cosmos.
    // After a doc-only upload, sessionActive=true but no workflow exists yet,
    // so we start a new one (which will carry the same sessionId and access the uploaded chunks).
    if (sessionActive && sessionId && workflowStarted) {
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
      const res = await fetch('http://127.0.0.1:8000/api/upload', {
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
    setWorkflowStarted(true);
    setTasks([]);
    setLogs([{ agent: 'System', msg: 'Submitting workflow request to backend...' }]);
    setApprovalPending(false);
    setWorkflowCompleted(false);

    try {
      const res = await fetch('http://127.0.0.1:8000/api/workflow/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: currentInput,
          session_id: sessionId,
          enabled_mcps: selectedMcps,
          hitl_enabled: toggles.humanApproval
        })
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
      await fetch('http://127.0.0.1:8000/api/workflow/approve', {
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

  const handleDeleteSession = async (e, sid) => {
    e.stopPropagation();
    if (!window.confirm("Delete this workflow history?")) return;
    try {
      await fetch(`http://localhost:8000/api/workflow/${sid}`, { method: 'DELETE' });
      setSessionHistory(prev => prev.filter(s => s.session_id !== sid));
      if (sessionId === sid) {
        window.location.reload();
      }
    } catch (e) {
      console.error("Failed to delete session", e);
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
                <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '13px', flex: 1 }}>
                  {session.initial_prompt}
                </div>
                <div
                  className="delete-action"
                  onClick={(e) => handleDeleteSession(e, session.session_id)}
                  style={{ padding: '4px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Trash2 size={12} color="var(--text-tertiary)" hovercolor="var(--danger)" />
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* --- MAIN CENTER CANVAS --- */}
        <main className="main-area">
          <header className="top-header">
            <div className="breadcrumb">Workflows / Active / <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>New Session</span></div>
            <div className="header-actions" style={{ position: 'relative' }}>
              <button className="btn-share"><Share size={14} /> Share</button>
              <div
                className={`icon-btn ${showCalendar ? 'active' : ''}`}
                style={{ background: showCalendar ? 'rgba(59, 130, 246, 0.1)' : '', borderRadius: '8px', padding: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                onClick={() => { setShowCalendar(!showCalendar); setShowSettings(false); }}
              >
                <Calendar size={18} color={showCalendar ? 'var(--accent-primary)' : 'var(--text-secondary)'} />
              </div>
              <div
                className={`icon-btn ${showSettings ? 'active' : ''}`}
                style={{ background: showSettings ? 'var(--bg-secondary)' : '', borderRadius: '8px', padding: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', marginLeft: '8px' }}
                onClick={() => { setShowSettings(!showSettings); setShowCalendar(false); }}
              >
                <Settings size={18} color={showSettings ? 'var(--accent-primary)' : 'var(--text-secondary)'} />
              </div>

              {showSettings && (
                <div className="settings-dropdown" style={{
                  position: 'absolute', top: '45px', right: 0, width: '220px',
                  background: 'var(--bg-primary)', border: '1px solid var(--border)',
                  borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                  zIndex: 1000, padding: '8px'
                }}>
                  <div
                    className="nav-item"
                    style={{ margin: 0, padding: '10px 12px', borderRadius: '8px' }}
                    onClick={() => { window.location.reload(); setShowSettings(false); }}
                  >
                    <Trash2 size={14} color="var(--danger)" />
                    <span style={{ marginLeft: '10px' }}>Clear Current Session</span>
                  </div>
                  <div
                    className="nav-item"
                    style={{ margin: '4px 0 0 0', padding: '10px 12px', borderRadius: '8px' }}
                    onClick={() => { window.location.href = '/mcp'; setShowSettings(false); }}
                  >
                    <Link size={14} color="var(--accent-primary)" />
                    <span style={{ marginLeft: '10px' }}>Manage MCP Connectors</span>
                  </div>
                  <div
                    className="nav-item"
                    style={{ margin: '4px 0 0 0', padding: '10px 12px', borderRadius: '8px' }}
                    onClick={() => { alert("OrchestrAI v1.0\nPowered by Groq & AutoGen\nBuild 2025.03.08"); setShowSettings(false); }}
                  >
                    <Info size={14} color="var(--text-secondary)" />
                    <span style={{ marginLeft: '10px' }}>App Intelligence Info</span>
                  </div>
                </div>
              )}
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
                  <div className="message progress-msg">
                    <div className="msg-avatar ai"><BrainCircuit size={16} className="pulse-icon" /></div>
                    <div className="msg-content">
                      <div className="msg-author">OrchestrAI System</div>
                      <div className="status-bubble">
                        <div className="pulse-dot"></div>
                        <span>{currentStatus}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Fabulous Global Calendar Panel */}
          {showCalendar && (
            <div className="calendar-panel">
              <div className="calendar-header">
                <div className="calendar-title">
                  <Flame size={18} className="spin-slow" />
                  <span>Global Timeline</span>
                </div>
                <button className="close-btn" onClick={() => setShowCalendar(false)}><X size={16} /></button>
              </div>

              <div className="calendar-content">
                <div className="calendar-stats">
                  <div className="stat-card">
                    <span className="stat-label">Total Events</span>
                    <span className="stat-val">{calendarEvents.length}</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-label">Matched</span>
                    <span className="stat-val">{filteredEvents.length}</span>
                  </div>
                </div>

                {/* Date Grid Picker */}
                <div className="calendar-grid">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, ix) => (
                    <div key={ix} className="grid-day-header">{day}</div>
                  ))}
                  {generateGrid().map((d, i) => {
                    const isSelected = selectedFilterDate && selectedFilterDate.day === d.day && selectedFilterDate.month === d.month;
                    const isToday = new Date().getDate() === d.day && new Date().getMonth() === d.month;
                    const hasEvt = d.current && hasEventOnDay(d.day, d.month, d.year);
                    return (
                      <div
                        key={i}
                        className={`grid-day ${d.current ? 'current' : ''} ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''} ${hasEvt ? 'has-event' : ''}`}
                        onClick={() => setSelectedFilterDate(isSelected ? null : d)}
                      >
                        {d.day}
                      </div>
                    );
                  })}
                </div>

                <div className="calendar-filter-bar">
                  <div className="filter-info">
                    {selectedFilterDate ? `Filtering: ${new Date(selectedFilterDate.year, selectedFilterDate.month, selectedFilterDate.day).toLocaleDateString([], { month: 'short', day: 'numeric' })}` : 'Upcoming Events'}
                  </div>
                  {selectedFilterDate && (
                    <div className="reset-filter-btn" onClick={() => setSelectedFilterDate(null)}>Clear</div>
                  )}
                </div>

                <div className="event-list">
                  {calendarLoading && calendarEvents.length === 0 ? (
                    <div className="empty-calendar">
                      <Sparkles size={32} className="pulse-icon" />
                      <p>Syncing global timeline...</p>
                    </div>
                  ) : filteredEvents.length === 0 ? (
                    <div className="empty-calendar">
                      <Wind size={32} />
                      <p>{selectedFilterDate ? "No events scheduled for this day." : "Your timeline is quiet."}</p>
                    </div>
                  ) : (
                    filteredEvents.map((evt, idx) => (
                      <div key={idx} className={`event-card ${evt.type?.toLowerCase()}`}>
                        <div className="event-time-strip">
                          <span className="time">{new Date(evt.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
                          <span className="date">{new Date(evt.start_time).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                        </div>
                        <div className="event-body">
                          <div className="event-type-badge">{evt.type}</div>
                          <h4 className="event-title">{evt.title}</h4>
                          <p className="event-desc">{evt.description}</p>
                        </div>
                        <div className="event-glow"></div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Floating Input Area */}
          <div className="input-wrapper">
            <div className="toggles-row">
              <div className={`toggle-chip ${toggles.humanApproval ? 'active' : ''}`} onClick={() => setToggles(p => ({ ...p, humanApproval: !p.humanApproval }))}>
                <ShieldCheck size={12} /> HITL Approval Required
              </div>
              <div style={{ width: '1px', height: '16px', background: 'var(--border-color)', margin: '0 4px' }} />

              <div className="tools-container" ref={toolsRef}>
                <div className={`toggle-chip ${toolsOpen ? 'active' : ''}`} onClick={() => setToolsOpen(!toolsOpen)}>
                  <Plus size={12} /> Tools {selectedMcps.length > 0 && <span style={{ marginLeft: '4px', background: 'var(--accent-primary)', color: 'white', padding: '0 4px', borderRadius: '4px', fontSize: '10px' }}>{selectedMcps.length}</span>}
                </div>

                {toolsOpen && (
                  <div className="tools-dropdown">
                    <div className="dropdown-label">Available Capabilities</div>
                    {availableMcps.map(mcp => {
                      const service = (mcp.service || '').toLowerCase();
                      const name = (mcp.name || '').toLowerCase();
                      const isSpotify = service === 'spotify' || name.includes('spotify');
                      const isFinance = service === 'finance' || name.includes('finance');
                      const isActive = selectedMcps.includes(mcp.id);
                      const typeClass = isSpotify ? 'spotify' : isFinance ? 'finance' : 'generic';

                      return (
                        <div
                          key={mcp.id}
                          className={`tool-item ${isActive ? 'active' : ''} ${typeClass}`}
                          onClick={() => {
                            setSelectedMcps(prev =>
                              prev.includes(mcp.id) ? prev.filter(id => id !== mcp.id) : [...prev, mcp.id]
                            );
                          }}
                        >
                          <div className="tool-icon">
                            {isSpotify ? <Music size={20} /> : isFinance ? <TrendingUp size={20} /> : <Link size={20} />}
                          </div>
                          <div className="tool-info">
                            <span className="tool-name">{mcp.name}</span>
                            <span className="tool-desc">{isSpotify ? 'Music & Playlists' : isFinance ? 'Market news & Data' : 'External Service'}</span>
                          </div>
                          {isActive && <Check size={18} className="tool-check" />}
                        </div>
                      );
                    })}
                    {availableMcps.length === 0 && (
                      <div className="tool-item generic" onClick={() => window.location.href = '/mcp'}>
                        <div className="tool-icon"><Plus size={20} /></div>
                        <div className="tool-info">
                          <span className="tool-name">Configure MCP</span>
                          <span className="tool-desc">Add your first integration</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
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
