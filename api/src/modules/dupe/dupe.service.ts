import { Injectable, Logger } from '@nestjs/common'
import { AiService, DupeRecognizeResult } from '../ai/ai.service'
import { CatalogService } from '../catalog/catalog.service'
import { SessionService } from '../session/session.service'

export interface RecognizeResponse {
  sessionId: string
  recognized: boolean
  item?: DupeRecognizeResult
  errorCode?: string
}

export interface DupeAlternativeResult {
  searchQuery: string
  badge: string
  reason: string
  product: any | null
  offer: any | null
  merchant: any | null
  isLowConfidence: boolean
}

export interface AlternativesResponse {
  sessionId: string
  originalItem: DupeRecognizeResult
  alternatives: DupeAlternativeResult[]
  hasResults: boolean
}

@Injectable()
export class DupeService {
  private readonly logger = new Logger(DupeService.name)

  constructor(
    private ai: AiService,
    private catalog: CatalogService,
    private sessionService: SessionService,
  ) {}

  async recognizeProduct(
    input: string,
    sessionId: string | undefined,
    geo = 'US',
  ): Promise<RecognizeResponse> {
    const session = await this.sessionService.validateOrCreate(sessionId, geo)
    await this.sessionService.touch(session.sessionId, { mode: 'dupe' })

    const result = await this.ai.recognizeProduct(input)
    return {
      sessionId: session.sessionId,
      recognized: result.recognized,
      item: result.recognized ? result : undefined,
      errorCode: result.errorCode,
    }
  }

  async getAlternatives(
    sessionId: string,
    recognizedItem: DupeRecognizeResult,
    goal: string,
    geo = 'US',
  ): Promise<AlternativesResponse> {
    await this.sessionService.touch(sessionId)

    // Get AI suggestions for search queries
    const aiResult = await this.ai.generateAlternatives(recognizedItem, goal, geo)

    // For each suggestion, find real products + offers from catalog
    const enriched = await Promise.all(
      aiResult.alternatives.map(async (alt) => {
        const products = await this.catalog.searchProducts(alt.searchQuery, undefined, 5)

        if (products.length === 0) {
          return { ...alt, product: null, offer: null, merchant: null, isLowConfidence: true }
        }

        // Get best offer for top product
        const offerMap = await this.catalog.getBestOffers([products[0].id], geo)
        const offerWithMerchant = offerMap.get(products[0].id)

        return {
          ...alt,
          product: products[0],
          offer: offerWithMerchant ?? null,
          merchant: offerWithMerchant?.merchant ?? null,
          isLowConfidence: !offerWithMerchant || products[0].confidenceScore < 0.7,
        }
      }),
    )

    return {
      sessionId,
      originalItem: recognizedItem,
      alternatives: enriched,
      hasResults: enriched.some(a => a.offer !== null),
    }
  }
}
