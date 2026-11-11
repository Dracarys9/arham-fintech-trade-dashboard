import { useEffect, useMemo, useState } from 'react'

import { Header } from './components/Header'
import { MetricsCards } from './components/MetricsCards'
import { TradeTable } from './components/TradeTable'
import type { PullStatus, Trade, TradeEvent } from './types'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

interface TradesResponse {
  trades: Trade[]
}

const initialStatus: PullStatus = {
  state: 'idle',
  active: false,
  progress: 0,
  totalTrades: 0,
}

function App() {
  const [trades, setTrades] = useState<Trade[]>([])
  const [status, setStatus] = useState<PullStatus>(initialStatus)
  const [query, setQuery] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    const eventSource = new EventSource(`${API_URL}/api/trades/stream`)

    fetch(`${API_URL}/api/trades`)
      .then((response) => {
        if (!response.ok) throw new Error('Unable to load trades')
        return response.json() as Promise<TradesResponse>
      })
      .then((data) => {
        if (active) setTrades(data.trades)
      })
      .catch(() => {
        if (active) setError('Trade feed unavailable. Check that the API is running.')
      })

    const handleEvent = (event: MessageEvent<string>) => {
      const payload = JSON.parse(event.data) as TradeEvent
      setStatus(payload.status)

      if (payload.type === 'completed') {
        fetch(`${API_URL}/api/trades`)
          .then((response) => response.json() as Promise<TradesResponse>)
          .then((data) => setTrades(data.trades))
          .catch(() => setError('Unable to refresh the completed trade batch.'))
      }
    }

    const handleConnection = (event: MessageEvent<string>) => {
      const payload = JSON.parse(event.data) as { status: PullStatus }
      setStatus(payload.status)
    }

    eventSource.addEventListener('open', () => setIsConnected(true))
    eventSource.addEventListener('connection', handleConnection)
    eventSource.addEventListener('progress', handleEvent)
    eventSource.addEventListener('completed', handleEvent)
    eventSource.onerror = () => setIsConnected(false)

    return () => {
      active = false
      eventSource.close()
    }
  }, [])

  const filteredTrades = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) return trades

    return trades.filter(
      (trade) =>
        trade.symbol.toLowerCase().includes(normalizedQuery) ||
        trade.client.toLowerCase().includes(normalizedQuery),
    )
  }, [query, trades])

  const totalVolume = useMemo(
    () => trades.reduce((total, trade) => total + trade.price * trade.quantity, 0),
    [trades],
  )

  async function triggerPull() {
    setError(null)
    try {
      const response = await fetch(`${API_URL}/api/trades/pull`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      if (!response.ok) {
        setError('A trade pull is already in progress.')
      }
    } catch {
      setError('Unable to reach the trade feed.')
    }
  }

  return (
    <div className="app-shell">
      <Header
        isConnected={isConnected}
        isPulling={status.active}
        progress={status.progress}
        onTriggerPull={triggerPull}
      />
      <main className="mx-auto w-full max-w-[1480px] flex-1 px-5 py-8 sm:px-8 lg:py-10">
        <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="eyebrow mb-2">Market operations · Live workspace</p>
            <h2 className="hero-title">Execution overview</h2>
            <p className="mt-2 max-w-xl text-[14px] leading-6 text-slate-500">
              Monitor incoming BSE trades and launch a fresh market pull whenever your desk needs it.
            </p>
          </div>
          {status.active && (
            <div className="progress-card">
              <div className="flex items-center justify-between text-[12px] font-semibold text-slate-600">
                <span>Syncing market feed</span>
                <span className="text-blue-600">{status.progress}%</span>
              </div>
              <div className="progress-track">
                <div className="progress-bar" style={{ width: `${status.progress}%` }} />
              </div>
            </div>
          )}
        </div>

        {error && <div className="error-banner">{error}</div>}
        <MetricsCards
          totalTrades={trades.length}
          totalVolume={totalVolume}
          lastUpdated={status.completedAt ?? status.startedAt ?? null}
        />
        <div className="mt-8">
          <TradeTable
            trades={filteredTrades}
            query={query}
            onQueryChange={setQuery}
          />
        </div>
      </main>
      <footer className="border-t border-slate-200/70 px-5 py-4 sm:px-8">
        <div className="mx-auto flex max-w-[1480px] items-center justify-between text-[11px] font-medium uppercase tracking-[0.12em] text-slate-400">
          <span>BSE / NSE market data infrastructure</span>
          <span>All systems nominal</span>
        </div>
      </footer>
    </div>
  )
}

export default App
