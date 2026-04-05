# AEGIS Crisis Scenario Examples

## Scenario Types

### `medical_emergency`
Mass casualty event requiring triage and medical resource allocation.

### `supply_shortage`
Critical depletion of food, water, or medical supplies requiring logistics coordination.

### `security_threat`
Hostile incursion or civil unrest requiring defensive posture and evacuation planning.

### `natural_disaster`
Earthquake, flood, or storm requiring shelter-in-place or evacuation decisions.

### `communication_blackout`
Loss of external communication requiring local coordination protocols.

## Example Payload

```json
{
  "type": "supply_shortage",
  "name": "Day 14 Water Crisis",
  "threat_level": "critical",
  "user_id": 1,
  "context": {
    "population": 47,
    "water_days_remaining": 2,
    "nearest_source_km": 12
  }
}
```
