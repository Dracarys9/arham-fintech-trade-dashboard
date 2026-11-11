# Arham Fintech — BSE Trade Monitor

## Overview

Arham Fintech is a full-stack technical assessment project that simulates a BSE trade-fetching workflow. It combines an Express and TypeScript API with a React/Vite dashboard for monitoring trade activity in real time.

The application is designed around three operational goals:

- **Instant cache load:** the API starts with 3,000 seeded in-memory trade records, so the dashboard can render immediately without waiting for a network pull.
- **Non-blocking sync:** triggering a pull returns `202 Accepted` immediately while the simulated 30-second worker continues in the background.
- **Zero-polling updates:** the dashboard uses a persistent Server-Sent Events (SSE) connection for progress and completion events instead of repeatedly polling the API.

## Features

### Backend

- Seeded generator for realistic BSE trades
- In-memory trade store with deterministic initial data
- Trade filtering by symbol and result limiting
- Background pull simulation with configurable duration
- Progress updates from 0% to 100%
- Automatic generation and append of a new trade batch after completion
- SSE stream with:
  - Initial connection status
  - Pull progress events
  - Pull completion events
  - Keep-alive heartbeats
- Protection against concurrent pull requests

### Frontend

- Bloomberg-inspired light fintech terminal UI
- Connection and pull-status badges
- Trigger Pull action
- Total trades, total volume, and last-updated metrics
- Search by symbol or client name
- Responsive trade table
- Live progress indicator driven by SSE
- Reconnect state and API error feedback

## Tech Stack

### Backend

- Node.js
- Express 5
- TypeScript
- Server-Sent Events
- `tsx` for development
- `dotenv` for environment configuration
- `cors` for local frontend access

### Frontend

- React 19
- TypeScript
- Vite
- Tailwind CSS 4
- `lucide-react` icons
- Native browser `EventSource` for SSE

## Project Structure

```text
.
├── src/
│   ├── data/
│   │   └── trades.ts              # Seeded trade generator and initial cache
│   ├── routes/
│   │   └── tradeRoutes.ts         # REST and SSE endpoints
│   ├── services/
│   │   └── tradeService.ts        # Background pull and event broadcaster
│   └── server.ts                  # Express application entry point
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.tsx
│   │   │   ├── MetricsCards.tsx
│   │   │   └── TradeTable.tsx
│   │   ├── App.tsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── types.ts
│   ├── package.json
│   └── vite.config.ts
├── architecture.md
└── README.md
```

## Prerequisites

- Node.js 20 or newer
- npm 10 or newer

## Installation

Install backend dependencies from the repository root:

```powershell
npm install
```

Install frontend dependencies:

```powershell
Set-Location client
npm install
Set-Location ..
```

## Running Locally

Run the backend in a terminal:

```powershell
npm run dev
```

The API listens on `http://localhost:3000` by default.

Run the frontend in a second terminal:

```powershell
Set-Location client
npm run dev
```

Vite prints the local dashboard URL, normally `http://localhost:5173`.

The frontend connects to `http://localhost:3000` by default. To use another API origin, define `VITE_API_URL` before starting Vite:

```powershell
$env:VITE_API_URL = "http://localhost:3000"
npm run dev
```

## Production Builds

Build the backend from the repository root:

```powershell
npm run build
npm start
```

Build the frontend:

```powershell
Set-Location client
npm run build
```

Preview the frontend production build:

```powershell
npm run preview
```

## Configuration

### Backend environment variables

| Variable | Default | Description |
| --- | ---: | --- |
| `PORT` | `3000` | Express listening port |
| `TRADE_PULL_DURATION_MS` | `30000` | Simulated background pull duration |

For a quick local test:

```powershell
$env:TRADE_PULL_DURATION_MS = "5000"
npm run dev
```

### Frontend environment variables

| Variable | Default | Description |
| --- | --- | --- |
| `VITE_API_URL` | `http://localhost:3000` | Backend API origin |

## API Reference

### Health check

```http
GET /health
```

### Get trades

```http
GET /api/trades
GET /api/trades?symbol=TCS&limit=20
```

Response shape:

```json
{
  "count": 20,
  "trades": [
    {
      "id": "BSE-000001",
      "client": "Arham Securities",
      "symbol": "TCS",
      "quantity": 120,
      "price": 3942.5,
      "timestamp": "2026-11-11T15:00:00.000Z"
    }
  ]
}
```

### Trigger a background pull

```http
POST /api/trades/pull
Content-Type: application/json

{}
```

Optional testing duration:

```json
{
  "durationMs": 5000
}
```

The endpoint responds immediately with `202 Accepted`. If another pull is active, it returns `409 Conflict`.

### Pull status

```http
GET /api/trades/pull/status
```

### SSE stream

```http
GET /api/trades/stream
Accept: text/event-stream
```

The stream emits `connection`, `progress`, and `completed` events. Progress and completion payloads include the current pull status and total trade count.

## Validation

Backend:

```powershell
npm run build
```

Frontend:

```powershell
Set-Location client
npm run build
npm run lint
```

## Architecture

See [architecture.md](./architecture.md) for the non-blocking worker and SSE design note.
