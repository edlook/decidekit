import type { Metadata } from 'next'
import { Nav, PageShell, Container, AffiliateDisclosure } from '@/components/layout/Nav'

export const metadata: Metadata = { title: 'Your recommendation' }

// This page renders a shareable/bookmarkable result
// In Phase 2: server-side render from result ID stored in Redis/DB
// For now: client renders from sessionStorage state

export default function ResultPage({ params }: { params: { id: string } }) {
  return (
    <>
      <Nav />
      <PageShell>
        <Container size="md" style={{ paddingTop: 48, paddingBottom: 64 }}>
          <div style={{
            borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)',
            background: 'var(--bg-card)', padding: 32, textAlign: 'center',
          }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 16 }}>
              Result #{params.id}
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--text-primary)', marginBottom: 12 }}>
              Result sharing coming soon
            </h1>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', maxWidth: 400, margin: '0 auto 24px' }}>
              Shareable result links will be available in the next release. For now, use the flows directly.
            </p>
            <a href="/" style={{ display: 'inline-block', borderRadius: 'var(--radius)', background: 'var(--accent)', color: '#0a0a0b', padding: '10px 24px', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
              Start a new search →
            </a>
          </div>
          <div style={{ marginTop: 24 }}>
            <AffiliateDisclosure />
          </div>
        </Container>
      </PageShell>
    </>
  )
}
