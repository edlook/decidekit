'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Nav, PageShell, Container, AffiliateDisclosure } from '@/components/layout/Nav'
import { useBuilder } from '@/lib/hooks'
import { formatPrice, buildRedirectUrl, track } from '@/lib/utils'

type Step = 'intent' | 'clarify' | 'priorities' | 'results'
type Variant = 'budget' | 'balanced' | 'premium'

const PRIORITY_OPTIONS = [
  { id: 'price',    label: 'Best price' },
  { id: 'quality',  label: 'Best quality' },
  { id: 'minimal',  label: 'Minimal / clean look' },
  { id: 'value',    label: 'Best value for money' },
  { id: 'shipping', label: 'Fast shipping' },
  { id: 'premium',  label: 'Premium feel' },
]

function BuilderInner() {
  const params = useSearchParams()
  const { loading, error, result, parseIntent, generateResult, sessionId } = useBuilder()

  const [step, setStep]         = useState<Step>(params.get('q') ? 'clarify' : 'intent')
  const [intent, setIntent]     = useState(params.get('q') ?? '')
  const [budget, setBudget]     = useState(500)
  const [geo, setGeo]           = useState('US')
  const [priorities, setPrio]   = useState<string[]>([])
  const [variant, setVariant]   = useState<Variant>('balanced')

  async function handleIntent(e: React.FormEvent) {
    e.preventDefault()
    if (!intent.trim()) return
    const data = await parseIntent(intent, geo)
    if (data) setStep('clarify')
  }

  async function handleGenerate() {
    const data = await generateResult({ clarifications: { country: geo }, budget, priorities })
    if (data) setStep('results')
  }

  function togglePrio(id: string) {
    setPrio(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id].slice(0, 3))
  }

  const variantData = result?.variants[variant]
  const steps: Step[] = ['intent', 'clarify', 'priorities', 'results']

  return (
    <>
      <Nav />
      <PageShell>
        <Container size="sm" style={{ paddingTop: 48, paddingBottom: 64 }}>

          {/* Step dots */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 36 }}>
            {steps.map((s, i) => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', flex: i < 3 ? 1 : undefined }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600,
                  background: s === step ? 'var(--accent)' : 'var(--bg-3)',
                  color: s === step ? '#0a0a0b' : 'var(--text-tertiary)',
                  border: `1px solid ${s === step ? 'var(--accent)' : 'var(--border)'}`,
                }}>
                  {i + 1}
                </div>
                {i < 3 && <div style={{ flex: 1, height: 1, background: 'var(--border)', margin: '0 4px' }} />}
              </div>
            ))}
          </div>

          {/* INTENT */}
          {step === 'intent' && (
            <form onSubmit={handleIntent}>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', color: 'var(--text-primary)', marginBottom: 8 }}>
                What do you need a setup for?
              </h1>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24 }}>
                Describe your goal — we handle the rest.
              </p>
              <textarea autoFocus value={intent} onChange={e => setIntent(e.target.value)}
                placeholder="e.g. Home recording studio for podcasting under $600"
                rows={3} style={{ width: '100%', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '12px 14px', fontSize: 14, color: 'var(--text-primary)', resize: 'vertical', outline: 'none', fontFamily: 'inherit', lineHeight: 1.6 }} />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, margin: '10px 0 24px' }}>
                {['Gaming PC under $800', 'Travel photography kit', 'Minimalist home office'].map(ex => (
                  <button key={ex} type="button" onClick={() => setIntent(ex)}
                    style={{ borderRadius: 999, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-tertiary)', padding: '4px 12px', fontSize: 12, cursor: 'pointer' }}>
                    {ex}
                  </button>
                ))}
              </div>
              {error && <p style={{ color: 'var(--red)', fontSize: 13, marginBottom: 12 }}>{error}</p>}
              <button type="submit" disabled={!intent.trim() || loading}
                style={{ background: 'var(--accent)', color: '#0a0a0b', border: 'none', borderRadius: 'var(--radius)', padding: '12px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer', opacity: (!intent.trim() || loading) ? 0.4 : 1 }}>
                {loading ? 'Parsing…' : 'Continue →'}
              </button>
            </form>
          )}

          {/* CLARIFY */}
          {step === 'clarify' && (
            <div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', color: 'var(--text-primary)', marginBottom: 12 }}>Quick questions</h1>
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '10px 14px', marginBottom: 24, fontSize: 13, color: 'var(--text-secondary)' }}>
                <span style={{ color: 'var(--text-tertiary)' }}>Request: </span>{intent}
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  Budget <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>${budget.toLocaleString()}</span>
                </label>
                <input type="range" min={50} max={5000} step={50} value={budget} onChange={e => setBudget(+e.target.value)} style={{ width: '100%', accentColor: 'var(--accent)' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>
                  <span>$50</span><span>$5,000</span>
                </div>
              </div>
              <div style={{ marginBottom: 28 }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', display: 'block', marginBottom: 10 }}>Country</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {['US', 'UK', 'DE', 'FR', 'AU', 'CA'].map(c => (
                    <button key={c} type="button" onClick={() => setGeo(c)} style={{
                      borderRadius: 999, border: `1px solid ${geo === c ? 'var(--accent)' : 'var(--border)'}`,
                      background: geo === c ? 'var(--accent-dim)' : 'var(--bg-card)',
                      color: geo === c ? 'var(--accent)' : 'var(--text-secondary)',
                      padding: '6px 16px', fontSize: 13, cursor: 'pointer',
                    }}>{c}</button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => setStep('intent')} style={{ border: '1px solid var(--border)', background: 'transparent', borderRadius: 'var(--radius)', padding: '10px 20px', fontSize: 14, color: 'var(--text-secondary)', cursor: 'pointer' }}>← Back</button>
                <button onClick={() => setStep('priorities')} style={{ background: 'var(--accent)', color: '#0a0a0b', border: 'none', borderRadius: 'var(--radius)', padding: '10px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Continue →</button>
              </div>
            </div>
          )}

          {/* PRIORITIES */}
          {step === 'priorities' && (
            <div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', color: 'var(--text-primary)', marginBottom: 8 }}>What matters most?</h1>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24 }}>Pick up to 3 priorities.</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 32 }}>
                {PRIORITY_OPTIONS.map(({ id, label }) => {
                  const sel = priorities.includes(id)
                  return (
                    <button key={id} type="button" onClick={() => togglePrio(id)} style={{
                      borderRadius: 'var(--radius)', border: `1px solid ${sel ? 'var(--accent)' : 'var(--border)'}`,
                      background: sel ? 'var(--accent-dim)' : 'var(--bg-card)',
                      color: sel ? 'var(--accent)' : 'var(--text-secondary)',
                      padding: '12px 16px', fontSize: 13, cursor: 'pointer', textAlign: 'left',
                    }}>{sel && '✓ '}{label}</button>
                  )
                })}
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => setStep('clarify')} style={{ border: '1px solid var(--border)', background: 'transparent', borderRadius: 'var(--radius)', padding: '10px 20px', fontSize: 14, color: 'var(--text-secondary)', cursor: 'pointer' }}>← Back</button>
                <button onClick={handleGenerate} disabled={loading} style={{ background: 'var(--accent)', color: '#0a0a0b', border: 'none', borderRadius: 'var(--radius)', padding: '10px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer', opacity: loading ? 0.6 : 1 }}>
                  {loading ? 'Generating…' : 'Get recommendations →'}
                </button>
              </div>
              {error && <p style={{ color: 'var(--red)', fontSize: 13, marginTop: 12 }}>{error}</p>}
            </div>
          )}

          {/* RESULTS */}
          {step === 'results' && (
            <div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', color: 'var(--text-primary)', marginBottom: 4 }}>
                {loading ? 'Building your kit…' : 'Your recommendations'}
              </h1>
              {result?.summary && <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>{result.summary}</p>}

              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
                  {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 88, borderRadius: 'var(--radius-lg)' }} />)}
                  <p style={{ fontSize: 13, color: 'var(--text-tertiary)', textAlign: 'center' }}>Matching products…</p>
                </div>
              ) : result ? (
                <>
                  {/* Variant tabs */}
                  <div style={{ display: 'flex', gap: 2, background: 'var(--bg-3)', borderRadius: 'var(--radius)', padding: 3, marginBottom: 20, width: 'fit-content' }}>
                    {(['budget', 'balanced', 'premium'] as Variant[]).map(v => (
                      <button key={v} onClick={() => setVariant(v)} style={{
                        borderRadius: 7, padding: '6px 16px', fontSize: 13, border: 'none', cursor: 'pointer', textTransform: 'capitalize',
                        background: variant === v ? 'var(--bg-card)' : 'transparent',
                        color: variant === v ? 'var(--text-primary)' : 'var(--text-tertiary)',
                        fontWeight: variant === v ? 500 : 400,
                      }}>{v}</button>
                    ))}
                  </div>

                  {variantData && (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{variantData.items.length} items</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 600, color: 'var(--accent)' }}>
                          {variantData.totalPrice > 0 ? formatPrice(variantData.totalPrice) : '—'}
                        </span>
                      </div>

                      {!variantData.items.length && (
                        <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13, border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
                          No products found for this variant. Try a different budget or category.
                        </div>
                      )}

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                        {variantData.items.map((item, i) => (
                          <div key={i} style={{ borderRadius: 'var(--radius-lg)', border: `1px solid ${item.isLowConfidence ? 'rgba(212,168,67,0.25)' : 'var(--border)'}`, background: 'var(--bg-card)', padding: 18 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{item.role}</div>
                                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>
                                  {item.product ? `${item.product.brand} ${item.product.name}` : '—'}
                                </div>
                                {item.merchant && <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 3 }}>{item.merchant.name}</div>}
                                {item.isLowConfidence && <span style={{ fontSize: 10, color: 'var(--accent)' }}>⚠ approximate match</span>}
                              </div>
                              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                {item.offer ? (
                                  <>
                                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 600, color: 'var(--accent)' }}>
                                      {formatPrice(item.offer.price, item.offer.currency)}
                                    </div>
                                    <a href={buildRedirectUrl(item.offer.id, sessionId ?? 'anon')}
                                      onClick={() => track('builder_offer_click', { offerId: item.offer!.id, variant })}
                                      target="_blank" rel="noopener noreferrer"
                                      style={{ display: 'inline-block', marginTop: 8, borderRadius: 'var(--radius)', background: 'var(--accent)', color: '#0a0a0b', padding: '6px 14px', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
                                      View offer →
                                    </a>
                                  </>
                                ) : <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>No offer</span>}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {result.tradeoffs?.length > 0 && (
                        <div style={{ borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--bg-3)', padding: '14px 16px', marginBottom: 16 }}>
                          <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 8 }}>Key trade-offs</div>
                          {result.tradeoffs.map((t, i) => <p key={i} style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>· {t}</p>)}
                        </div>
                      )}

                      <AffiliateDisclosure />
                    </>
                  )}
                </>
              ) : (
                <p style={{ color: 'var(--red)', fontSize: 14 }}>{error ?? 'Could not generate recommendations.'}</p>
              )}

              <button onClick={() => { setStep('intent'); setIntent('') }}
                style={{ marginTop: 20, border: '1px solid var(--border)', background: 'transparent', borderRadius: 'var(--radius)', padding: '10px 20px', fontSize: 14, color: 'var(--text-secondary)', cursor: 'pointer' }}>
                ← Start over
              </button>
            </div>
          )}
        </Container>
      </PageShell>
    </>
  )
}

export default function BuildPage() {
  return <Suspense><BuilderInner /></Suspense>
}
