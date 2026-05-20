'use client'

import { useState, useEffect } from 'react'
import { adminApi } from '@/lib/api'

interface Job {
  id: string; network: string; advertiserId: string; merchantName?: string; status: string
  totalFetched: number; totalNormalized: number; totalMatched: number
  totalErrors: number; startedAt: string | null; completedAt: string | null
  errorMessage: string | null
}

export default function IngestionPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    network: 'awin', advertiserId: '', merchantName: '', feedUrl: '', dryRun: true,
  })

  useEffect(() => {
    adminApi.getIngestionJobs()
      .then(res => setJobs(res.data ?? []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  async function handleRun(e: React.FormEvent) {
    e.preventDefault()
    if (!form.advertiserId || !form.merchantName) return
    setRunning(true)
    setResult(null)
    setError(null)
    try {
      const res = await adminApi.runIngestion({
        network: form.network as any,
        advertiserId: form.advertiserId,
        merchantName: form.merchantName,
        dryRun: form.dryRun,
      })
      setResult(res)
      // Refresh job list
      const updated = await adminApi.getIngestionJobs()
      setJobs(updated.data ?? [])
    } catch (e: any) {
      setError(e.message)
    } finally {
      setRunning(false)
    }
  }

  function statusColor(status: string) {
    return status === 'completed' ? 'var(--teal)' : status === 'failed' ? 'var(--red)' : status === 'running' ? 'var(--accent)' : 'var(--text-tertiary)'
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'start' }}>

      {/* Trigger form */}
      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', color: 'var(--text-primary)', marginBottom: 24 }}>
          Run ingestion
        </h1>

        <form onSubmit={handleRun} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { label: 'Network', field: 'network', type: 'select', options: ['awin', 'rakuten'] },
            { label: 'Advertiser ID', field: 'advertiserId', type: 'text', placeholder: 'e.g. 12345' },
            { label: 'Merchant Name', field: 'merchantName', type: 'text', placeholder: 'e.g. Amazon UK' },
            { label: 'Feed URL (optional)', field: 'feedUrl', type: 'text', placeholder: 'Override default API URL' },
          ].map(({ label, field, type, placeholder, options }) => (
            <div key={field}>
              <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>{label}</label>
              {type === 'select' ? (
                <select value={(form as any)[field]} onChange={e => setForm(prev => ({ ...prev, [field]: e.target.value }))}
                  style={{ width: '100%', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '9px 12px', fontSize: 13, color: 'var(--text-primary)', outline: 'none' }}>
                  {options!.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : (
                <input type="text" value={(form as any)[field]} placeholder={placeholder}
                  onChange={e => setForm(prev => ({ ...prev, [field]: e.target.value }))}
                  style={{ width: '100%', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '9px 12px', fontSize: 13, color: 'var(--text-primary)', outline: 'none', fontFamily: 'var(--font-body)' }} />
              )}
            </div>
          ))}

          <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <input type="checkbox" checked={form.dryRun} onChange={e => setForm(prev => ({ ...prev, dryRun: e.target.checked }))} />
            Dry run (parse + normalize + match, skip DB writes)
          </label>

          {error && <div style={{ borderRadius: 'var(--radius)', border: '1px solid var(--red)33', background: 'var(--red-dim)', padding: '10px 14px', fontSize: 13, color: 'var(--red)' }}>{error}</div>}

          <button type="submit" disabled={running || !form.advertiserId || !form.merchantName}
            style={{ background: 'var(--accent)', color: '#0a0a0b', border: 'none', borderRadius: 'var(--radius)', padding: '11px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer', opacity: running ? 0.6 : 1 }}>
            {running ? '⟳ Running pipeline…' : 'Run pipeline'}
          </button>
        </form>

        {result && (
          <div style={{ marginTop: 20, borderRadius: 'var(--radius)', border: '1px solid var(--teal)33', background: 'var(--teal-dim)', padding: '16px' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--teal)', marginBottom: 12 }}>
              ✓ Pipeline completed in {(result.durationMs / 1000).toFixed(1)}s
            </div>
            {[
              ['Fetched',    result.totalFetched],
              ['Normalized', result.totalNormalized],
              ['Matched',    result.totalMatched],
              ['Written',    result.totalWritten],
              ['Skipped',    result.totalSkipped],
            ].map(([label, val]) => (
              <div key={label as string} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{val}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Job history */}
      <div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: 'var(--text-primary)', marginBottom: 20 }}>
          Job history
        </h2>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[...Array(5)].map((_, i) => <div key={i} className="skeleton" style={{ height: 64, borderRadius: 'var(--radius)' }} />)}
          </div>
        ) : jobs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-tertiary)', fontSize: 13 }}>No jobs yet</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {jobs.map(job => (
              <div key={job.id} style={{ borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--bg-card)', padding: '12px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{job.merchantName ?? job.advertiserId} · {job.network}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: statusColor(job.status) }}>{job.status}</span>
                </div>
                <div style={{ display: 'flex', gap: 16, fontSize: 11, color: 'var(--text-tertiary)' }}>
                  {job.totalFetched > 0 && <span>fetched: {job.totalFetched}</span>}
                  {job.totalMatched > 0 && <span>matched: {job.totalMatched}</span>}
                  {job.completedAt && <span>{new Date(job.completedAt).toLocaleString()}</span>}
                </div>
                {job.errorMessage && <div style={{ fontSize: 11, color: 'var(--red)', marginTop: 4 }}>{job.errorMessage}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
