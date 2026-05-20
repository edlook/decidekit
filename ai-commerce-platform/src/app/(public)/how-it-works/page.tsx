import type { Metadata } from 'next'
import { Nav, PageShell, Container } from '@/components/layout/Nav'

export const metadata: Metadata = { title: 'How DecideKit works' }

const html = `<p>DecideKit helps you make purchase decisions through three guided flows. No account, no login, no email required.</p><br/><p><strong>Build a solution:</strong> Describe a task or goal in plain text and receive a complete Budget, Balanced, and Premium kit. Each item includes an explanation and a link to purchase it.</p><br/><p><strong>Find an alternative:</strong> Paste a product URL or describe a product you own. We identify it and surface cheaper alternatives, premium upgrades, same-style substitutes, or same-function replacements with a clear reason for each.</p><br/><p><strong>Choose via battles:</strong> Pick a category and go through quick head-to-head comparisons. The system infers your preferences and surfaces a winner with reasoning.</p><br/><p><strong>How recommendations work:</strong> We use AI to parse your request. Real product data comes from affiliate feeds (Awin, Rakuten) which we normalise, deduplicate, and rank by relevance, merchant quality, and availability. Affiliate value is one factor among many — never the primary one.</p>`

export default function Page() {
  return (
    <>
      <Nav />
      <PageShell>
        <Container size="md" className="py-12 md:py-16">
          <div style={{ maxWidth: 680 }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--text-primary)', marginBottom: 32 }}>
              How DecideKit works
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
