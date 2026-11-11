export interface Trade {
  id: string
  client: string
  symbol: string
  quantity: number
  price: number
  timestamp: string
}

export interface PullStatus {
  state: 'idle' | 'running' | 'completed'
  active: boolean
  progress: number
  startedAt?: string
  completedAt?: string
  durationMs?: number
  totalTrades: number
}

export interface TradeEvent {
  type: 'progress' | 'completed'
  status: PullStatus
  batchSize?: number
}
