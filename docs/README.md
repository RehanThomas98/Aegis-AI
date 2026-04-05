# 🧭 AEGIS: Crisis Coordinator

**Multi-Agent AI System for Post-Apocalyptic Survival Coordination**

A cutting-edge multi-agent system that helps individuals and communities survive multiple simultaneous threats (nuclear fallout, pandemics, grid failure, civil unrest) by intelligently coordinating medical decisions, supply rationing, security assessments, and communication—all while working **offline-first**.

---

## 🎯 Project Overview

### Problem
In a crisis, people face competing, urgent needs with incomplete information:
- Medical emergencies (triage, resource allocation)
- Scarce resources (food, water, medicine rationing)
- Security threats (safe routes, threat assessment)
- Communication breakdown (coordinating with family/community)

**AEGIS solves this** by deploying specialized AI agents that collaborate, negotiate conflicts, and deliver one clear, actionable survival plan.

### Solution Architecture
```
User Intent
    ↓
Crisis Coordinator Agent (Claude)
    ↓
[Medical | Logistics | Security | Communication] Agents
    ↓
Conflict Detection & Resolution
    ↓
Unified Survival Plan (with confidence levels)
```

---

## ✨ Key Features

### 1. **Multi-Threat Scenario Handling**
- ☢️ **Nuclear/Radiological** (fallout, contamination, shelter safety)
- 🦠 **Pandemic/Viral** (quarantine, medical protocols, isolation)
- ⚡ **Grid Failure** (power loss, supply chains broken, comms down)
- 🚨 **Civil Unrest** (security threats, safe routes, community coordination)
- 🌪️ **Hybrid** (any combination of above)

### 2. **Agent Coordination Engine**
Four specialized agents analyze scenarios from different perspectives:

| Agent | Responsibilities |
|-------|-----------------|
| **Medical** | Triage, medical protocols, medication allocation |
| **Logistics** | Inventory, rationing, resource allocation |
| **Security** | Threat assessment, safe routes, shelter security |
| **Communication** | Messaging plans, family coordination, offline methods |

### 3. **Intelligent Conflict Resolution**
When agents disagree (e.g., "Medical needs water" vs. "Logistics says water is scarce"), the Coordinator synthesizes a solution prioritizing: **Life-safety > Comfort > Efficiency**

### 4. **Offline-First Architecture**
- ✓ Works with cached data when internet is unavailable
- ✓ Syncs decisions when online
- ✓ Queue system for offline operations

### 5. **Practical, Actionable Output**
- Hour-by-hour action plans
- Resource allocation schedules
- Confidence levels for each recommendation
- Clear next decision points

---

## 🏗️ Technical Architecture

### Stack
```
Frontend:        React + Vite
Backend API:     Express.js (Node.js)
Database:        SQLite (or Postgres)
AI Engine:       Anthropic Claude API
MCP Tools:       Google Maps, Weather APIs, Medical Protocols
Deployment:      Vercel (API), Netlify (Frontend)
```

### System Diagram
```
┌─────────────────────────────────────────────┐
│         Web UI / Mobile Interface          │
│    (Scenario Selector → Agent Visualization)│
└──────────────────┬──────────────────────────┘
                   │ (REST API)
┌──────────────────▼──────────────────────────┐
│    Coordinator Agent (Claude)               │
│    - Intent parsing                         │
│    - Agent routing                          │
│    - Conflict resolution                    │
└──────────────────┬──────────────────────────┘
         │         │         │         │
    ┌────▼──┐ ┌───▼──┐ ┌────▼──┐ ┌───▼───┐
    │Medical│ │Logis-│ │Sec.   │ │Comm.  │
    │Agent  │ │tics  │ │Agent  │ │Agent  │
    │       │ │Agent │ │       │ │       │
    └────┬──┘ └───┬──┘ └────┬──┘ └───┬───┘
         │        │         │        │
    ┌────▼────────▼─────────▼────────▼────┐
    │   Tool Bridge (MCP + External APIs) │
    │ • Google Maps (routes, zones)        │
    │ • Weather/Air Quality (simulations)  │
    │ • Medical Protocols (CDC, WHO)       │
    │ • Community Data (resources, people) │
    └────┬─────────────────────────────────┘
         │
    ┌────▼──────────────────────────┐
    │ Database (SQLite/Postgres)    │
    │ • Scenarios & templates        │
    │ • User profiles & preferences  │
    │ • Decision history             │
    │ • Offline sync queue           │
    └───────────────────────────────┘
```

### Database Schema
See `db/schema.sql` for complete schema. Key tables:
- `scenarios` — Crisis situation definitions
- `users` — User profiles, family info, supplies
- `decisions` — Coordinator outputs & history
- `agent_logs` — Individual agent analysis logs
- `offline_queue` — Sync queue for offline mode

---

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- npm or yarn
- Anthropic API key (`ANTHROPIC_API_KEY`)
- SQLite 3

### Installation

```bash
# Clone and navigate
git clone https://github.com/yourusername/AEGIS.git
cd AEGIS

# Install dependencies
npm install

# Set up environment
echo "ANTHROPIC_API_KEY=sk-..." > .env

# Initialize database
npm run setup-db

# Start API server
npm start

# In another terminal, start frontend
cd frontend
npm run dev
```

### API Endpoints

```bash
# Create a new scenario
POST /api/scenario
{
  "type": "nuclear",
  "description": "Fallout event, family of 8",
  "user_id": 1
}

# Get agent coordination for scenario
POST /api/scenario/:id/coordinate
{
  "type": "nuclear",
  "location": "urban shelter",
  "family_size": 8,
  "shelter_capacity": 7,
  "supplies": { "water": 150, "food": "14 days" },
  "vulnerable": ["elderly", "infant"],
  "user_id": 1
}

# View scenario decision history
GET /api/scenario/:id/history

# Health check
GET /api/health
```

---

## 📊 Usage Examples

### Example 1: Nuclear Fallout Event
```
Input:
- Type: Nuclear fallout
- Location: Urban shelter
- Family: 8 people (elderly, infant, others 25-45)
- Shelter capacity: 7 people
- Supplies: 150L water, 14 days food, 20 N95 masks

Output:
┌─────────────────────────────────────────┐
│ PRIORITY ACTION PLAN – NUCLEAR FALLOUT  │
├─────────────────────────────────────────┤
│ IMMEDIATE (next 2 hours):               │
│ • Enter main shelter (7 people)         │
│ • Move teenage son to neighbor shelter  │
│ • Contact neighbors: [Coordination]     │
│ • Route: Main St → Oak Ave (safest)     │
│                                         │
│ RATIONING SCHEDULE:                     │
│ • 14-day stretch: 1,200 cal/person/day  │
│ • Infant: Formula priority              │
│ • Elderly: Higher water allotment       │
│                                         │
│ MEDICAL PROTOCOL:                       │
│ • Potassium iodide tablets (schedule)   │
│ • Monitor elderly for radiation sickness│
│ • Infant: Maintain temperature/humidity │
│                                         │
│ COMMUNICATION:                          │
│ • Text neighbor: ETA 30 min             │
│ • Leave note at house (backup contact)  │
│ • Rally point if family separated       │
└─────────────────────────────────────────┘

Confidence Levels:
✓ Shelter safety: HIGH
✓ Supply adequacy: MEDIUM (tight rationing)
⚠ Route safety: MEDIUM
✓ Family coordination: HIGH
```

### Example 2: Pandemic Triage
```
Input:
- Type: Pandemic
- Family: 5 people (asthmatic, elderly, others)
- Symptoms: High fever (3), mild cough (5), shortness of breath (1)
- Supplies: 10 N95 masks, 5-day medication

Output:
┌─────────────────────────────────────────┐
│ PANDEMIC TRIAGE PLAN – DAY 1-5          │
├─────────────────────────────────────────┤
│ ISOLATION:                              │
│ • Room A (Asthmatic + Elderly): Separate│
│   AC, extra humidity, caregiver PPE     │
│ • Room B (Others): Standard isolation   │
│                                         │
│ MEDICATION ALLOCATION:                  │
│ • Inhalers: Asthmatic + Elderly (daily) │
│ • Fever reducers: All (as needed, ration)
│ • Cough suppressants: Nighttime only    │
│                                         │
│ RESUPPLY MISSION (Day 4):               │
│ • Route: Home → Pharmacy (low-traffic)  │
│ • Time: 10am (lowest crowd)             │
│ • People: 1 (lowest risk)               │
│ • Shopping: Medications, masks          │
│                                         │
│ MONITORING:                             │
│ • Vitals check: 3x/day (elder/asthma)   │
│ • Call telemedicine if worsening        │
│ • Alert contacts: Exposed persons       │
└─────────────────────────────────────────┘

Next Review: Day 3
```

### Example 3: Grid Failure (Uncertain Duration)
```
Input:
- Type: Grid failure
- Duration: Unknown (could be hours or weeks)
- Family: 6 people
- Supplies: 2L bottled water, 3 days food

Output:
┌─────────────────────────────────────────┐
│ GRID FAILURE RESPONSE PLAN               │
├─────────────────────────────────────────┤
│ TIER 1 (6 hours):                       │
│ • Ration water: 0.5L/person/day         │
│ • Boil water (gas stove)                │
│ • Contact neighbors                     │
│ • Charge phones at gas station          │
│                                         │
│ TIER 2 (24-72 hours):                   │
│ • Collect rainwater (buckets)           │
│ • Eat perishables first                 │
│ • Heating: Gas stove/fireplace          │
│ • Community check: Is widespread?       │
│                                         │
│ TIER 3 (3+ days, assume long-term):     │
│ • Daily water collection mission        │
│ • Shift to shelf-stable food            │
│ • Heating: Consolidate to one room      │
│ • Communication: Radio + notes          │
│ • Security: Monitor surroundings        │
└─────────────────────────────────────────┘

Decision Point (Day 2): If power not restored, escalate.
```

---

## 🔧 Development

### Project Structure
```
AEGIS/
├── AEGIS-server.js       # Main API + coordinator logic
├── db/
│   └── schema.sql          # Database schema
├── frontend/
│   ├── src/
│   │   ├── App.jsx         # Main React component
│   │   ├── App.css         # Styles
│   │   └── main.jsx        # Vite entry
│   ├── package.json
│   └── vite.config.js
├── package.json            # Root dependencies
├── .env.example            # Environment variables
├── README.md              # This file
└── docs/
    └── ARCHITECTURE.md     # Detailed architecture docs
```

### Key Classes

**CrisisCoordinator** — Main orchestrator
```javascript
const coordinator = new CrisisCoordinator(client, db);
const result = await coordinator.coordinate(scenario);
// Returns: { scenario, agentOutputs, conflicts, finalPlan }
```

**Specialized Agents** — Medical, Logistics, Security, Communication
```javascript
const medical = new MedicalAgent(client);
const output = await medical.analyze(scenario);
// Returns: { triage, protocols, resource_allocation, ... }
```

### Adding a New Agent
1. Create class extending BaseAgent
2. Implement `analyze(scenario)` method
3. Register in CrisisCoordinator constructor
4. Add conflict detection in `detectConflicts()`

---

## 📈 Roadmap

### Phase 1: MVP (Current)
- ✅ Multi-agent coordination
- ✅ Conflict resolution
- ✅ 4 core agents (medical, logistics, security, communication)
- ✅ Web UI with scenario selector
- ✅ Offline-first architecture

### Phase 2: Integrations
- [ ] Real Google Maps API (routes, zones)
- [ ] Weather/Air Quality APIs (contamination simulation)
- [ ] Medical protocol databases (CDC, WHO)
- [ ] Community resource mapping

### Phase 3: Community Features
- [ ] Family tree coordination
- [ ] Neighborhood network tracking
- [ ] Shared resource inventory (community-level)
- [ ] Distributed messaging (peer-to-peer)

### Phase 4: Advanced Scenarios
- [ ] Cascading failures (multiple threats over time)
- [ ] Adaptive learning (improve from past decisions)
- [ ] Predictive modeling (what happens if...?)
- [ ] Multi-location coordination (coordinating multiple families)

---

## 🧪 Testing

```bash
# Run API tests
npm test

# Test a specific scenario
curl -X POST http://localhost:3000/api/scenario/1/coordinate \
  -H "Content-Type: application/json" \
  -d '{
    "type": "nuclear",
    "family_size": 8,
    "supplies": {"water": 150}
  }'
```

---

## ⚠️ Disclaimer

**AEGIS is a prototype for educational and research purposes only.** It is not a substitute for official emergency guidance, professional medical advice, or guidance from government agencies (FEMA, CDC, etc.). In a real crisis, always follow official instructions from emergency services and government health authorities.

---

## 🤝 Contributing

We welcome contributions! Areas of interest:
- Agent logic improvements
- New scenario types
- UI/UX enhancements
- Performance optimization
- Documentation

See `CONTRIBUTING.md` for guidelines.

---

## 📄 License

MIT License. See `LICENSE` file.

---

## 📞 Team

**AEGIS** — Google Cohort Hackathon Project  
Built for crisis coordination, decision-making, and survival.

---

## 🔗 Links

- **Project Brief:** `AEGIS_PROJECT_BRIEF.md`
- **API Docs:** `docs/API.md`
- **Architecture:** `docs/ARCHITECTURE.md`
- **Scenario Templates:** `docs/SCENARIOS.md`

---

## 🚀 Deploy

### Vercel (API)
```bash
vercel deploy
```

### Netlify (Frontend)
```bash
cd frontend
netlify deploy --prod
```

---

**Built with ❤️ for crisis resilience and survival coordination.**
