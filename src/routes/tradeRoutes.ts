import type { Response } from "express";
import { Router } from "express";

import {
  getPullStatus,
  getTrades,
  startBackgroundPull,
  subscribeToTradeEvents,
} from "../services/tradeService";

export const tradeRoutes = Router();

function sendSseEvent(
  response: Response,
  event: string,
  data: unknown,
): void {
  response.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

tradeRoutes.get("/", (req, res) => {
  const trades = getTrades();
  const requestedSymbol = String(req.query.symbol ?? "").trim().toUpperCase();
  const requestedLimit = Number(req.query.limit ?? trades.length);
  const limit =
    Number.isInteger(requestedLimit) && requestedLimit > 0
      ? Math.min(requestedLimit, trades.length)
      : trades.length;

  const filteredTrades = requestedSymbol
    ? trades.filter((trade) => trade.symbol === requestedSymbol)
    : trades;

  res.json({
    count: Math.min(filteredTrades.length, limit),
    trades: filteredTrades.slice(0, limit),
  });
});

tradeRoutes.post("/pull", (req, res) => {
  if (getPullStatus().active) {
    res.status(409).json({
      error: "A trade pull is already running",
      status: getPullStatus(),
    });
    return;
  }

  const requestedDuration = Number(req.body?.durationMs);
  const durationMs =
    Number.isFinite(requestedDuration) && requestedDuration > 0
      ? requestedDuration
      : undefined;
  const status = startBackgroundPull(durationMs);

  res.status(202).json(status);
});

tradeRoutes.get("/stream", (req, res) => {
  res.status(200);
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const unsubscribe = subscribeToTradeEvents((event) => {
    sendSseEvent(res, event.type, event);
  });
  const heartbeat = setInterval(() => {
    res.write(": heartbeat\n\n");
  }, 15_000);

  sendSseEvent(res, "connection", {
    status: getPullStatus(),
    message: "Trade stream connected",
  });

  req.on("close", () => {
    clearInterval(heartbeat);
    unsubscribe();
  });
});

tradeRoutes.get("/pull/status", (_req, res) => {
  res.json(getPullStatus());
});
