# AEGIS Architecture

## Overview

AEGIS is a multi-agent AI system built on a Node.js/Express backend with a React frontend.

## Components

### Backend (`aegis-server.js`)
- Express REST API
- SQLite database via `sqlite3`
- Anthropic Claude API integration (`@anthropic-ai/sdk`)

### Agents
- **CrisisCoordinator** — orchestrates all agents and synthesizes final plan
- **MedicalAgent** — handles health/triage decisions
- **LogisticsAgent** — manages supply and resource allocation
- **SecurityAgent** — assesses threats and defensive measures
- **CommunicationAgent** — handles information dissemination

### Frontend (`src/`)
- React 18 + Vite
- Single-page app communicating with the backend API

### Database (`db/`)
- SQLite (file-based)
- Tables: `users`, `scenarios`, `decisions`, `agent_logs`
