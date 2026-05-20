'use client'
import { useEffect } from 'react'
import { Nav, PageShell, Container } from '@/components/layout/Nav'

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.error(error) }, [error])
  return (
    <>
      <Nav />
      <PageShell>
        <Container size="sm" style={{ paddingTop: 80, paddingBottom: 80, textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 72, fontWeight: 600, color: 'var(--red)', lineHeight: 1, marginBottom: 16 }}>!</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--text-primary)', marginBottom: 12 }}>Something went wrong</h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 32 }}>{error.message}</p>
          <button onClick={reset} style={{ borderRadius: 'var(--radius)', background: 'var(--accent)', color: '#0a0a0b', border: 'none', padding: '10px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            Try again
          </button>
        </Container>
      </PageShell>
    </>
  )
}
