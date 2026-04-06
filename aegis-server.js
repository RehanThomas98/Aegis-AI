// AEGIS — Crisis Coordinator
// Backend: Express + Groq (llama-3.3-70b) with Google Gemini fallback
// Each incoming crisis message is routed to specialist agents in parallel,
// then synthesized into a single actionable plan by the coordinator.

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const Groq = require('groq-sdk');
const { GoogleGenAI } = require('@google/genai');

// Store file uploads in memory rather than disk to keep the container stateless
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
});

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

if (!GROQ_API_KEY) {
  console.error('❌ ERROR: No GROQ_API_KEY found in .env file');
  process.exit(1);
}

console.log('✅ Groq API key loaded');
if (GOOGLE_API_KEY) console.log('✅ Google Gemini API key loaded (fallback ready)');

const groq = new Groq({ apiKey: GROQ_API_KEY });
const genai = GOOGLE_API_KEY ? new GoogleGenAI({ apiKey: GOOGLE_API_KEY }) : null;

async function callGroq(messages, maxTokens = 800, model = 'llama-3.3-70b-versatile') {
  const completion = await groq.chat.completions.create({
    model,
    messages: Array.isArray(messages)
      ? messages
      : [{ role: 'user', content: messages }],
    temperature: 0.7,
    max_tokens: maxTokens,
  });
  trackUsage(completion);
  return completion.choices[0]?.message?.content || '';
}

async function callGemini(messages, maxTokens = 800) {
  if (!genai) throw new Error('Google API key not configured');
  const systemMsg = messages.find(m => m.role === 'system');
  const chatMsgs = messages.filter(m => m.role !== 'system');
  const contents = chatMsgs.map(m => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{ text: m.content }],
  }));
  const result = await genai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents,
    config: {
      systemInstruction: systemMsg?.content || '',
      maxOutputTokens: maxTokens,
      temperature: 0.7,
    },
  });
  usageStats.gemini.requestsToday += 1;
  return result.text || '';
}

// Primary LLM caller — tries Groq first, automatically falls back to Gemini on rate limit (HTTP 429)
async function callAI(messages, maxTokens = 550, model = 'llama-3.3-70b-versatile') {
  try {
    return await callGroq(messages, maxTokens, model);
  } catch (e) {
    const isRateLimit = e.status === 429 || (e.message || '').includes('rate_limit');
    if (isRateLimit && genai) {
      console.warn('⚠️  Groq rate limit — falling back to Google Gemini');
      return await callGemini(messages, maxTokens);
    }
    throw e;
  }
}

// Lightweight model for conversational queries — uses a separate daily token pool
// so casual messages don't eat into the budget reserved for full crisis analysis
const callGroqFast = async (messages, maxTokens = 250) => {
  try {
    return await callGroq(messages, maxTokens, 'llama-3.1-8b-instant');
  } catch (e) {
    const isRateLimit = e.status === 429 || (e.message || '').includes('rate_limit');
    if (isRateLimit && genai) {
      console.warn('⚠️  Groq fast rate limit — falling back to Google Gemini');
      return await callGemini(messages, maxTokens);
    }
    throw e;
  }
};

// Country-specific emergency helplines injected into responses when distress
// keywords are detected in the user's message (see CONCERN_RE below)
const HELPLINES = {
  IN: [
    { name: 'National Emergency',        number: '112',           type: 'emergency' },
    { name: 'Police',                    number: '100',           type: 'emergency' },
    { name: 'Ambulance',                 number: '108',           type: 'emergency' },
    { name: 'Fire',                      number: '101',           type: 'emergency' },
    { name: 'iCall (Mental Health)',     number: '9152987821',    type: 'mental' },
    { name: 'Vandrevala Foundation',     number: '1860-2662-345', type: 'mental' },
    { name: 'NDMA Disaster Helpline',    number: '1078',          type: 'disaster' },
    { name: 'Women Helpline',            number: '1091',          type: 'violence' },
    { name: 'Domestic Violence (NCW)',   number: '181',           type: 'violence' },
    { name: 'Child Helpline',            number: '1098',          type: 'child' },
    { name: 'Senior Citizen',            number: '14567',         type: 'senior' },
  ],
  US: [
    { name: 'Emergency',                 number: '911',           type: 'emergency' },
    { name: '988 Suicide & Crisis',      number: '988',           type: 'mental' },
    { name: 'Crisis Text Line',          number: 'Text HOME to 741741', type: 'mental' },
    { name: 'SAMHSA Helpline',           number: '1-800-662-4357',type: 'mental' },
    { name: 'National DV Hotline',       number: '1-800-799-7233',type: 'violence' },
    { name: 'FEMA Disaster',             number: '1-800-621-3362',type: 'disaster' },
    { name: 'Poison Control',            number: '1-800-222-1222',type: 'medical' },
    { name: 'Childhelp',                 number: '1-800-422-4453',type: 'child' },
  ],
  GB: [
    { name: 'Emergency',                 number: '999',           type: 'emergency' },
    { name: 'Non-Emergency Police',      number: '101',           type: 'emergency' },
    { name: 'Samaritans',                number: '116 123',       type: 'mental' },
    { name: 'NHS Mental Health',         number: '111',           type: 'mental' },
    { name: 'National DV Helpline',      number: '0808 2000 247', type: 'violence' },
    { name: 'Childline',                 number: '0800 1111',     type: 'child' },
  ],
  AU: [
    { name: 'Emergency',                 number: '000',           type: 'emergency' },
    { name: 'Lifeline',                  number: '13 11 14',      type: 'mental' },
    { name: 'Beyond Blue',               number: '1300 22 4636',  type: 'mental' },
    { name: '1800RESPECT',               number: '1800 737 732',  type: 'violence' },
    { name: 'Kids Helpline',             number: '1800 55 1800',  type: 'child' },
    { name: 'Poisons Info',              number: '13 11 26',      type: 'medical' },
  ],
  CA: [
    { name: 'Emergency',                 number: '911',           type: 'emergency' },
    { name: 'Crisis Services Canada',    number: '1-833-456-4566',type: 'mental' },
    { name: 'National DV Hotline',       number: '1-800-363-9010',type: 'violence' },
    { name: 'Poison Control',            number: '1-800-268-9017',type: 'medical' },
  ],
  SG: [
    { name: 'Emergency',                 number: '999',           type: 'emergency' },
    { name: 'Ambulance / Fire',          number: '995',           type: 'emergency' },
    { name: 'Samaritans of Singapore',   number: '1767',          type: 'mental' },
    { name: "Women's Helpline",          number: '1800 777 0000', type: 'violence' },
  ],
  AE: [
    { name: 'Emergency',                 number: '999',           type: 'emergency' },
    { name: 'Ambulance',                 number: '998',           type: 'emergency' },
    { name: 'Dubai Mental Health',       number: '800 4673',      type: 'mental' },
    { name: 'Violence Against Women',    number: '800 4673',      type: 'violence' },
  ],
  NZ: [
    { name: 'Emergency',                 number: '111',           type: 'emergency' },
    { name: 'Lifeline',                  number: '0800 543 354',  type: 'mental' },
    { name: "Women's Refuge",            number: '0800 733 843',  type: 'violence' },
  ],
  DE: [
    { name: 'Emergency',                 number: '112',           type: 'emergency' },
    { name: 'Police',                    number: '110',           type: 'emergency' },
    { name: 'Telefonseelsorge',          number: '0800 111 0 111',type: 'mental' },
    { name: 'Domestic Violence',         number: '08000 116 016', type: 'violence' },
  ],
  FR: [
    { name: 'SAMU (Medical)',            number: '15',            type: 'emergency' },
    { name: 'Police',                    number: '17',            type: 'emergency' },
    { name: 'Fire (Pompiers)',           number: '18',            type: 'emergency' },
    { name: 'Suicide Écoute',            number: '3114',          type: 'mental' },
    { name: 'Violences Conjugales',      number: '3919',          type: 'violence' },
  ],
  JP: [
    { name: 'Police',                    number: '110',           type: 'emergency' },
    { name: 'Fire / Ambulance',          number: '119',           type: 'emergency' },
    { name: 'Inochi no Denwa',           number: '0570-783-556',  type: 'mental' },
  ],
  ZA: [
    { name: 'Police',                    number: '10111',         type: 'emergency' },
    { name: 'Ambulance',                 number: '10177',         type: 'emergency' },
    { name: 'SADAG Mental Health',       number: '0800 456 789',  type: 'mental' },
    { name: 'GBV Command Centre',        number: '0800 428 428',  type: 'violence' },
  ],
  BR: [
    { name: 'SAMU (Ambulance)',          number: '192',           type: 'emergency' },
    { name: 'Police',                    number: '190',           type: 'emergency' },
    { name: 'CVV (Crisis)',              number: '188',           type: 'mental' },
    { name: 'Central da Mulher',         number: '180',           type: 'violence' },
  ],
};

const CONCERN_RE = /\b(suicid|self.harm|self.hurt|kill.myself|end.my.life|depress|anxiet|mental.health|overwhelm|hopeless|helpless|lonely|isolat|abuse|domestic.viol|assault|harass|rape|unsafe|in.danger|please.help|im.scared|distress|panic.attack|breakdown|victim|hurt.myself|want.to.die|cant.go.on|no.reason.to.live|feel.like.dying|not.safe)\b/i;

function getHelplines(countryCode, text) {
  const all = HELPLINES[countryCode] || HELPLINES['IN'];
  const m = (text || '').toLowerCase();
  const wantsMental   = /\b(suicid|self.harm|depress|anxiet|hopeless|lonely|panic|mental|overwhelm|breakdown|want.to.die|cant.go.on)\b/.test(m);
  const wantsViolence = /\b(abuse|domestic|assault|harass|rape|unsafe|danger|victim|scared)\b/.test(m);
  const filtered = all.filter(h => {
    if (h.type === 'emergency') return true;
    if (wantsMental && h.type === 'mental') return true;
    if (wantsViolence && h.type === 'violence') return true;
    return false;
  });
  return filtered.length ? filtered : all.filter(h => h.type === 'emergency' || h.type === 'mental');
}

// In-memory usage counters — reset at midnight UTC.
// Exposed via GET /api/usage so the settings panel can show token consumption.
const usageStats = {
  groq: { tokensUsed: 0, requestsToday: 0, dailyLimit: 100000 },
  gemini: { requestsToday: 0 },
  agents: { medical: 0, logistics: 0, security: 0, communication: 0, coordinator: 0 },
  lastReset: new Date().toDateString(),
};

function trackUsage(completion, agentKey = null) {
  const today = new Date().toDateString();
  if (usageStats.lastReset !== today) {
    usageStats.groq.tokensUsed = 0;
    usageStats.groq.requestsToday = 0;
    usageStats.gemini.requestsToday = 0;
    Object.keys(usageStats.agents).forEach(k => { usageStats.agents[k] = 0; });
    usageStats.lastReset = today;
  }
  const tokens = completion?.usage?.total_tokens || 0;
  usageStats.groq.tokensUsed += tokens;
  usageStats.groq.requestsToday += 1;
  if (agentKey && usageStats.agents[agentKey] !== undefined) usageStats.agents[agentKey] += 1;
}

// Detects whether a message is a casual/conversational query (e.g. "what time is it?")
// vs a genuine crisis situation. Crisis messages go through the full multi-agent pipeline;
// conversational ones get a fast, direct answer without the overhead.
const CRISIS_KEYWORDS = /\b(medic|health|injur|wound|sick|ill|pain|doctor|medicine|drug|symptom|bleed|fracture|infect|dehydrat|triage|first.?aid|hospital|disease|fever|allerg|virus|treatment|trauma|burn|poison|antidote|cpr|oxygen|pulse|breath|nurse|food|water|supply|supplies|ration|stockpile|fuel|power|resource|storage|equipment|shelter|kit|inventory|provision|stock|tools|generator|battery|transport|vehicle|distribute|evacuate|secur|threat|danger|safe|protect|attack|loot|crowd|escape|route|access|patrol|weapon|defend|border|perimeter|risk|guard|crime|violence|shoot|hostile|intruder|checkpoint|communicat|signal|radio|network|coordinat|broadcast|relay|alert|notify|warn|earthquake|flood|wildfire|hurricane|tornado|tsunami|disaster|crisis|emergency|explosion|chemical|nuclear|pandemic|outbreak|collapse)\b/;

function isConversational(text) {
  return !CRISIS_KEYWORDS.test((text || '').toLowerCase());
}

// Returns only the agents relevant to the message, avoiding unnecessary LLM calls.
// Falls back to all four agents if no specific domain keywords are detected.
function routeAgents(text) {
  const m = (text || '').toLowerCase();
  const rules = {
    medical:       /\b(medic|health|injur|wound|sick|ill|pain|doctor|medicine|drug|symptom|bleed|fracture|infect|dehydrat|triage|first.?aid|hospital|disease|fever|allerg|virus|treatment|trauma|burn|poison|antidote|cpr|oxygen|pulse|breath|nurse)\b/,
    logistics:     /\b(food|water|supply|supplies|ration|stockpile|fuel|power|resource|storage|equipment|shelter|kit|inventory|provision|stock|tools|generator|battery|transport|vehicle|distribute|quantity|amount|bring|carry|evacuate)\b/,
    security:      /\b(secur|threat|danger|safe|protect|attack|loot|crowd|evacuat|escape|route|access|patrol|weapon|lock|defend|border|perimeter|risk|guard|crime|violence|shoot|hostile|intruder|checkpoint)\b/,
    communication: /\b(communicat|contact|reach|signal|radio|phone|network|internet|family|coordinat|message|broadcast|offline|connect|relay|alert|notify|warn|report|update|frequency|channel)\b/,
  };
  const selected = Object.entries(rules).filter(([, re]) => re.test(m)).map(([k]) => k);
  return selected.length > 0 ? selected : Object.keys(rules); // fallback: all agents
}
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ── SQLite database ───────────────────────────────────────────────────────────

const db = new sqlite3.Database('./db/aegis.db', (err) => {
  if (err) {
    console.error('❌ Database connection failed:', err);
  } else {
    console.log('✓ Connected to Aegis database');
  }
});

// ── Specialist AI agents ─────────────────────────────────────────────────────
// Each agent has a focused system prompt for its domain.
// They run in parallel via Promise.all inside CrisisCoordinator.coordinate().

class MedicalAgent {
  async analyze(scenario, history = []) {
    const question = scenario.question || JSON.stringify(scenario);
    const histCtx = history.length
      ? '\n\nPREVIOUS CONVERSATION:\n' + history.map(h => `${h.role === 'user' ? 'User' : 'AEGIS'}: ${h.content}`).join('\n')
      : '';
    const messages = [
      { role: 'system', content: `You are a Medical Crisis Expert — concise, practical, direct.
Format rules:
- Simple/specific question → answer directly in 1-3 paragraphs, NO section headers
- Complex multi-factor scenario → use only the sections that are genuinely relevant:
  ## 🩺 Medical Assessment | ## ⚠️ Health Risks | ## 💊 Treatment & Medications | ## 🚑 Priority Actions | ## 🧰 Medical Supplies Needed
- Never pad with irrelevant sections. Match length to complexity.
- **Bold** every phone number, critical action, and key quantity. Wrap important protocols and medical terms in "quotes".
- Plain English, second person ("you", "your"). Specific and actionable.${histCtx}` },
      { role: 'user', content: question }
    ];
    try { return await callAI(messages, 550); }
    catch (e) { console.error('Medical Agent Error:', e); return 'Medical analysis unavailable'; }
  }
}

class LogisticsAgent {
  async analyze(scenario, history = []) {
    const question = scenario.question || JSON.stringify(scenario);
    const histCtx = history.length
      ? '\n\nPREVIOUS CONVERSATION:\n' + history.map(h => `${h.role === 'user' ? 'User' : 'AEGIS'}: ${h.content}`).join('\n')
      : '';
    const messages = [
      { role: 'system', content: `You are a Supply Chain & Logistics Expert — concise, practical, direct.
Format rules:
- Simple/specific question → answer directly in 1-3 paragraphs, NO section headers
- Complex multi-factor scenario → use only the sections that are genuinely relevant:
  ## 📦 Resource Inventory | ## ⏱️ Rationing Schedule | ## 🛒 What To Stockpile | ## 📋 Distribution Plan | ## ⚡ Logistics Actions
- Never pad with irrelevant sections. Match length to complexity.
- **Bold** every critical action, quantity, and deadline. Wrap supply names and procedures in "quotes".
- Plain English, second person ("you", "your group"). Be specific with quantities and timelines.${histCtx}` },
      { role: 'user', content: question }
    ];
    try { return await callAI(messages, 550); }
    catch (e) { console.error('Logistics Agent Error:', e); return 'Logistics analysis unavailable'; }
  }
}

class SecurityAgent {
  async analyze(scenario, history = []) {
    const question = scenario.question || JSON.stringify(scenario);
    const histCtx = history.length
      ? '\n\nPREVIOUS CONVERSATION:\n' + history.map(h => `${h.role === 'user' ? 'User' : 'AEGIS'}: ${h.content}`).join('\n')
      : '';
    const messages = [
      { role: 'system', content: `You are a Security & Safety Expert — concise, practical, direct.
Format rules:
- Simple/specific question → answer directly in 1-3 paragraphs, NO section headers
- Complex multi-factor scenario → use only the sections that are genuinely relevant:
  ## 🔴 Threat Level | ## 🏠 Shelter & Safe Zones | ## 🔒 Security Protocols | ## 🚪 Access Control | ## 🏃 Escape Routes
- Never pad with irrelevant sections. Match length to complexity.
- **Bold** every threat assessment, escape route, and critical instruction. Wrap zone names and protocols in "quotes".
- Plain English, second person ("you", "your group"). Be specific and practical, not generic.${histCtx}` },
      { role: 'user', content: question }
    ];
    try { return await callAI(messages, 550); }
    catch (e) { console.error('Security Agent Error:', e); return 'Security analysis unavailable'; }
  }
}

class CommunicationAgent {
  async analyze(scenario, history = []) {
    const question = scenario.question || JSON.stringify(scenario);
    const histCtx = history.length
      ? '\n\nPREVIOUS CONVERSATION:\n' + history.map(h => `${h.role === 'user' ? 'User' : 'AEGIS'}: ${h.content}`).join('\n')
      : '';
    const messages = [
      { role: 'system', content: `You are a Crisis Communication Expert — concise, practical, direct.
Format rules:
- Simple/specific question → answer directly in 1-3 paragraphs, NO section headers
- Complex multi-factor scenario → use only the sections that are genuinely relevant:
  ## 📡 Communication Plan | ## 👨‍👩‍👧 Family Contact Strategy | ## 📻 Offline Methods | ## 🕐 Coordination Timeline | ## ⚠️ What Could Go Wrong
- Never pad with irrelevant sections. Match length to complexity.
- **Bold** every phone number, frequency, and critical contact step. Wrap channel names and signal types in "quotes".
- Plain English, second person ("you", "your group"). Emphasize offline-first — assume no internet or mobile network.${histCtx}` },
      { role: 'user', content: question }
    ];
    try { return await callAI(messages, 550); }
    catch (e) { console.error('Communication Agent Error:', e); return 'Communication analysis unavailable'; }
  }
}

// ── Crisis Coordinator ────────────────────────────────────────────────────────
// Orchestrates the specialist agents: routes to relevant ones, runs them in
// parallel, then synthesizes their outputs into a single unified response.

class CrisisCoordinator {
  constructor() {
    this.medicalAgent = new MedicalAgent();
    this.logisticsAgent = new LogisticsAgent();
    this.securityAgent = new SecurityAgent();
    this.commAgent = new CommunicationAgent();
  }

  async coordinate(scenario, history = []) {
    console.log(`🎯 COORDINATOR: Processing scenario: ${scenario.type}`);

    // Route to only the relevant agents based on message content
    const question = scenario.question || scenario.type || '';
    const activeAgents = routeAgents(question);
    console.log(`🔀 Routing to agents: ${activeAgents.join(', ')}`);

    const agentMap = {
      medical:       () => this.medicalAgent.analyze(scenario, history),
      logistics:     () => this.logisticsAgent.analyze(scenario, history),
      security:      () => this.securityAgent.analyze(scenario, history),
      communication: () => this.commAgent.analyze(scenario, history),
    };

    const results = await Promise.all(activeAgents.map(k => agentMap[k]()));
    const agentOutputs = Object.fromEntries(activeAgents.map((k, i) => [k, results[i]]));

    console.log('✓ Active agents completed analysis');

    // Synthesize into final plan
    const finalPlan = await this.synthesizePlan(scenario, agentOutputs, history);

    return {
      scenario,
      agentOutputs,
      finalPlan,
      timestamp: new Date().toISOString()
    };
  }

  async synthesizePlan(scenario, agentOutputs, history = []) {
    const agentSection = Object.entries(agentOutputs)
      .map(([k, v]) => `- ${k.charAt(0).toUpperCase() + k.slice(1)}: ${v}`)
      .join('\n');

    const histCtx = history.length
      ? '\n\nPREVIOUS CONVERSATION:\n' + history.map(h => `${h.role === 'user' ? 'User' : 'AEGIS'}: ${h.content}`).join('\n')
      : '';

    const messages = [
      { role: 'system', content: `You are AEGIS, an AI crisis coordinator. Synthesize agent analyses into a clear, human-friendly briefing.
Format rules:
- Simple follow-up or single-domain question → answer directly in 1-3 paragraphs, NO section headers
- Full multi-domain crisis scenario → use only genuinely relevant sections from:
  ## 🔴 Situation Overview | ## ⚡ Act Now | ## 👁️ What To Watch Out For | ## 🛡️ Stay Safe | ## 📦 What You Need | ## 💬 Keep In Mind
- Never pad with irrelevant sections. Match length to complexity.
- **Bold** every action item, phone number, and critical warning. Wrap specific terms, protocols, and locations in "quotes".
- Plain English, second person ("you", "your family"). No agent names — speak as one unified voice.${histCtx}` },
      { role: 'user', content: `Situation: ${scenario.question || scenario.type}\n\nAgent analyses:\n${agentSection}` }
    ];

    try {
      return await callAI(messages, 800);
    } catch (error) {
      console.error('Coordinator Error:', error.message?.slice(0, 120));
      return fallbackSynthesize(scenario, agentOutputs);
    }
  }
}

function fallbackSynthesize(scenario, agentOutputs) {
  return `## 🔴 Situation Overview
You are facing a ${scenario.type || 'critical'} emergency. Immediate coordinated action is required across medical, logistics, security, and communication fronts.

## ⚡ Act Now
- Assess your immediate surroundings for safety
- Account for all members of your group
- Secure your shelter and limit exposure
- Inventory all available supplies
- Establish communication with others if possible

## 👁️ What To Watch Out For
- Deteriorating physical or mental health in any group member
- Depleting critical supplies (water, food, medicine)
- Changes in external conditions or threat level
- Loss of communication or coordination

## 🛡️ Stay Safe
- Stay sheltered until conditions are confirmed safe
- Follow strict hygiene and sanitation protocols
- Ration all resources carefully
- Keep calm and maintain group cohesion

## 📦 What You Need
${agentOutputs.logistics?.split('\n').slice(0, 6).join('\n') || '- Water, food, medical supplies, communication tools'}

## 💬 Keep In Mind
**Every decision you make now affects your group's long-term survival — act deliberately, not in panic.**
**Information is as valuable as supplies — monitor your situation continuously.**
**Rest, hydration, and morale are not luxuries — they are survival requirements.**`;
}

const coordinator = new CrisisCoordinator();

// ── API endpoints ────────────────────────────────────────────────────────────

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    ai: !!process.env.GROQ_API_KEY,
    model: 'llama-3.3-70b-versatile',
    timestamp: new Date().toISOString(),
  });
});

app.post('/api/scenario', (req, res) => {
  const { type, name, user_id, threat_level } = req.body;
  
  const query = `INSERT INTO scenarios (type, name, user_id, threat_level) VALUES (?, ?, ?, ?)`;
  db.run(query, [type, name, user_id, threat_level], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ scenario_id: this.lastID, message: 'Scenario created' });
  });
});

app.post('/api/scenario/:id/coordinate', async (req, res) => {
  try {
    const scenario = {
      type: req.body.type,
      family_size: req.body.family_size,
      shelter_capacity: req.body.shelter_capacity,
      supplies: req.body.supplies,
      vulnerable: req.body.vulnerable || [],
      location: req.body.location || 'unknown',
      threat_level: req.body.threat_level || 'unknown',
      user_id: req.body.user_id
    };

    const result = await coordinator.coordinate(scenario);
    
    // Store in database
    const query = `INSERT INTO decisions (scenario_id, user_id, agent_outputs, coordinator_plan, confidence_level)
                   VALUES (?, ?, ?, ?, ?)`;
    db.run(query, [
      req.params.id,
      scenario.user_id,
      JSON.stringify(result.agentOutputs),
      result.finalPlan,
      85,
    ]);

    res.json(result);
  } catch (error) {
    console.error('Coordination error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/ask', async (req, res) => {
  const { message, history, userName, timezone, country } = req.body;
  if (!message) return res.status(400).json({ error: 'message is required' });

  // Keep only the last 8 exchanges to stay within token budget
  const safeHistory = Array.isArray(history) ? history.slice(-8) : [];

  try {
    // Casual questions (greetings, time, general knowledge) get a direct fast answer.
  // Only genuine crisis keywords trigger the full multi-agent pipeline.
    if (isConversational(message)) {
      const tz = timezone || 'UTC';
      const now = new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short', timeZone: tz });
      const greeting = userName ? `The user's first name is ${userName}. Address them by name naturally when it fits.` : '';
      const histCtx = safeHistory.length
        ? '\n\nPREVIOUS CONVERSATION:\n' + safeHistory.map(h => `${h.role === 'user' ? 'User' : 'AEGIS'}: ${h.content}`).join('\n')
        : '';
      const msgs = [
        { role: 'system', content: `You are AEGIS, a crisis coordinator assistant — warm, human, and concise. Current date and time: ${now} (${tz}). ${greeting} Answer the user's question directly in 1-2 sentences. When giving the time or date, format it naturally (e.g. "Hey Thomas, it's 2:30 PM IST on Sunday, April 5"). Do NOT use crisis section headers or survival advice for casual questions.${histCtx}` },
        { role: 'user', content: message },
      ];
      const reply = await callGroqFast(msgs, 250);
      return res.json({ finalPlan: reply, timestamp: new Date().toISOString() });
    }

    // Append relevant emergency helplines to the prompt when the message
    // contains distress keywords — the AI then includes them in its response
    const countryCode = (country || 'IN').toUpperCase();
    let helplineBlock = '';
    if (CONCERN_RE.test(message)) {
      const lines = getHelplines(countryCode, message)
        .map(h => `- **${h.name}:** ${h.number}`)
        .join('\n');
      helplineBlock = `\n\nIMPORTANT: End your response with a section exactly like this (copy the header):\n## 📞 Emergency Helplines\n${lines}`;
    }

    const scenario = { type: 'custom_query', question: message + helplineBlock };
    const result = await coordinator.coordinate(scenario, safeHistory);
    res.json(result);
  } catch (error) {
    console.error('Ask error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/usage', (req, res) => {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  tomorrow.setUTCHours(0, 0, 0, 0);
  const msLeft = tomorrow - now;
  const hLeft = Math.floor(msLeft / 3600000);
  const mLeft = Math.floor((msLeft % 3600000) / 60000);
  const groqRemaining = Math.max(0, usageStats.groq.dailyLimit - usageStats.groq.tokensUsed);
  res.json({
    groq: {
      tokensUsed: usageStats.groq.tokensUsed,
      tokensRemaining: groqRemaining,
      dailyLimit: usageStats.groq.dailyLimit,
      percentUsed: Math.min(100, Math.round((usageStats.groq.tokensUsed / usageStats.groq.dailyLimit) * 100)),
      requestsToday: usageStats.groq.requestsToday,
      resetIn: `${hLeft}h ${mLeft}m`,
    },
    gemini: { requestsToday: usageStats.gemini.requestsToday },
    agents: usageStats.agents,
  });
});

// Dynamic follow-up suggestions based on conversation context
app.post('/api/suggestions', async (req, res) => {
  try {
    const { lastMessage = '', lastResponse = '' } = req.body;
    const msgs = [
      {
        role: 'system',
        content: `You are a follow-up suggestion generator for a crisis coordination assistant.
Given the last exchange, generate exactly 3 short follow-up prompts a user might want to ask next.
Rules:
- Each suggestion must be under 8 words
- Return ONLY a JSON array of 3 strings, nothing else
- Make them contextually relevant: if crisis-related, suggest actionable next steps; if conversational, keep them friendly
- Examples: ["What supplies do I need?", "How long should I shelter?", "Find evacuation routes"]`,
      },
      {
        role: 'user',
        content: `Last user message: "${lastMessage.slice(0, 200)}"\nLast AEGIS response: "${lastResponse.slice(0, 300)}"`,
      },
    ];
    const raw = await callGroqFast(msgs, 120);
    const match = raw.match(/\[[\s\S]*?\]/);
    const suggestions = match ? JSON.parse(match[0]) : ['Tell me more', 'What are my options?', 'What should I do first?'];
    res.json({ suggestions: suggestions.slice(0, 3) });
  } catch (err) {
    res.json({ suggestions: ['Tell me more', 'What should I do next?', 'Any other advice?'] });
  }
});

app.get('/api/scenario/:id/history', (req, res) => {
  const query = `SELECT * FROM decisions WHERE scenario_id = ? ORDER BY created_at DESC`;
  db.all(query, [req.params.id], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows || []);
  });
});

// File upload endpoint — extracts text context and runs through coordinator
app.post('/api/upload', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const { mimetype, originalname, buffer, size } = req.file;
  const agentType = req.body.agentType || null; // optional: target single agent
  const extraMessage = req.body.message || '';

  let fileContext = '';

  // Handle text-based files: extract content directly
  if (
    mimetype === 'text/plain' ||
    mimetype === 'application/json' ||
    mimetype.startsWith('text/')
  ) {
    fileContext = buffer.toString('utf8').slice(0, 8000);
  } else if (mimetype === 'application/pdf') {
    fileContext = `[PDF file: "${originalname}", ${(size / 1024).toFixed(1)} KB — summarize as if it contains crisis-relevant information]`;
  } else if (mimetype.startsWith('image/')) {
    // For images: describe the type and ask the AI to help based on context
    fileContext = `[Image file: "${originalname}", type: ${mimetype}, ${(size / 1024).toFixed(1)} KB — the user has shared an image, likely showing their situation, location, supplies, or environment. Respond based on their message and assume the image shows relevant crisis context.]`;
  } else if (mimetype.startsWith('video/')) {
    fileContext = `[Video file: "${originalname}", type: ${mimetype}, ${(size / 1024).toFixed(0)} KB — the user has shared a video of their situation. Respond based on their message.]`;
  } else {
    fileContext = `[File: "${originalname}", type: ${mimetype}, ${(size / 1024).toFixed(1)} KB]`;
  }

  const combinedMessage = extraMessage
    ? `${extraMessage}\n\nAttached file context:\n${fileContext}`
    : `Analyze this and provide crisis guidance:\n\n${fileContext}`;

  try {
    if (agentType) {
      const agentMap = {
        medical: coordinator.medicalAgent,
        logistics: coordinator.logisticsAgent,
        security: coordinator.securityAgent,
        communication: coordinator.commAgent,
      };
      const agent = agentMap[agentType];
      if (!agent) return res.status(400).json({ error: `Unknown agent: ${agentType}` });
      const scenario = { type: 'file_upload', question: combinedMessage };
      const response = await agent.analyze(scenario);
      return res.json({ agentType, response, fileName: originalname, timestamp: new Date().toISOString() });
    }

    // Full coordinator
    const scenario = { type: 'file_upload', question: combinedMessage };
    const result = await coordinator.coordinate(scenario);
    res.json({ ...result, fileName: originalname });
  } catch (error) {
    console.error('Upload analysis error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Direct single-agent chat — only calls one agent, no coordinator overhead
app.post('/api/agent/ask', async (req, res) => {
  const { agentType, message } = req.body;
  if (!message) return res.status(400).json({ error: 'message is required' });

  const agentMap = {
    medical:       coordinator.medicalAgent,
    logistics:     coordinator.logisticsAgent,
    security:      coordinator.securityAgent,
    communication: coordinator.commAgent,
  };

  const agent = agentMap[agentType];
  if (!agent) return res.status(400).json({ error: `Unknown agent type: ${agentType}` });

  const safeHistory = Array.isArray(req.body.history) ? req.body.history.slice(-8) : [];

  try {
    const scenario = { type: 'custom_query', question: message };
    const response = await agent.analyze(scenario, safeHistory);
    res.json({ agentType, response, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error(`Agent [${agentType}] error:`, error);
    res.status(500).json({ error: error.message });
  }
});

// Generates a concise 3-word crisis label for a conversation title
app.post('/api/rename', async (req, res) => {
  const { firstMessage, firstResponse } = req.body;
  if (!firstMessage) return res.json({ title: 'Crisis Situation' });
  try {
    const msgs = [
      { role: 'system', content: 'Generate a concise 3-4 word title for a crisis conversation. Examples: "Chennai Flood Evacuation", "Nuclear Shelter Protocol", "Grid Failure Survival". Return ONLY the title, no quotes, no punctuation.' },
      { role: 'user', content: `User said: "${firstMessage.slice(0, 200)}"\nAEGIS responded about: "${(firstResponse || '').slice(0, 200)}"` },
    ];
    const title = (await callGroqFast(msgs, 20)).trim().replace(/^["']|["']$/g, '');
    res.json({ title: title || 'Crisis Situation' });
  } catch {
    res.json({ title: firstMessage.slice(0, 30) || 'Crisis Situation' });
  }
});

// Generates a structured situation report (SITREP) from the full conversation
app.post('/api/sitrep', async (req, res) => {
  const { messages } = req.body;
  if (!messages || !messages.length) return res.json({ sitrep: null });
  const context = messages.slice(-10).map(m =>
    m.role === 'user' ? `User: ${m.text || ''}` : m.role === 'assistant' ? `AEGIS: ${(m.text || '').slice(0, 400)}` : null
  ).filter(Boolean).join('\n\n');
  try {
    const prompt = [
      { role: 'system', content: 'You are a crisis SITREP generator. Generate a concise 5-line Situation Report formatted exactly as:\nWHO: [who is affected and their status]\nWHAT: [what crisis is happening]\nWHERE: [location if mentioned, else "Location not specified"]\nSTATUS: [current situation and immediate threats]\nNEEDS: [top 3 immediate needs or actions]\n\nBe concise — each line max 20 words. No extra text.' },
      { role: 'user', content: context },
    ];
    const raw = await callAI(prompt, 200);
    res.json({ sitrep: raw.trim() });
  } catch {
    res.status(500).json({ sitrep: null, error: 'Failed to generate SITREP' });
  }
});

// ── Static frontend (production) ─────────────────────────────────────────────
// Serves the Vite build output. In development, Vite runs separately on its own port.

const path = require('path');
const distPath = path.join(__dirname, 'dist');
if (require('fs').existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(distPath, 'index.html'));
    }
  });
  console.log('✓ Serving React frontend from /dist');
}

app.listen(PORT, () => {
  console.log(`✅ AEGIS server running on http://localhost:${PORT}`);
});