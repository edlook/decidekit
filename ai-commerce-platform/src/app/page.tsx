import Link from 'next/link'
import type { Metadata } from 'next'
import { Nav, PageShell, Container, AffiliateDisclosure } from '@/components/layout/Nav'

export const metadata: Metadata = {
  title: 'DecideKit — AI-powered purchase decisions',
}

const MODES = [
  {
    key: 'build',
    href: '/build',
    label: 'Build a solution',
    description: 'Describe a task or goal and get a complete Budget / Balanced / Premium kit tailored to your constraints.',
    cta: 'Start building',
    accentVar: '--accent',
  },
  {
    key: 'replace',
    href: '/replace',
    label: 'Find an alternative',
    description: 'Paste a product link or describe an item — get a cheaper dupe, upgrade, or substitute with clear reasoning.',
    cta: 'Find alternatives',
    accentVar: '--teal',
  },
  {
    key: 'choose',
    href: '/choose',
    label: 'Choose via battles',
    description: 'Quick pairwise comparisons — the AI infers your preferences and surfaces a winner and shortlist.',
    cta: 'Start choosing',
    accentVar: '--accent',
  },
]

const EXAMPLES = [
  'Home studio setup under $800',
  'Alternative to Sony WH-1000XM5',
  'Best laptop for video editing under $1,200',
  'Cheaper version of Dyson V15',
  'Gaming PC build for $600',
  'Kitchen upgrade kit for a small apartment',
]

const HOW_IT_WORKS = [
  { step: '01', title: 'Pick a mode', body: "Choose whether you're building from scratch, looking for an alternative, or need help deciding between options." },
  { step: '02', title: 'Describe your need', body: 'Enter a free-text request, paste a product link, or pick a category. No forms. No filters.' },
  { step: '03', title: 'Get an explained result', body: 'Receive ranked recommendations with clear reasoning — not a raw list of products.' },
  { step: '04', title: 'Go to the merchant', body: 'Click any offer to be routed to the merchant site. No account required, ever.' },
]

export default function HomePage() {
  return (
    <>
      <Nav />
      <PageShell>
        {/* Hero */}
        <section className="relative overflow-hidden pt-20 pb-16 md:pt-28 md:pb-24">
          <div
            aria-hidden="true"
            style={{
              position: 'absolute', inset: 0, pointerEvents: 'none',
              background: 'radial-gradient(circle at 50% 0%, rgba(212,168,67,0.07) 0%, transparent 60%)',
            }}
          />
          <Container size="lg" className="relative text-center">
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              marginBottom: 24, borderRadius: 999,
              border: '1px solid var(--border)', background: 'var(--bg-card)',
              padding: '6px 14px', fontSize: 12, color: 'var(--text-secondary)',
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--teal)', display: 'block' }} />
              No account required · No email · No login
            </div>

            <h1 style={{
              fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 6vw, 3.5rem)',
              lineHeight: 1.1, color: 'var(--text-primary)', maxWidth: 700, margin: '0 auto 20px',
            }}>
              Stop browsing.{' '}
              <span style={{ color: 'var(--accent)', fontStyle: 'italic' }}>Start deciding.</span>
            </h1>

            <p style={{ color: 'var(--text-secondary)', fontSize: '1.0625rem', lineHeight: 1.7, maxWidth: 520, margin: '0 auto 40px' }}>
              AI-guided purchase decisions in three modes — build a kit, find a better alternative, or pick between options. Explained results, not just lists.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
              <Link href="/build" style={{
                borderRadius: 'var(--radius)', background: 'var(--accent)',
                padding: '12px 24px', fontSize: 14, fontWeight: 600, color: '#0a0a0b',
                textDecoration: 'none', transition: 'filter var(--transition)',
              }}>
                Build a solution →
              </Link>
              <Link href="/start" style={{
                borderRadius: 'var(--radius)', border: '1px solid var(--border)',
                background: 'var(--bg-card)', padding: '12px 24px', fontSize: 14,
                color: 'var(--text-primary)', textDecoration: 'none', transition: 'border-color var(--transition)',
              }}>
                Not sure where to start?
              </Link>
            </div>
          </Container>
        </section>

        {/* Mode cards */}
        <section style={{ padding: '40px 0 56px' }}>
          <Container size="lg">
            <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
              {MODES.map((mode) => (
                <Link key={mode.key} href={mode.href} style={{
                  display: 'block', borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border)', background: 'var(--bg-card)',
                  padding: 24, textDecoration: 'none', transition: 'border-color var(--transition), background var(--transition)',
                }}>
                  <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 10 }}>
                    {mode.label}
                  </h2>
                  <p style={{ fontSize: 14, lineHeight: 1.65, color: 'var(--text-secondary)', marginBottom: 20 }}>
                    {mode.description}
                  </p>
                  <span style={{ fontSize: 13, fontWeight: 500, color: `var(${mode.accentVar})` }}>
                    {mode.cta} →
                  </span>
                </Link>
              ))}
            </div>
          </Container>
        </section>

        {/* Example prompts */}
        <section style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '36px 0' }}>
          <Container size="lg">
            <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 16 }}>
              Try these
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {EXAMPLES.map((ex) => (
                <Link key={ex} href={`/build?q=${encodeURIComponent(ex)}`} style={{
                  borderRadius: 999, border: '1px solid var(--border)', background: 'var(--bg-card)',
                  padding: '8px 16px', fontSize: 13, color: 'var(--text-secondary)', textDecoration: 'none',
                  transition: 'border-color var(--transition), color var(--transition)',
                }}>
                  {ex}
                </Link>
              ))}
            </div>
          </Container>
        </section>

        {/* How it works */}
        <section style={{ padding: '64px 0 80px' }}>
          <Container size="lg">
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem, 4vw, 2rem)', color: 'var(--text-primary)', marginBottom: 40 }}>
              How it works
            </h2>
            <div style={{ display: 'grid', gap: 32, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
              {HOW_IT_WORKS.map(({ step, title, body }) => (
                <div key={step}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 28, fontWeight: 500, color: 'var(--text-tertiary)', marginBottom: 12, lineHeight: 1 }}>
                    {step}
                  </div>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>{title}</h3>
                  <p style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--text-secondary)' }}>{body}</p>
                </div>
              ))}
            </div>
          </Container>
        </section>

        {/* Footer */}
        <footer style={{ borderTop: '1px solid var(--border)', padding: '40px 0' }}>
          <Container size="lg">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
                DecideKit
              </span>
              <nav style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                {[['How it works', '/how-it-works'], ['Affiliate disclosure', '/disclosure'], ['Privacy', '/privacy'], ['Terms', '/terms']].map(([label, href]) => (
                  <Link key={href} href={href} style={{ fontSize: 12, color: 'var(--text-tertiary)', textDecoration: 'none' }}>
                    {label}
                  </Link>
                ))}
              </nav>
            </div>
            <AffiliateDisclosure />
          </Container>
        </footer>
      </PageShell>
    </>
  )
}
