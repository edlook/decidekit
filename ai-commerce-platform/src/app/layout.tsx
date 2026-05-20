import type { Metadata, Viewport } from 'next'
import './globals.css'
import { PostHogProvider } from '@/components/PostHogProvider'

export const metadata: Metadata = {
  title: {
    default: 'DecideKit — AI-powered purchase decisions',
    template: '%s | DecideKit',
  },
  description:
    'Build your perfect setup, find a better alternative, or choose between products with AI-guided decision flows. No signup required.',
  openGraph: {
    type: 'website',
    title: 'DecideKit — AI-powered purchase decisions',
    description: 'Build, replace, or choose — no account needed.',
  },
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0a0a0b',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=DM+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <PostHogProvider>
          {children}
        </PostHogProvider>
      </body>
    </html>
  )
}
