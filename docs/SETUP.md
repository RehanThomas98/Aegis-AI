# AEGIS Setup Guide

## Prerequisites
- Node.js >= 16
- An Anthropic API key

## Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env .env.local
# Edit .env and add your ANTHROPIC_API_KEY

# Initialize the database
npm run setup-db

# Start the server
npm start
```

## Development

```bash
# Run backend with auto-reload
npm run dev

# Build frontend
npm run build
```

## Cloud Run Deployment

```bash
# Build and push Docker image
docker build -t aegis .
docker run -p 3000:3000 --env-file .env aegis
```
