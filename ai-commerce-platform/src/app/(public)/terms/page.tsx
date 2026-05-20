import type { Metadata } from 'next'
import { Nav, PageShell, Container } from '@/components/layout/Nav'

export const metadata: Metadata = { title: 'Terms of Use' }

const html = `<p>By using DecideKit you agree to these terms.</p><br/><p><strong>Service:</strong> DecideKit is a product recommendation and decision tool. Recommendations are for informational purposes only and do not constitute financial or purchasing advice.</p><br/><p><strong>No warranties:</strong> We do not guarantee the accuracy, completeness, or timeliness of product information, prices, or availability. Always verify on the merchant site before purchasing.</p><br/><p><strong>Affiliate relationships:</strong> We earn commissions when you purchase through our links. See our Affiliate Disclosure for full details.</p><br/><p><strong>Limitation of liability:</strong> DecideKit is not liable for losses arising from purchase decisions made based on our recommendations.</p>`

export default function Page() {
  return (
    <>
      <Nav />
      <PageShell>
        <Container size="md" className="py-12 md:py-16">
          <div style={{ maxWidth: 680 }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--text-primary)', marginBottom: 32 }}>
              Terms of Use
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
