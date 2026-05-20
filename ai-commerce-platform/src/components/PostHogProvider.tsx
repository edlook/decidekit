'use client'

import { useEffect } from 'react'
import posthog from 'posthog-js'

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
    if (!key) return

    posthog.init(key, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://app.posthog.com',
      loaded: (ph) => {
        if (process.env.NODE_ENV === 'development') ph.debug()
      },
      capture_pageview: true,
      capture_pageleave: true,
      persistence: 'sessionStorage',   // no cross-session tracking
      autocapture: false,              // only manual events
    })
  }, [])

  return <>{children}</>
}
