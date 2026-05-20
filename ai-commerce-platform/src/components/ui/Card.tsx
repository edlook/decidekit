import { cn } from '@/lib/utils'

// ─── Card ────────────────────────────────────────────────────────────────────

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean
  active?: boolean
}

export function Card({ hover = false, active = false, className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-card)] p-5',
        hover && 'transition-all duration-[var(--transition)] hover:border-[var(--border-hover)] cursor-pointer',
        active && 'border-[var(--accent)] bg-[var(--accent-dim)]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

// ─── Badge ───────────────────────────────────────────────────────────────────

interface BadgeProps {
  label: string
  color?: 'accent' | 'teal' | 'red' | 'muted'
  className?: string
}

export function Badge({ label, color = 'muted', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
        color === 'accent' && 'border-[var(--accent)]/20 bg-[var(--accent-dim)] text-[var(--accent)]',
        color === 'teal'   && 'border-[var(--teal)]/20 bg-[var(--teal-dim)] text-[var(--teal)]',
        color === 'red'    && 'border-[var(--red)]/20 bg-[var(--red-dim)] text-[var(--red)]',
        color === 'muted'  && 'border-[var(--border)] bg-[var(--bg-3)] text-[var(--text-secondary)]',
        className
      )}
    >
      {label}
    </span>
  )
}

// ─── Chip (selectable) ───────────────────────────────────────────────────────

interface ChipProps {
  label: string
  selected?: boolean
  onClick?: () => void
  className?: string
}

export function Chip({ label, selected = false, onClick, className }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center rounded-full border px-3 py-1.5 text-sm transition-all duration-[var(--transition)]',
        selected
          ? 'border-[var(--accent)] bg-[var(--accent-dim)] text-[var(--accent)]'
          : 'border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:border-[var(--border-hover)] hover:text-[var(--text-primary)]',
        className
      )}
    >
      {label}
    </button>
  )
}

// ─── Divider ─────────────────────────────────────────────────────────────────

export function Divider({ className }: { className?: string }) {
  return <hr className={cn('border-t border-[var(--border)]', className)} />
}

// ─── Progress bar ────────────────────────────────────────────────────────────

interface ProgressProps {
  current: number
  total: number
  className?: string
}

export function ProgressBar({ current, total, className }: ProgressProps) {
  const pct = Math.round((current / total) * 100)
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="flex-1 h-1 rounded-full bg-[var(--bg-3)] overflow-hidden">
        <div
          className="h-full bg-[var(--accent)] rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-[var(--text-tertiary)] tabular-nums">
        {current} / {total}
      </span>
    </div>
  )
}

// ─── Confidence indicator ────────────────────────────────────────────────────

interface ConfidenceProps {
  score: number   // 0–1
  className?: string
}

export function ConfidenceBadge({ score, className }: ConfidenceProps) {
  const pct = Math.round(score * 100)
  const color = score > 0.75 ? 'teal' : score > 0.5 ? 'accent' : 'red'
  return (
    <Badge
      label={`${pct}% match`}
      color={color}
      className={className}
    />
  )
}

// ─── Stale price warning ─────────────────────────────────────────────────────

export function StalePriceWarning() {
  return (
    <div className="flex items-center gap-2 rounded-[var(--radius)] border border-[var(--accent)]/15 bg-[var(--accent-dim)] px-3 py-2">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <span className="text-xs text-[var(--accent)]">Price may have changed — check merchant site</span>
    </div>
  )
}
