import { Injectable, Logger } from '@nestjs/common'
import { SearchService } from '../../search/search.service'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Offer } from '../../../database/entities/offer.entity'
import type { MatchResult } from '../matchers/entity-matcher'

export interface WriteStats {
  created: number
  updated: number
  deactivated: number
  skipped: number
}

@Injectable()
export class OfferWriter {
  private readonly logger = new Logger(OfferWriter.name)

  // Staleness threshold: if price unchanged for 24h, mark stale
  private readonly STALE_HOURS = 24

  constructor(
    @InjectRepository(Offer)
    private offerRepo: Repository<Offer>,
    private search: SearchService,
  ) {}

  async writeBatch(matches: MatchResult[]): Promise<WriteStats> {
    const stats: WriteStats = { created: 0, updated: 0, deactivated: 0, skipped: 0 }
    const now = new Date()

    for (const match of matches) {
      try {
        const { item, productConcept, merchant } = match

        // Skip items with invalid deeplinks
        if (!item.deeplink || !this.isValidUrl(item.deeplink)) {
          stats.skipped++
          continue
        }

        // Find existing offer for this product + merchant combo
        const existing = await this.offerRepo.findOne({
          where: {
            productConceptId: productConcept.id,
            merchantId: merchant.id,
          },
        })

        const isStale = existing
          ? this.isStale(existing.priceLastCheckedAt, this.STALE_HOURS)
          : false

        const priceChanged = existing
          ? Math.abs(Number(existing.price) - item.normalizedPrice) > 0.01
          : true

        if (existing) {
          // Update existing offer
          await this.offerRepo.save({
            ...existing,
            price: item.normalizedPrice,
            currency: item.normalizedCurrency,
            availability: item.normalizedAvailability,
            deeplink: item.deeplink,
            imageUrl: item.imageUrl ?? existing.imageUrl,
            confidenceScore: item.confidenceScore,
            isPriceStale: !priceChanged && isStale,
            priceLastCheckedAt: now,
            isActive: item.normalizedAvailability !== 'out_of_stock',
            geo: item.geo ?? existing.geo,
            updatedAt: now,
          })
          stats.updated++
        } else {
          // Create new offer
          await this.offerRepo.save(
            this.offerRepo.create({
              productConceptId: productConcept.id,
              merchantId: merchant.id,
              price: item.normalizedPrice,
              currency: item.normalizedCurrency,
              availability: item.normalizedAvailability,
              deeplink: item.deeplink,
              imageUrl: item.imageUrl,
              confidenceScore: item.confidenceScore,
              isPriceStale: false,
              priceLastCheckedAt: now,
              isActive: item.normalizedAvailability !== 'out_of_stock',
              geo: item.geo ?? ['US'],
              trackingToken: this.extractToken(item.deeplink),
            }),
          )
          stats.created++
          // Index in OpenSearch asynchronously
          if (match.productConcept) {
            this.search.indexProduct(match.productConcept).catch(() => {})
          }
        }
      } catch (err) {
        this.logger.warn(`Failed to write offer for "${match.item.name}": ${err}`)
        stats.skipped++
      }
    }

    // Deactivate offers that weren't in this feed run (out-of-stock detection)
    // This is done at the job level, not here, to avoid partial-run false positives

    this.logger.log(
      `Offer write complete: +${stats.created} created, ~${stats.updated} updated, ` +
      `${stats.skipped} skipped`,
    )

    return stats
  }

  // Mark offers from a merchant as stale if not seen in this feed run
  async deactivateMissingOffers(
    merchantId: string,
    seenProductConceptIds: string[],
  ): Promise<number> {
    if (seenProductConceptIds.length === 0) return 0

    const result = await this.offerRepo
      .createQueryBuilder()
      .update(Offer)
      .set({ isActive: false, availability: 'out_of_stock' })
      .where('merchantId = :merchantId', { merchantId })
      .andWhere('productConceptId NOT IN (:...ids)', { ids: seenProductConceptIds })
      .andWhere('isActive = true')
      .execute()

    const count = result.affected ?? 0
    if (count > 0) {
      this.logger.log(`Deactivated ${count} stale offers for merchant ${merchantId}`)
    }
    return count
  }

  private isStale(checkedAt: Date | null, hours: number): boolean {
    if (!checkedAt) return true
    const ageMs = Date.now() - new Date(checkedAt).getTime()
    return ageMs > hours * 60 * 60 * 1000
  }

  private isValidUrl(url: string): boolean {
    try {
      const u = new URL(url)
      return u.protocol === 'https:' || u.protocol === 'http:'
    } catch {
      return false
    }
  }

  private extractToken(deeplink: string): string | undefined {
    try {
      return new URL(deeplink).searchParams.get('clickref')
        ?? new URL(deeplink).searchParams.get('u1')
        ?? undefined
    } catch {
      return undefined
    }
  }
}
