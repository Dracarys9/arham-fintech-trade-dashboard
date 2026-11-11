import { ArrowDownToLine, BarChart3, Clock3 } from 'lucide-react'

interface MetricsCardsProps {
  totalTrades: number
  totalVolume: number
  lastUpdated: string | null
}

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

const numberFormatter = new Intl.NumberFormat('en-IN')

function formatUpdated(value: string | null): string {
  if (!value) return 'Waiting for first sync'

  return new Intl.DateTimeFormat('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(value))
}

export function MetricsCards({
  totalTrades,
  totalVolume,
  lastUpdated,
}: MetricsCardsProps) {
  const cards = [
    {
      label: 'Total trades',
      value: numberFormatter.format(totalTrades),
      detail: 'Across active feed',
      icon: BarChart3,
      tone: 'violet',
    },
    {
      label: 'Total volume',
      value: currencyFormatter.format(totalVolume),
      detail: 'Notional traded value',
      icon: ArrowDownToLine,
      tone: 'mint',
    },
    {
      label: 'Last updated',
      value: formatUpdated(lastUpdated),
      detail: 'Live stream timestamp',
      icon: Clock3,
      tone: 'amber',
    },
  ]

  return (
    <section className="grid gap-4 md:grid-cols-3">
      {cards.map(({ label, value, detail, icon: Icon, tone }) => (
        <article className="metric-card" key={label}>
          <div className={`metric-icon metric-${tone}`}>
            <Icon size={18} />
          </div>
          <div className="min-w-0">
            <p className="metric-label">{label}</p>
            <p className="metric-value truncate">{value}</p>
            <p className="metric-detail">{detail}</p>
          </div>
        </article>
      ))}
    </section>
  )
}
