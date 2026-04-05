# AEGIS API Reference

## Base URL
`http://localhost:3000`

## Endpoints

### POST `/api/coordinate`
Trigger the multi-agent crisis coordination pipeline.

**Request body:**
```json
{
  "type": "medical_emergency",
  "name": "Scenario name",
  "user_id": 1,
  "threat_level": "high"
}
```

**Response:**
```json
{
  "scenario": { ... },
  "agentOutputs": [ ... ],
  "conflicts": [ ... ],
  "finalPlan": "...",
  "timestamp": "2026-04-04T00:00:00.000Z"
}
```

### GET `/api/scenarios`
List all stored scenarios.

### GET `/api/decisions/:id`
Get a specific decision record with agent logs.
