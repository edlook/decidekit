import Link from 'next/link'
import { Nav, PageShell, Container } from '@/components/layout/Nav'

export default function NotFound() {
  return (
    <>
      <Nav />
      <PageShell>
        <Container size="sm" style={{ paddingTop: 80, paddingBottom: 80, textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 72, fontWeight: 600, color: 'var(--text-tertiary)', lineHeight: 1, marginBottom: 16 }}>
            404
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--text-primary)', marginBottom: 12 }}>
            Page not found
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 32 }}>
            This page does not exist or was moved.
          </p>
          <Link href="/" style={{ display: 'inline-block', borderRadius: 'var(--radius)', background: 'var(--accent)', color: '#0a0a0b', padding: '10px 24px', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
            Back to home →
          </Link>
        </Container>
      </PageShell>
    </>
  )
}
