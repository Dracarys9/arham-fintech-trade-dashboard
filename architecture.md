# Arham Fintech Architecture Note

## Deployment & Architecture

The React frontend is deployed on Vercel and available at:

- [https://arham-fintech-trade-dashboard.vercel.app/](https://arham-fintech-trade-dashboard.vercel.app/)

The frontend communicates with the Node.js/Express backend API hosted on Render:

- [https://arham-fintech-backend-yf9t.onrender.com](https://arham-fintech-backend-yf9t.onrender.com)

This deployment preserves the same request, background-worker, and Server-Sent Events flow described below: the live dashboard sends API requests to the Render service and receives real-time trade updates over SSE.

## High-Level Design

The application separates the fast request/response path from the slow simulated market synchronization path:

```text
┌──────────────────┐       GET /api/trades        ┌──────────────────────┐
│                  │ ───────────────────────────> │                      │
│  React Dashboard │                              │  Express API         │
│                  │ <─────────────────────────── │  Trade Routes        │
└────────┬─────────┘       JSON cache response    └──────────┬───────────┘
         │                                                   │
         │ EventSource: /api/trades/stream                   │
         │ <═════════════════════════════════════════════════╪══ SSE events
         │                                                   │
         │ POST /api/trades/pull                             │
         │ ─────────────────────────────────────────────────>│ 202 Accepted
         │                                                   │
         │                                      ┌────────────▼───────────┐
         │                                      │ Trade Service          │
         │                                      │                        │
         │                                      │ Background timers      │
         │                                      │ Progress 0% → 100%     │
         │                                      │ Append generated batch │
         │                                      │ Broadcast to clients   │
         │                                      └────────────┬───────────┘
         │                                                   │
         └───────────────────────────────────────────────────┘
                    progress and completed events
```

## Initial Cache

When the backend starts, `src/data/trades.ts` generates 3,000 deterministic trade records. `tradeService.ts` copies those records into its in-memory store.

This makes `GET /api/trades` an immediate memory read. The dashboard can display the existing market snapshot while a later background pull is running.

## Solving the 30-Second Network Timeout Constraint

A network request should not remain open for the entire simulated pull. A pull can take approximately 30 seconds for testing, or a longer duration in a production-like configuration. Holding the original HTTP request open would make the request vulnerable to client, proxy, or load-balancer timeouts.

The solution is a non-blocking asynchronous worker pattern:

1. The client sends `POST /api/trades/pull`.
2. The route validates the request and immediately returns `202 Accepted`.
3. `startBackgroundPull()` records the active state and starts `setInterval`/`setTimeout` timers.
4. The Node.js event loop remains available to serve other HTTP requests and SSE connections.
5. Progress is updated in the service state without blocking the request thread.
6. On completion, a new trade batch is generated and appended to the in-memory store.
7. The service broadcasts a completion event to every connected SSE subscriber.

Only one pull can run at a time. A second trigger receives `409 Conflict`, preventing overlapping workers from corrupting progress or duplicating completion work.

## Zero-Polling Updates with SSE

The dashboard opens one long-lived connection to:

```text
GET /api/trades/stream
```

The response uses `Content-Type: text/event-stream`. The route registers the connection with the trade service and removes the subscriber when the browser disconnects.

The service broadcasts:

- `progress` — current percentage and pull status
- `completed` — final status, updated trade count, and appended batch size

The route also sends an initial `connection` event and periodic comment heartbeats. Heartbeats keep intermediaries from treating an idle stream as dead, while the browser's native `EventSource` automatically maintains the connection.

This avoids repeated `GET /api/trades/pull/status` requests. The server pushes state changes only when they occur, satisfying the zero-polling requirement.

## Request Lifecycles

### Fast cache read

```text
GET /api/trades
  → Express route
  → tradeService.getTrades()
  → JSON response from memory
```

### Background pull

```text
POST /api/trades/pull
  → check active state
  → start timers
  → return 202 immediately
  → emit progress events
  → generate and append new trades
  → emit completed event
```

### Live dashboard

```text
EventSource opens
  → initial connection event
  → progress events as the worker advances
  → completed event after the new batch is stored
  → frontend refreshes the cache once after completion
```

## Trade-Offs

- The current store is process-local memory, which is appropriate for the assessment simulation but would need Redis or a database for multiple backend instances.
- SSE is one-way, which fits server-to-dashboard progress updates. The trigger remains a normal `POST` request.
- The worker timers model asynchronous work. A production integration would replace the timers with a queue or job runner while preserving the same route and SSE contract.
