'use client'

import { useState, useEffect, useCallback } from 'react'
import { adminApi } from '@/lib/api'

type Filter = 'all' | 'stale' | 'low_confidence' | 'out_of_stock'

interface Offer {
  offerId: string; productName: string; brand: string; merchantName: string
  price: number; currency: string; availability: string
  confidenceScore: number; isPriceStale: boolean; priceLastCheckedAt: string | null
  flags: string[]
}

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all',            label: 'All' },
  { id: 'stale',          label: 'Stale prices' },
  { id: 'low_confidence', label: 'Low confidence' },
  { id: 'out_of_stock',   label: 'Out of stock' },
]

function Flag({ label }: { label: string }) {
  const colors: Record<string, string> = {
    stale_price:      'var(--accent)',
    low_confidence:   'var(--red)',
    out_of_stock:     'var(--text-tertiary)',
    no_image:         'var(--text-tertiary)',
    missing_deeplink: 'var(--red)',
  }
  return (
    <span style={{
      fontSize: 10, fontWeight: 600, borderRadius: 999, padding: '2px 8px',
      border: `1px solid ${colors[label] ?? 'var(--border)'}33`,
      background: `${colors[label] ?? 'var(--border)'}18`,
      color: colors[label] ?? 'var(--text-tertiary)',
    }}>
      {label.replace(/_/g, ' ')}
    </span>
  )
}

export default function OffersPage() {
  const [filter, setFilter] = useState<Filter>('all')
  const [offers, setOffers] = useState<Offer[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionId, setActionId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await adminApi.getOffers(filter, page, 50)
      setOffers(res.items ?? [])
      setTotal(res.total ?? 0)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [filter, page])

  useEffect(() => { load() }, [load])

  async function handleDeactivate(id: string) {
    setActionId(id)
    try {
      await adminApi.deactivateOffer(id)
      setOffers(prev => prev.filter(o => o.offerId !== id))
      setTotal(prev => prev - 1)
    } catch (e: any) { alert(e.message) }
    finally { setActionId(null) }
  }

  async function handleApprove(id: string) {
    setActionId(id)
    try {
      await adminApi.approveOffer(id)
      setOffers(prev => prev.map(o => o.offerId === id ? { ...o, flags: [], isPriceStale: false, confidenceScore: 1.0 } : o))
    } catch (e: any) { alert(e.message) }
    finally { setActionId(null) }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', color: 'var(--text-primary)' }}>
          Offer moderation
        </h1>
        <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>{total} offers</span>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'var(--bg-3)', borderRadius: 'var(--radius)', padding: 4, width: 'fit-content' }}>
        {FILTERS.map(f => (
          <button key={f.id} onClick={() => { setFilter(f.id); setPage(1) }} style={{
            borderRadius: 7, border: 'none', padding: '6px 14px', fontSize: 13, cursor: 'pointer',
            background: filter === f.id ? 'var(--bg-card)' : 'transparent',
            color: filter === f.id ? 'var(--text-primary)' : 'var(--text-tertiary)',
            fontWeight: filter === f.id ? 500 : 400,
          }}>
            {f.label}
          </button>
        ))}
      </div>

      {error && <div style={{ color: 'var(--red)', fontSize: 14, marginBottom: 16 }}>Error: {error} — is the API running?</div>}

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[...Array(8)].map((_, i) => <div key={i} className="skeleton" style={{ height: 64, borderRadius: 'var(--radius)' }} />)}
        </div>
      ) : offers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-tertiary)', fontSize: 14 }}>
          No offers for this filter
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {offers.map(offer => (
            <div key={offer.offerId} style={{
              borderRadius: 'var(--radius)', border: '1px solid var(--border)',
              background: 'var(--bg-card)', padding: '12px 16px',
              display: 'flex', alignItems: 'center', gap: 16,
            }}>
              {/* Product info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {offer.brand} {offer.productName}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>
                  {offer.merchantName} · {offer.availability}
                  {offer.priceLastCheckedAt && ` · checked ${new Date(offer.priceLastCheckedAt).toLocaleDateString()}`}
                </div>
              </div>

              {/* Price */}
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--accent)', flexShrink: 0 }}>
                {offer.currency} {offer.price.toFixed(2)}
              </div>

              {/* Confidence */}
              <div style={{
                fontSize: 12, borderRadius: 999, padding: '2px 10px',
                border: '1px solid var(--border)', background: 'var(--bg-3)',
                color: offer.confidenceScore < 0.6 ? 'var(--red)' : 'var(--text-secondary)',
                flexShrink: 0,
              }}>
                {Math.round(offer.confidenceScore * 100)}%
              </div>

              {/* Flags */}
              <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                {offer.flags.map(f => <Flag key={f} label={f} />)}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button
                  onClick={() => handleApprove(offer.offerId)}
                  disabled={actionId === offer.offerId}
                  style={{
                    borderRadius: 'var(--radius)', border: '1px solid var(--teal)33',
                    background: 'var(--teal-dim)', color: 'var(--teal)',
                    padding: '5px 12px', fontSize: 12, cursor: 'pointer',
                    opacity: actionId === offer.offerId ? 0.5 : 1,
                  }}
                >
                  Approve
                </button>
                <button
                  onClick={() => handleDeactivate(offer.offerId)}
                  disabled={actionId === offer.offerId}
                  style={{
                    borderRadius: 'var(--radius)', border: '1px solid var(--red)33',
                    background: 'var(--red-dim)', color: 'var(--red)',
                    padding: '5px 12px', fontSize: 12, cursor: 'pointer',
                    opacity: actionId === offer.offerId ? 0.5 : 1,
                  }}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > 50 && (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 24 }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            style={{ border: '1px solid var(--border)', background: 'var(--bg-card)', borderRadius: 'var(--radius)', padding: '7px 16px', fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer' }}>
            ← Prev
          </button>
          <span style={{ padding: '7px 16px', fontSize: 13, color: 'var(--text-tertiary)' }}>
            Page {page} of {Math.ceil(total / 50)}
          </span>
          <button onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / 50)}
            style={{ border: '1px solid var(--border)', background: 'var(--bg-card)', borderRadius: 'var(--radius)', padding: '7px 16px', fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer' }}>
            Next →
          </button>
        </div>
      )}
    </div>
  )
}
