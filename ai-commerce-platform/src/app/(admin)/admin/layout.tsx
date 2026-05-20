import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: { default: 'Admin', template: '%s | Admin' } }

const NAV = [
  { href: '/admin/dashboard',  label: 'Dashboard',   icon: '▦' },
  { href: '/admin/offers',     label: 'Offers',       icon: '⊞' },
  { href: '/admin/merchants',  label: 'Merchants',    icon: '⊡' },
  { href: '/admin/ingestion',  label: 'Ingestion',    icon: '⇄' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Sidebar */}
      <aside style={{
        width: 220, flexShrink: 0,
        borderRight: '1px solid var(--border)',
        background: 'var(--bg-2)',
        padding: '20px 0',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ padding: '0 20px 20px', borderBottom: '1px solid var(--border)', marginBottom: 12 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 15, color: 'var(--text-primary)' }}>
            DecideKit
          </span>
          <span style={{
            display: 'block', fontSize: 10, color: 'var(--accent)', marginTop: 2,
            textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600,
          }}>
            Admin
          </span>
        </div>
        <nav style={{ padding: '0 8px', flex: 1 }}>
          {NAV.map(item => (
            <Link key={item.href} href={item.href} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 12px', borderRadius: 'var(--radius)', marginBottom: 2,
              fontSize: 13, color: 'var(--text-secondary)', textDecoration: 'none',
              transition: 'all var(--transition)',
            }}>
              <span style={{ fontSize: 14, opacity: 0.7 }}>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)' }}>
          <Link href="/" style={{ fontSize: 12, color: 'var(--text-tertiary)', textDecoration: 'none' }}>
            ← Back to site
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, overflow: 'auto', padding: '32px' }}>
        {children}
      </main>
    </div>
  )
}
