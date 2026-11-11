import { generateTrades, trades as initialTrades } from "../data/trades";
import type { Trade } from "../data/trades";

export type PullState = "idle" | "running" | "completed";
export type TradeEventType = "progress" | "completed";

export interface PullStatus {
  state: PullState;
  active: boolean;
  progress: number;
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
  totalTrades: number;
}

export interface TradeEvent {
  type: TradeEventType;
  status: PullStatus;
  batchSize?: number;
}

export type TradeEventSubscriber = (event: TradeEvent) => void;

const DEFAULT_PULL_DURATION_MS = 30_000;
const PROGRESS_INTERVAL_MS = 1_000;
const NEW_BATCH_SIZE = 100;

const tradeStore: Trade[] = [...initialTrades];
const subscribers = new Set<TradeEventSubscriber>();

let status: PullStatus = {
  state: "idle",
  active: false,
  progress: 0,
  totalTrades: tradeStore.length,
};
let progressTimer: NodeJS.Timeout | undefined;
let completionTimer: NodeJS.Timeout | undefined;

function getDefaultDuration(): number {
  const configuredDuration = Number(process.env.TRADE_PULL_DURATION_MS);

  return Number.isFinite(configuredDuration) && configuredDuration > 0
    ? configuredDuration
    : DEFAULT_PULL_DURATION_MS;
}

function publish(event: TradeEvent): void {
  for (const subscriber of subscribers) {
    subscriber(event);
  }
}

function clearPullTimers(): void {
  if (progressTimer) {
    clearInterval(progressTimer);
    progressTimer = undefined;
  }

  if (completionTimer) {
    clearTimeout(completionTimer);
    completionTimer = undefined;
  }
}

function updateProgress(startedAtMs: number, durationMs: number): void {
  const elapsedMs = Date.now() - startedAtMs;
  const progress = Math.min(99, Math.floor((elapsedMs / durationMs) * 100));

  status = {
    ...status,
    progress,
  };

  publish({ type: "progress", status: getPullStatus() });
}

function completePull(startedAt: string, durationMs: number): void {
  clearPullTimers();

  const batch = generateTrades(NEW_BATCH_SIZE, Date.now());
  const firstTradeId = tradeStore.length + 1;
  const identifiedBatch = batch.map((trade, index) => ({
    ...trade,
    id: `BSE-${String(firstTradeId + index).padStart(6, "0")}`,
  }));

  tradeStore.push(...identifiedBatch);

  status = {
    state: "completed",
    active: false,
    progress: 100,
    startedAt,
    completedAt: new Date().toISOString(),
    durationMs,
    totalTrades: tradeStore.length,
  };

  publish({
    type: "completed",
    status: getPullStatus(),
    batchSize: identifiedBatch.length,
  });
}

export function getTrades(): Trade[] {
  return [...tradeStore];
}

export function getPullStatus(): PullStatus {
  return { ...status };
}

export function subscribeToTradeEvents(
  subscriber: TradeEventSubscriber,
): () => void {
  subscribers.add(subscriber);

  return () => {
    subscribers.delete(subscriber);
  };
}

export function startBackgroundPull(
  durationMs = getDefaultDuration(),
): PullStatus {
  if (!Number.isFinite(durationMs) || durationMs <= 0) {
    throw new Error("Pull duration must be a positive number");
  }

  if (status.active) {
    return getPullStatus();
  }

  clearPullTimers();

  const startedAt = new Date().toISOString();
  const startedAtMs = Date.now();

  status = {
    state: "running",
    active: true,
    progress: 0,
    startedAt,
    durationMs,
    totalTrades: tradeStore.length,
  };

  publish({ type: "progress", status: getPullStatus() });

  progressTimer = setInterval(() => {
    updateProgress(startedAtMs, durationMs);
  }, PROGRESS_INTERVAL_MS);

  completionTimer = setTimeout(() => {
    completePull(startedAt, durationMs);
  }, durationMs);

  return getPullStatus();
}
