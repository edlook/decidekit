import Link from 'next/link'
import type { Metadata } from 'next'
import { Nav, PageShell, Container } from '@/components/layout/Nav'

export const metadata: Metadata = { title: 'Get started' }

const DECISION_PROMPTS = [
  {
    question: 'I need a complete setup for a task or budget',
    mode: 'build',
    href: '/build',
    hint: 'Home studio, travel kit, gaming rig, office desk...',
  },
  {
    question: 'I already have a product in mind and want an alternative',
    mode: 'replace',
    href: '/replace',
    hint: 'Cheaper version, upgrade, same-style substitute...',
  },
  {
    question: 'I have a few options and need help picking one',
    mode: 'choose',
    href: '/choose',
    hint: 'Laptop A vs B, two headphone models, etc.',
  },
]

export default function StartPage() {
  return (
    <>
      <Nav />
      <PageShell>
        <Container size="sm" className="flex min-h-[calc(100vh-56px)] flex-col items-center justify-center py-16">
          <h1
            className="mb-2 text-center text-2xl text-[var(--text-primary)] md:text-3xl"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            What are you trying to do?
          </h1>
          <p className="mb-10 text-center text-sm text-[var(--text-secondary)]">
            Pick the flow that fits — you can switch any time.
          </p>

          <div className="w-full space-y-3">
            {DECISION_PROMPTS.map(({ question, href, hint }) => (
              <Link
                key={href}
                href={href}
                style={{
                  display: 'block',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-card)',
                  padding: '20px 24px',
                  textDecoration: 'none',
                  transition: 'border-color var(--transition), background var(--transition)',
                }}
              >
                <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 4 }}>
                  {question}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{hint}</div>
              </Link>
            ))}
          </div>

          <p style={{ marginTop: 32, fontSize: 12, color: 'var(--text-tertiary)', textAlign: 'center' }}>
            No account required · Results include affiliate links
          </p>
        </Container>
      </PageShell>
    </>
  )
}
