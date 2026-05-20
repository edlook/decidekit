import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import axios from 'axios'

// Server-side PostHog client (lightweight — no official Node SDK needed)
// Docs: https://posthog.com/docs/api/post-only-endpoints

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name)
  private readonly apiKey: string | undefined
  private readonly host = 'https://app.posthog.com'

  constructor(private config: ConfigService) {
    this.apiKey = this.config.get<string>('posthog.apiKey')
  }

  async capture(
    distinctId: string,         // sessionId
    event: string,
    properties: Record<string, unknown> = {},
  ): Promise<void> {
    if (!this.apiKey || process.env.NODE_ENV === 'test') return

    try {
      await axios.post(
        `${this.host}/capture/`,
        {
          api_key: this.apiKey,
          distinct_id: distinctId,
          event,
          properties: {
            ...properties,
            $lib: 'decidekit-api',
            environment: process.env.NODE_ENV ?? 'development',
          },
          timestamp: new Date().toISOString(),
        },
        { timeout: 3000 },   // Non-blocking — 3s max
      )
    } catch {
      // Analytics must never crash the request
    }
  }

  async captureRedirect(params: {
    sessionId: string
    offerId: string
    merchantId: string
    mode: string
    geo?: string
    success: boolean
  }): Promise<void> {
    await this.capture(params.sessionId, 'redirect_init', {
      offer_id: params.offerId,
      merchant_id: params.merchantId,
      mode: params.mode,
      geo: params.geo,
      redirect_status: params.success ? 'success' : 'fail',
    })
  }
}
