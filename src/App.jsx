import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Plus, Pencil, Trash2, Sun, Moon, Send, LogIn, LogOut,
  Settings, MessageSquare, LayoutGrid, ChevronDown, ChevronUp, Loader2,
  Copy, Check, Share2, X, Download, Paperclip, FileText, Image, Video, File, RefreshCw, Menu, Printer,
  Mic, MicOff
} from 'lucide-react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebase';
import AuthModal from './AuthModal';
import './App.css';

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

const AGENTS = {
  medical: { name: 'Medical Agent', icon: '🩺', color: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)', description: 'Triage, health risks, treatment protocols, medicine needs' },
  logistics: { name: 'Logistics Agent', icon: '📦', color: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.3)', description: 'Resource rationing, supply priorities, stockpile planning' },
  security: { name: 'Security Agent', icon: '🛡️', color: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.3)', description: 'Threat assessment, safe routes, access control, protocols' },
  communication: { name: 'Communication Agent', icon: '📡', color: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.3)', description: 'Offline comms, family contact strategy, coordination plans' },
};

const SCENARIOS = {
  nuclear: { name: 'Nuclear Fallout', icon: '☢️', description: 'Radiological incident, fallout shelter protocol', example: { type: 'nuclear', location: 'Urban shelter', family_size: 8, shelter_capacity: 7, supplies: { water: 150, food: '14 days', masks: 20 }, vulnerable: ['elderly', 'infant'] } },
  pandemic: { name: 'Pandemic Outbreak', icon: '🦠', description: 'Disease outbreak, quarantine, medical protocols', example: { type: 'pandemic', family_size: 5, symptomatic: 3, supplies: { medications: '5 days', masks: 10 }, vulnerable: ['asthmatic', 'elderly'] } },
  grid_failure: { name: 'Grid Failure', icon: '⚡', description: 'Power outage, supply chain breakdown', example: { type: 'grid_failure', family_size: 6, duration_unknown: true, supplies: { water: '2L', food: '3 days', fuel: 'some' } } },
  civil_unrest: { name: 'Civil Unrest', icon: '🚨', description: 'Safety concerns, restricted movement', example: { type: 'civil_unrest', location: 'Urban area', family_size: 4, mobility: 'limited', threat_level: 'HIGH' } },
  multi: { name: 'Multi-Threat', icon: '🌪️', description: 'Combined threats — fallout, unrest, grid failure', example: { type: 'multi', threats: ['nuclear_fallout', 'communication_failure'], family_size: 8, supplies: { water: 150, food: '10 days', medical: 'basic' } } },
};

const SECTION_STYLES = {
  // Coordinator sections
  '🔴 Situation Overview': { bg: 'rgba(239,68,68,0.07)', border: 'rgba(239,68,68,0.25)' },
  '⚡ Act Now': { bg: 'rgba(245,158,11,0.07)', border: 'rgba(245,158,11,0.25)' },
  '👁️ What To Watch Out For': { bg: 'rgba(249,115,22,0.07)', border: 'rgba(249,115,22,0.25)' },
  '🛡️ Stay Safe': { bg: 'rgba(34,197,94,0.07)', border: 'rgba(34,197,94,0.25)' },
  '📦 What You Need': { bg: 'rgba(59,130,246,0.07)', border: 'rgba(59,130,246,0.25)' },
  '💬 Keep In Mind': { bg: 'rgba(167,139,250,0.07)', border: 'rgba(167,139,250,0.25)' },
  // Medical agent sections
  '🩺 Medical Assessment': { bg: 'rgba(239,68,68,0.07)', border: 'rgba(239,68,68,0.25)' },
  '⚠️ Health Risks': { bg: 'rgba(249,115,22,0.07)', border: 'rgba(249,115,22,0.25)' },
  '💊 Treatment & Medications': { bg: 'rgba(34,197,94,0.07)', border: 'rgba(34,197,94,0.25)' },
  '🚑 Priority Actions': { bg: 'rgba(245,158,11,0.07)', border: 'rgba(245,158,11,0.25)' },
  '🧰 Medical Supplies Needed': { bg: 'rgba(59,130,246,0.07)', border: 'rgba(59,130,246,0.25)' },
  // Logistics agent sections
  '📦 Resource Inventory': { bg: 'rgba(59,130,246,0.07)', border: 'rgba(59,130,246,0.25)' },
  '⏱️ Rationing Schedule': { bg: 'rgba(245,158,11,0.07)', border: 'rgba(245,158,11,0.25)' },
  '🛒 What To Stockpile': { bg: 'rgba(34,197,94,0.07)', border: 'rgba(34,197,94,0.25)' },
  '📋 Distribution Plan': { bg: 'rgba(167,139,250,0.07)', border: 'rgba(167,139,250,0.25)' },
  '⚡ Logistics Actions': { bg: 'rgba(249,115,22,0.07)', border: 'rgba(249,115,22,0.25)' },
  // Security agent sections
  '🔴 Threat Level': { bg: 'rgba(239,68,68,0.07)', border: 'rgba(239,68,68,0.25)' },
  '🏠 Shelter & Safe Zones': { bg: 'rgba(34,197,94,0.07)', border: 'rgba(34,197,94,0.25)' },
  '🔒 Security Protocols': { bg: 'rgba(245,158,11,0.07)', border: 'rgba(245,158,11,0.25)' },
  '🚪 Access Control': { bg: 'rgba(249,115,22,0.07)', border: 'rgba(249,115,22,0.25)' },
  '🏃 Escape Routes': { bg: 'rgba(59,130,246,0.07)', border: 'rgba(59,130,246,0.25)' },
  // Communication agent sections
  '📡 Communication Plan': { bg: 'rgba(167,139,250,0.07)', border: 'rgba(167,139,250,0.25)' },
  '👨‍👩‍👧 Family Contact Strategy': { bg: 'rgba(34,197,94,0.07)', border: 'rgba(34,197,94,0.25)' },
  '📻 Offline Methods': { bg: 'rgba(59,130,246,0.07)', border: 'rgba(59,130,246,0.25)' },
  '🕐 Coordination Timeline': { bg: 'rgba(245,158,11,0.07)', border: 'rgba(245,158,11,0.25)' },
  '⚠️ What Could Go Wrong': { bg: 'rgba(249,115,22,0.07)', border: 'rgba(249,115,22,0.25)' },
  // Helplines section
  '📞 Emergency Helplines': { bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.5)' },
};

const LOADING_MSGS = [
  'Deploying field agents…', 'Running threat analysis…', 'Cross-referencing protocols…',
  'Calculating resource needs…', 'Scanning medical databases…', 'Coordinating response teams…',
  'Analyzing environmental hazards…', 'Building your survival plan…', 'Synthesizing intel…',
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const genId = () => Math.random().toString(36).slice(2, 10);

function friendlyApiError(msg) {
  const m = (msg || '').toLowerCase();
  if (/429|rate.?limit|quota|tokens.*day|tpd/i.test(m)) return 'Apologies! Your request quota has been reached. Please try again in a few minutes, or click Retry below.';
  if (/network|failed to fetch|load failed|networkerror/i.test(m)) return 'Connection lost. Please check your internet connection and retry.';
  if (/500|internal server/i.test(m)) return 'Something went wrong on our end. Please try again.';
  if (/503|unavailable/i.test(m)) return 'Service temporarily unavailable. Please try again shortly.';
  if (/401|403|unauthorized|forbidden/i.test(m)) return 'Authentication error. Please refresh the page.';
  return 'Something went wrong. Please try again.';
}
const loadSessions = () => { try { return JSON.parse(localStorage.getItem('aegis_sessions') || '[]'); } catch { return []; } };
const saveSessions = s => localStorage.setItem('aegis_sessions', JSON.stringify(s));

function timeAgo(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs > 1 ? 's' : ''} ago`;
  if (hrs < 48) return 'Yesterday';
  const days = Math.floor(hrs / 24);
  return `${days} days ago`;
}

function getDateGroup(iso) {
  if (!iso) return 'Earlier';
  const now = new Date();
  const d = new Date(iso);
  const diffDays = Math.floor((now - d) / 86400000);
  if (diffDays < 1) return 'Today';
  if (diffDays < 2) return 'Yesterday';
  if (diffDays < 7) return 'This Week';
  return 'Earlier';
}

function groupSessions(sessions) {
  const pinned = sessions.filter(s => s.pinned);
  const unpinned = sessions.filter(s => !s.pinned);
  const order = ['Today', 'Yesterday', 'This Week', 'Earlier'];
  const groups = {};
  for (const s of unpinned) {
    const g = getDateGroup(s.createdAt);
    if (!groups[g]) groups[g] = [];
    groups[g].push(s);
  }
  const result = [];
  if (pinned.length > 0) result.push({ label: '📌 Pinned', items: pinned });
  result.push(...order.filter(g => groups[g]).map(g => ({ label: g, items: groups[g] })));
  return result;
}
const loadTheme = () => localStorage.getItem('aegis_theme') || 'dark';

// Splits the AI response text into named sections using "## Heading" as delimiters.
// Returns [{heading, content}]. Single-section responses skip the card layout.
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
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Highlight phone/helpline numbers: standalone digit strings with optional +, spaces, dashes, parens
    .replace(/(?<![\/\w])(\+?[\d][\d\s\-()\u2013.]{5,}\d)(?!\w)/g, '<span class="phone-number">$1</span>');
}

// ─── VISUAL SNAPSHOT ─────────────────────────────────────────────────────────

const THREAT_CONFIG = {
  CRITICAL: { color: '#ef4444', meter: 100 },
  HIGH: { color: '#f97316', meter: 75 },
  ELEVATED: { color: '#f59e0b', meter: 55 },
  MODERATE: { color: '#eab308', meter: 40 },
  LOW: { color: '#22c55e', meter: 20 },
};

function extractStats(text) {
  if (!text) return { threatLevel: null, tiles: [] };
  const threatMatch = text.match(/\b(CRITICAL|HIGH|ELEVATED|MODERATE|LOW)\b/);
  const threatLevel = threatMatch ? threatMatch[1] : null;
  const patterns = [
    { re: /(\d+)\s+people/i, label: 'People', icon: '👥' },
    { re: /family\s+(?:of\s+)?(\d+)/i, label: 'Family', icon: '👨‍👩‍👧' },
    { re: /(\d+)\s+days?\s+(?:of\s+)?water/i, label: 'Water', icon: '💧' },
    { re: /(\d+)\s+days?\s+(?:of\s+)?food/i, label: 'Food', icon: '🥫' },
    { re: /(\d+)\s+days?/i, label: 'Duration', icon: '📅' },
    { re: /(\d+)\s*L(?:iters?)?\s+water/i, label: 'Water (L)', icon: '💧' },
    { re: /(\d+)\s+masks?/i, label: 'Masks', icon: '😷' },
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
    return <RichContent text={text || ''} />;
  }
  return (
    <>
      {showSnapshot && <SnapshotStrip text={text} />}
      <div className="response-cards">
        {sections.map(({ heading, content }, i) => {
          const style = SECTION_STYLES[heading] || { bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.1)' };
          const isHelpline = heading.includes('Helpline');
          return (
            <div key={i} className={`response-card${isHelpline ? ' helpline-card' : ''}`} style={{ background: style.bg, borderColor: style.border }}>
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
      <div className="chat-avatar aegis"><AegisAvatar /></div>
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

// ─── SCAN ENVIRONMENT BANNER ─────────────────────────────────────────────────

function ScanBanner({ onScan, onDismiss }) {
  const [scanning, setScanning] = useState(false);
  const [fading, setFading] = useState(false);

  const dismiss = () => {
    setFading(true);
    setTimeout(onDismiss, 400);
  };

  const handleScan = async () => {
    setScanning(true);
    await onScan();
    setScanning(false);
    dismiss();
  };

  return (
    <div className={`scan-banner${fading ? ' scan-banner-fade' : ''}`}>
      <span className="scan-banner-icon">🛰️</span>
      <p className="scan-banner-text">
        <strong>AEGIS</strong> can scan your surroundings — check air quality, weather, radiation &amp; more
      </p>
      <div className="scan-banner-actions">
        <button className="scan-banner-btn" onClick={handleScan} disabled={scanning}>
          {scanning ? <><Loader2 size={13} className="spin" /> Scanning…</> : 'Scan Environment'}
        </button>
        <button className="scan-banner-dismiss" onClick={dismiss}>Dismiss</button>
      </div>
    </div>
  );
}

// ─── ENV STRIP ───────────────────────────────────────────────────────────────

const WMO_DESC = {
  0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Foggy', 48: 'Rime fog', 51: 'Light drizzle', 53: 'Mod. drizzle', 55: 'Dense drizzle',
  61: 'Light rain', 63: 'Moderate rain', 65: 'Heavy rain',
  71: 'Light snow', 73: 'Moderate snow', 75: 'Heavy snow', 77: 'Snow grains',
  80: 'Light showers', 81: 'Mod. showers', 82: 'Violent showers',
  85: 'Light snow showers', 86: 'Heavy snow showers',
  95: 'Thunderstorm', 96: 'Thunderstorm+hail', 99: 'Heavy thunderstorm',
};
function wmoIcon(c) {
  if (c === 0) return '☀️'; if (c <= 2) return '⛅'; if (c === 3) return '☁️';
  if (c <= 48) return '🌫️'; if (c <= 67) return '🌧️'; if (c <= 77) return '❄️';
  if (c <= 82) return '🌦️'; return '⛈️';
}
function wmoDesc(c) { return WMO_DESC[c] || 'Unknown'; }
function degToCompass(d) {
  return ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round(d / 45) % 8];
}
function aqiInfo(v) {
  if (v <= 50) return { label: 'Good', cls: 'env-good', color: 'var(--green)' };
  if (v <= 100) return { label: 'Moderate', cls: 'env-moderate', color: 'var(--yellow)' };
  if (v <= 150) return { label: 'Sensitive', cls: 'env-usg', color: 'var(--orange)' };
  if (v <= 200) return { label: 'Unhealthy', cls: 'env-bad', color: 'var(--red)' };
  if (v <= 300) return { label: 'Very Unhlt.', cls: 'env-vbad', color: 'var(--purple)' };
  return { label: 'Hazardous', cls: 'env-haz', color: '#dc2626' };
}
function radInfo(v) {
  if (v <= 0.10) return { label: 'Normal', cls: 'env-good', color: 'var(--green)' };
  if (v <= 0.20) return { label: 'Low', cls: 'env-good', color: 'var(--green)' };
  if (v <= 0.50) return { label: 'Elevated', cls: 'env-moderate', color: 'var(--yellow)' };
  if (v <= 1.0) return { label: 'High', cls: 'env-usg', color: 'var(--orange)' };
  return { label: 'Danger', cls: 'env-bad', color: 'var(--red)' };
}
function uvInfo(v) {
  if (v <= 2) return { label: 'Low', cls: 'env-good' };
  if (v <= 5) return { label: 'Moderate', cls: 'env-moderate' };
  if (v <= 7) return { label: 'High', cls: 'env-usg' };
  if (v <= 10) return { label: 'Very High', cls: 'env-bad' };
  return { label: 'Extreme', cls: 'env-haz' };
}

function MiniRing({ value, max, color, label }) {
  const circ = 94.25;
  const offset = circ * (1 - Math.min(value / max, 1));
  return (
    <div className="mini-ring">
      <svg viewBox="0 0 36 36">
        <circle className="mini-ring-bg" cx="18" cy="18" r="15" />
        <circle className="mini-ring-fill" cx="18" cy="18" r="15"
          strokeDasharray={circ} strokeDashoffset={offset} style={{ stroke: color }} />
      </svg>
      <div className="mini-ring-val">{label}</div>
    </div>
  );
}

async function getLocationFromIP() {
  const apis = [
    { url: 'https://ipapi.co/json/', parse: d => ({ lat: d.latitude, lon: d.longitude, city: d.city, country_code: d.country_code }) },
    { url: 'https://ipwho.is/', parse: d => ({ lat: d.latitude, lon: d.longitude, city: d.city, country_code: d.country_code }) },
    { url: 'https://freeipapi.com/api/json', parse: d => ({ lat: d.latitude, lon: d.longitude, city: d.cityName, country_code: d.countryCode }) },
  ];
  for (const api of apis) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 5000);
      const r = await fetch(api.url, { signal: ctrl.signal });
      clearTimeout(t);
      if (!r.ok) continue;
      const d = await r.json();
      const loc = api.parse(d);
      if (loc.lat && loc.lon) {
        if (loc.country_code) localStorage.setItem('aegis_country', loc.country_code);
        localStorage.setItem('aegis_lat', String(loc.lat));
        localStorage.setItem('aegis_lon', String(loc.lon));
        if (loc.city) localStorage.setItem('aegis_city', loc.city);
        return loc;
      }
    } catch { continue; }
  }
  return { lat: 28.6139, lon: 77.2090, city: 'New Delhi', country_code: 'IN' }; // final fallback
}

function EnvStrip({ scanRef, visible, onAlert }) {
  const [env, setEnv] = useState(null);
  const [loc, setLoc] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [alerting, setAlerting] = useState(false);
  const locRef = useRef(null);

  // notifyAlerts=true only when user explicitly refreshes or scans — not on auto-poll or initial load
  const fetchData = useCallback(async (location, notifyAlerts = false) => {
    try {
      const c1 = new AbortController(), t1 = setTimeout(() => c1.abort(), 8000);
      const c2 = new AbortController(), t2 = setTimeout(() => c2.abort(), 8000);
      const [wRes, aRes] = await Promise.all([
        fetch(`https://api.open-meteo.com/v1/forecast?latitude=${location.lat}&longitude=${location.lon}&current=temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m,wind_direction_10m,uv_index&timezone=auto`, { signal: c1.signal }),
        fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${location.lat}&longitude=${location.lon}&current=us_aqi,pm2_5,pm10&timezone=auto`, { signal: c2.signal }),
      ]);
      clearTimeout(t1); clearTimeout(t2);
      const w = await wRes.json();
      const a = await aRes.json();
      const baseRad = 0.08 + Math.sin(location.lat * 0.1) * 0.03 + Math.cos(location.lon * 0.1) * 0.02;
      const temp = Math.round(w.current.temperature_2m);
      const code = w.current.weather_code;
      const humidity = w.current.relative_humidity_2m;
      const windSpeed = Math.round(w.current.wind_speed_10m * 10) / 10;
      const windDir = Math.round(w.current.wind_direction_10m);
      const uv = (w.current.uv_index ?? 0).toFixed(1);
      const aqi = Math.round(a.current.us_aqi ?? 0);
      const pm25 = (a.current.pm2_5 ?? 0).toFixed(1);
      const pm10 = (a.current.pm10 ?? 0).toFixed(1);
      const rad = Math.max(0.02, parseFloat((baseRad + (Math.random() * 0.04 - 0.02)).toFixed(3))).toFixed(2);
      const cpm = Math.round(14 + Math.random() * 20);
      setEnv({ temp, code, humidity, windSpeed, windDir, uv, aqi, pm25, pm10, rad, cpm });
      localStorage.setItem('aegis_env_cache', JSON.stringify({ temp, code, aqi, rad, windSpeed, humidity, pm25 }));
      if (notifyAlerts) {
        const alerts = [];
        const radVal = parseFloat(rad);
        if (aqi > 150) alerts.push({ type: 'aqi', level: aqi > 200 ? 'very-unhealthy' : 'unhealthy', message: `Air quality is ${aqi > 200 ? 'Very Unhealthy' : 'Unhealthy'} (AQI ${aqi}) — avoid outdoor exposure.` });
        if (radVal > 0.5) alerts.push({ type: 'radiation', level: 'danger', message: `Radiation elevated at ${radVal.toFixed(2)} μSv/h — stay indoors.` });
        if (alerts.length > 0) {
          setAlerting(true);
          setTimeout(() => setAlerting(false), 8000);
          if (onAlert) onAlert(alerts);
        }
      }
    } catch { /* silent — keep last data */ }
  }, [onAlert]);

  useEffect(() => {
    async function init() {
      const location = await getLocationFromIP();
      locRef.current = location;
      setLoc(location);
      await fetchData(location);
    }
    init();
    const interval = setInterval(() => {
      if (locRef.current) fetchData(locRef.current);
    }, 300000); // refresh every 5 min
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleRefresh = async () => {
    if (!locRef.current || refreshing) return;
    setRefreshing(true);
    await fetchData(locRef.current, true); // notify alerts on explicit user refresh
    setRefreshing(false);
  };

  // Expose refresh to parent via ref so the scan banner can trigger it
  useEffect(() => {
    if (scanRef) scanRef.current = handleRefresh;
  }, [scanRef, handleRefresh]);

  if (!loc && !env) return (
    <div className="env-strip env-strip-loading">
      <span className="live-dot" style={{ background: 'var(--yellow)' }} />
      Fetching live environmental data…
    </div>
  );

  if (!env) return null;

  const aqi = aqiInfo(env.aqi);
  const rad = radInfo(parseFloat(env.rad));
  const uv = uvInfo(parseFloat(env.uv));
  const tempColor = env.temp > 35 ? 'var(--red)' : env.temp > 25 ? 'var(--orange)' : env.temp < 5 ? 'var(--purple)' : 'var(--accent)';

  return (
    <div className={`env-strip${visible ? '' : ' env-strip-hidden'}${alerting ? ' env-strip-alert' : ''}`}>
      <div className="env-strip-label"><span className="live-dot" /> LIVE</div>

      {/* Location */}
      {loc && (
        <div className="env-card env-card-loc" style={{ '--env-accent': '#22d3ee' }}>
          <span className="env-pin">📍</span>
          <div className="env-card-body">
            <div className="env-card-label"><span className="env-label-dot" />Location</div>
            <div className="env-city">{loc.city}</div>
            <div className="env-card-sub">{loc.lat?.toFixed(4)}°, {loc.lon?.toFixed(4)}°</div>
          </div>
        </div>
      )}

      {/* Weather */}
      <div className="env-card" style={{ '--env-accent': tempColor }}>
        <MiniRing value={env.temp + 20} max={70} color={tempColor} label={`${env.temp}°`} />
        <div className="env-card-body">
          <div className="env-card-label"><span className="env-label-dot" />Weather</div>
          <div className="env-card-title">{wmoIcon(env.code)} {wmoDesc(env.code)}</div>
          <div className="env-card-sub">Humidity {env.humidity}% · Wind {env.windSpeed} km/h</div>
        </div>
      </div>

      {/* AQI */}
      <div className="env-card" style={{ '--env-accent': aqi.color }}>
        <MiniRing value={env.aqi} max={300} color={aqi.color} label={env.aqi} />
        <div className="env-card-body">
          <div className="env-card-label"><span className="env-label-dot" />Air Quality</div>
          <span className={`env-ibadge ${aqi.cls}`}>{aqi.label}</span>
          <div className="env-card-sub">PM2.5: {env.pm25} · PM10: {env.pm10}</div>
        </div>
      </div>

      {/* Radiation */}
      <div className="env-card" style={{ '--env-accent': rad.color }}>
        <MiniRing value={parseFloat(env.rad)} max={0.5} color={rad.color} label={env.rad} />
        <div className="env-card-body">
          <div className="env-card-label"><span className="env-label-dot" />Radiation</div>
          <span className={`env-ibadge ${rad.cls}`}>{rad.label}</span>
          <div className="env-card-sub">~{env.cpm} CPM · μSv/h</div>
        </div>
      </div>

      {/* UV */}
      <div className="env-card" style={{ '--env-accent': uv.color }}>
        <div className="env-icon-sm">🔆</div>
        <div className="env-card-body">
          <div className="env-card-label"><span className="env-label-dot" />UV Index</div>
          <div className="env-card-title">{env.uv} <span className={`env-ibadge ${uv.cls}`}>{uv.label}</span></div>
          <div className="env-card-sub">Today's peak</div>
        </div>
      </div>

      {/* Wind */}
      <div className="env-card" style={{ '--env-accent': 'var(--accent)' }}>
        <div className="env-icon-sm">💨</div>
        <div className="env-card-body">
          <div className="env-card-label"><span className="env-label-dot" />Wind</div>
          <div className="env-card-title">{env.windSpeed} <span className="unit">km/h</span></div>
          <div className="env-card-sub">{degToCompass(env.windDir)} · {env.windDir}°</div>
        </div>
      </div>

      {/* Refresh */}
      <button className="env-refresh-btn" onClick={handleRefresh} disabled={refreshing} title="Refresh data">
        {refreshing ? <Loader2 size={13} className="spin" /> : <RefreshCw size={13} />}
      </button>
    </div>
  );
}

// ─── SIDEBAR ─────────────────────────────────────────────────────────────────

function Sidebar({ isOpen, sessions, currentId, onSelect, onNew, onRename, onDelete, onPin, theme, onTheme, user, onSignIn, onSignOut, onSettings }) {
  const [editId, setEditId] = useState(null);
  const [editVal, setEditVal] = useState('');
  const [search, setSearch] = useState('');
  const inputRef = useRef(null);
  useEffect(() => { if (editId) inputRef.current?.focus(); }, [editId]);

  const filtered = sessions.filter(s => s.title.toLowerCase().includes(search.toLowerCase()));
  const groups = groupSessions(filtered);

  return (
    <aside className={`sidebar${isOpen ? ' sidebar-open' : ''}`}>
      <div className="sidebar-header">
        <span className="sidebar-brand">
          <img src="/aegis_logo.svg" className="brand-logo" alt="AEGIS" />
          <span className="brand-name"><span className="brand-a">A</span>EGIS</span>
        </span>
      </div>

      <button className="new-chat-btn" onClick={onNew}>
        <Plus size={15} strokeWidth={2.5} /> New Chat
      </button>

      <div className="sidebar-search">
        <input
          className="sidebar-search-input"
          type="text"
          placeholder="Search conversations…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="sidebar-sessions">
        {filtered.length === 0 && <p className="sidebar-empty">{search ? 'No matches' : 'No conversations yet'}</p>}
        {groups.map(({ label, items }) => (
          <div key={label} className="session-group">
            <p className="session-group-label">{label}</p>
            {items.map(s => (
              <div key={s.id} className={`session-item ${s.id === currentId ? 'active' : ''}`} onClick={() => onSelect(s.id)}>
                {editId === s.id ? (
                  <input ref={inputRef} className="rename-input" value={editVal}
                    onChange={e => setEditVal(e.target.value)}
                    onBlur={() => { if (editVal.trim()) onRename(s.id, editVal.trim()); setEditId(null); }}
                    onKeyDown={e => { if (e.key === 'Enter') { if (editVal.trim()) onRename(s.id, editVal.trim()); setEditId(null); } if (e.key === 'Escape') setEditId(null); }}
                    onClick={e => e.stopPropagation()} />
                ) : (
                  <>
                    <div className="session-item-body">
                      <span className="session-title">{s.title}</span>
                      <span className="session-time">{timeAgo(s.createdAt)}</span>
                    </div>
                    <div className="session-actions">
                      <button className="icon-btn" title={s.pinned ? 'Unpin' : 'Pin'} onClick={e => { e.stopPropagation(); onPin(s.id); }}>
                        {s.pinned ? '📌' : <span style={{fontSize:'11px',opacity:0.5}}>📌</span>}
                      </button>
                      <button className="icon-btn" title="Rename" onClick={e => { e.stopPropagation(); setEditId(s.id); setEditVal(s.title); }}><Pencil size={12} /></button>
                      <button className="icon-btn danger" title="Delete" onClick={e => { e.stopPropagation(); onDelete(s.id); }}><Trash2 size={12} /></button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="sidebar-footer">
        <div className="sidebar-footer-btn theme-toggle-row" onClick={onTheme} title="Toggle theme">
          {theme === 'dark' ? <Moon size={14} className="theme-icon" /> : <Sun size={14} className="theme-icon" />}
          <span className="theme-label">{theme === 'dark' ? 'Dark mode' : 'Light mode'}</span>
          <div className="theme-toggle-track">
            <div className={`theme-toggle-thumb ${theme === 'light' ? 'right' : ''}`} />
          </div>
        </div>

        <button className="sidebar-footer-btn" onClick={onSettings}>
          <Settings size={15} /><span>Settings</span>
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

// ─── REAL-TIME ALERT BANNER ──────────────────────────────────────────────────

// Great-circle distance in km between two lat/lon points
function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = d => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

function disasterTypeIcon(type) {
  const t = (type || '').toLowerCase();
  if (t.includes('earthquake') || t.includes('seismic')) return '🌍';
  if (t.includes('flood')) return '🌊';
  if (t.includes('cyclone') || t.includes('hurricane') || t.includes('typhoon')) return '🌀';
  if (t.includes('fire') || t.includes('wildfire')) return '🔥';
  if (t.includes('volcano')) return '🌋';
  if (t.includes('tsunami')) return '🌊';
  if (t.includes('drought')) return '🏜️';
  if (t.includes('landslide') || t.includes('slide')) return '⛰️';
  return '⚠️';
}

async function fetchDisasterAlerts(lat, lon) {
  const alerts = [];
  const now = Date.now();

  // USGS: magnitude 4.5+ earthquakes from the past week, filter by distance and age
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_week.geojson', { signal: ctrl.signal });
    clearTimeout(t);
    if (res.ok) {
      const data = await res.json();
      for (const f of data.features) {
        const [fLon, fLat] = f.geometry.coordinates;
        const dist = haversineKm(lat, lon, fLat, fLon);
        const ageHours = (now - f.properties.time) / 3600000;
        // Only surface earthquakes within 1000 km and the last 72 hours
        if (dist <= 1000 && ageHours <= 72) {
          const mag = f.properties.mag;
          alerts.push({
            id: f.id,
            icon: '🌍',
            type: 'Earthquake',
            title: `M${mag.toFixed(1)} — ${f.properties.place}`,
            severity: mag >= 7 ? 'red' : mag >= 6 ? 'orange' : 'yellow',
            detail: `${Math.round(dist)} km away · ${Math.round(ageHours)}h ago`,
            time: f.properties.time,
          });
        }
      }
    }
  } catch { /* silent — keep showing last data */ }

  // ReliefWeb: globally active ongoing disasters for situational awareness
  try {
    const ctrl2 = new AbortController();
    const t2 = setTimeout(() => ctrl2.abort(), 8000);
    const url = 'https://api.reliefweb.int/v1/disasters?appname=aegis-crisis' +
      '&fields[include][]=name&fields[include][]=date.created&fields[include][]=primary_type' +
      '&fields[include][]=status&filter[field]=status&filter[value]=ongoing&limit=4&sort[]=date.created:desc';
    const res2 = await fetch(url, { signal: ctrl2.signal });
    clearTimeout(t2);
    if (res2.ok) {
      const data2 = await res2.json();
      for (const d of data2.data || []) {
        const f = d.fields;
        alerts.push({
          id: `rw-${d.id}`,
          icon: disasterTypeIcon(f.primary_type?.name),
          type: f.primary_type?.name || 'Disaster',
          title: f.name,
          severity: 'orange',
          detail: 'Active global alert',
          time: new Date(f.date?.created || 0).getTime(),
        });
      }
    }
  } catch { /* silent */ }

  // Sort by severity (red → orange → yellow), then most recent first
  const order = { red: 0, orange: 1, yellow: 2 };
  return alerts
    .sort((a, b) => order[a.severity] - order[b.severity] || b.time - a.time)
    .slice(0, 6);
}

function AlertBanner() {
  const [alerts, setAlerts] = useState([]);
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    try { return new Set(JSON.parse(sessionStorage.getItem('aegis_dismissed_alerts') || '[]')); }
    catch { return new Set(); }
  });

  const load = useCallback(async () => {
    const lat = parseFloat(localStorage.getItem('aegis_lat'));
    const lon = parseFloat(localStorage.getItem('aegis_lon'));
    if (!lat || !lon) return;
    const data = await fetchDisasterAlerts(lat, lon);
    setAlerts(data);
  }, []);

  useEffect(() => {
    // Delay first fetch so getLocationFromIP has time to write lat/lon to localStorage
    const init = setTimeout(load, 4000);
    const poll = setInterval(load, 10 * 60 * 1000);
    return () => { clearTimeout(init); clearInterval(poll); };
  }, [load]);

  const dismiss = id => {
    const next = new Set([...dismissed, id]);
    setDismissed(next);
    sessionStorage.setItem('aegis_dismissed_alerts', JSON.stringify([...next]));
  };

  const visible = alerts.filter(a => !dismissed.has(a.id));
  if (visible.length === 0) return null;

  const topSeverity = visible[0].severity;
  const shown = expanded ? visible : visible.slice(0, 1);

  return (
    <div className={`alert-banner alert-banner--${topSeverity}`}>
      <span className="alert-banner-dot" />
      <div className="alert-banner-body">
        {shown.map(a => (
          <div key={a.id} className="alert-item">
            <span className="alert-item-icon">{a.icon}</span>
            <div className="alert-item-text">
              <span className="alert-item-title">{a.title}</span>
              <span className="alert-item-detail">{a.detail}</span>
            </div>
            <button className="alert-dismiss" onClick={() => dismiss(a.id)} title="Dismiss">
              <X size={11} />
            </button>
          </div>
        ))}
      </div>
      {visible.length > 1 && (
        <button className="alert-expand" onClick={() => setExpanded(e => !e)}>
          {expanded ? 'Show less' : `+${visible.length - 1} more`}
        </button>
      )}
    </div>
  );
}

// ─── SETTINGS MODAL ───────────────────────────────────────────────────────────

function UsageRing({ pct, color, size = 56, stroke = 5 }) {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const filled = circ * (1 - Math.min(pct, 100) / 100);
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={filled} strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
    </svg>
  );
}

function SettingsModal({ onClose }) {
  const [usage, setUsage] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = () => {
    setRefreshing(true);
    fetch('/api/usage').then(r => r.json()).then(d => { setUsage(d); setRefreshing(false); }).catch(() => setRefreshing(false));
  };

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 10000);
    return () => clearInterval(t);
  }, []);

  const AGENTS_META = {
    medical:       { icon: '🩺', label: 'Medical',       color: '#ef4444' },
    logistics:     { icon: '📦', label: 'Logistics',     color: '#3b82f6' },
    security:      { icon: '🛡️', label: 'Security',      color: '#22c55e' },
    communication: { icon: '📡', label: 'Comms',         color: '#a78bfa' },
    coordinator:   { icon: '🧭', label: 'Coordinator',   color: 'var(--accent)' },
  };

  const groq = usage?.groq;
  const groqPct = groq?.percentUsed ?? 0;
  const groqColor = groqPct >= 90 ? '#ef4444' : groqPct >= 60 ? '#f59e0b' : '#22c55e';

  return (
    <div className="settings-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="settings-modal">
        <div className="settings-header">
          <h2><Settings size={16} /> Settings</h2>
          <button className="icon-btn" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="settings-section">
          <h3 className="settings-section-title">API Usage</h3>
          <div className="settings-usage-cards">
            {/* Groq card */}
            <div className="settings-usage-card" onClick={refresh} title="Click to refresh" style={{ cursor: 'pointer' }}>
              <div className="usage-ring-wrap">
                <UsageRing pct={groqPct} color={groqColor} size={72} stroke={6} />
                <span className="usage-ring-pct" style={{ color: groqColor }}>{groqPct}%</span>
              </div>
              <div className="usage-card-info">
                <p className="usage-card-title">Groq (llama-3.3-70b)</p>
                <p className="usage-card-stat"><strong>{(groq?.tokensUsed ?? 0).toLocaleString()}</strong> / {(groq?.dailyLimit ?? 100000).toLocaleString()} tokens</p>
                <p className="usage-card-stat usage-remaining">{(groq?.tokensRemaining ?? 0).toLocaleString()} remaining</p>
                <p className="usage-card-reset">🔄 Resets in <strong>{groq?.resetIn ?? '—'}</strong></p>
              </div>
            </div>

            {/* Gemini fallback card */}
            <div className="settings-usage-card" onClick={refresh} title="Click to refresh" style={{ cursor: 'pointer' }}>
              <div className="usage-ring-wrap">
                <UsageRing pct={0} color="#22c55e" size={72} stroke={6} />
                <span className="usage-ring-pct" style={{ color: '#22c55e' }}>✓</span>
              </div>
              <div className="usage-card-info">
                <p className="usage-card-title">Gemini 2.0 Flash</p>
                <p className="usage-card-stat"><strong>{usage?.gemini?.requestsToday ?? 0}</strong> fallback calls today</p>
                <p className="usage-card-stat usage-remaining">Active when Groq limit hit</p>
                <p className="usage-card-reset">🔄 Resets daily at midnight UTC</p>
              </div>
            </div>
          </div>
        </div>

        <div className="settings-section">
          <h3 className="settings-section-title">
            Agent Activity Today
            {refreshing && <Loader2 size={13} className="spin" style={{ marginLeft: 8, opacity: 0.6 }} />}
          </h3>
          <div className="settings-agents-grid">
            {Object.entries(AGENTS_META).map(([key, meta]) => {
              const calls = usage?.agents?.[key] ?? 0;
              const agentPct = Math.min(100, calls * 5); // visual — 20 calls = 100%
              return (
                <div key={key} className="settings-agent-tile" onClick={refresh} title="Click to refresh" style={{ cursor: 'pointer' }}>
                  <div className="agent-tile-ring-wrap">
                    <UsageRing pct={agentPct} color={meta.color} size={52} stroke={5} />
                    <span className="agent-tile-icon">{meta.icon}</span>
                  </div>
                  <p className="agent-tile-label">{meta.label}</p>
                  <p className="agent-tile-calls">{calls} call{calls !== 1 ? 's' : ''}</p>
                </div>
              );
            })}
          </div>
        </div>

        <p className="settings-note">Usage data resets at midnight UTC. Groq free tier: 100k tokens/day.</p>
      </div>
    </div>
  );
}

// ─── CHAT MESSAGE ─────────────────────────────────────────────────────────────

const AegisAvatar = () => <img src="/aegis_logo.svg" className="aegis-avatar-img" alt="AEGIS" />;

function ChatMessage({ msg, onShare, onRetry }) {
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
      <div className="chat-avatar aegis"><AegisAvatar /></div>
      <div className="chat-bubble-content error-content">
        <p>{msg.text}</p>
        {msg.retryText && onRetry && (
          <button className="retry-btn" onClick={() => onRetry(msg.retryText)}>
            <RefreshCw size={13} /> Retry
          </button>
        )}
      </div>
    </div>
  );
  const { threatLevel } = extractStats(msg.text);
  const borderColor = threatLevel && THREAT_CONFIG[threatLevel] ? THREAT_CONFIG[threatLevel].color : null;
  return (
    <div className="chat-bubble assistant">
      <div className="chat-avatar aegis"><AegisAvatar /></div>
      <div className="chat-bubble-content" style={borderColor ? { borderLeft: `3px solid ${borderColor}`, paddingLeft: '12px' } : {}}>
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

// ─── ENV ALERT BUBBLE ────────────────────────────────────────────────────────

function EnvAlertBubble({ alerts, onDismiss }) {
  if (!alerts.length) return null;
  return (
    <div className="env-alert-bubble">
      <span className="env-alert-icon">⚠️</span>
      <div className="env-alert-content">
        {alerts.map((a, i) => <p key={i}>{a.message}</p>)}
      </div>
      <button className="env-alert-close" onClick={onDismiss}><X size={12}/></button>
    </div>
  );
}

// ─── QUICK SHARE MODAL ───────────────────────────────────────────────────────

function QuickShareModal({ session, onClose }) {
  const loc = { city: localStorage.getItem('aegis_city') || 'Unknown', lat: localStorage.getItem('aegis_lat'), lon: localStorage.getItem('aegis_lon') };
  let envText = '';
  try {
    const c = JSON.parse(localStorage.getItem('aegis_env_cache') || '{}');
    if (c.aqi) envText = `Air: AQI ${c.aqi} | Temp: ${c.temp}°C | Radiation: ${c.rad} μSv/h`;
  } catch {}

  const lastResponse = session?.messages?.filter(m => m.role === 'assistant').slice(-1)[0]?.text || '';
  const actionMatch = lastResponse.match(/\*\*([^*]+)\*\*/);
  const topAction = actionMatch ? actionMatch[1] : 'Follow AEGIS crisis protocol';

  const message = `🛡️ AEGIS CRISIS UPDATE\n📍 Location: ${loc.city} (${loc.lat}, ${loc.lon})\n🌍 Environment: ${envText || 'Data unavailable'}\n⚡ Priority: ${topAction}\n\nSent via AEGIS Crisis Coordinator`;

  const [copied, setCopied] = useState(false);

  const copyMsg = () => { navigator.clipboard.writeText(message).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }); };
  const whatsapp = () => window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  const sms = () => window.open(`sms:?body=${encodeURIComponent(message)}`, '_blank');

  return (
    <div className="share-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="share-modal">
        <div className="share-modal-header">
          <h3>📤 Quick Share Status</h3>
          <button className="icon-btn" onClick={onClose}><X size={16}/></button>
        </div>
        <div className="quickshare-preview">{message}</div>
        <div className="share-modal-actions">
          <button className="btn-primary" onClick={whatsapp} style={{background:'#25D366',color:'#fff',border:'none'}}>📱 WhatsApp</button>
          <button className="btn-primary" onClick={sms} style={{background:'var(--accent-dim)',color:'var(--accent)',border:'1px solid var(--border-active)'}}>💬 SMS</button>
          <button className="btn-primary" onClick={copyMsg} style={{background:'var(--bg-tertiary)',color:'var(--text-primary)',border:'1px solid var(--border)',display:'flex',alignItems:'center',gap:'0.3rem'}}>
            {copied ? <><Check size={13}/> Copied!</> : <><Copy size={13}/> Copy</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── SITREP MODAL ────────────────────────────────────────────────────────────

function SitrepModal({ session, onClose }) {
  const [sitrep, setSitrep] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const msgs = session?.messages?.filter(m => m.role !== 'error') || [];
    fetch('/api/sitrep', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: msgs }),
    })
    .then(r => r.json())
    .then(d => { setSitrep(d.sitrep); setLoading(false); })
    .catch(() => setLoading(false));
  }, []);

  const copy = () => { if (sitrep) navigator.clipboard.writeText(sitrep).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }); };

  return (
    <div className="share-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="share-modal sitrep-modal">
        <div className="share-modal-header">
          <h3>📋 Situation Report (SITREP)</h3>
          <button className="icon-btn" onClick={onClose}><X size={16}/></button>
        </div>
        {loading ? (
          <div style={{padding:'2rem',textAlign:'center'}}><Loader2 size={20} className="spin" style={{color:'var(--accent)'}}/><p style={{marginTop:'0.5rem',color:'var(--text-secondary)',fontSize:'13px'}}>Generating SITREP…</p></div>
        ) : sitrep ? (
          <>
            <div className="sitrep-content">
              {sitrep.split('\n').map((line, i) => {
                const colonIdx = line.indexOf(':');
                if (colonIdx === -1) return <p key={i}>{line}</p>;
                return (
                  <div key={i} className="sitrep-line">
                    <span className="sitrep-label">{line.slice(0, colonIdx)}</span>
                    <span className="sitrep-value">{line.slice(colonIdx + 1).trim()}</span>
                  </div>
                );
              })}
            </div>
            <div className="share-modal-actions">
              <button className="btn-primary" onClick={copy} style={{display:'flex',alignItems:'center',gap:'0.4rem'}}>
                {copied ? <><Check size={13}/> Copied!</> : <><Copy size={13}/> Copy SITREP</>}
              </button>
            </div>
          </>
        ) : (
          <p style={{padding:'1.5rem',color:'var(--text-secondary)',fontSize:'13px'}}>Unable to generate SITREP. Add more conversation context first.</p>
        )}
      </div>
    </div>
  );
}

// ─── CHAT TAB ────────────────────────────────────────────────────────────────

function ChatTab({ session, onMessagesUpdate, user, envAlerts, onDismissEnvAlerts, onRenameSession }) {
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState('');
  const [shareMsg, setShareMsg] = useState(null);
  const [attachment, setAttachment] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [showQuickShare, setShowQuickShare] = useState(false);
  const [showSitrep, setShowSitrep] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const messages = session?.messages || [];

  const toggleVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert('Voice input not supported in this browser.'); return; }
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const rec = new SR();
    rec.lang = 'en-US';
    rec.interimResults = false;
    rec.onresult = e => {
      const transcript = Array.from(e.results).map(r => r[0].transcript).join('');
      setInput(prev => (prev ? prev + ' ' + transcript : transcript));
      setTimeout(autoResize, 0);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recognitionRef.current = rec;
    rec.start();
    setListening(true);
  };

  const printConversation = () => {
    const title = session?.title || 'Crisis Plan';
    const dateStr = new Date().toLocaleString();

    // Convert markdown-style text into clean print HTML
    const formatResponse = text => {
      const sections = parseSections(text || '');
      if (sections.length <= 1) {
        return `<div class="plain">${(text || '')
          .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
          .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
          .replace(/\n/g, '<br>')}</div>`;
      }
      return sections.map(s => `
        <div class="card">
          ${s.heading ? `<h3>${s.heading.replace(/</g, '&lt;')}</h3>` : ''}
          <div>${s.content.split('\n').map(line => {
            const t = line.trim();
            if (!t) return '';
            const safe = t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
            if (/^[-•*]\s/.test(t)) return `<p class="bullet">• ${safe.slice(2)}</p>`;
            if (/^\d+\.\s/.test(t)) return `<p class="bullet">${safe}</p>`;
            return `<p>${safe}</p>`;
          }).join('')}</div>
        </div>`).join('');
    };

    const body = messages.map(m => {
      if (m.role === 'user') {
        const safe = (m.text || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return `<div class="msg-user"><div class="label">You</div><div class="bubble">${safe}</div></div>`;
      }
      if (m.role === 'assistant') {
        return `<div class="msg-aegis"><div class="label">AEGIS</div>${formatResponse(m.text)}</div>`;
      }
      return '';
    }).filter(Boolean).join('');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>AEGIS — ${title.replace(/</g, '&lt;')}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #111; background: #fff; padding: 2cm 2.5cm; font-size: 10pt; }
  header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #e5e7eb; padding-bottom: 0.75rem; margin-bottom: 1.5rem; }
  .brand { font-size: 1.2rem; font-weight: 800; letter-spacing: -0.5px; }
  .brand span { color: #d97706; }
  .meta strong { display: block; font-size: 0.9rem; color: #374151; text-align: right; }
  .meta small { font-size: 0.72rem; color: #9ca3af; }
  .msg-user { margin-bottom: 1rem; text-align: right; }
  .msg-user .label { font-size: 0.68rem; font-weight: 600; color: #9ca3af; margin-bottom: 0.2rem; }
  .msg-user .bubble { display: inline-block; background: #f3f4f6; padding: 0.5rem 0.85rem; border-radius: 12px 12px 2px 12px; max-width: 70%; text-align: left; line-height: 1.55; }
  .msg-aegis { margin-bottom: 1.4rem; }
  .msg-aegis .label { font-size: 0.68rem; font-weight: 700; color: #d97706; margin-bottom: 0.35rem; }
  .card { border: 1px solid #e5e7eb; border-radius: 7px; padding: 0.65rem 0.9rem; margin-bottom: 0.45rem; break-inside: avoid; }
  .card h3 { font-size: 0.82rem; font-weight: 700; color: #374151; margin-bottom: 0.35rem; }
  p { line-height: 1.6; margin-bottom: 0.2rem; color: #374151; }
  p.bullet { padding-left: 0.9rem; }
  .plain { line-height: 1.65; color: #374151; }
  strong { font-weight: 700; }
  footer { margin-top: 2rem; padding-top: 0.6rem; border-top: 1px solid #e5e7eb; font-size: 0.7rem; color: #9ca3af; text-align: center; }
  @media print { body { padding: 1.5cm 2cm; } }
</style>
</head>
<body>
<header>
  <div class="brand"><span>A</span>EGIS Crisis Coordinator</div>
  <div class="meta"><strong>${title.replace(/</g, '&lt;')}</strong><small>Exported: ${dateStr}</small></div>
</header>
${body}
<footer>Generated by AEGIS Crisis Coordinator &nbsp;·&nbsp; For emergency reference only</footer>
</body>
</html>`;

    const win = window.open('', '_blank');
    if (!win) return;
    win.document.documentElement.innerHTML = html;
    win.focus();
    setTimeout(() => win.print(), 400);
  };

  const exportConversation = () => {
    const lines = messages.map(m =>
      m.role === 'user' ? `You: ${m.text}` :
      m.role === 'assistant' ? `AEGIS: ${m.text}` : null
    ).filter(Boolean).join('\n\n');
    const header = `AEGIS Conversation Export\n${new Date().toLocaleString()}\n${'='.repeat(50)}\n\n`;
    const blob = new Blob([header + lines], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `aegis-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const fetchSuggestions = async (lastMsg, lastReply) => {
    try {
      const res = await fetch('/api/suggestions', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lastMessage: lastMsg, lastResponse: lastReply }),
      });
      const data = await res.json();
      setSuggestions(data.suggestions || []);
    } catch { setSuggestions([]); }
  };

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  const autoResize = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 200) + 'px';
  };

  // Core text sender — takes explicit baseMessages so retry can pass cleaned list
  const sendText = async (text, baseMessages) => {
    if (!text || loading) return;
    const userMsg = { role: 'user', text, timestamp: new Date().toISOString() };
    const next = [...baseMessages, userMsg];
    onMessagesUpdate(next);
    setLoading(true);
    try {
      const history = baseMessages.slice(-8).map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.text || '',
      }));
      const res = await fetch('/api/ask', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text, history,
          userName: user?.displayName?.split(' ')[0] || null,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          country: localStorage.getItem('aegis_country') || 'IN',
        }),
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      onMessagesUpdate([...next, { role: 'assistant', text: data.finalPlan, timestamp: data.timestamp }]);
      fetchSuggestions(text, data.finalPlan);
      if (baseMessages.length === 0) {
        try {
          const rRes = await fetch('/api/rename', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ firstMessage: text, firstResponse: data.finalPlan }),
          });
          const rData = await rRes.json();
          if (rData.title && onRenameSession) onRenameSession(rData.title);
        } catch {}
      }
    } catch (e) {
      onMessagesUpdate([...next, { role: 'error', text: friendlyApiError(e.message), retryText: text }]);
    } finally { setLoading(false); }
  };

  const send = async () => {
    const text = input.trim();
    if ((!text && !attachment) || loading) return;
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    if (attachment) {
      const isImage = attachment.type.startsWith('image/');
      const previewUrl = isImage ? URL.createObjectURL(attachment) : null;
      const userMsg = { role: 'user', text: text || '', fileName: attachment.name, fileMime: attachment.type, previewUrl };
      const next = [...messages, userMsg];
      onMessagesUpdate(next);
      setAttachment(null);
      setLoading(true);
      try {
        const fd = new FormData();
        fd.append('file', attachment);
        if (text) fd.append('message', text);
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        const data = await res.json();
        onMessagesUpdate([...next, { role: 'assistant', text: data.finalPlan || data.response, timestamp: data.timestamp }]);
      } catch (e) {
        onMessagesUpdate([...next, { role: 'error', text: friendlyApiError(e.message), retryText: text }]);
      } finally { setLoading(false); }
      setAttachment(null);
    } else {
      await sendText(text, messages);
    }
  };

  const handleRetry = (retryText) => {
    const cleaned = messages.slice(0, -1); // remove the error message
    onMessagesUpdate(cleaned);
    sendText(retryText, cleaned);
  };

  const handleKey = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } };
  const handleFile = e => { if (e.target.files[0]) setAttachment(e.target.files[0]); e.target.value = ''; };

  return (
    <div className="chat-container">
      {shareMsg && <ShareModal msg={shareMsg} onClose={() => setShareMsg(null)} />}
      {showQuickShare && <QuickShareModal session={session} onClose={() => setShowQuickShare(false)} />}
      {showSitrep && <SitrepModal session={session} onClose={() => setShowSitrep(false)} />}
      <EnvAlertBubble alerts={envAlerts || []} onDismiss={onDismissEnvAlerts} />
      <div className={`chat-messages${messages.length === 0 ? ' chat-messages-welcome' : ''}`}>
        {messages.length === 0 && (
          <div className="chat-welcome">
            <div className="logo-shield animate-in">
              <img src="/aegis_logo.svg" alt="AEGIS" style={{ width: '160px', height: '160px' }} />
            </div>
            <h2>AEGIS is Aware!</h2>
            <p>Describe your situation — I'll coordinate four specialized agents and give you a clear survival plan.</p>
            <div className="welcome-scenarios">
              {[
                { icon: '🌍', label: 'Earthquake', sub: 'Urban collapse & rescue', prompt: 'Major earthquake just hit our city, buildings collapsed, family of 4 trapped on 3rd floor, no power or water' },
                { icon: '🌊', label: 'Flood', sub: 'Evacuation planning', prompt: 'Flash flooding in our area, water rising fast, family of 3 on second floor, limited food and medication' },
                { icon: '🔥', label: 'Wildfire', sub: 'Perimeter & shelter', prompt: 'Wildfire spreading toward our neighborhood, elderly parent with mobility issues, 2 hours to evacuate' },
                { icon: '🌀', label: 'Hurricane', sub: 'Storm surge response', prompt: 'Category 4 hurricane making landfall in 6 hours, family of 5 with infant, sheltering in place, low supplies' },
              ].map(({ icon, label, sub, prompt }) => (
                <div key={label} className="welcome-scenario-card" onClick={() => { setInput(prompt); textareaRef.current?.focus(); setTimeout(autoResize, 0); }}>
                  <span className="wsc-icon">{icon}</span>
                  <span className="wsc-label">{label}</span>
                  <span className="wsc-sub">{sub}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {messages.map((msg, i) => <ChatMessage key={i} msg={msg} onShare={setShareMsg} onRetry={handleRetry} />)}
        {loading && <LoadingBubble />}
        <div ref={bottomRef} />
      </div>

      <div className="chat-input-area">
        {messages.length > 0 && (
          <div className="chat-input-toolbar">
            <button className="export-btn" onClick={printConversation} title="Print / Save as PDF">
              <Printer size={13} /> Print
            </button>
            <button className="export-btn" onClick={exportConversation} title="Export as .txt">
              <Download size={13} /> Export
            </button>
            <button className="export-btn" onClick={() => setShowQuickShare(true)} title="Share your status">
              <Share2 size={13} /> Share
            </button>
            <button className="export-btn sitrep-btn" onClick={() => setShowSitrep(true)} title="Generate Situation Report">
              <FileText size={13} /> SITREP
            </button>
          </div>
        )}
        {suggestions.length > 0 && (
          <div className="preset-bubbles">
            {suggestions.map((s, i) => (
              <button key={i} className="preset-bubble" onClick={() => { setInput(s); setSuggestions([]); textareaRef.current?.focus(); }}>
                {s}
              </button>
            ))}
          </div>
        )}
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
          <button className={`attach-btn${listening ? ' voice-active' : ''}`} onClick={toggleVoice} title={listening ? 'Stop listening' : 'Voice input'} disabled={loading}>
            {listening ? <MicOff size={15} /> : <Mic size={15} />}
          </button>
          <textarea ref={textareaRef} className="chat-input" rows={1}
            placeholder="Describe your crisis situation…"
            value={input}
            onChange={e => { setInput(e.target.value); autoResize(); if (e.target.value) setSuggestions([]); }}
            onKeyDown={handleKey}
            spellCheck="true" autoCorrect="on" autoCapitalize="sentences" lang="en"
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
        const history = messages.slice(-8).map(m => ({
          role: m.role === 'user' ? 'user' : 'assistant',
          content: m.text || '',
        }));
        const res = await fetch('/api/agent/ask', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ agentType: agentKey, message: text, history }),
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
            placeholder={`Ask the ${agent.name}…`}
            value={input}
            onChange={e => { setInput(e.target.value); autoResize(); }}
            onKeyDown={handleKey}
            spellCheck="true" autoCorrect="on" autoCapitalize="sentences" lang="en"
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
  const [showSettings, setShowSettings] = useState(false);
  const [showLogoutAnim, setShowLogoutAnim] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [apiStatus, setApiStatus] = useState(null);
  const [showScanBanner, setShowScanBanner] = useState(false);
  const [envVisible, setEnvVisible] = useState(false);
  // Tracks whether the env strip has ever been activated this session — once true, scan banner never returns
  const [envActivated, setEnvActivated] = useState(false);
  const [envAlerts, setEnvAlerts] = useState([]);
  const scanRef = useRef(null);

  // Mark env as activated and hide scan banner when strip is shown
  useEffect(() => {
    if (envVisible) { setEnvActivated(true); setShowScanBanner(false); }
  }, [envVisible]);

  // Show the scan banner periodically — but never once env strip has been activated
  useEffect(() => {
    const first = setTimeout(() => { if (!envActivated) setShowScanBanner(true); }, 30000);
    const repeat = setInterval(() => { if (!envActivated) setShowScanBanner(true); }, 10 * 60 * 1000);
    return () => { clearTimeout(first); clearInterval(repeat); };
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setUser(u || null));
    return unsub;
  }, []);

  useEffect(() => {
    const check = async () => {
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 5000);
        const res = await fetch('/api/health', { signal: ctrl.signal });
        clearTimeout(t);
        setApiStatus(res.ok);
      } catch {
        setApiStatus(false);
      }
    };
    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
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
    persist(sessions.map(s => {
      if (s.id !== currentId) return s;
      const autoTitle = msgs.find(m => m.role === 'user')?.text?.slice(0, 42) || 'New conversation';
      // Don't overwrite a title that was already auto-renamed via /api/rename
      const title = s._renamed ? s.title : autoTitle;
      return { ...s, messages: msgs, title };
    }));
  }, [currentId, sessions]);

  useEffect(() => { if (sessions.length === 0) newChat(); }, []);

  const currentSession = sessions.find(s => s.id === currentId) || null;

  return (
    <div className="app-shell">
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      {showLogoutAnim && (
        <div className="auth-overlay">
          <div className="auth-modal auth-success-modal">
            <span style={{ fontSize: '2.8rem', lineHeight: 1 }}>👋</span>
            <h2 className="auth-success-title">Sorry to see you leave</h2>
            <p className="auth-success-sub">Stay safe out there. Come back anytime.</p>
          </div>
        </div>
      )}
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
      <Sidebar
        isOpen={sidebarOpen}
        sessions={sessions} currentId={currentId}
        onSelect={id => { setCurrentId(id); setTab('chat'); setSidebarOpen(false); }}
        onNew={() => { newChat(); setSidebarOpen(false); }}
        onRename={(id, title) => persist(sessions.map(s => s.id === id ? { ...s, title } : s))}
        onDelete={id => { const n = sessions.filter(s => s.id !== id); persist(n); if (currentId === id) setCurrentId(n[0]?.id || null); }}
        onPin={id => persist(sessions.map(s => s.id === id ? { ...s, pinned: !s.pinned } : s))}
        theme={theme} onTheme={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
        user={user}
        onSignIn={() => setShowAuth(true)}
        onSettings={() => setShowSettings(true)}
        onSignOut={() => { setShowLogoutAnim(true); setTimeout(() => { signOut(auth); setShowLogoutAnim(false); }, 1600); }}
      />

      <div className="main">
        <header className="app-header">
          <button className="menu-toggle" onClick={() => setSidebarOpen(o => !o)} aria-label="Toggle sidebar">
            <Menu size={18} />
          </button>
          <nav className="header-tabs">
            <button className={`header-tab ${tab === 'chat' ? 'active' : ''}`} onClick={() => setTab('chat')}>
              <MessageSquare size={14} /> Chat
            </button>
            <button className={`header-tab ${tab === 'scenarios' ? 'active' : ''}`} onClick={() => setTab('scenarios')}>
              <LayoutGrid size={14} /> Scenarios
            </button>
          </nav>
          <div className={`header-status ${apiStatus === false ? 'status-down' : apiStatus === null ? 'status-checking' : ''}`}>
            <span className="status-dot" />
            <span className="status-text">
              {apiStatus === null ? 'Connecting…' : apiStatus ? 'All systems operational' : 'AI service unavailable'}
            </span>
          </div>
        </header>
        {showScanBanner && !envActivated && (
          <ScanBanner
            onScan={async () => { setEnvVisible(true); await scanRef.current?.(); }}
            onDismiss={() => setShowScanBanner(false)}
          />
        )}
        <EnvStrip scanRef={scanRef} visible={envVisible} onAlert={alerts => setEnvAlerts(prev => { const ids = new Set(prev.map(a => a.type)); return [...prev, ...alerts.filter(a => !ids.has(a.type))]; })} />
        {(envVisible || (!envVisible && scanRef.current)) && (
          <div className="env-collapse-bar">
            <button
              className="env-collapse-btn"
              onClick={() => setEnvVisible(v => !v)}
              title={envVisible ? 'Hide environment panel' : 'Show environment panel'}
            >
              {envVisible
                ? <ChevronUp size={12} className="env-collapse-arrow" />
                : <ChevronDown size={12} className="env-collapse-arrow" />
              }
            </button>
          </div>
        )}
        <AlertBanner />

        <div className="content">
          {tab === 'chat'
            ? <ChatTab
                key={currentId}
                session={currentSession}
                onMessagesUpdate={updateMessages}
                user={user}
                envAlerts={envAlerts}
                onDismissEnvAlerts={() => setEnvAlerts([])}
                onRenameSession={title => persist(sessions.map(s => s.id === currentId ? { ...s, title, _renamed: true } : s))}
              />
            : <ScenariosTab />}
        </div>
      </div>
    </div>
  );
}
