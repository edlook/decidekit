import { Injectable, Logger } from '@nestjs/common'
import { AiService } from '../ai/ai.service'
import { CatalogService, RankedKit } from '../catalog/catalog.service'
import { SessionService } from '../session/session.service'

export interface BuilderIntentResponse {
  sessionId: string
  intent: string
  category: string
  inferredBudget: number | null
  clarificationQuestions: Array<{
    id: string
    question: string
    type: 'chips' | 'range' | 'text'
    options?: string[]
  }>
}

export interface BuilderResultResponse {
  sessionId: string
  query: string
  summary: string
  assumptions: string[]
  variants: {
    budget: { items: RankedKit[]; totalPrice: number; isPartial: boolean }
    balanced: { items: RankedKit[]; totalPrice: number; isPartial: boolean }
    premium: { items: RankedKit[]; totalPrice: number; isPartial: boolean }
  }
  tradeoffs: string[]
  hasSufficientCoverage: boolean
}

@Injectable()
export class BuilderService {
  private readonly logger = new Logger(BuilderService.name)

  constructor(
    private ai: AiService,
    private catalog: CatalogService,
    private sessionService: SessionService,
  ) {}

  async parseIntent(
    text: string,
    sessionId: string | undefined,
    geo = 'US',
  ): Promise<BuilderIntentResponse> {
    const session = await this.sessionService.validateOrCreate(sessionId, geo)
    await this.sessionService.touch(session.sessionId, { mode: 'builder' })

    const parsed = await this.ai.parseBuilderIntent(text, geo)

    return {
      sessionId: session.sessionId,
      ...parsed,
    }
  }

  async generateResult(
    sessionId: string,
    intent: string,
    clarifications: Record<string, string | number>,
    budget: number,
    priorities: string[],
    geo = 'US',
  ): Promise<BuilderResultResponse> {
    await this.sessionService.touch(sessionId)

    // 1. Generate kit structure from AI
    const kitSuggestion = await this.ai.generateSolutionKits(intent, clarifications, budget, priorities)

    // 2. For each variant, find real products/offers
    const [budgetKit, balancedKit, premiumKit] = await Promise.all([
      this.catalog.buildKit(kitSuggestion.budgetKit.items, geo, budget * 0.7),
      this.catalog.buildKit(kitSuggestion.balancedKit.items, geo, budget),
      this.catalog.buildKit(kitSuggestion.premiumKit.items, geo, budget * 1.5),
    ])

    const sumPrices = (items: RankedKit[]): number =>
      items.reduce((sum, item) => sum + (item.offer ? Number(item.offer.price) : 0), 0)

    return {
      sessionId,
      query: intent,
      summary: kitSuggestion.summary,
      assumptions: kitSuggestion.assumptions,
      variants: {
        budget:   { items: budgetKit,   totalPrice: sumPrices(budgetKit),   isPartial: budgetKit.some(i => !i.offer) },
        balanced: { items: balancedKit, totalPrice: sumPrices(balancedKit), isPartial: balancedKit.some(i => !i.offer) },
        premium:  { items: premiumKit,  totalPrice: sumPrices(premiumKit),  isPartial: premiumKit.some(i => !i.offer) },
      },
      tradeoffs: kitSuggestion.tradeoffs,
      hasSufficientCoverage: balancedKit.filter(i => i.offer).length >= Math.ceil(balancedKit.length * 0.6),
    }
  }
}
