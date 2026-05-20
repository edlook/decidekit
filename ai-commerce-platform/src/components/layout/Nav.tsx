import Link from 'next/link'
import { cn } from '@/lib/utils'

interface NavProps { className?: string }

export function Nav({ className }: NavProps) {
  return (
    <header className={cn(
      'fixed top-0 left-0 right-0 z-50 flex h-14 items-center justify-between px-4 md:px-6',
      'border-b border-[var(--border)] bg-[var(--bg)]/80 backdrop-blur-md',
      className
    )}>
      <Link href="/" className="flex items-center gap-2 text-[var(--text-primary)] hover:opacity-80 transition-opacity">
        <span className="text-lg font-semibold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
          DecideKit
        </span>
        <span className="hidden sm:block rounded-full border border-[var(--accent)]/30 bg-[var(--accent-dim)] px-2 py-0.5 text-[10px] font-medium text-[var(--accent)] uppercase tracking-wider">
          Beta
        </span>
      </Link>
      <nav className="flex items-center gap-1">
        <Link href="/how-it-works" className="rounded-[var(--radius)] px-3 py-1.5 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-3)] hover:text-[var(--text-primary)]">
          How it works
        </Link>
        <Link href="/start" className="ml-2 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-card)] px-3 py-1.5 text-sm text-[var(--text-primary)] transition-all hover:border-[var(--border-hover)] hover:bg-[var(--bg-3)]">
          Get started
        </Link>
      </nav>
    </header>
  )
}

export function AffiliateDisclosure({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <p style={style} className={cn('text-xs text-[var(--text-tertiary)] leading-relaxed', className)}>
      Some links on this page are affiliate links. If you click and buy, we may earn a commission
      at no extra cost to you. This never influences our rankings — recommendations are based on
      relevance and quality.{' '}
      <Link href="/disclosure" className="underline hover:text-[var(--text-secondary)]">
        Learn more
      </Link>
    </p>
  )
}

export function PageShell({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <main className={cn('min-h-screen pt-14', className)}>
      {children}
    </main>
  )
}

export function Container({
  children, size = 'md', className, style,
}: {
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <div
      style={style}
      className={cn(
        'mx-auto w-full px-4 md:px-6',
        size === 'sm' && 'max-w-xl',
        size === 'md' && 'max-w-2xl',
        size === 'lg' && 'max-w-4xl',
        size === 'xl' && 'max-w-6xl',
        className
      )}
    >
      {children}
    </div>
  )
}
