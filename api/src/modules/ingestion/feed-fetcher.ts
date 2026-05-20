import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import axios from 'axios'
import pRetry from 'p-retry'

export interface FetchResult {
  content: string
  format: 'xml' | 'csv' | 'tsv'
  contentLength: number
}

@Injectable()
export class FeedFetcher {
  private readonly logger = new Logger(FeedFetcher.name)

  constructor(private config: ConfigService) {}

  async fetchAwinFeed(advertiserId: string): Promise<FetchResult | null> {
    const apiKey = this.config.get<string>('affiliate.awinKey')
    if (!apiKey) {
      this.logger.warn('AWIN_API_KEY not set — skipping Awin fetch')
      return null
    }

    // Awin Product Feed API
    const url = `https://productdata.awin.com/datafeed/download/apikey/${apiKey}/language/en/fid/${advertiserId}/columns/aw_product_id,product_name,description,category_name,merchant_category,brand_name,search_price,currency_code,store_price,aw_deep_link,aw_image_url,in_stock,availability/format/xml/delimiter/%2C/compression/none/`

    return this.fetchWithRetry(url, advertiserId)
  }

  async fetchRakutenFeed(advertiserId: string, token: string): Promise<FetchResult | null> {
    // Rakuten/LinkShare feed via their reporting API
    const url = `https://api.rakutenmarketing.com/linklocator/1.0/getMerchandisersAdvertiserLinks?mid=${advertiserId}&token=${token}&cat=all`
    return this.fetchWithRetry(url, advertiserId)
  }

  async fetchFromUrl(url: string, label = 'feed'): Promise<FetchResult | null> {
    return this.fetchWithRetry(url, label)
  }

  private async fetchWithRetry(url: string, label: string): Promise<FetchResult | null> {
    try {
      const result = await pRetry(
        () => this.doFetch(url),
        {
          retries: 3,
          minTimeout: 2000,
          maxTimeout: 10000,
          onFailedAttempt: (err: any) => {
            this.logger.warn(
              `Fetch attempt ${err.attemptNumber} failed for ${label}: ${String(err.message ?? err)}`,
            )
          },
        },
      )
      return result
    } catch (err) {
      this.logger.error(`All retries failed for ${label}: ${err}`)
      return null
    }
  }

  private async doFetch(url: string): Promise<FetchResult> {
    const response = await axios.get<string>(url, {
      timeout: 60_000,
      maxContentLength: 200 * 1024 * 1024, // 200MB max
      responseType: 'text',
      headers: {
        'Accept': 'application/xml, text/csv, text/plain, */*',
        'User-Agent': 'DecideKit-FeedBot/1.0',
      },
    })

    const content = response.data
    const contentType = String(response.headers['content-type'] ?? '')

    let format: FetchResult['format'] = 'csv'
    if (contentType.includes('xml') || content.trimStart().startsWith('<')) {
      format = 'xml'
    } else if (content.split('\n')[0]?.includes('\t')) {
      format = 'tsv'
    }

    return {
      content,
      format,
      contentLength: content.length,
    }
  }
}
