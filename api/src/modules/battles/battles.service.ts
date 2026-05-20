import { Injectable, Logger } from '@nestjs/common'
import { AiService } from '../ai/ai.service'
import { CatalogService } from '../catalog/catalog.service'
import { SessionService } from '../session/session.service'
import { ProductConcept } from '../../database/entities/product-concept.entity'
import { Offer } from '../../database/entities/offer.entity'
import { Merchant } from '../../database/entities/merchant.entity'

interface Choice { winnerId: string; loserId: string }

export interface ProductWithOffer {
  id: string; brand: string; name: string
  category: string; attributes: Record<string, string>
  price?: number; currency?: string; offerId?: string; imageUrl?: string
}

export interface PairResponse {
  sessionId: string
  left: ProductWithOffer
  right: ProductWithOffer
  battleIndex: number
  confidence: number
  isDone: boolean
  winner?: ProductWithOffer
  winnerReasoning?: string
  alternatives?: ProductWithOffer[]
}

interface BattleState {
  category: string
  candidates: ProductConcept[]
  choices: Choice[]
  confidence: number
}

// In-memory battle states (Redis-backed in production via session)
const battleStates = new Map<string, BattleState>()

@Injectable()
export class BattlesService {
  private readonly logger = new Logger(BattlesService.name)

  constructor(
    private ai: AiService,
    private catalog: CatalogService,
    private sessionService: SessionService,
  ) {}

  async getNextPair(
    sessionId: string | undefined,
    category: string,
    constraints: Record<string, string>,
    previousChoices: Choice[],
    geo = 'US',
  ): Promise<PairResponse> {
    const session = await this.sessionService.validateOrCreate(sessionId, geo)
    await this.sessionService.touch(session.sessionId, { mode: 'battles' })
    const sid = session.sessionId

    // Init or reload state
    let state = battleStates.get(sid)
    if (!state || state.category !== category) {
      const candidates = await this.catalog.searchProducts(category, undefined, 24)
      state = { category, candidates, choices: previousChoices, confidence: 0 }
      battleStates.set(sid, state)
    } else {
      state.choices = previousChoices
    }

    // Update confidence via AI after ≥2 choices
    if (state.choices.length >= 2) {
      const choicesWithAttrs = state.choices.map(c => ({
        winnerId: c.winnerId, loserId: c.loserId,
        winnerAttrs: Object.values(state!.candidates.find(p => p.id === c.winnerId)?.attributes ?? {}),
        loserAttrs:  Object.values(state!.candidates.find(p => p.id === c.loserId)?.attributes ?? {}),
      }))
      const inference = await this.ai.inferBattlePreferences(choicesWithAttrs, category)
      state.confidence = inference.confidence

      if (inference.isDone || state.choices.length >= 5) {
        return this.buildResult(sid, state, geo)
      }
    }

    // Pick next unseen pair
    const usedIds = new Set(state.choices.flatMap(c => [c.winnerId, c.loserId]))
    const unused = state.candidates.filter(c => !usedIds.has(c.id))
    if (unused.length < 2) return this.buildResult(sid, state, geo)

    const [left, right] = unused
    const offerMap = await this.catalog.getBestOffers([left.id, right.id], geo)

    return {
      sessionId: sid,
      left:  this.toProductWithOffer(left,  offerMap.get(left.id)),
      right: this.toProductWithOffer(right, offerMap.get(right.id)),
      battleIndex: state.choices.length + 1,
      confidence: state.confidence,
      isDone: false,
    }
  }

  private async buildResult(sid: string, state: BattleState, geo: string): Promise<PairResponse> {
    // Tally wins
    const wins = new Map<string, number>()
    state.choices.forEach(c => wins.set(c.winnerId, (wins.get(c.winnerId) ?? 0) + 1))

    const ranked = [...state.candidates]
      .sort((a, b) => (wins.get(b.id) ?? 0) - (wins.get(a.id) ?? 0))

    const winner = ranked[0] ?? state.candidates[0]
    const alts   = ranked.slice(1, 4)

    const allIds = [winner.id, ...alts.map(p => p.id)]
    const offerMap = await this.catalog.getBestOffers(allIds, geo)

    return {
      sessionId: sid,
      left:  this.toProductWithOffer(winner, offerMap.get(winner.id)),
      right: this.toProductWithOffer(alts[0] ?? winner, offerMap.get(alts[0]?.id ?? winner.id)),
      battleIndex: state.choices.length,
      confidence: state.confidence,
      isDone: true,
      winner: this.toProductWithOffer(winner, offerMap.get(winner.id)),
      winnerReasoning: `Based on your ${state.choices.length} comparisons, this best fits your preferences.`,
      alternatives: alts.map(p => this.toProductWithOffer(p, offerMap.get(p.id))),
    }
  }

  private toProductWithOffer(
    product: ProductConcept,
    offer?: (Offer & { merchant?: Merchant }),
  ): ProductWithOffer {
    return {
      id: product.id,
      brand: product.brand,
      name: product.name,
      category: product.category,
      attributes: product.attributes ?? {},
      price: offer ? Number(offer.price) : undefined,
      currency: offer?.currency,
      offerId: offer?.id,
      imageUrl: offer?.imageUrl ?? undefined,
    }
  }
}
