import { Search, SlidersHorizontal } from 'lucide-react'

import type { Trade } from '../types'

interface TradeTableProps {
  trades: Trade[]
  query: string
  onQueryChange: (value: string) => void
}

const numberFormatter = new Intl.NumberFormat('en-IN')
const priceFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
})

function formatTimestamp(timestamp: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp))
}

export function TradeTable({
  trades,
  query,
  onQueryChange,
}: TradeTableProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_14px_45px_rgba(27,39,73,0.06)]">
      <div className="flex flex-col justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:px-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="live-pulse" />
            <h2 className="section-title">Trade activity</h2>
          </div>
          <p className="mt-1 text-[13px] text-slate-500">
            Streaming executions from the BSE market feed
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="search-field">
            <Search size={16} />
            <input
              type="search"
              placeholder="Search symbol or client"
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              aria-label="Search trades"
            />
          </label>
          <button type="button" className="icon-button" aria-label="Filter trades">
            <SlidersHorizontal size={17} />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="trade-table">
          <thead>
            <tr>
              <th>Trade ID</th>
              <th>Client</th>
              <th>Symbol</th>
              <th className="text-right">Quantity</th>
              <th className="text-right">Price</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {trades.length > 0 ? (
              trades.map((trade) => (
                <tr key={trade.id}>
                  <td className="font-mono text-[12px] font-semibold text-slate-500">
                    {trade.id}
                  </td>
                  <td className="font-medium text-slate-800">{trade.client}</td>
                  <td>
                    <span className="symbol-badge">{trade.symbol}</span>
                  </td>
                  <td className="text-right font-mono text-[13px] text-slate-700">
                    {numberFormatter.format(trade.quantity)}
                  </td>
                  <td className="text-right font-mono text-[13px] font-semibold text-slate-900">
                    {priceFormatter.format(trade.price)}
                  </td>
                  <td className="whitespace-nowrap text-[13px] text-slate-500">
                    {formatTimestamp(trade.timestamp)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="empty-state">
                  No trades match “{query}”
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
