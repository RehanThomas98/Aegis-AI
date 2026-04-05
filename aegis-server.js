// ============================================
// Aegis: Crisis Coordinator
// Starter Code - Multi-Agent System
// ============================================

// ============================================
// 1. DATABASE SCHEMA (SQLite)
// ============================================
// Save as: db/schema.sql

/*
CREATE TABLE scenarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  user_id INTEGER,
  threat_level TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  location TEXT,
  family_size INTEGER,
  medical_conditions TEXT,
  shelter_capacity INTEGER,
  supplies JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE decisions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  scenario_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  agent_outputs JSON,
  coordinator_plan TEXT,
  confidence_level REAL,
  executed BOOLEAN DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (scenario_id) REFERENCES scenarios(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE agent_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  decision_id INTEGER NOT NULL,
  agent_type TEXT NOT NULL,
  input TEXT,
  output TEXT,
  confidence REAL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (decision_id) REFERENCES decisions(id)
);
*/

// ============================================
// 2. CORE API SETUP
// ============================================
// Save as: server.js
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const Groq = require('groq-sdk');

// Multer — store uploads in memory
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
});

const GROQ_API_KEY = process.env.GROQ_API_KEY;

if (!GROQ_API_KEY) {
  console.error('❌ ERROR: No GROQ_API_KEY found in .env file');
  process.exit(1);
}

console.log('✅ Groq API key loaded');

const groq = new Groq({ apiKey: GROQ_API_KEY });

async function callGemini(prompt) {
  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    max_tokens: 1024,
  });
  return completion.choices[0]?.message?.content || '';
}
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ============================================
// DATABASE SETUP
// ============================================

const db = new sqlite3.Database('./db/aegis.db', (err) => {
  if (err) {
    console.error('❌ Database connection failed:', err);
  } else {
    console.log('✓ Connected to Aegis database');
  }
});

// ============================================
// AGENT CLASSES (Using Google Gemini)
// ============================================

class MedicalAgent {
  async analyze(scenario) {
    const prompt = `You are a Medical Crisis Expert. Analyze this crisis scenario and respond in plain English, second person ("you", "your group").

Scenario: ${JSON.stringify(scenario, null, 2)}

Write your response using EXACTLY these section headers (copy them precisely):

## 🩺 Medical Assessment
2-3 sentences on the overall medical situation and who is most at risk.

## ⚠️ Health Risks
Bullet list of 4-5 specific health risks to watch for given the scenario.

## 💊 Treatment & Medications
Bullet list of treatments, first-aid steps, and medicines needed with dosages where relevant.

## 🚑 Priority Actions
Numbered list of the 4-5 most urgent medical actions to take right now.

## 🧰 Medical Supplies Needed
Bullet list of supplies with quantities where possible.

Rules:
- Plain English, second person only
- Be specific and actionable, not generic
- No jargon without explanation
- Keep each section concise and scannable`;

    try {
      return await callGemini(prompt);
    } catch (error) {
      console.error('Medical Agent Error:', error);
      return 'Medical analysis unavailable';
    }
  }
}

class LogisticsAgent {
  async analyze(scenario) {
    const prompt = `You are a Supply Chain & Logistics Expert. Analyze resource allocation for this crisis. Respond in plain English, second person ("you", "your group").

Scenario: ${JSON.stringify(scenario, null, 2)}

Write your response using EXACTLY these section headers (copy them precisely):

## 📦 Resource Inventory
2-3 sentences assessing current supply situation and how long it will last.

## ⏱️ Rationing Schedule
Bullet list of daily/weekly ration amounts for critical supplies (water, food, fuel, medicine).

## 🛒 What To Stockpile
Bullet list of the most critical items to acquire immediately, with target quantities.

## 📋 Distribution Plan
Numbered list of how to fairly distribute supplies across your group.

## ⚡ Logistics Actions
Numbered list of the 4-5 most urgent logistics actions to take right now.

Rules:
- Plain English, second person only
- Be specific with quantities and timelines
- No jargon without explanation
- Keep each section concise and scannable`;

    try {
      return await callGemini(prompt);
    } catch (error) {
      console.error('Logistics Agent Error:', error);
      return 'Logistics analysis unavailable';
    }
  }
}

class SecurityAgent {
  async analyze(scenario) {
    const prompt = `You are a Security & Safety Expert. Assess threats and safety measures for this crisis. Respond in plain English, second person ("you", "your group").

Scenario: ${JSON.stringify(scenario, null, 2)}

Write your response using EXACTLY these section headers (copy them precisely):

## 🔴 Threat Level
2-3 sentences on the current threat level and primary dangers to your safety.

## 🏠 Shelter & Safe Zones
Bullet list of the safest locations and what makes them safe or unsafe.

## 🔒 Security Protocols
Numbered list of security measures to put in place immediately.

## 🚪 Access Control
Bullet list of rules for who enters your shelter and how to vet them.

## 🏃 Escape Routes
Bullet list of 2-3 escape routes with conditions for when to use each.

Rules:
- Plain English, second person only
- Be specific and practical, not generic
- No jargon without explanation
- Keep each section concise and scannable`;

    try {
      return await callGemini(prompt);
    } catch (error) {
      console.error('Security Agent Error:', error);
      return 'Security analysis unavailable';
    }
  }
}

class CommunicationAgent {
  async analyze(scenario) {
    const prompt = `You are a Crisis Communication Expert. Plan an offline-first communication strategy for this crisis. Respond in plain English, second person ("you", "your group").

Scenario: ${JSON.stringify(scenario, null, 2)}

Write your response using EXACTLY these section headers (copy them precisely):

## 📡 Communication Plan
2-3 sentences on the overall communication strategy given available resources.

## 👨‍👩‍👧 Family Contact Strategy
Bullet list of steps to locate and stay in contact with family members.

## 📻 Offline Methods
Bullet list of specific offline communication tools and techniques (radio frequencies, signals, messengers, etc.).

## 🕐 Coordination Timeline
Numbered list of scheduled check-ins and communication windows with times.

## ⚠️ What Could Go Wrong
Bullet list of 3-4 communication risks and how to mitigate each.

Rules:
- Plain English, second person only
- Emphasize offline-first — assume no internet or mobile network
- Be specific with tools, frequencies, and timings
- Keep each section concise and scannable`;

    try {
      return await callGemini(prompt);
    } catch (error) {
      console.error('Communication Agent Error:', error);
      return 'Communication analysis unavailable';
    }
  }
}

// ============================================
// CRISIS COORDINATOR (Uses all agents)
// ============================================

class CrisisCoordinator {
  constructor() {
    this.medicalAgent = new MedicalAgent();
    this.logisticsAgent = new LogisticsAgent();
    this.securityAgent = new SecurityAgent();
    this.commAgent = new CommunicationAgent();
  }

  async coordinate(scenario) {
    console.log(`🎯 COORDINATOR: Processing scenario: ${scenario.type}`);

    // Invoke all agents in parallel
    const [medical, logistics, security, communication] = await Promise.all([
      this.medicalAgent.analyze(scenario),
      this.logisticsAgent.analyze(scenario),
      this.securityAgent.analyze(scenario),
      this.commAgent.analyze(scenario),
    ]);

    console.log('✓ All agents analyzed scenario');

    const agentOutputs = { medical, logistics, security, communication };

    // Synthesize into final plan
    const finalPlan = await this.synthesizePlan(scenario, agentOutputs);

    return {
      scenario,
      agentOutputs,
      finalPlan,
      timestamp: new Date().toISOString()
    };
  }

  async synthesizePlan(scenario, agentOutputs) {
    const prompt = `You are AEGIS, an AI crisis coordinator. Based on the agent analyses below, write a clear, human-friendly survival briefing.

SITUATION: ${JSON.stringify(scenario, null, 2)}

AGENT INPUTS:
- Medical: ${agentOutputs.medical}
- Logistics: ${agentOutputs.logistics}
- Security: ${agentOutputs.security}
- Communication: ${agentOutputs.communication}

Write your response using EXACTLY these section headers (copy them precisely):

## 🔴 Situation Overview
2-3 sentences summarising the threat level and key context.

## ⚡ Act Now
Bullet list of the 4-6 most critical actions to take in the next 60 minutes.

## 👁️ What To Watch Out For
Bullet list of 4-5 warning signs, risks, or things that could go wrong.

## 🛡️ Stay Safe
3-5 specific safety rules and protocols to follow.

## 📦 What You Need
Bullet list of essential supplies and resources with quantities where possible.

## 💬 Keep In Mind
Exactly 3 short, memorable reminders — formatted as bold sentences.

Rules:
- Write in plain English, second person ("you", "your family")
- Be specific and actionable, not generic
- No agent names, no "medical agent says" — speak as one unified voice
- Keep each section concise and scannable`;

    try {
      return await callGemini(prompt);
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

// ============================================
// API ENDPOINTS
// ============================================

app.get('/api/health', (req, res) => {
  res.json({ status: 'Aegis Crisis Coordinator active' });
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
      85 // confidence level
    ]);

    res.json(result);
  } catch (error) {
    console.error('Coordination error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/ask', async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'message is required' });

  try {
    const scenario = { type: 'custom_query', question: message };
    const result = await coordinator.coordinate(scenario);
    res.json(result);
  } catch (error) {
    console.error('Ask error:', error);
    res.status(500).json({ error: error.message });
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

  try {
    const scenario = { type: 'custom_query', question: message };
    const response = await agent.analyze(scenario);
    res.json({ agentType, response, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error(`Agent [${agentType}] error:`, error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// SERVE REACT FRONTEND (production build)
// ============================================

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

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
  console.log('🌍 Aegis Crisis Coordinator API');
  console.log(`📡 Server running on http://localhost:${PORT}`);
  console.log('📊 Endpoints:');
  console.log('   POST   /api/scenario');
  console.log('   POST   /api/scenario/:id/coordinate');
  console.log('   GET    /api/scenario/:id/history');
  console.log('   GET    /api/health');
});