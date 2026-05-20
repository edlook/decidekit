import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ProductConcept } from '../../../database/entities/product-concept.entity'
import { Merchant } from '../../../database/entities/merchant.entity'
import type { NormalizedFeedItem } from '../types'

export interface MatchResult {
  item: NormalizedFeedItem
  productConcept: ProductConcept
  merchant: Merchant
  matchType: 'exact_ean' | 'exact_mpn' | 'brand_name' | 'name_fuzzy' | 'new'
}

@Injectable()
export class EntityMatcher {
  private readonly logger = new Logger(EntityMatcher.name)

  constructor(
    @InjectRepository(ProductConcept)
    private productRepo: Repository<ProductConcept>,
    @InjectRepository(Merchant)
    private merchantRepo: Repository<Merchant>,
  ) {}

  async matchBatch(items: NormalizedFeedItem[]): Promise<MatchResult[]> {
    const results: MatchResult[] = []

    // Pre-load merchants to avoid N+1 queries
    const merchantCache = new Map<string, Merchant>()

    for (const item of items) {
      try {
        const merchant = await this.getOrCreateMerchant(
          item.sourceMerchantName,
          item.sourceNetwork,
          item.sourceAdvertiserId,
          merchantCache,
        )

        const { concept, matchType } = await this.matchProductConcept(item)

        results.push({ item, productConcept: concept, merchant, matchType })
      } catch (err) {
        this.logger.warn(`Match failed for "${item.name}": ${err}`)
      }
    }

    this.logger.log(
      `Matched ${results.length}/${items.length} items. ` +
      `Types: ${summarizeMatchTypes(results)}`,
    )

    return results
  }

  // ─── Product matching ───────────────────────────────────────────────────

  private async matchProductConcept(
    item: NormalizedFeedItem,
  ): Promise<{ concept: ProductConcept; matchType: MatchResult['matchType'] }> {

    // 1. Exact EAN/GTIN match (highest confidence)
    if (item.ean && item.ean.length >= 8) {
      const match = await this.productRepo
        .createQueryBuilder('p')
        .where(`p.attributes->>'ean' = :ean`, { ean: item.ean })
        .getOne()
      if (match) return { concept: match, matchType: 'exact_ean' }
    }

    // 2. Exact MPN match
    if (item.mpn) {
      const match = await this.productRepo
        .createQueryBuilder('p')
        .where(`p.attributes->>'mpn' = :mpn`, { mpn: item.mpn })
        .getOne()
      if (match) return { concept: match, matchType: 'exact_mpn' }
    }

    // 3. Brand + exact name match (case-insensitive)
    if (item.normalizedBrand && item.normalizedBrand !== 'Unknown') {
      const match = await this.productRepo
        .createQueryBuilder('p')
        .where('LOWER(p.brand) = LOWER(:brand)', { brand: item.normalizedBrand })
        .andWhere('LOWER(p.name) = LOWER(:name)', { name: item.name })
        .getOne()
      if (match) return { concept: match, matchType: 'brand_name' }
    }

    // 4. Fuzzy name match within same category (using ILIKE)
    if (item.normalizedCategory !== 'other') {
      const words = item.name.split(/\s+/).filter(w => w.length > 3).slice(0, 4)
      if (words.length >= 2) {
        const pattern = `%${words.join('%')}%`
        const match = await this.productRepo
          .createQueryBuilder('p')
          .where('p.name ILIKE :pattern', { pattern })
          .andWhere('p.category = :cat', { cat: item.normalizedCategory })
          .getOne()
        if (match) return { concept: match, matchType: 'name_fuzzy' }
      }
    }

    // 5. No match → create new ProductConcept
    const newConcept = await this.createProductConcept(item)
    return { concept: newConcept, matchType: 'new' }
  }

  private async createProductConcept(item: NormalizedFeedItem): Promise<ProductConcept> {
    const attrs: Record<string, string> = { ...(item.attributes ?? {}) }
    if (item.ean) attrs.ean = item.ean
    if (item.mpn) attrs.mpn = item.mpn

    const concept = this.productRepo.create({
      brand: item.normalizedBrand,
      name: item.name,
      category: item.normalizedCategory,
      subcategory: item.normalizedSubcategory,
      attributes: attrs,
      relationships: { substitutes: [], upgrades: [], bundles: [], compatible: [] },
      confidenceScore: item.confidenceScore,
      source: 'feed',
      isActive: true,
    })

    return this.productRepo.save(concept)
  }

  // ─── Merchant matching ─────────────────────────────────────────────────

  private async getOrCreateMerchant(
    name: string,
    network: string,
    networkMerchantId: string,
    cache: Map<string, Merchant>,
  ): Promise<Merchant> {
    const cacheKey = `${network}:${networkMerchantId}`
    if (cache.has(cacheKey)) return cache.get(cacheKey)!

    let merchant = await this.merchantRepo.findOne({
      where: { networkMerchantId, network: network as any },
    })

    if (!merchant) {
      merchant = await this.merchantRepo.findOne({ where: { name } })
    }

    if (!merchant) {
      merchant = await this.merchantRepo.save(
        this.merchantRepo.create({
          name,
          network: network as any,
          networkMerchantId,
          qualityScore: 5.0,
          geoMarkets: network === 'awin' ? ['GB', 'DE', 'FR'] : ['US'],
          isActive: true,
          isApproved: false,
        }),
      )
      this.logger.log(`Created new merchant: ${name} (${network})`)
    }

    cache.set(cacheKey, merchant)
    return merchant
  }
}

function summarizeMatchTypes(results: MatchResult[]): string {
  const counts: Record<string, number> = {}
  for (const r of results) {
    counts[r.matchType] = (counts[r.matchType] ?? 0) + 1
  }
  return Object.entries(counts).map(([k, v]) => `${k}=${v}`).join(', ')
}
