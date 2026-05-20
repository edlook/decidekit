import type { Metadata } from 'next'
import { Nav, PageShell, Container } from '@/components/layout/Nav'

export const metadata: Metadata = { title: 'Privacy Policy' }

const html = `<p>DecideKit is built with privacy by default. We do not require accounts, do not collect email addresses, and do not build persistent user profiles.</p><br/><p><strong>What we collect:</strong> An anonymous session ID stored in your browser session storage (expires when you close your browser), click events (offer ID, session ID, flow mode, approximate country), and anonymised usage analytics via PostHog.</p><br/><p><strong>What we do not collect:</strong> Names, email addresses, payment information, or any personally identifiable data. We do not use tracking cookies beyond session continuity.</p><br/><p><strong>Third parties:</strong> When you click a product link you are redirected to a third-party merchant whose own privacy policy applies. We pass a tracking subID for affiliate attribution but share no personal data.</p>`

export default function Page() {
  return (
    <>
      <Nav />
      <PageShell>
        <Container size="md" className="py-12 md:py-16">
          <div style={{ maxWidth: 680 }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--text-primary)', marginBottom: 32 }}>
              Privacy Policy
            </h1>
            <div
              style={{ fontSize: 15, lineHeight: 1.8, color: 'var(--text-secondary)' }}
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </div>
        </Container>
      </PageShell>
    </>
  )
}
