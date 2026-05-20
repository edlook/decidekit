'use client'

import { useState, useEffect } from 'react'
import { adminApi } from '@/lib/api'

interface Merchant {
  merchantId: string; merchantName: string; network: string
  qualityScore: number; totalOffers: number; activeOffers: number
  staleOffers: number; avgConfidence: number; clickCount7d: number; isApproved: boolean
}

function QualityBar({ score }: { score: number }) {
  const pct = (score / 10) * 100
  const color = score >= 8 ? 'var(--teal)' : score >= 6 ? 'var(--accent)' : 'var(--red)'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ width: 80, height: 4, background: 'var(--bg-3)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2, transition: 'width 0.5s' }} />
      </div>
      <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color }}>{score.toFixed(1)}</span>
    </div>
  )
}

export default function MerchantsPage() {
  const [merchants, setMerchants] = useState<Merchant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<string | null>(null)
  const [editScore, setEditScore] = useState(5)

  useEffect(() => {
    adminApi.getMerchants()
      .then(res => setMerchants(res.data ?? res))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  async function handleSave(merchantId: string, isApproved: boolean) {
    try {
      await adminApi.updateMerchant(merchantId, editScore, isApproved)
      setMerchants(prev => prev.map(m =>
        m.merchantId === merchantId
          ? { ...m, qualityScore: editScore, isApproved }
          : m,
      ))
      setEditing(null)
    } catch (e: any) { alert(e.message) }
  }

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', color: 'var(--text-primary)', marginBottom: 28 }}>
        Merchant quality
      </h1>

      {error && <div style={{ color: 'var(--red)', fontSize: 14, marginBottom: 16 }}>Error: {error}</div>}

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ height: 72, borderRadius: 'var(--radius)' }} />)}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {/* Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px 80px 80px 100px 120px', gap: 12, padding: '8px 16px', fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            <span>Merchant</span><span>Network</span><span>Offers</span><span>Active</span><span>Stale</span><span>Clicks 7d</span><span>Quality</span><span></span>
          </div>

          {merchants.map(m => (
            <div key={m.merchantId} style={{
              borderRadius: 'var(--radius)', border: '1px solid var(--border)',
              background: 'var(--bg-card)', padding: '12px 16px',
            }}>
              {editing === m.merchantId ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <span style={{ fontSize: 13, color: 'var(--text-primary)', flex: 1 }}>{m.merchantName}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Quality score:</label>
                    <input type="range" min={0} max={10} step={0.5} value={editScore}
                      onChange={e => setEditScore(+e.target.value)}
                      style={{ width: 100, accentColor: 'var(--accent)' }} />
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--accent)', minWidth: 28 }}>{editScore}</span>
                  </div>
                  <button onClick={() => handleSave(m.merchantId, true)} style={{ borderRadius: 'var(--radius)', border: 'none', background: 'var(--accent)', color: '#0a0a0b', padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Save</button>
                  <button onClick={() => setEditing(null)} style={{ borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', padding: '6px 14px', fontSize: 12, cursor: 'pointer' }}>Cancel</button>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px 80px 80px 100px 120px', gap: 12, alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{m.merchantName}</div>
                    {m.isApproved
                      ? <span style={{ fontSize: 10, color: 'var(--teal)' }}>✓ Approved</span>
                      : <span style={{ fontSize: 10, color: 'var(--red)' }}>⚠ Not approved</span>
                    }
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{m.network}</span>
                  <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{m.totalOffers}</span>
                  <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--teal)' }}>{m.activeOffers}</span>
                  <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: m.staleOffers > 10 ? 'var(--accent)' : 'var(--text-secondary)' }}>{m.staleOffers}</span>
                  <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{m.clickCount7d}</span>
                  <QualityBar score={m.qualityScore} />
                  <button onClick={() => { setEditing(m.merchantId); setEditScore(m.qualityScore) }}
                    style={{ borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--bg-3)', color: 'var(--text-secondary)', padding: '5px 12px', fontSize: 12, cursor: 'pointer' }}>
                    Edit
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
