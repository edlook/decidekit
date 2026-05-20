'use client'

import { useState } from 'react'
import { Nav, PageShell, Container } from '@/components/layout/Nav'
import { useDupe } from '@/lib/hooks'
import { formatPrice, buildRedirectUrl, track } from '@/lib/utils'
import { AffiliateDisclosure } from '@/components/layout/Nav'

type Step = 'input' | 'goal' | 'results'

const GOALS = [
  { id: 'cheaper',       label: 'Cheaper version',   hint: 'Same vibe, lower price' },
  { id: 'better',        label: 'Better quality',     hint: 'Step up from what you have' },
  { id: 'same_style',    label: 'Same style',         hint: 'Similar look or aesthetic' },
  { id: 'same_function', label: 'Same function',      hint: 'Does the same job' },
  { id: 'premium',       label: 'Premium upgrade',    hint: 'Best-in-class alternative' },
  { id: 'faster',        label: 'Faster delivery',    hint: 'Available sooner' },
]

const BADGE_COLORS: Record<string, string> = {
  lower_price:     'var(--teal)',
  best_value:      'var(--accent)',
  closest_style:   'var(--text-secondary)',
  same_function:   'var(--text-secondary)',
  premium_upgrade: '#a78bfa',
  faster_ship:     '#60a5fa',
}

export default function ReplacePage() {
  const { loading, error, recognized, alternatives, recognize, getAlternatives, sessionId } = useDupe()
  const [step, setStep] = useState<Step>('input')
  const [input, setInput] = useState('')
  const [goal, setGoal] = useState('')

  async function handleInputSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim()) return
    const data = await recognize(input)
    if (data?.recognized) setStep('goal')
  }

  async function handleGoalSubmit() {
    if (!goal) return
    const data = await getAlternatives(goal)
    if (data) setStep('results')
  }

  return (
    <>
      <Nav />
      <PageShell>
        <Container size="sm" style={{ paddingTop: 48, paddingBottom: 64 }}>

          {step === 'input' && (
            <form onSubmit={handleInputSubmit}>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', color: 'var(--text-primary)', marginBottom: 8 }}>
                What would you like to replace?
              </h1>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24 }}>
                Paste a product URL or describe it by name / model.
              </p>
              <input autoFocus type="text" value={input} onChange={e => setInput(e.target.value)}
                placeholder="e.g. Sony WH-1000XM5 or https://amazon.com/..."
                style={{ width: '100%', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '12px 14px', fontSize: 14, color: 'var(--text-primary)', outline: 'none', fontFamily: 'var(--font-body)' }} />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, margin: '10px 0 24px' }}>
                {['Sony WH-1000XM5', 'Dyson V15', 'Herman Miller Aeron'].map(ex => (
                  <button key={ex} type="button" onClick={() => setInput(ex)}
                    style={{ borderRadius: 999, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-tertiary)', padding: '4px 12px', fontSize: 12, cursor: 'pointer' }}>
                    {ex}
                  </button>
                ))}
              </div>
              {error && <p style={{ color: 'var(--red)', fontSize: 13, marginBottom: 12 }}>{error}</p>}
              <button type="submit" disabled={!input.trim() || loading}
                style={{ background: 'var(--accent)', color: '#0a0a0b', border: 'none', borderRadius: 'var(--radius)', padding: '12px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer', opacity: (!input.trim() || loading) ? 0.4 : 1 }}>
                {loading ? 'Identifying…' : 'Continue →'}
              </button>
            </form>
          )}

          {step === 'goal' && recognized && (
            <div>
              {recognized.item && (
                <div style={{ borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--bg-card)', padding: '12px 16px', marginBottom: 28, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--bg-3)', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>
                      {recognized.item.brand} {recognized.item.name}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--teal)', marginTop: 2 }}>
                      ✓ Identified · {Math.round((recognized.item.confidence ?? 0) * 100)}% confidence
                    </div>
                  </div>
                </div>
              )}
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--text-primary)', marginBottom: 8 }}>
                What are you looking for?
              </h2>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20 }}>Pick the type of alternative.</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 28 }}>
                {GOALS.map(({ id, label, hint }) => (
                  <button key={id} type="button" onClick={() => setGoal(id)} style={{
                    borderRadius: 'var(--radius)', border: `1px solid ${goal === id ? 'var(--accent)' : 'var(--border)'}`,
                    background: goal === id ? 'var(--accent-dim)' : 'var(--bg-card)',
                    color: goal === id ? 'var(--accent)' : 'var(--text-secondary)',
                    padding: '14px 16px', fontSize: 13, cursor: 'pointer', textAlign: 'left', transition: 'all var(--transition)',
                  }}>
                    <div style={{ fontWeight: 500, marginBottom: 3 }}>{label}</div>
                    <div style={{ fontSize: 11, opacity: 0.7 }}>{hint}</div>
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => { setStep('input'); setGoal('') }}
                  style={{ border: '1px solid var(--border)', background: 'transparent', borderRadius: 'var(--radius)', padding: '10px 20px', fontSize: 14, color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  ← Back
                </button>
                <button onClick={handleGoalSubmit} disabled={!goal || loading}
                  style={{ background: 'var(--accent)', color: '#0a0a0b', border: 'none', borderRadius: 'var(--radius)', padding: '10px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer', opacity: (!goal || loading) ? 0.4 : 1 }}>
                  {loading ? 'Finding…' : 'Find alternatives →'}
                </button>
              </div>
            </div>
          )}

          {step === 'results' && (
            <div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', color: 'var(--text-primary)', marginBottom: 4 }}>
                {loading ? 'Finding alternatives…' : 'Alternatives'}
              </h1>

              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 20 }}>
                  {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 88, borderRadius: 'var(--radius-lg)' }} />)}
                </div>
              ) : alternatives && alternatives.alternatives.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 20 }}>
                  {alternatives.alternatives.map((alt, i) => {
                    const color = BADGE_COLORS[alt.badge] ?? 'var(--text-secondary)'
                    return (
                      <div key={i} style={{ borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', background: 'var(--bg-card)', padding: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                        <div style={{ flex: 1 }}>
                          <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color, border: `1px solid ${color}33`, background: `${color}12`, borderRadius: 999, padding: '2px 10px', display: 'inline-block', marginBottom: 8 }}>
                            {alt.badge.replace(/_/g, ' ')}
                          </span>
                          <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>
                            {alt.product ? `${alt.product.brand} ${alt.product.name}` : alt.searchQuery}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>{alt.reason}</div>
                          {alt.merchant && <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 3 }}>{alt.merchant.name}</div>}
                          {alt.isLowConfidence && <div style={{ fontSize: 11, color: 'var(--accent)', marginTop: 4 }}>⚠ approximate match</div>}
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          {alt.offer && (
                            <>
                              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 600, color: 'var(--accent)' }}>
                                {formatPrice(alt.offer.price, alt.offer.currency)}
                              </div>
                              <a href={buildRedirectUrl(alt.offer.id, sessionId ?? 'anon')}
                                onClick={() => track('dupe_offer_click', { offerId: alt.offer!.id })}
                                target="_blank" rel="noopener noreferrer"
                                style={{ display: 'inline-block', marginTop: 8, borderRadius: 'var(--radius)', background: 'var(--accent)', color: '#0a0a0b', padding: '6px 14px', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
                                View →
                              </a>
                            </>
                          )}
                        </div>
                      </div>
                    )
                  })}
                  <AffiliateDisclosure style={{ marginTop: 8 }} />
                </div>
              ) : (
                <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 20 }}>
                  {error ?? 'No alternatives found. Try a different product or goal.'}
                </p>
              )}

              <button onClick={() => { setStep('input'); setGoal('') }}
                style={{ marginTop: 24, border: '1px solid var(--border)', background: 'transparent', borderRadius: 'var(--radius)', padding: '10px 20px', fontSize: 14, color: 'var(--text-secondary)', cursor: 'pointer' }}>
                ← Start over
              </button>
            </div>
          )}
        </Container>
      </PageShell>
    </>
  )
}
