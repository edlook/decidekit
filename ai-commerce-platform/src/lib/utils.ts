import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { AnalyticsEvent, Session } from '@/types'

// ─── Classnames ──────────────────────────────────────────────────────────────

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ─── Price formatting ────────────────────────────────────────────────────────

export function formatPrice(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatPriceRange(min: number, max: number, currency = 'USD'): string {
  if (min === max) return formatPrice(min, currency)
  return `${formatPrice(min, currency)} – ${formatPrice(max, currency)}`
}

// ─── Session (anonymous) ─────────────────────────────────────────────────────

const SESSION_KEY = 'acdp_session'

export function getOrCreateSession(): Session {
  if (typeof window === 'undefined') {
    return { sessionId: 'ssr', createdAt: Date.now() }
  }

  const existing = sessionStorage.getItem(SESSION_KEY)
  if (existing) {
    try {
      return JSON.parse(existing) as Session
    } catch {
      // corrupted — fall through to create new
    }
  }

  const session: Session = {
    sessionId: crypto.randomUUID(),
    createdAt: Date.now(),
  }
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
  return session
}

export function updateSession(partial: Partial<Session>): Session {
  const session = { ...getOrCreateSession(), ...partial }
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
  }
  return session
}

// ─── Analytics stub (swap for PostHog in production) ────────────────────────

export function track(event: AnalyticsEvent, properties?: Record<string, unknown>) {
  if (process.env.NODE_ENV === 'development') {
    console.log('[analytics]', event, properties ?? '')
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ph = (window as any).posthog
    if (ph?.capture) {
      ph.capture(event, properties ?? {})
    }
  } catch {
    // Analytics must never crash the app
  }
}

// ─── Badge labels ────────────────────────────────────────────────────────────

export const BADGE_LABELS: Record<string, string> = {
  lower_price:     'Lower price',
  best_value:      'Best value',
  closest_style:   'Closest style',
  faster_ship:     'Ships faster',
  premium_upgrade: 'Premium pick',
}

export const BADGE_COLORS: Record<string, string> = {
  lower_price:     'text-teal border-teal/20 bg-teal/8',
  best_value:      'text-accent border-accent/20 bg-accent/8',
  closest_style:   'text-text-secondary border-border bg-bg-3',
  faster_ship:     'text-blue-400 border-blue-400/20 bg-blue-400/8',
  premium_upgrade: 'text-purple-400 border-purple-400/20 bg-purple-400/8',
}

// ─── Redirect URL builder ────────────────────────────────────────────────────

export function buildRedirectUrl(offerId: string, sessionId: string): string {
  return `/r/${offerId}?sid=${sessionId}`
}

// ─── Truncate text ───────────────────────────────────────────────────────────

export function truncate(str: string, n: number): string {
  return str.length > n ? str.slice(0, n - 1) + '…' : str
}
