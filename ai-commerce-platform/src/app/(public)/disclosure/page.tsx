import type { Metadata } from 'next'
import { Nav, PageShell, Container } from '@/components/layout/Nav'

export const metadata: Metadata = { title: 'Affiliate Disclosure' }

const html = `<p>DecideKit participates in affiliate marketing programs. When you click on product links and make a purchase, we may earn a commission at no additional cost to you.</p><br/><p><strong>What this means:</strong> Some links on this site are affiliate links. We only recommend products we believe provide value. Our rankings are not driven by commission rates — relevance to your request always comes first.</p><br/><p><strong>Networks we work with:</strong> Awin, Rakuten/LinkShare, and Impact. Merchants include major retailers and brand stores within these networks.</p><br/><p><strong>Price accuracy:</strong> Prices are sourced from affiliate feeds and may not always be current. Always verify the final price on the merchant site before purchasing.</p>`

export default function Page() {
  return (
    <>
      <Nav />
      <PageShell>
        <Container size="md" className="py-12 md:py-16">
          <div style={{ maxWidth: 680 }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--text-primary)', marginBottom: 32 }}>
              Affiliate Disclosure
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
