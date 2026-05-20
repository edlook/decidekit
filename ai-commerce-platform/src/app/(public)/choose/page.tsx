'use client'

import { useState } from 'react'
import { Nav, PageShell, Container } from '@/components/layout/Nav'
import { useBattles } from '@/lib/hooks'
import { formatPrice, buildRedirectUrl, track } from '@/lib/utils'
import { AffiliateDisclosure } from '@/components/layout/Nav'

type Step = 'category' | 'setup' | 'battle' | 'result'

const CATEGORIES = ['Headphones', 'Laptops', 'Cameras', 'Keyboards', 'Monitors', 'Microphones', 'Running shoes', 'Backpacks']

export default function ChoosePage() {
  const { loading, error, currentPair, choices, isDone, startBattles, choose, skip, sessionId } = useBattles()
  const [step, setStep] = useState<Step>('category')
  const [category, setCategory] = useState('')
  const [budgetZone, setBudgetZone] = useState('mid')

  async function handleStart() {
    const data = await startBattles(category, { budget: budgetZone })
    if (data) setStep(data.isDone ? 'result' : 'battle')
  }

  async function handleChoice(side: 'left' | 'right') {
    if (!currentPair) return
    const winner = side === 'left' ? currentPair.left : currentPair.right
    const loser  = side === 'left' ? currentPair.right : currentPair.left
    const data = await choose(winner.id, loser.id, category)
    if (data?.isDone) setStep('result')
  }

  function BattleCard({ product, onChoose }: { product: any; onChoose: () => void }) {
    return (
      <button onClick={onChoose} style={{
        borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)',
        background: 'var(--bg-card)', padding: 20, cursor: 'pointer', textAlign: 'left', width: '100%',
        transition: 'border-color var(--transition), background var(--transition)',
      }}>
        <div style={{ width: '100%', paddingBottom: '60%', background: 'var(--bg-3)', borderRadius: 'var(--radius)', marginBottom: 14, position: 'relative', overflow: 'hidden' }}>
          {product.imageUrl
            ? <img src={product.imageUrl} alt={product.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }} />
            : <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'var(--text-tertiary)' }}>No image</span>
          }
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 3 }}>{product.brand}</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>{product.name}</div>
        {product.price && (
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 15, color: 'var(--accent)', marginBottom: 10 }}>
            {formatPrice(product.price, product.currency)}
          </div>
        )}
        {Object.entries(product.attributes ?? {}).slice(0, 3).map(([k, v]) => (
          <div key={k} style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 2 }}>· {v as string}</div>
        ))}
      </button>
    )
  }

  return (
    <>
      <Nav />
      <PageShell>
        <Container size="sm" style={{ paddingTop: 48, paddingBottom: 64 }}>

          {step === 'category' && (
            <div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', color: 'var(--text-primary)', marginBottom: 8 }}>What are you choosing between?</h1>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24 }}>Pick a category or type your own.</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
                {CATEGORIES.map(cat => (
                  <button key={cat} type="button" onClick={() => setCategory(cat)} style={{
                    borderRadius: 'var(--radius)', border: `1px solid ${category === cat ? 'var(--accent)' : 'var(--border)'}`,
                    background: category === cat ? 'var(--accent-dim)' : 'var(--bg-card)',
                    color: category === cat ? 'var(--accent)' : 'var(--text-secondary)',
                    padding: '11px 16px', fontSize: 13, cursor: 'pointer', textAlign: 'left', transition: 'all var(--transition)',
                  }}>{category === cat && '✓ '}{cat}</button>
                ))}
              </div>
              <input type="text" value={category} onChange={e => setCategory(e.target.value)}
                placeholder="Or type a category…"
                style={{ width: '100%', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '11px 14px', fontSize: 14, color: 'var(--text-primary)', outline: 'none', fontFamily: 'var(--font-body)', marginBottom: 24 }} />
              <button disabled={!category.trim()} onClick={() => setStep('setup')}
                style={{ background: 'var(--accent)', color: '#0a0a0b', border: 'none', borderRadius: 'var(--radius)', padding: '12px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer', opacity: category.trim() ? 1 : 0.4 }}>
                Continue →
              </button>
            </div>
          )}

          {step === 'setup' && (
            <div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', color: 'var(--text-primary)', marginBottom: 8 }}>Quick setup</h1>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24 }}>Category: <strong style={{ color: 'var(--text-primary)' }}>{category}</strong></p>
              <div style={{ marginBottom: 28 }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', display: 'block', marginBottom: 10 }}>Budget zone</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[['budget', 'Budget'], ['mid', 'Mid-range'], ['premium', 'Premium']].map(([id, lbl]) => (
                    <button key={id} type="button" onClick={() => setBudgetZone(id)} style={{
                      flex: 1, borderRadius: 'var(--radius)', border: `1px solid ${budgetZone === id ? 'var(--accent)' : 'var(--border)'}`,
                      background: budgetZone === id ? 'var(--accent-dim)' : 'var(--bg-card)',
                      color: budgetZone === id ? 'var(--accent)' : 'var(--text-secondary)',
                      padding: '10px 0', fontSize: 13, cursor: 'pointer', transition: 'all var(--transition)',
                    }}>{lbl}</button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => setStep('category')} style={{ border: '1px solid var(--border)', background: 'transparent', borderRadius: 'var(--radius)', padding: '10px 20px', fontSize: 14, color: 'var(--text-secondary)', cursor: 'pointer' }}>← Back</button>
                <button onClick={handleStart} disabled={loading} style={{ background: 'var(--accent)', color: '#0a0a0b', border: 'none', borderRadius: 'var(--radius)', padding: '10px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer', opacity: loading ? 0.5 : 1 }}>
                  {loading ? 'Loading…' : 'Start battles →'}
                </button>
              </div>
            </div>
          )}

          {step === 'battle' && currentPair && !isDone && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                <div style={{ flex: 1, height: 3, background: 'var(--bg-3)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: 'var(--accent)', width: `${(choices.length / 5) * 100}%`, transition: 'width 0.4s', borderRadius: 2 }} />
                </div>
                <span style={{ fontSize: 12, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>{choices.length + 1} / 5</span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-tertiary)', textAlign: 'center', marginBottom: 16 }}>Which would you choose?</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <BattleCard product={currentPair.left}  onChoose={() => handleChoice('left')} />
                <BattleCard product={currentPair.right} onChoose={() => handleChoice('right')} />
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16 }}>
                {['Skip', 'Neither', 'Depends'].map(a => (
                  <button key={a} type="button" onClick={skip}
                    style={{ border: '1px solid var(--border)', background: 'transparent', borderRadius: 999, padding: '6px 16px', fontSize: 12, color: 'var(--text-tertiary)', cursor: 'pointer' }}>
                    {a}
                  </button>
                ))}
              </div>
              {error && <p style={{ color: 'var(--red)', fontSize: 13, marginTop: 12, textAlign: 'center' }}>{error}</p>}
            </div>
          )}

          {(step === 'result' || isDone) && currentPair?.winner && (
            <div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', color: 'var(--text-primary)', marginBottom: 20 }}>
                {loading ? 'Computing winner…' : '🏆 Your best match'}
              </h1>
              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div className="skeleton" style={{ height: 200, borderRadius: 'var(--radius-lg)' }} />
                </div>
              ) : (
                <>
                  <div style={{ borderRadius: 'var(--radius-lg)', border: '1px solid var(--accent)', background: 'var(--accent-dim)', padding: 24, marginBottom: 16 }}>
                    <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Winner</div>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 4 }}>{currentPair.winner.brand}</div>
                    <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>{currentPair.winner.name}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>{currentPair.winnerReasoning}</div>
                    {currentPair.winner.price && currentPair.winner.offerId && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 600, color: 'var(--accent)' }}>
                          {formatPrice(currentPair.winner.price, currentPair.winner.currency)}
                        </span>
                        <a href={buildRedirectUrl(currentPair.winner.offerId, sessionId ?? 'anon')}
                          onClick={() => track('battles_offer_click', { offerId: currentPair.winner!.offerId })}
                          target="_blank" rel="noopener noreferrer"
                          style={{ borderRadius: 'var(--radius)', background: 'var(--accent)', color: '#0a0a0b', padding: '10px 20px', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
                          View best offer →
                        </a>
                      </div>
                    )}
                  </div>
                  {currentPair.alternatives && currentPair.alternatives.length > 0 && (
                    <div>
                      <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 10 }}>Also worth considering:</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {currentPair.alternatives.map((alt, i) => (
                          <div key={i} style={{ borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--bg-card)', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{alt.brand} </span>
                              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{alt.name}</span>
                            </div>
                            {alt.price && alt.offerId && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--accent)' }}>{formatPrice(alt.price, alt.currency)}</span>
                                <a href={buildRedirectUrl(alt.offerId, sessionId ?? 'anon')} target="_blank" rel="noopener noreferrer"
                                  style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none' }}>View →</a>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <AffiliateDisclosure style={{ marginTop: 20 }} />
                  <button onClick={() => { setStep('category'); setCategory('') }}
                    style={{ marginTop: 16, border: '1px solid var(--border)', background: 'transparent', borderRadius: 'var(--radius)', padding: '10px 20px', fontSize: 14, color: 'var(--text-secondary)', cursor: 'pointer', width: '100%' }}>
                    Start over
                  </button>
                </>
              )}
            </div>
          )}
        </Container>
      </PageShell>
    </>
  )
}
