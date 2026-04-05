import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Plus, Pencil, Trash2, Sun, Moon, Send, LogIn, LogOut,
  Settings, MessageSquare, LayoutGrid, ChevronDown, ChevronUp, Loader2,
  Copy, Check, Share2, X, Download, Paperclip, FileText, Image, Video, File
} from 'lucide-react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebase';
import AuthModal from './AuthModal';
import './App.css';

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

const AGENTS = {
  medical:       { name: 'Medical Agent',       icon: '🩺', color: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.3)',   description: 'Triage, health risks, treatment protocols, medicine needs' },
  logistics:     { name: 'Logistics Agent',     icon: '📦', color: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.3)',  description: 'Resource rationing, supply priorities, stockpile planning' },
  security:      { name: 'Security Agent',      icon: '🛡️', color: 'rgba(34,197,94,0.12)',   border: 'rgba(34,197,94,0.3)',   description: 'Threat assessment, safe routes, access control, protocols' },
  communication: { name: 'Communication Agent', icon: '📡', color: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.3)', description: 'Offline comms, family contact strategy, coordination plans' },
};

const SCENARIOS = {
  nuclear:      { name: 'Nuclear Fallout',    icon: '☢️', description: 'Radiological incident, fallout shelter protocol',  example: { type: 'nuclear',      location: 'Urban shelter', family_size: 8, shelter_capacity: 7, supplies: { water: 150, food: '14 days', masks: 20 }, vulnerable: ['elderly', 'infant'] } },
  pandemic:     { name: 'Pandemic Outbreak',  icon: '🦠', description: 'Disease outbreak, quarantine, medical protocols',   example: { type: 'pandemic',     family_size: 5, symptomatic: 3, supplies: { medications: '5 days', masks: 10 }, vulnerable: ['asthmatic', 'elderly'] } },
  grid_failure: { name: 'Grid Failure',       icon: '⚡', description: 'Power outage, supply chain breakdown',              example: { type: 'grid_failure', family_size: 6, duration_unknown: true, supplies: { water: '2L', food: '3 days', fuel: 'some' } } },
  civil_unrest: { name: 'Civil Unrest',       icon: '🚨', description: 'Safety concerns, restricted movement',              example: { type: 'civil_unrest', location: 'Urban area', family_size: 4, mobility: 'limited', threat_level: 'HIGH' } },
  multi:        { name: 'Multi-Threat',       icon: '🌪️', description: 'Combined threats — fallout, unrest, grid failure',  example: { type: 'multi',        threats: ['nuclear_fallout', 'communication_failure'], family_size: 8, supplies: { water: 150, food: '10 days', medical: 'basic' } } },
};

const SECTION_STYLES = {
  // Coordinator sections
  '🔴 Situation Overview':    { bg: 'rgba(239,68,68,0.07)',    border: 'rgba(239,68,68,0.25)' },
  '⚡ Act Now':                { bg: 'rgba(245,158,11,0.07)',   border: 'rgba(245,158,11,0.25)' },
  '👁️ What To Watch Out For': { bg: 'rgba(249,115,22,0.07)',   border: 'rgba(249,115,22,0.25)' },
  '🛡️ Stay Safe':              { bg: 'rgba(34,197,94,0.07)',    border: 'rgba(34,197,94,0.25)' },
  '📦 What You Need':          { bg: 'rgba(59,130,246,0.07)',   border: 'rgba(59,130,246,0.25)' },
  '💬 Keep In Mind':           { bg: 'rgba(167,139,250,0.07)', border: 'rgba(167,139,250,0.25)' },
  // Medical agent sections
  '🩺 Medical Assessment':     { bg: 'rgba(239,68,68,0.07)',    border: 'rgba(239,68,68,0.25)' },
  '⚠️ Health Risks':           { bg: 'rgba(249,115,22,0.07)',   border: 'rgba(249,115,22,0.25)' },
  '💊 Treatment & Medications':{ bg: 'rgba(34,197,94,0.07)',    border: 'rgba(34,197,94,0.25)' },
  '🚑 Priority Actions':       { bg: 'rgba(245,158,11,0.07)',   border: 'rgba(245,158,11,0.25)' },
  '🧰 Medical Supplies Needed':{ bg: 'rgba(59,130,246,0.07)',   border: 'rgba(59,130,246,0.25)' },
  // Logistics agent sections
  '📦 Resource Inventory':     { bg: 'rgba(59,130,246,0.07)',   border: 'rgba(59,130,246,0.25)' },
  '⏱️ Rationing Schedule':     { bg: 'rgba(245,158,11,0.07)',   border: 'rgba(245,158,11,0.25)' },
  '🛒 What To Stockpile':      { bg: 'rgba(34,197,94,0.07)',    border: 'rgba(34,197,94,0.25)' },
  '📋 Distribution Plan':      { bg: 'rgba(167,139,250,0.07)', border: 'rgba(167,139,250,0.25)' },
  '⚡ Logistics Actions':       { bg: 'rgba(249,115,22,0.07)',   border: 'rgba(249,115,22,0.25)' },
  // Security agent sections
  '🔴 Threat Level':           { bg: 'rgba(239,68,68,0.07)',    border: 'rgba(239,68,68,0.25)' },
  '🏠 Shelter & Safe Zones':   { bg: 'rgba(34,197,94,0.07)',    border: 'rgba(34,197,94,0.25)' },
  '🔒 Security Protocols':     { bg: 'rgba(245,158,11,0.07)',   border: 'rgba(245,158,11,0.25)' },
  '🚪 Access Control':         { bg: 'rgba(249,115,22,0.07)',   border: 'rgba(249,115,22,0.25)' },
  '🏃 Escape Routes':          { bg: 'rgba(59,130,246,0.07)',   border: 'rgba(59,130,246,0.25)' },
  // Communication agent sections
  '📡 Communication Plan':     { bg: 'rgba(167,139,250,0.07)', border: 'rgba(167,139,250,0.25)' },
  '👨‍👩‍👧 Family Contact Strategy':{ bg: 'rgba(34,197,94,0.07)',   border: 'rgba(34,197,94,0.25)' },
  '📻 Offline Methods':        { bg: 'rgba(59,130,246,0.07)',   border: 'rgba(59,130,246,0.25)' },
  '🕐 Coordination Timeline':  { bg: 'rgba(245,158,11,0.07)',   border: 'rgba(245,158,11,0.25)' },
  '⚠️ What Could Go Wrong':    { bg: 'rgba(249,115,22,0.07)',   border: 'rgba(249,115,22,0.25)' },
};

const LOADING_MSGS = [
  'Deploying field agents…', 'Running threat analysis…', 'Cross-referencing protocols…',
  'Calculating resource needs…', 'Scanning medical databases…', 'Coordinating response teams…',
  'Analyzing environmental hazards…', 'Building your survival plan…', 'Synthesizing intel…',
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const genId = () => Math.random().toString(36).slice(2, 10);
const loadSessions = () => { try { return JSON.parse(localStorage.getItem('aegis_sessions') || '[]'); } catch { return []; } };
const saveSessions = s => localStorage.setItem('aegis_sessions', JSON.stringify(s));
const loadTheme = () => localStorage.getItem('aegis_theme') || 'dark';

/** Parse "## heading\ncontent" blocks into [{heading, content}] */
function parseSections(text) {
  if (!text) return [];
  const blocks = text.split(/\n(?=## )/);
  return blocks.map(block => {
    const nl = block.indexOf('\n');
    if (!block.startsWith('## ') || nl === -1) return { heading: '', content: block.trim() };
    return { heading: block.slice(3, nl).trim(), content: block.slice(nl + 1).trim() };
  }).filter(s => s.content);
}

/** Render content lines — bold **text**, bullets, numbered lists, code blocks */
function RichContent({ text }) {
  const lines = text.split('\n');
  const elements = [];
  let inCode = false;
  let codeLines = [];

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const trimmed = raw.trim();

    if (trimmed.startsWith('```')) {
      if (!inCode) {
        inCode = true; codeLines = [];
      } else {
        elements.push(<pre key={`code-${i}`} className="rc-code-block"><code>{codeLines.join('\n')}</code></pre>);
        inCode = false; codeLines = [];
      }
      continue;
    }
    if (inCode) { codeLines.push(raw); continue; }
    if (!trimmed) continue;

    if (/^[-•*]\s/.test(trimmed)) {
      elements.push(<div key={i} className="rc-bullet"><span className="bullet-dot" /><span dangerouslySetInnerHTML={{ __html: renderInline(trimmed.slice(2).trim()) }} /></div>);
    } else if (/^\d+\.\s/.test(trimmed)) {
      const num = trimmed.match(/^(\d+)\./)[1];
      const rest = trimmed.slice(trimmed.indexOf('.') + 1).trim();
      elements.push(<div key={i} className="rc-numbered"><span className="num-badge">{num}</span><span dangerouslySetInnerHTML={{ __html: renderInline(rest) }} /></div>);
    } else {
      elements.push(<p key={i} dangerouslySetInnerHTML={{ __html: renderInline(trimmed) }} />);
    }
  }
  if (inCode && codeLines.length > 0) {
    elements.push(<pre key="code-unclosed" className="rc-code-block"><code>{codeLines.join('\n')}</code></pre>);
  }
  return <div className="rich-content">{elements}</div>;
}

function renderInline(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>');
}

// ─── VISUAL SNAPSHOT ─────────────────────────────────────────────────────────

const THREAT_CONFIG = {
  CRITICAL: { color: '#ef4444', meter: 100 },
  HIGH:     { color: '#f97316', meter: 75 },
  ELEVATED: { color: '#f59e0b', meter: 55 },
  MODERATE: { color: '#eab308', meter: 40 },
  LOW:      { color: '#22c55e', meter: 20 },
};

function extractStats(text) {
  if (!text) return { threatLevel: null, tiles: [] };
  const threatMatch = text.match(/\b(CRITICAL|HIGH|ELEVATED|MODERATE|LOW)\b/);
  const threatLevel = threatMatch ? threatMatch[1] : null;
  const patterns = [
    { re: /(\d+)\s+people/i,          label: 'People',      icon: '👥' },
    { re: /family\s+(?:of\s+)?(\d+)/i,label: 'Family',      icon: '👨‍👩‍👧' },
    { re: /(\d+)\s+days?\s+(?:of\s+)?water/i, label: 'Water',icon: '💧' },
    { re: /(\d+)\s+days?\s+(?:of\s+)?food/i,  label: 'Food', icon: '🥫' },
    { re: /(\d+)\s+days?/i,            label: 'Duration',    icon: '📅' },
    { re: /(\d+)\s*L(?:iters?)?\s+water/i, label: 'Water (L)',icon: '💧' },
    { re: /(\d+)\s+masks?/i,           label: 'Masks',       icon: '😷' },
    { re: /(\d+)\s+(?:are\s+)?symptomatic/i, label: 'Symptomatic', icon: '🤒' },
  ];
  const tiles = [];
  const seenLabels = new Set();
  for (const { re, label, icon } of patterns) {
    const m = text.match(re);
    if (m && !seenLabels.has(label)) {
      seenLabels.add(label);
      tiles.push({ label, value: m[1], icon });
      if (tiles.length >= 5) break;
    }
  }
  return { threatLevel, tiles };
}

function SnapshotStrip({ text }) {
  const { threatLevel, tiles } = extractStats(text);
  const tc = threatLevel ? THREAT_CONFIG[threatLevel] : null;
  if (!tc && tiles.length === 0) return null;
  return (
    <div className="snapshot-strip">
      {tc && (
        <div className="snapshot-threat-tile" style={{ borderColor: tc.color + '55', background: tc.color + '18' }}>
          <span className="snapshot-label">Threat</span>
          <span className="snapshot-threat-value" style={{ color: tc.color }}>{threatLevel}</span>
          <div className="snapshot-bar"><div className="snapshot-bar-fill" style={{ width: `${tc.meter}%`, background: tc.color }} /></div>
        </div>
      )}
      {tiles.map((t, i) => (
        <div key={i} className="snapshot-stat-tile">
          <span className="snapshot-stat-icon">{t.icon}</span>
          <span className="snapshot-stat-value">{t.value}</span>
          <span className="snapshot-label">{t.label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── SHARE MODAL ─────────────────────────────────────────────────────────────

function ShareModal({ msg, onClose }) {
  const [copied, setCopied] = useState(false);

  const handleCopyText = () => {
    navigator.clipboard.writeText(msg.text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownload = () => {
    const blob = new Blob([msg.text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aegis-response-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="share-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="share-modal">
        <div className="share-modal-header">
          <h3>🧭 Share AEGIS Response</h3>
          <button className="icon-btn" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="share-preview">
          <ResponseCards text={msg.text} showSnapshot={false} />
        </div>
        <div className="share-modal-actions">
          <button className="btn-primary" onClick={handleCopyText} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copied!' : 'Copy as text'}
          </button>
          <button className="btn-primary" onClick={handleDownload}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'var(--surface2)', color: 'var(--text)', border: '1px solid var(--border2)' }}>
            <Download size={14} /> Download .txt
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── RESPONSE CARDS ──────────────────────────────────────────────────────────

function ResponseCards({ text, showSnapshot = true }) {
  const sections = parseSections(text);
  if (sections.length <= 1) {
    return <pre className="chat-plan">{text}</pre>;
  }
  return (
    <>
      {showSnapshot && <SnapshotStrip text={text} />}
      <div className="response-cards">
        {sections.map(({ heading, content }, i) => {
          const style = SECTION_STYLES[heading] || { bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.1)' };
          return (
            <div key={i} className="response-card" style={{ background: style.bg, borderColor: style.border }}>
              {heading && <h3 className="card-heading">{heading}</h3>}
              <RichContent text={content} />
            </div>
          );
        })}
      </div>
    </>
  );
}

// ─── LOADING ─────────────────────────────────────────────────────────────────

function LoadingBubble() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % LOADING_MSGS.length), 1800);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="chat-bubble assistant">
      <div className="chat-avatar aegis">🧭</div>
      <div className="chat-bubble-content">
        <div className="typing-dots"><span /><span /><span /></div>
        <p className="loading-msg">{LOADING_MSGS[idx]}</p>
      </div>
    </div>
  );
}

// ─── ATTACHMENT HELPERS ───────────────────────────────────────────────────────

const ACCEPTED_TYPES = '.txt,.pdf,.json,.csv,.md,.jpg,.jpeg,.png,.gif,.webp,.mp4,.mov,.webm';

function fileTypeIcon(mime) {
  if (!mime) return <File size={14} />;
  if (mime.startsWith('image/')) return <Image size={14} />;
  if (mime.startsWith('video/')) return <Video size={14} />;
  return <FileText size={14} />;
}

function AttachmentPreview({ file, onRemove }) {
  const isImage = file.type.startsWith('image/');
  const previewUrl = isImage ? URL.createObjectURL(file) : null;
  return (
    <div className="attachment-chip">
      {isImage
        ? <img src={previewUrl} className="attachment-thumb" alt="" onLoad={() => URL.revokeObjectURL(previewUrl)} />
        : <span className="attachment-icon">{fileTypeIcon(file.type)}</span>
      }
      <span className="attachment-name">{file.name}</span>
      <button className="attachment-remove" onClick={onRemove} title="Remove"><X size={11} /></button>
    </div>
  );
}

// ─── SIDEBAR ─────────────────────────────────────────────────────────────────

function Sidebar({ sessions, currentId, onSelect, onNew, onRename, onDelete, theme, onTheme, user, onSignIn, onSignOut }) {
  const [editId, setEditId] = useState(null);
  const [editVal, setEditVal] = useState('');
  const inputRef = useRef(null);
  useEffect(() => { if (editId) inputRef.current?.focus(); }, [editId]);

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <span className="sidebar-brand">🧭 AEGIS</span>
      </div>

      <button className="new-chat-btn" onClick={onNew}>
        <Plus size={15} strokeWidth={2.5} /> New chat
      </button>

      <div className="sidebar-sessions">
        {sessions.length === 0 && <p className="sidebar-empty">No conversations yet</p>}
        {sessions.map(s => (
          <div key={s.id} className={`session-item ${s.id === currentId ? 'active' : ''}`} onClick={() => onSelect(s.id)}>
            {editId === s.id ? (
              <input ref={inputRef} className="rename-input" value={editVal}
                onChange={e => setEditVal(e.target.value)}
                onBlur={() => { if (editVal.trim()) onRename(s.id, editVal.trim()); setEditId(null); }}
                onKeyDown={e => { if (e.key === 'Enter') { if (editVal.trim()) onRename(s.id, editVal.trim()); setEditId(null); } if (e.key === 'Escape') setEditId(null); }}
                onClick={e => e.stopPropagation()} />
            ) : (
              <>
                <MessageSquare size={13} className="session-icon" />
                <span className="session-title">{s.title}</span>
                <div className="session-actions">
                  <button className="icon-btn" title="Rename" onClick={e => { e.stopPropagation(); setEditId(s.id); setEditVal(s.title); }}><Pencil size={12} /></button>
                  <button className="icon-btn danger" title="Delete" onClick={e => { e.stopPropagation(); onDelete(s.id); }}><Trash2 size={12} /></button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="sidebar-footer">
        <button className="sidebar-footer-btn" onClick={onTheme} title="Toggle theme">
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
        </button>

        {user ? (
          <div className="sidebar-user">
            {user.photoURL
              ? <img src={user.photoURL} className="user-av-img" referrerPolicy="no-referrer" alt="" />
              : <div className="user-av-placeholder">{(user.displayName || user.email || '?')[0].toUpperCase()}</div>
            }
            <div className="user-info">
              <span className="user-display-name">{user.displayName || 'User'}</span>
              <span className="user-email">{user.email}</span>
            </div>
            <button className="icon-btn" title="Sign out" onClick={onSignOut}><LogOut size={14} /></button>
          </div>
        ) : (
          <button className="sidebar-footer-btn accent" onClick={onSignIn}>
            <LogIn size={15} /><span>Sign in</span>
          </button>
        )}
      </div>
    </aside>
  );
}

// ─── CHAT MESSAGE ─────────────────────────────────────────────────────────────

function ChatMessage({ msg, onShare, avatarIcon = '🧭' }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (msg.role === 'user') return (
    <div className="chat-bubble user">
      <div className="chat-bubble-content user-content">
        {msg.fileName && (
          <div className="msg-file-chip">
            {fileTypeIcon(msg.fileMime)}<span>{msg.fileName}</span>
          </div>
        )}
        {msg.previewUrl && <img src={msg.previewUrl} className="msg-image-preview" alt="attachment" />}
        {msg.text && <p>{msg.text}</p>}
      </div>
      <div className="chat-avatar user-av">👤</div>
    </div>
  );
  if (msg.role === 'error') return (
    <div className="chat-bubble assistant">
      <div className="chat-avatar aegis">{avatarIcon}</div>
      <div className="chat-bubble-content error-content"><p>{msg.text}</p></div>
    </div>
  );
  return (
    <div className="chat-bubble assistant">
      <div className="chat-avatar aegis">{avatarIcon}</div>
      <div className="chat-bubble-content">
        <ResponseCards text={msg.text} />
        <div className="msg-actions">
          <button className="msg-action-btn" onClick={handleCopy} title="Copy response">
            {copied ? <Check size={13} /> : <Copy size={13} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
          {onShare && (
            <button className="msg-action-btn" onClick={() => onShare(msg)} title="Share">
              <Share2 size={13} /><span>Share</span>
            </button>
          )}
        </div>
        {msg.timestamp && <p className="timestamp">{new Date(msg.timestamp).toLocaleTimeString()}</p>}
      </div>
    </div>
  );
}

// ─── CHAT TAB ────────────────────────────────────────────────────────────────

function ChatTab({ session, onMessagesUpdate }) {
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState('');
  const [shareMsg, setShareMsg] = useState(null);
  const [attachment, setAttachment] = useState(null);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const messages = session?.messages || [];

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  const autoResize = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 200) + 'px';
  };

  const send = async () => {
    const text = input.trim();
    if ((!text && !attachment) || loading) return;
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    const isImage = attachment?.type.startsWith('image/');
    const previewUrl = isImage ? URL.createObjectURL(attachment) : null;
    const userMsg = {
      role: 'user', text: text || '',
      fileName: attachment?.name, fileMime: attachment?.type, previewUrl,
    };
    const next = [...messages, userMsg];
    onMessagesUpdate(next);
    setAttachment(null);
    setLoading(true);

    try {
      let data;
      if (attachment) {
        const fd = new FormData();
        fd.append('file', attachment);
        if (text) fd.append('message', text);
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        data = await res.json();
        onMessagesUpdate([...next, { role: 'assistant', text: data.finalPlan || data.response, timestamp: data.timestamp }]);
      } else {
        const res = await fetch('/api/ask', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text }),
        });
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        data = await res.json();
        onMessagesUpdate([...next, { role: 'assistant', text: data.finalPlan, timestamp: data.timestamp }]);
      }
    } catch (e) {
      onMessagesUpdate([...next, { role: 'error', text: `Error: ${e.message}` }]);
    } finally { setLoading(false); }
  };

  const handleKey = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } };
  const handleFile = e => { if (e.target.files[0]) setAttachment(e.target.files[0]); e.target.value = ''; };

  return (
    <div className="chat-container">
      {shareMsg && <ShareModal msg={shareMsg} onClose={() => setShareMsg(null)} />}
      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="chat-welcome">
            <div className="welcome-avatar animate-in">🧭</div>
            <h2>AEGIS is ready.</h2>
            <p>Describe your situation — I'll coordinate four specialized agents and give you a clear survival plan.</p>
          </div>
        )}
        {messages.map((msg, i) => <ChatMessage key={i} msg={msg} onShare={setShareMsg} />)}
        {loading && <LoadingBubble />}
        <div ref={bottomRef} />
      </div>

      <div className="chat-input-area">
        {attachment && (
          <div className="attachment-preview-row">
            <AttachmentPreview file={attachment} onRemove={() => setAttachment(null)} />
          </div>
        )}
        <div className="chat-input-box">
          <input ref={fileInputRef} type="file" accept={ACCEPTED_TYPES} style={{ display: 'none' }} onChange={handleFile} />
          <button className="attach-btn" onClick={() => fileInputRef.current.click()} title="Attach file" disabled={loading}>
            <Paperclip size={15} />
          </button>
          <textarea ref={textareaRef} className="chat-input" rows={1}
            placeholder="Describe your crisis situation…"
            value={input}
            onChange={e => { setInput(e.target.value); autoResize(); }}
            onKeyDown={handleKey}
            disabled={loading} />
          <button className="chat-send-btn" onClick={send} disabled={loading || (!input.trim() && !attachment)}>
            {loading ? <Loader2 size={16} className="spin" /> : <Send size={15} strokeWidth={2.5} />}
          </button>
        </div>
        <p className="chat-hint">Enter to send · Shift+Enter for new line · Attach docs, images, videos</p>
      </div>
    </div>
  );
}

// ─── AGENT CHAT TAB ──────────────────────────────────────────────────────────

function AgentChatTab({ agentKey, onBack }) {
  const agent = AGENTS[agentKey];
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [msgIdx, setMsgIdx] = useState(0);
  const [shareMsg, setShareMsg] = useState(null);
  const [attachment, setAttachment] = useState(null);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);
  useEffect(() => {
    if (!loading) return;
    const t = setInterval(() => setMsgIdx(i => (i + 1) % LOADING_MSGS.length), 1800);
    return () => clearInterval(t);
  }, [loading]);

  const autoResize = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 200) + 'px';
  };

  const send = async () => {
    const text = input.trim();
    if ((!text && !attachment) || loading) return;
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    const isImage = attachment?.type.startsWith('image/');
    const previewUrl = isImage ? URL.createObjectURL(attachment) : null;
    const userMsg = { role: 'user', text: text || '', fileName: attachment?.name, fileMime: attachment?.type, previewUrl };
    const next = [...messages, userMsg];
    setMessages(next);
    setAttachment(null);
    setLoading(true);

    try {
      let data;
      if (attachment) {
        const fd = new FormData();
        fd.append('file', attachment);
        fd.append('agentType', agentKey);
        if (text) fd.append('message', text);
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        data = await res.json();
        setMessages([...next, { role: 'assistant', text: data.response, timestamp: data.timestamp }]);
      } else {
        const res = await fetch('/api/agent/ask', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ agentType: agentKey, message: text }),
        });
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        data = await res.json();
        setMessages([...next, { role: 'assistant', text: data.response, timestamp: data.timestamp }]);
      }
    } catch (e) {
      setMessages([...next, { role: 'error', text: `Error: ${e.message}` }]);
    } finally { setLoading(false); }
  };

  const handleKey = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } };
  const handleFile = e => { if (e.target.files[0]) setAttachment(e.target.files[0]); e.target.value = ''; };

  return (
    <div className="agent-chat-wrap">
      <div className="agent-chat-header" style={{ borderColor: agent.border, background: agent.color }}>
        <button className="btn-back" onClick={onBack}>← Back</button>
        <span className="agent-chat-icon">{agent.icon}</span>
        <div>
          <h3 className="agent-chat-name">{agent.name}</h3>
          <p className="agent-chat-desc">{agent.description}</p>
        </div>
      </div>

      {shareMsg && <ShareModal msg={shareMsg} onClose={() => setShareMsg(null)} />}
      <div className="agent-chat-messages">
        {messages.length === 0 && (
          <div className="agent-chat-welcome">
            <span className="agent-welcome-icon">{agent.icon}</span>
            <p>Ask the <strong>{agent.name}</strong> anything specific to its domain.</p>
          </div>
        )}
        {messages.map((msg, i) => <ChatMessage key={i} msg={msg} onShare={setShareMsg} avatarIcon={agent.icon} />)}
        {loading && (
          <div className="chat-bubble assistant">
            <div className="chat-avatar aegis">{agent.icon}</div>
            <div className="chat-bubble-content">
              <div className="typing-dots"><span /><span /><span /></div>
              <p className="loading-msg">{LOADING_MSGS[msgIdx]}</p>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="chat-input-area" style={{ padding: '0.75rem 1rem 1rem' }}>
        {attachment && (
          <div className="attachment-preview-row">
            <AttachmentPreview file={attachment} onRemove={() => setAttachment(null)} />
          </div>
        )}
        <div className="chat-input-box">
          <input ref={fileInputRef} type="file" accept={ACCEPTED_TYPES} style={{ display: 'none' }} onChange={handleFile} />
          <button className="attach-btn" onClick={() => fileInputRef.current.click()} title="Attach file" disabled={loading}>
            <Paperclip size={15} />
          </button>
          <textarea ref={textareaRef} className="chat-input" rows={1}
            placeholder={`Ask the ${agent.name}…`}
            value={input}
            onChange={e => { setInput(e.target.value); autoResize(); }}
            onKeyDown={handleKey}
            disabled={loading} />
          <button className="chat-send-btn" onClick={send} disabled={loading || (!input.trim() && !attachment)}>
            {loading ? <Loader2 size={16} className="spin" /> : <Send size={15} strokeWidth={2.5} />}
          </button>
        </div>
        <p className="chat-hint">Enter to send · Shift+Enter for new line · Attach docs, images, videos</p>
      </div>
    </div>
  );
}

// ─── SCENARIOS TAB ───────────────────────────────────────────────────────────

function ScenariosTab() {
  const [selected, setSelected] = useState(null);      // scenario key
  const [activeAgent, setActiveAgent] = useState(null); // agent key
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    if (!loading) return;
    const t = setInterval(() => setMsgIdx(i => (i + 1) % LOADING_MSGS.length), 1800);
    return () => clearInterval(t);
  }, [loading]);

  const run = async key => {
    setSelected(key); setLoading(true); setResult(null); setError(null);
    try {
      const res = await fetch('/api/scenario/1/coordinate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...SCENARIOS[key].example, user_id: 1 }),
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      setResult(await res.json());
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  // Agent direct chat view
  if (activeAgent) {
    return <AgentChatTab agentKey={activeAgent} onBack={() => setActiveAgent(null)} />;
  }

  // Scenario result view
  if (selected) return (
    <div className="coordination-panel">
      <button className="btn-back" onClick={() => { setSelected(null); setResult(null); }}>← Back</button>
      <h2>{SCENARIOS[selected].icon} {SCENARIOS[selected].name}</h2>
      {loading && <div className="loading"><div className="spinner" /><p>{LOADING_MSGS[msgIdx]}</p></div>}
      {error && <div className="error-box"><p>❌ {error}</p><button className="btn-primary" onClick={() => run(selected)}>Retry</button></div>}
      {result && (
        <div className="result-panel">
          <ResponseCards text={result.finalPlan} />
          <p className="timestamp" style={{ textAlign: 'center', padding: '0.5rem' }}>
            Generated: {new Date(result.timestamp).toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );

  // Main selection view
  return (
    <div className="scenario-selector">
      {/* Agent cards */}
      <p className="section-label">Chat with a specific agent</p>
      <div className="agent-grid">
        {Object.entries(AGENTS).map(([key, a]) => (
          <div key={key} className="agent-card" style={{ '--agent-color': a.color, '--agent-border': a.border }} onClick={() => setActiveAgent(key)}>
            <span className="agent-card-icon">{a.icon}</span>
            <div>
              <h3>{a.name}</h3>
              <p>{a.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Scenario cards */}
      <p className="section-label" style={{ marginTop: '1.5rem' }}>Run a full scenario (all agents)</p>
      <div className="scenario-grid">
        {Object.entries(SCENARIOS).map(([key, s]) => (
          <div key={key} className="scenario-card" onClick={() => run(key)}>
            <span className="scenario-icon">{s.icon}</span>
            <div><h3>{s.name}</h3><p>{s.description}</p></div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── APP ROOT ────────────────────────────────────────────────────────────────

export default function App() {
  const [theme, setTheme] = useState(loadTheme);
  const [tab, setTab] = useState('chat');
  const [sessions, setSessions] = useState(loadSessions);
  const [currentId, setCurrentId] = useState(() => { const s = loadSessions(); return s[0]?.id || null; });
  const [user, setUser] = useState(null);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setUser(u || null));
    return unsub;
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('aegis_theme', theme);
  }, [theme]);

  const persist = next => { setSessions(next); saveSessions(next); };

  const newChat = useCallback(() => {
    const s = { id: genId(), title: 'New conversation', messages: [], createdAt: new Date().toISOString() };
    const next = [s, ...sessions];
    persist(next); setCurrentId(s.id); setTab('chat');
  }, [sessions]);

  const updateMessages = useCallback((msgs) => {
    if (!currentId) return;
    const title = msgs.find(m => m.role === 'user')?.text?.slice(0, 42) || 'New conversation';
    persist(sessions.map(s => s.id === currentId ? { ...s, messages: msgs, title } : s));
  }, [currentId, sessions]);

  useEffect(() => { if (sessions.length === 0) newChat(); }, []);

  const currentSession = sessions.find(s => s.id === currentId) || null;

  return (
    <div className="app-shell">
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      <Sidebar
        sessions={sessions} currentId={currentId}
        onSelect={id => { setCurrentId(id); setTab('chat'); }}
        onNew={newChat}
        onRename={(id, title) => persist(sessions.map(s => s.id === id ? { ...s, title } : s))}
        onDelete={id => { const n = sessions.filter(s => s.id !== id); persist(n); if (currentId === id) setCurrentId(n[0]?.id || null); }}
        theme={theme} onTheme={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
        user={user}
        onSignIn={() => setShowAuth(true)}
        onSignOut={() => signOut(auth)}
      />

      <div className="main">
        <header className="app-header">
          <nav className="header-tabs">
            <button className={`header-tab ${tab === 'chat' ? 'active' : ''}`} onClick={() => setTab('chat')}>
              <MessageSquare size={14} /> Chat
            </button>
            <button className={`header-tab ${tab === 'scenarios' ? 'active' : ''}`} onClick={() => setTab('scenarios')}>
              <LayoutGrid size={14} /> Scenarios
            </button>
          </nav>
        </header>

        <div className="content">
          {tab === 'chat'
            ? <ChatTab key={currentId} session={currentSession} onMessagesUpdate={updateMessages} />
            : <ScenariosTab />}
        </div>
      </div>
    </div>
  );
}
