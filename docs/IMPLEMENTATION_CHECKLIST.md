# AEGIS: 48–72 Hour Implementation Checklist

## 🎯 GOAL
Build a working multi-agent crisis coordinator that impresses judges with:
- ✓ Real multi-agent coordination (not sequential tools)
- ✓ Live demo showing agent collaboration + conflict resolution
- ✓ Offline-first capability
- ✓ Clean, deployable code
- ✓ Professional pitch

---

## ⏱️ TIMELINE

### PHASE 1: FOUNDATION (Hours 0–12)

**Hour 0–3: Setup**
- [ ] Create GitHub repo (initialize with README)
- [ ] Clone, npm install, verify dependencies
- [ ] Create `.env` with `ANTHROPIC_API_KEY`
- [ ] Set up database: `npm run setup-db`
- [ ] Test API server startup: `npm start`
- [ ] Verify Anthropic API connection (test 1 simple call)

**Hour 3–6: Data Layer**
- [ ] Create SQLite database (`AEGIS.db`)
- [ ] Build schema: scenarios, users, decisions, agent_logs, offline_queue
- [ ] Write helper functions: insertScenario(), getScenario(), saveDecision()
- [ ] Test database CRUD operations

**Hour 6–9: CLI Interface**
- [ ] Create CLI prompt (Inquirer.js or simple prompt)
- [ ] Scenario selector menu (nuclear, pandemic, grid, civil, multi)
- [ ] Input handler: capture user scenario details
- [ ] Output formatter: pretty-print agent responses

**Hour 9–12: Scenario Templates**
- [ ] Define 5 scenario templates with realistic data:
  - Nuclear fallout
  - Pandemic outbreak
  - Grid failure
  - Civil unrest
  - Hybrid threat
- [ ] Create example inputs for each
- [ ] Document scenario structure

---

### PHASE 2: AGENTS (Hours 12–36)

**Hour 12–18: Medical Agent**
- [ ] Implement MedicalAgent class
- [ ] Write prompt: triage, protocols, resource needs, conflicts
- [ ] Test with pandemic scenario
- [ ] Add structured output parsing (extract JSON)
- [ ] Test error handling

**Hour 18–24: Logistics Agent**
- [ ] Implement LogisticsAgent class
- [ ] Write prompt: inventory, rationing, constraints, conflicts
- [ ] Add rationing algorithm (days_of_supply calculator)
- [ ] Test with grid failure scenario
- [ ] Integration test: can it detect conflicts with medical needs?

**Hour 24–30: Security Agent**
- [ ] Implement SecurityAgent class
- [ ] Write prompt: threat assessment, routes, shelter security
- [ ] Add basic route mapping (mock Google Maps if no real API)
- [ ] Test with civil unrest scenario
- [ ] Test: can it flag communication risks?

**Hour 30–36: Communication Agent**
- [ ] Implement CommunicationAgent class
- [ ] Write prompt: messaging plan, contact trees, offline methods
- [ ] Add security check: don't leak location info
- [ ] Test with family coordination scenario
- [ ] Test: does it respect security agent constraints?

---

### PHASE 3: COORDINATION + INTEGRATION (Hours 36–54)

**Hour 36–42: Coordinator Agent**
- [ ] Implement CrisisCoordinator class
- [ ] Parallel agent invocation (Promise.all)
- [ ] Add conflict detection logic
- [ ] Write synthesize prompt: resolve conflicts, output unified plan
- [ ] Test with simple scenario

**Hour 42–48: Conflict Resolution**
- [ ] Implement detectConflicts() method
- [ ] Add priority logic: life-safety > comfort > efficiency
- [ ] Test conflict scenarios:
  - Medical vs. Logistics (water allocation)
  - Security vs. Communication (info sharing)
  - All 4 agents with competing needs
- [ ] Verify resolution makes sense

**Hour 48–54: API Endpoints**
- [ ] Wire up Express server
- [ ] `POST /api/scenario` — create scenario
- [ ] `POST /api/scenario/:id/coordinate` — get coordination
- [ ] `GET /api/scenario/:id/history` — view decisions
- [ ] `GET /api/health` — status check
- [ ] Test all endpoints with curl/Postman

---

### PHASE 4: UI + POLISH (Hours 54–66)

**Hour 54–60: React Frontend**
- [ ] Set up Vite project
- [ ] Build scenario selector component
- [ ] Build coordination display (agent cards)
- [ ] Build results panel (conflicts + plan)
- [ ] Add loading states + error handling
- [ ] Style with provided CSS

**Hour 60–66: Deployment + Testing**
- [ ] Deploy API to Vercel/Railway
- [ ] Deploy frontend to Netlify
- [ ] Test live end-to-end
- [ ] Fix any integration issues
- [ ] Verify offline mode works (use browser cache)

---

### PHASE 5: DEMO + POLISH (Hours 66–72)

**Hour 66–69: Demo Prep**
- [ ] Record 2–3 demo runs (nuclear, pandemic, grid failure)
- [ ] Create demo script (what to show, what to say)
- [ ] Practice live demo (5–10 min, smooth transitions)
- [ ] Have backup video in case live fails

**Hour 69–71: Documentation**
- [ ] Polish README
- [ ] Add setup instructions (copy-paste friendly)
- [ ] Document API endpoints with examples
- [ ] Add architecture diagram (ASCII or simple SVG)

**Hour 71–72: Pitch Prep**
- [ ] Create 5-slide pitch deck (use provided outline)
- [ ] Practice 8-minute pitch (problem → solution → demo → impact)
- [ ] Prepare for Q&A (have answers to common questions)
- [ ] Final repo check: clean code, no secrets, good comments

---

## 📋 DELIVERABLES CHECKLIST

### Code Deliverables
- [ ] `AEGIS-server.js` — Fully functional API with all agents
- [ ] `src/App.jsx` — React component with UI
- [ ] `src/App.css` — Professional styling
- [ ] `db/schema.sql` — Database schema
- [ ] `package.json` — Dependencies
- [ ] `README.md` — Clear setup instructions

### Live Deliverables
- [ ] API deployed and accessible
- [ ] Frontend deployed and accessible
- [ ] 2–3 demo scenarios working end-to-end
- [ ] Database populated with example scenarios

### Documentation
- [ ] README with setup, usage, endpoints
- [ ] Architecture diagram (explain system flow)
- [ ] Scenario templates (show what inputs look like)
- [ ] Agent prompt examples (show agent reasoning)

### Pitch Materials
- [ ] 5-slide deck (PDF + speaker notes)
- [ ] Demo script (timing, talking points)
- [ ] Video demo (90–120 seconds, fallback)
- [ ] Backup: printed one-pager for judges

---

## 🔥 CRUNCH MODE TACTICS (If Behind Schedule)

**Hour 48 and it's not working?**
- Cut the UI: demo via CLI + API calls
- Cut real MCP integrations: use mock data
- Cut offline mode: demo online-only (mention offline as roadmap)
- Cut the 4th agent: ship with 3 (medical, logistics, security)
- **Keep:** Core multi-agent coordination + conflict resolution (this is the novel part)

**Hour 60 and agents aren't good?**
- Simplify agent prompts (less complexity = more reliable)
- Add examples to prompts (few-shot learning)
- Lower max_tokens to force concise output
- Use simpler JSON parsing (regex if needed)

**Hour 66 and no UI?**
- Stick with CLI demo (it's faster to iterate)
- Judges care about AI coordination, not UI polish
- Focus on demo clarity, not visual design

**Hour 71 and no deployment?**
- Demo locally on your laptop
- Have API running on localhost
- Show GitHub repo (judges can see code)

---

## ✅ SUCCESS CRITERIA (Minimum Viable Hack)

**MVP Success = Must Have All:**
1. [ ] 4 agents (medical, logistics, security, communication) functional
2. [ ] Coordinator synthesizes plan from agent outputs
3. [ ] Conflict detection working (at least 1 real conflict scenario)
4. [ ] Database storing decisions + history
5. [ ] API with 3+ endpoints
6. [ ] Live demo: nuclear fallout or pandemic scenario
7. [ ] Deployed (can be localhost, fine)
8. [ ] Clean GitHub repo with README
9. [ ] 5-minute pitch explaining multi-agent coordination

**Bonus Features = Nice to Have:**
- [ ] Real MCP integrations (Google Maps, Weather API)
- [ ] Polished React UI
- [ ] Offline mode fully functional
- [ ] 3+ different scenarios demoed live
- [ ] Agent logging + decision history view
- [ ] Custom scenario builder (user inputs scenario params)

---

## 🛠️ DEBUGGING GUIDE

### Agent not producing output
```javascript
// Add logging
console.log("Input to agent:", scenario);
const response = await agent.analyze(scenario);
console.log("Raw response:", response);
// Check if JSON parsing is failing
```

### Coordinator not resolving conflicts
```javascript
// Check detectConflicts() logic
const conflicts = coordinator.detectConflicts(agentOutputs);
console.log("Conflicts found:", conflicts);
// Manually verify agent outputs are conflicting
```

### Database errors
```bash
# Check database exists and is initialized
sqlite3 AEGIS.db ".tables"

# Verify schema
sqlite3 AEGIS.db ".schema scenarios"

# Clear and reinit if broken
rm AEGIS.db
npm run setup-db
```

### API not responding
```bash
# Check server is running
lsof -i :3000

# Test endpoint
curl -X GET http://localhost:3000/api/health

# Check API key
echo $ANTHROPIC_API_KEY
```

### Frontend not fetching
```javascript
// Check CORS headers in Express
app.use(cors());

// Check fetch URL matches API location
const API_URL = 'http://localhost:3000'; // If local
// vs
const API_URL = 'https://AEGIS-api.vercel.app'; // If deployed
```

---

## 🎯 MUST-HAVES FOR JUDGES

1. **Working demo** — Even if simple, it must work live
2. **Multi-agent coordination** — Not just tool calls, agents must coordinate
3. **Conflict resolution** — Show agents disagreeing, coordinator resolving
4. **Clear pitch** — Problem → Solution → Demo → Impact
5. **Clean code** — Readable, commented, deployable
6. **Novel approach** — This isn't a productivity app; it's crisis AI
7. **Real scenario** — Nuclear fallout, pandemic, grid failure (not toy examples)

---

## 📞 GETTING HELP

**If stuck on agents:**
- Simplify the prompt
- Add examples to the prompt
- Test with smaller input
- Check raw API response (log it)

**If stuck on coordination:**
- Hardcode first test case (medical vs logistics)
- Build conflict resolution on that
- Then generalize

**If stuck on deployment:**
- Start with localhost demo
- Deploy API to Vercel (easiest)
- Deploy frontend to Netlify
- Both have free tiers, instant deploy

**If running out of time:**
- Cut UI, keep API
- Cut integrations, use mock data
- Cut offline, demo online-only
- Keep agents + coordination (this is the core)

---

## 🚀 FINAL CHECKLIST (Hour 71)

- [ ] All code committed to GitHub
- [ ] README has setup instructions (test them)
- [ ] API deployed and responding
- [ ] Demo scenario works end-to-end
- [ ] Pitch deck finalized
- [ ] Practiced pitch (time it: 8 min max)
- [ ] Backup demo video recorded
- [ ] Team knows what to say if API fails
- [ ] Know the codebase (be able to explain it quickly)
- [ ] Have judges' contact info / submission URL

---

## 🎯 MOCK DEMO RUN (Test This)

```bash
# 1. Start server
npm start
# Output: ✓ Connected to AEGIS database
#        📡 Server running on http://localhost:3000

# 2. Make test request
curl -X POST http://localhost:3000/api/scenario/1/coordinate \
  -H "Content-Type: application/json" \
  -d '{
    "type": "nuclear",
    "family_size": 8,
    "shelter_capacity": 7,
    "supplies": {"water": 150, "food": "14 days"},
    "vulnerable": ["elderly", "infant"],
    "user_id": 1
  }'

# 3. Expected output
# {
#   "scenario": {...},
#   "agentOutputs": [
#     {"type": "medical", "output": {...}},
#     {"type": "logistics", "output": {...}},
#     ...
#   ],
#   "conflicts": [{agents: [...], resource: "water", ...}],
#   "finalPlan": "PRIORITY ACTION PLAN...",
#   "timestamp": "2024-01-15T..."
# }

# 4. If you see this, you're ready for the demo!
```

---

**You've got 48–72 hours. Build something amazing. Let's go.** 🚀

---

## RESOURCES

- **Anthropic API Docs**: https://docs.anthropic.com
- **Express.js Guide**: https://expressjs.com
- **React Docs**: https://react.dev
- **SQLite Reference**: https://www.sqlite.org/cli.html
- **Vite Setup**: https://vitejs.dev/guide/

---

## TEAM COORDINATION

**Suggested split (for pair):**
- **Person A:** Server + agents (hours 0–36), then API endpoints (36–48)
- **Person B:** Database (0–12), then UI (hours 54–66)
- **Both:** Coordination (48–54), demo prep (66–72)

**If solo:** Focus on agents + coordination (core), skip UI if short on time.

**Check-ins:** Every 6 hours, sync on progress + blockers.

---

**Remember: judges care about WORKING multi-agent coordination more than visual polish. Focus on that.** ✨
