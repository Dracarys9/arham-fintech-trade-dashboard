import { Activity, ArrowUpRight, Radio, Zap } from 'lucide-react'

interface HeaderProps {
  isConnected: boolean
  isPulling: boolean
  progress: number
  onTriggerPull: () => void
}

function StatusPill({
  color,
  icon,
  children,
}: {
  color: 'green' | 'blue' | 'slate'
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <span className={`status-pill status-${color}`}>
      {icon}
      {children}
    </span>
  )
}

export function Header({
  isConnected,
  isPulling,
  progress,
  onTriggerPull,
}: HeaderProps) {
  return (
    <header className="relative z-10 border-b border-slate-200/80 bg-white/80 px-5 py-4 backdrop-blur-xl sm:px-8">
      <div className="mx-auto flex max-w-[1480px] items-center justify-between gap-5">
        <div className="flex items-center gap-3">
          <div className="brand-mark">
            <Activity size={19} strokeWidth={2.5} />
          </div>
          <div>
            <p className="eyebrow">Arham Fintech</p>
            <h1 className="text-[17px] font-bold tracking-[-0.02em] text-slate-950">
              BSE Trade Monitor
            </h1>
          </div>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <StatusPill
            color={isConnected ? 'green' : 'slate'}
            icon={<Radio size={13} />}
          >
            {isConnected ? 'Connected' : 'Reconnecting'}
          </StatusPill>
          {isPulling ? (
            <StatusPill color="blue" icon={<Zap size={13} />}>
              Pull in Progress · {progress}%
            </StatusPill>
          ) : (
            <StatusPill color="slate" icon={<span className="status-dot" />}>
              Idle
            </StatusPill>
          )}
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={onTriggerPull}
          disabled={isPulling}
        >
          <ArrowUpRight size={16} strokeWidth={2.5} />
          {isPulling ? 'Pulling…' : 'Trigger Pull'}
        </button>
      </div>
    </header>
  )
}
