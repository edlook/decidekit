'use client'

import { useState, useEffect } from 'react'
import { adminApi } from '@/lib/api'

interface Stats {
  catalog: { totalProducts: number; totalOffers: number; activeOffers: number; staleOffers: number; outOfStockOffers: number; categoryCounts: Record<string, number> }
  merchants: { total: number; active: number; approved: number; byNetwork: Record<string, number> }
  clicks: { total24h: number; total7d: number; redirectSuccessRate: number; byMode: Record<string, number> }
  ingestion: { lastRunAt: string | null; lastRunStatus: string | null; totalJobsThisWeek: number; failedJobsThisWeek: number }
}

function StatCard({ label, value, sub, accent = false }: { label: string; value: string | number; sub?: string; accent?: boolean }) {
  return (
    <div style={{
      borderRadius: 'var(--radius-lg)', border: `1px solid ${accent ? 'var(--accent)' : 'var(--border)'}`,
      background: accent ? 'var(--accent-dim)' : 'var(--bg-card)', padding: '18px 20px',
    }}>
      <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 600, color: accent ? 'var(--accent)' : 'var(--text-primary)', fontFamily: 'var(--font-mono)', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 6 }}>{sub}</div>}
    </div>
  )
}

function StatusDot({ status }: { status: string | null }) {
  const color = status === 'completed' ? 'var(--teal)' : status === 'failed' ? 'var(--red)' : status === 'running' ? 'var(--accent)' : 'var(--text-tertiary)'
  return <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: color, marginRight: 6 }} />
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    adminApi.getStats()
      .then(setStats)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const title = (s: string) => ({ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--text-primary)', marginBottom: 16 } as any)

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', color: 'var(--text-primary)', marginBottom: 28 }}>
        Dashboard
      </h1>

      {loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {[...Array(8)].map((_, i) => <div key={i} className="skeleton" style={{ height: 92, borderRadius: 'var(--radius-lg)' }} />)}
        </div>
      )}

      {error && (
        <div style={{ borderRadius: 'var(--radius)', border: '1px solid var(--red)', background: 'var(--red-dim)', padding: '12px 16px', color: 'var(--red)', fontSize: 14 }}>
          ⚠ Could not load stats: {error}
          <br /><span style={{ fontSize: 12, opacity: 0.7 }}>Make sure the API is running on :3001</span>
        </div>
      )}

      {stats && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

          {/* Catalog */}
          <section>
            <h2 style={title('')}>Catalog</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
              <StatCard label="Products"      value={stats.catalog.totalProducts}    />
              <StatCard label="Total offers"  value={stats.catalog.totalOffers}      />
              <StatCard label="Active offers" value={stats.catalog.activeOffers} accent />
              <StatCard label="Stale prices"  value={stats.catalog.staleOffers}  sub="needs refresh" />
              <StatCard label="Out of stock"  value={stats.catalog.outOfStockOffers} />
            </div>
            {Object.keys(stats.catalog.categoryCounts).length > 0 && (
              <div style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {Object.entries(stats.catalog.categoryCounts)
                  .sort(([,a],[,b]) => b - a)
                  .map(([cat, count]) => (
                    <span key={cat} style={{
                      borderRadius: 999, border: '1px solid var(--border)', background: 'var(--bg-card)',
                      padding: '4px 12px', fontSize: 12, color: 'var(--text-secondary)',
                    }}>
                      {cat} · <strong style={{ color: 'var(--text-primary)' }}>{count}</strong>
                    </span>
                  ))}
              </div>
            )}
          </section>

          {/* Clicks */}
          <section>
            <h2 style={title('')}>Clicks & Redirects</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
              <StatCard label="Clicks 24h"    value={stats.clicks.total24h} accent />
              <StatCard label="Clicks 7d"     value={stats.clicks.total7d}  />
              <StatCard label="Redirect OK"   value={`${stats.clicks.redirectSuccessRate}%`} sub="last 7 days" />
              {Object.entries(stats.clicks.byMode).map(([mode, count]) => (
                <StatCard key={mode} label={`Mode: ${mode}`} value={count} />
              ))}
            </div>
          </section>

          {/* Merchants */}
          <section>
            <h2 style={title('')}>Merchants</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
              <StatCard label="Total"    value={stats.merchants.total}    />
              <StatCard label="Active"   value={stats.merchants.active}   />
              <StatCard label="Approved" value={stats.merchants.approved} accent />
              {Object.entries(stats.merchants.byNetwork).map(([net, count]) => (
                <StatCard key={net} label={net} value={count} />
              ))}
            </div>
          </section>

          {/* Ingestion */}
          <section>
            <h2 style={title('')}>Ingestion</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
              <StatCard label="Jobs this week"  value={stats.ingestion.totalJobsThisWeek}  />
              <StatCard label="Failed jobs"     value={stats.ingestion.failedJobsThisWeek} />
              <div style={{ borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', background: 'var(--bg-card)', padding: '18px 20px' }}>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Last run</div>
                <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>
                  <StatusDot status={stats.ingestion.lastRunStatus} />
                  {stats.ingestion.lastRunStatus ?? 'never'}
                </div>
                {stats.ingestion.lastRunAt && (
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>
                    {new Date(stats.ingestion.lastRunAt).toLocaleString()}
                  </div>
                )}
              </div>
            </div>
          </section>

        </div>
      )}
    </div>
  )
}
