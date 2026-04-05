# AEGIS: Crisis Coordinator
## Multi-Agent Survival System for Post-Apocalyptic Scenarios

**Team:** AEGIS (Solo/Pair)  
**Hackathon:** Google Cohort  
**Duration:** 48–72 hours  
**Complexity:** Medium-High (multi-agent coordination, offline-first, dynamic scenarios)

---

## EXECUTIVE SUMMARY

**AEGIS** is an AI-powered crisis coordination platform that helps individuals and communities survive multiple simultaneous threats (nuclear, pandemic, grid failure, civil unrest) by intelligently managing medical decisions, supply rationing, security threats, and communication—all while working **offline-first**.

Instead of a person juggling contradictory priorities across fragmented tools, AEGIS's specialized agents collaborate, negotiate conflicts, and provide one clear, actionable survival plan.

---

## CORE PROBLEM STATEMENT

In a crisis, people face **competing, urgent needs with incomplete information**:
- Medical emergencies (who gets treatment first?)
- Scarce resources (ration food for 10 people with 5 days of supplies)
- Security threats (is this route safe? Where are the danger zones?)
- Communication breakdown (how do we coordinate with family across the city?)

**Current solution:** Check 5 apps, make manual decisions, hope they're right.  
**AEGIS solution:** Agents handle each domain, negotiate priorities, and tell you what to do.

**Why offline-first?** Internet infrastructure fails first in crises. AEGIS syncs data when possible, but operates independently.

---

## PRODUCT VISION: "AEGIS"

### **Elevator Pitch (30 seconds)**
> AEGIS is an AI crisis coordinator for anyone facing immediate survival challenges. It runs on your phone or laptop—works offline or online—and handles the hard decisions: Which family member gets medical care first? How do we ration food? Is that neighborhood safe? Who in our community needs help? AEGIS's agents coordinate across medicine, logistics, security, and communication to give you one clear survival plan.

### **Why "AEGIS"?**
- AEGIS = line of longitude that guides navigation
- Works offline (like a physical map)
- Sounds authoritative but approachable
- Easy to remember, professional branding

---

## CORE FEATURES

### **1. Dynamic Threat Assessment**
- User declares scenario: "Nuclear fallout event, sheltering in place, 8 people, 14 days supplies"
- System activates threat profile (multi-threat scenario)
- Agents fetch relevant protocols and begin coordination

**Multi-threat scenarios handled:**
- Nuclear/radiological (fallout, contamination, shelter safety)
- Pandemic/viral (quarantine, medical protocols, isolation)
- Grid failure (power loss, communications down, supply chains broken)
- Civil unrest (security threats, safe routes, community coordination)
- Hybrid (any combination)

### **2. Multi-Agent Coordination Engine**

**Four Specialized Agents:**

#### **Agent 1: Medical Coordinator**
- Maintains patient records (symptoms, medical history, allergies)
- Applies triage protocols (nuclear: radiation exposure; pandemic: quarantine)
- Allocates limited medications (who needs painkillers? antibiotics? vaccines?)
- Negotiates with logistics agent ("I need clean water for wound care, but security says water is for decontamination")
- **Decision:** Provides medical protocols and priority rankings

#### **Agent 2: Logistics Planner**
- Tracks inventory (food, water, shelter, fuel, medical supplies)
- Calculates rationing schedules (days of supply remaining)
- Models resource allocation (medical vs. decontamination vs. cooking)
- Negotiates with medical agent ("We can't allocate 20L for medical; our supply is 3L/day")
- **Decision:** Provides rationing schedules and priority resource allocation

#### **Agent 3: Security Analyst**
- Assesses threats (civil unrest, contaminated zones, predatory behavior)
- Maps safe routes (between shelter, water sources, medical facilities)
- Monitors community safety (alerts about danger zones)
- Negotiates with communication agent ("Don't broadcast supply locations; security risk")
- **Decision:** Provides threat assessment, safe routes, and security alerts

#### **Agent 4: Communication Coordinator**
- Manages offline-first messaging (family coordination, community alerts)
- Maintains contact trees (who needs to know what)
- Plans communication strategy (when/how to reach external help)
- Negotiates with security agent ("Alert family but don't reveal shelter location")
- **Decision:** Provides messaging plans and coordination schedules

#### **Primary Agent: Crisis Coordinator**
- Understands user intent ("What should we do?", "We're running low on food", "Is it safe to leave?")
- Routes to specialized agents
- **Resolves agent conflicts** (critical feature):
  - Medical says: "Patient needs 2L clean water daily for hydration"
  - Logistics says: "We have 2L/day total for 8 people"
  - Security says: "Water source is 2km away, in contaminated zone"
  - Coordinator synthesizes: "Ration to 1.5L/person. Patient gets priority medical water. Send 2 people to water source with protective gear, fastest safe route."
- Delivers **one actionable plan** with confidence levels

---

### **3. Offline-First Architecture**

**Online mode:**
- Sync real data (Google Maps for routes, medical APIs for protocols, community data)
- Pull latest threat intelligence
- Update family contact trees

**Offline mode:**
- Operate with cached scenario templates
- Use local database (medical protocols, supply calculations, threat models)
- Queue decisions/messages for sync when online
- **No internet? No problem.**

---

### **4. Practical Survival Workflows**

#### **Workflow 1: Family Decision – Nuclear Event**
```
User input: "We're in fallout zone. Shelter for 5 holds 7 people. Family of 8."

Medical Agent:
  - Checks for vulnerable members (elderly, pregnant, immune-compromised)
  - Ages: 78, 6mo, 4yo, others 25-45
  - Verdict: Elderly at higher radiation risk; infant needs controlled environment

Logistics Agent:
  - Calculates 14-day supplies for 8 people vs. 7-person shelter
  - 14 days food: ✓ (prepped bunker stock)
  - 14 days water: ✓ (150L collected)
  - Medical supplies: ✓ (first aid kit, medications)
  - Verdict: 7 days comfortable, 14 days tight, beyond 14 days critical

Security Agent:
  - Checks safe routes to neighbor's shelters
  - Nearest shelter (1km): Family friends, safe zone
  - Radiation levels on route: Moderate (need basic protection)
  - Verdict: Can move 1-2 people safely

Communication Agent:
  - Plans alert to neighbors
  - Coordinates family communication (who goes where)
  - Creates offline message protocol

Crisis Coordinator synthesizes:
┌─────────────────────────────────────────────────┐
│ PRIORITY ACTION PLAN – NUCLEAR FALLOUT EVENT    │
├─────────────────────────────────────────────────┤
│ IMMEDIATE (next 2 hours):                       │
│ • Enter main shelter (7 people): You, partner,  │
│   elderly parent, infant, 3 children            │
│ • Move to neighbor shelter (1 person): Teenage  │
│   son (lowest radiation risk, healthiest)       │
│ • Contact: [Neighbor #1], coordinate arrival    │
│ • Route: Main St → Oak Ave (safest path)        │
│ • Protection: N95 masks, cover exposed skin     │
│                                                 │
│ RATIONING SCHEDULE:                             │
│ • 14-day stretch plan: 1,200 cal/person/day     │
│ • Infant: Formula priority (8 servings/day)     │
│ • Elderly: Higher water allotment (health)      │
│                                                 │
│ MEDICAL PROTOCOL:                               │
│ • Elderly: Monitor for radiation sickness       │
│ • Infant: Maintain temperature/humidity         │
│ • Others: Potassium iodide tablets (Schedule)   │
│                                                 │
│ COMMUNICATION:                                  │
│ • Text neighbor (online): Arrival ETA 30 min    │
│ • Offline: Leave note at house for other son    │
│ • Rally point: [Location] if family separated   │
└─────────────────────────────────────────────────┘

Confidence Levels:
  ✓ Shelter safety: HIGH (tested bunker)
  ✓ Supply adequacy: MEDIUM (tight rationing)
  ⚠ Route safety: MEDIUM (moderate radiation)
  ✓ Family coordination: HIGH (clear plan)
```

#### **Workflow 2: Pandemic Triage – Medical Resource Allocation**
```
User input: "5 family members symptomatic. One elderly, one asthmatic. 10 N95 masks, 5 days meds."

Medical Agent:
  - Symptom analysis: High fever (3), mild cough (5), shortness of breath (1 asthmatic)
  - Risk ranking: Asthmatic (HIGH), Elderly (HIGH), Others (MEDIUM)
  - Medication needs: Fever reducers, cough suppressants, asthma inhalers

Logistics Agent:
  - N95 masks: 10 total, ration to highest-risk people
  - Medications: 5-day supply for 5 people = tight fit
  - Quarantine: Suggest 2 separate rooms (symptomatic + asymptomatic)

Security Agent:
  - Civil unrest risk: LOW (early pandemic stage)
  - Supply run necessary? YES (medication will run out day 5)
  - Safe time/location for supply run: Tomorrow 10am, local pharmacy (lower traffic)

Communication Agent:
  - Alert: Secondary contacts exposed (anyone visited this week?)
  - Coordinate: Who monitors each patient?
  - External: Can we call telemedicine doctor?

Crisis Coordinator output:
┌─────────────────────────────────────────────────┐
│ PANDEMIC TRIAGE PLAN – DAY 1-5                  │
├─────────────────────────────────────────────────┤
│ IMMEDIATE ISOLATION:                            │
│ • Room A (Asthmatic + Elderly): Separate AC,    │
│   extra humidity, N95 masks for caregivers      │
│ • Room B (Others): Standard isolation           │
│ • Bathrooms: Separate if possible               │
│                                                 │
│ MEDICATION ALLOCATION:                          │
│ • Asthma inhalers: Elderly + Asthmatic (daily)  │
│ • Fever reducers: All 5 (as needed, ration)     │
│ • Cough suppressants: Nighttime only            │
│                                                 │
│ N95 USAGE (10 masks, 5-day supply):             │
│ • Caregivers: 2 masks/day (fresh mask)          │
│ • Patients entering shared spaces: 1 mask/day   │
│ • Supply runs: All caregivers (2 masks)         │
│                                                 │
│ RESUPPLY MISSION (Day 4):                       │
│ • Route: Home → Pharmacy (low-traffic route)    │
│ • Time: 10am (lowest crowd)                     │
│ • People: 1 (lowest risk, masked)               │
│ • Shopping list: [Medications, masks, supplies] │
│                                                 │
│ MONITORING:                                     │
│ • Check vitals 3x/day (asthmatic/elderly)       │
│ • Telemedicine: Call doctor if worsening        │
│ • Alert contacts: [List] exposed; monitor       │
└─────────────────────────────────────────────────┘

Next review: Day 3 (reassess symptoms, medication supply)
```

#### **Workflow 3: Grid Failure – Multi-Threat Response**
```
User input: "Power out 36 hours. No water, no communications. Uncertain if temporary or long-term."

Security Agent:
  - Initial threat: UNKNOWN (could recover in hours or be permanent)
  - Civil unrest risk: LOW (too early)
  - Water source: Neighbors? Municipal? Contaminated?

Logistics Agent:
  - Current supplies: Food (3 days), water (bottled, 2L)
  - Utilities: Gas stove (works), no refrigeration, no heating
  - Need: Water source, fuel for heating/cooking

Medical Agent:
  - No immediate health emergencies
  - Monitor for: Dehydration, hypothermia (if prolonged)
  - Medications requiring refrigeration: NONE (good)

Communication Agent:
  - Phone battery: 40% (limit usage)
  - Offline communication: Notes/radio?
  - Family contact protocol: Landline to neighbors?

Crisis Coordinator output:
┌─────────────────────────────────────────────────┐
│ GRID FAILURE RESPONSE PLAN (UNCERTAIN DURATION) │
├─────────────────────────────────────────────────┤
│ TIER 1: IMMEDIATE (Next 6 hours)                │
│ ✓ Ration water: 0.5L/person/day (minimal)       │
│ ✓ Boil drinking water (gas stove)               │
│ ✓ Contact neighbors (landline / knock)          │
│ ✓ Charge phones: Gas station (if reachable)     │
│ ✓ Move food to cooler (if ice available)        │
│                                                 │
│ TIER 2: SHORT-TERM (24-72 hours)                │
│ • Collect rainwater (buckets, bathtubs)         │
│ • Source: Neighbors' wells? Bottled water depot?│
│ • Food: Eat perishables first (3-day plan)      │
│ • Heating: Gas stove or fireplace (if safe)     │
│ • Lights: Flashlights + candles (SAFETY)        │
│ • Community check: Is this widespread?          │
│                                                 │
│ TIER 3: EXTENDED (3+ days)                      │
│ • Assume long-term outage                       │
│ • Water procurement: Daily collection mission    │
│ • Food: Shift to shelf-stable items             │
│ • Heating: Consolidate to one room              │
│ • Communication: Radio + handwritten notes      │
│ • Security: Check locks, monitor surroundings   │
│                                                 │
│ RESOURCE ALLOCATION:                            │
│ • Water priority: Drinking > Cooking > Hygiene  │
│ • Food priority: Perishables > Canned > Dry     │
│ • Fuel priority: Cooking > Heating > Light      │
└─────────────────────────────────────────────────┘

Decision point (Day 2): If power not restored, escalate to Tier 3 protocol.
```

---

## TECHNICAL ARCHITECTURE

### **Stack (Solo/Pair Friendly)**

```
┌────────────────────────────────────────────┐
│   Frontend (Web + Mobile-responsive CLI)   │
│   React / React Native (or Vue + CLI)      │
└──────────────────┬─────────────────────────┘
                   │
┌──────────────────▼─────────────────────────┐
│   Coordinator Agent (Claude API)           │
│   - Intent understanding                   │
│   - Agent routing & conflict resolution    │
│   - Plan synthesis                         │
└──────────────────┬─────────────────────────┘
         │         │         │         │
    ┌────▼──┐ ┌───▼──┐ ┌────▼──┐ ┌───▼───┐
    │Medical│ │Logis-│ │Security│ │Comm.  │
    │Agent  │ │tics  │ │Agent   │ │Agent  │
    │       │ │Agent │ │        │ │       │
    └────┬──┘ └───┬──┘ └────┬──┘ └───┬───┘
         │        │         │        │
    ┌────▼────────▼─────────▼────────▼────┐
    │   Tool Bridge (MCP + APIs)          │
    │ • Google Maps (routes, zones)        │
    │ • Weather/Air Quality (contamination)│
    │ • Medical Protocols (CDC, WHO)       │
    │ • Community Data (census, resources) │
    │ • Offline fallbacks (cached data)    │
    └────┬─────────────────────────────────┘
         │
    ┌────▼──────────────────────────┐
    │   Database (SQLite/Postgres)  │
    │ • Scenario templates           │
    │ • User profile + preferences   │
    │ • Decision history             │
    │ • Sync queue (offline mode)    │
    └───────────────────────────────┘

OFFLINE-FIRST FLOW:
1. Online: Sync scenario data, routes, protocols
2. Offline: Use cached data + local DB
3. Decisions: Queue for sync when online again
4. Result: Works anytime, everywhere
```

### **Database Schema** (Simplified)

```sql
-- Core tables
CREATE TABLE scenarios (
  id INTEGER PRIMARY KEY,
  type TEXT (nuclear|pandemic|grid_failure|civil_unrest|multi),
  name TEXT,
  description TEXT,
  active_at TIMESTAMP,
  created_at TIMESTAMP
);

CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  name TEXT,
  location TEXT,
  family_size INTEGER,
  medical_conditions TEXT[], -- [asthma, diabetes, etc]
  shelter_capacity INTEGER,
  supplies JSON, -- {water: 150, food: 30_days, ...}
  created_at TIMESTAMP
);

CREATE TABLE decisions (
  id INTEGER PRIMARY KEY,
  user_id INTEGER,
  scenario_id INTEGER,
  agent_decisions JSON, -- {medical: {...}, logistics: {...}, ...}
  coordinator_plan TEXT,
  executed BOOLEAN,
  created_at TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (scenario_id) REFERENCES scenarios(id)
);

CREATE TABLE agent_logs (
  id INTEGER PRIMARY KEY,
  decision_id INTEGER,
  agent_type TEXT (medical|logistics|security|communication),
  input TEXT,
  output TEXT,
  confidence_level FLOAT,
  created_at TIMESTAMP,
  FOREIGN KEY (decision_id) REFERENCES decisions(id)
);

CREATE TABLE offline_queue (
  id INTEGER PRIMARY KEY,
  user_id INTEGER,
  action TEXT,
  payload JSON,
  synced BOOLEAN,
  created_at TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

## IMPLEMENTATION TIMELINE (48–72 Hours)

### **Phase 1: Foundation (0–12 hours)**
- [ ] Set up repo, database schema, API skeleton
- [ ] Implement CLI interface (Inquirer.js or similar)
- [ ] Create scenario templates (nuclear, pandemic, grid, civil unrest, multi)
- [ ] Write prompt templates for all four agents

### **Phase 2: Agents (12–30 hours)**
- [ ] Medical Agent: Protocol application, triage logic
- [ ] Logistics Agent: Inventory calculation, rationing algorithm
- [ ] Security Agent: Threat assessment, route mapping (mock Google Maps)
- [ ] Communication Agent: Message planning, contact tree logic
- [ ] Coordinator Agent: Intent routing, agent invocation, conflict resolution

### **Phase 3: Integration (30–45 hours)**
- [ ] Wire agents together (coordinator calls sub-agents)
- [ ] Implement conflict resolution (when agents disagree)
- [ ] Add MCP integrations (start with mock data, add real APIs if time)
  - Google Maps for routes
  - Weather API for contamination simulation
  - Mock medical protocol database
- [ ] Offline-first logic (sync, cache, queue)

### **Phase 4: Polish + Demo (45–72 hours)**
- [ ] Web UI: Scenario selector → live agent coordination → action plan
- [ ] Error handling, edge cases
- [ ] Demo flow: Show 2–3 workflows live
- [ ] Documentation, GitHub README
- [ ] Deployment: Vercel (API) + Netlify (frontend)

---

## DELIVERABLES

### **By Hour 72:**

1. **GitHub Repo**
   - Clean, well-commented code
   - README with setup instructions
   - Architecture diagram
   - Sample scenarios + expected outputs

2. **Deployed API**
   - `/api/scenario/create` — Initialize crisis scenario
   - `/api/scenario/:id/decide` — Get agent coordination + action plan
   - `/api/scenario/:id/history` — View past decisions
   - `/api/sync` — Offline sync endpoint

3. **Web Interface**
   - Scenario selector (nuclear, pandemic, grid, civil, multi)
   - Real-time agent coordination visualization
   - Action plan display (prioritized, clear)
   - Mock offline mode (works without internet)

4. **Demo Video (2–3 min)**
   - Show scenario: "Nuclear fallout, family of 8, shelter for 7"
   - Agents work in parallel (medical, logistics, security, communication)
   - Coordinator resolves conflicts
   - Output: Clear family plan with prioritization

5. **Pitch Deck (5 slides)**
   - Problem: Crisis = competing priorities
   - Solution: Multi-agent coordination
   - Demo: Live walkthrough
   - Impact: Practical, actionable, offline-first
   - Roadmap: Integrations, scaling, community features

---

## WHY AEGIS WINS (Hackathon Judge Appeal)

✅ **Novel problem:** Multi-agent AI for survival (not productivity tools)  
✅ **Real complexity:** Agents disagree; coordinator must resolve  
✅ **Practical value:** Works offline; actually useful in crisis  
✅ **Buildable scope:** MVP achievable in 48–72h for solo/pair  
✅ **Emotional impact:** Saves lives (even hypothetically)  
✅ **Technical depth:** Database, APIs, agent orchestration, sync logic  
✅ **Demo-friendly:** Visual, clear, dramatic ("Family saved by AI coordination")  
✅ **Extensible:** Easy roadmap (more agents, more tools, community features)  
✅ **Google fit:** "AI for good," crisis resilience, accessibility  

---

## COMPETITIVE ADVANTAGES

| Feature | AEGIS | Competitors |
|---------|----------|-------------|
| **Multi-threat** | Nuclear + pandemic + grid + civil unrest + hybrid | Single-scenario tools |
| **Offline-first** | Works when internet down | Cloud-dependent |
| **Agent coordination** | Agents negotiate conflicts | Sequential checklists |
| **Practical output** | Actionable hour-by-hour plans | Theoretical advice |
| **Communication focus** | Family + community coordination | Individual-centric |
| **No specialization required** | Works for anyone | Prepper/technical audience only |

---

## RISKS + MITIGATION

| Risk | Mitigation |
|------|-----------|
| Agent conflicts too complex | Start simple; prototype decision rules first |
| MCP integrations take too long | Use mock data initially; add real APIs in Phase 3 |
| Scope creep (too many agents) | Start with 3 agents; add 4th in final phase |
| UI takes time | Use CLI for demo; web UI is nice-to-have |
| Data privacy concerns (for real users) | Document: This is prototype/educational only |

---

## RESOURCES TO STUDY

- **Agent coordination:** ReAct prompting, tool use in Claude
- **Conflict resolution:** Multi-objective optimization, Pareto frontiers
- **Offline-first:** Service workers, IndexedDB, sync queues
- **Scenario design:** FEMA disaster response, CDC pandemic protocols, nuclear safety guidelines
- **MCP servers:** Google Calendar, Gmail, Google Maps (understand how to call them)

---

## SUCCESS CRITERIA

**MVP Success:**
- [ ] All 4 agents functional and produce reasonable outputs
- [ ] Coordinator synthesizes conflict-free plan
- [ ] Works offline (cached data)
- [ ] Live demo: 2 scenarios, clear action plans
- [ ] Deployed API + web interface

**Bonus (if time):**
- [ ] Real MCP integrations (Google Maps, Weather API)
- [ ] Community features (family tree, network coordination)
- [ ] Advanced scenarios (hybrid threats, cascading failures)
- [ ] Historical data (track decisions, learn from outcomes)

---

## NEXT STEPS

1. **This week:** Finalize team, set up repo, create scenario templates
2. **Day 1 (Hour 0–12):** Database + CLI foundation
3. **Day 2 (Hour 12–36):** Implement all 4 agents
4. **Day 3 (Hour 36–60):** Coordinator + conflict resolution
5. **Day 4 (Hour 60–72):** Integration, demo, deploy

**You've got this. Let's build AEGIS.** 🚀

---

## APPENDIX: Sample Agent Prompts

### **Medical Agent Prompt**
```
You are the Medical Coordinator Agent for AEGIS, a crisis survival system.

Your role: 
- Assess medical risks in the current scenario
- Apply evidence-based medical protocols (CDC, WHO, medical literature)
- Triage patients (who needs care first?)
- Allocate limited medical resources (meds, clean water, isolation)
- Negotiate with other agents (logistics, security, communication)

Input: 
{
  scenario: "Pandemic outbreak, family of 5, symptomatic",
  patients: [
    {name: "A", age: 65, symptoms: "high fever, cough", conditions: "asthma"},
    {name: "B", age: 8, symptoms: "mild fever", conditions: "none"},
    ...
  ],
  resources: {medications: "5-day supply", masks: "20 N95"}
}

Output (JSON):
{
  triage: [{patient: "A", risk: "HIGH", reason: "..."}],
  protocols: [{action: "Isolate A+B", duration: "14 days", rationale: "..."}],
  resource_allocation: {
    medications: {asthma_inhalers: "A daily", fever_reducers: "all as-needed"},
    masks: {A: "N95 daily", B: "N95 when shared space"}
  },
  negotiation_needs: [
    {agent: "logistics", request: "2L clean water daily for A", priority: "HIGH"}
  ],
  confidence: 0.92,
  rationale: "Standard pandemic triage with asthma comorbidity priority..."
}
```

### **Coordinator Agent Prompt**
```
You are the Crisis Coordinator Agent for AEGIS.

Your role:
- Understand user intent ("What should we do?" "We're running out of water" "Is it safe to leave?")
- Invoke specialized agents (medical, logistics, security, communication)
- Resolve conflicts when agents disagree
- Synthesize one clear, actionable survival plan

Conflict Resolution Strategy:
1. Identify the conflict (e.g., medical needs water, logistics says water is scarce)
2. Weigh priorities: Life-safety > comfort > efficiency
3. Find creative solutions (allocate differently, sequence actions, accept trade-offs)
4. Present user with options if no clear winner

Output:
- ONE cohesive action plan
- Confidence levels for each recommendation
- Clear rationale for trade-offs
- Next decision point (when to reassess)
```

---

**Document complete. Ready to code.** 🚀
