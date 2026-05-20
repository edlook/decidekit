import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ProductConcept } from '../../database/entities/product-concept.entity'
import { Offer } from '../../database/entities/offer.entity'
import { Merchant } from '../../database/entities/merchant.entity'
import { ClickEvent } from '../../database/entities/click-event.entity'
import { FeedIngestionJob } from '../../database/entities/feed-ingestion-job.entity'

export interface DashboardStats {
  catalog: {
    totalProducts: number
    totalOffers: number
    activeOffers: number
    staleOffers: number
    outOfStockOffers: number
    categoryCounts: Record<string, number>
  }
  merchants: {
    total: number
    active: number
    approved: number
    byNetwork: Record<string, number>
  }
  clicks: {
    total24h: number
    total7d: number
    redirectSuccessRate: number
    topOffers: Array<{ offerId: string; count: number }>
    byMode: Record<string, number>
  }
  ingestion: {
    lastRunAt: string | null
    lastRunStatus: string | null
    totalJobsThisWeek: number
    failedJobsThisWeek: number
  }
}

export interface OfferModerationItem {
  offerId: string
  productName: string
  brand: string
  merchantName: string
  price: number
  currency: string
  availability: string
  confidenceScore: number
  isPriceStale: boolean
  priceLastCheckedAt: Date | null
  deeplink: string
  flags: string[]
}

export interface MerchantQualityItem {
  merchantId: string
  merchantName: string
  network: string
  qualityScore: number
  totalOffers: number
  activeOffers: number
  staleOffers: number
  avgConfidence: number
  clickCount7d: number
  isApproved: boolean
}

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(ProductConcept) private productRepo: Repository<ProductConcept>,
    @InjectRepository(Offer)          private offerRepo: Repository<Offer>,
    @InjectRepository(Merchant)       private merchantRepo: Repository<Merchant>,
    @InjectRepository(ClickEvent)     private clickRepo: Repository<ClickEvent>,
    @InjectRepository(FeedIngestionJob) private jobRepo: Repository<FeedIngestionJob>,
  ) {}

  // ─── Dashboard ───────────────────────────────────────────────────────────

  async getDashboardStats(): Promise<DashboardStats> {
    const [
      totalProducts,
      totalOffers,
      activeOffers,
      staleOffers,
      outOfStock,
      totalMerchants,
      activeMerchants,
      approvedMerchants,
    ] = await Promise.all([
      this.productRepo.count(),
      this.offerRepo.count(),
      this.offerRepo.count({ where: { isActive: true } }),
      this.offerRepo.count({ where: { isPriceStale: true, isActive: true } }),
      this.offerRepo.count({ where: { availability: 'out_of_stock' } }),
      this.merchantRepo.count(),
      this.merchantRepo.count({ where: { isActive: true } }),
      this.merchantRepo.count({ where: { isApproved: true } }),
    ])

    // Category breakdown
    const catRaw = await this.productRepo
      .createQueryBuilder('p')
      .select('p.category', 'category')
      .addSelect('COUNT(*)', 'count')
      .groupBy('p.category')
      .getRawMany()
    const categoryCounts: Record<string, number> = {}
    for (const row of catRaw) categoryCounts[row.category] = parseInt(row.count, 10)

    // Network breakdown
    const netRaw = await this.merchantRepo
      .createQueryBuilder('m')
      .select('m.network', 'network')
      .addSelect('COUNT(*)', 'count')
      .groupBy('m.network')
      .getRawMany()
    const byNetwork: Record<string, number> = {}
    for (const row of netRaw) byNetwork[row.network] = parseInt(row.count, 10)

    // Clicks 24h / 7d
    const now = new Date()
    const h24 = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const d7  = new Date(now.getTime() - 7  * 24 * 60 * 60 * 1000)

    const [clicks24h, clicks7d] = await Promise.all([
      this.clickRepo.createQueryBuilder('c').where('c.createdAt >= :h24', { h24 }).getCount(),
      this.clickRepo.createQueryBuilder('c').where('c.createdAt >= :d7', { d7 }).getCount(),
    ])

    const successClicks = await this.clickRepo
      .createQueryBuilder('c')
      .where('c.createdAt >= :d7', { d7 })
      .andWhere('c.redirectStatus = :s', { s: 'success' })
      .getCount()

    const successRate = clicks7d > 0 ? Math.round((successClicks / clicks7d) * 100) : 0

    // Top offers by click count
    const topOffersRaw = await this.clickRepo
      .createQueryBuilder('c')
      .select('c.offerId', 'offerId')
      .addSelect('COUNT(*)', 'count')
      .where('c.createdAt >= :d7', { d7 })
      .groupBy('c.offerId')
      .orderBy('count', 'DESC')
      .limit(5)
      .getRawMany()

    // Clicks by mode
    const modeRaw = await this.clickRepo
      .createQueryBuilder('c')
      .select('c.mode', 'mode')
      .addSelect('COUNT(*)', 'count')
      .where('c.createdAt >= :d7', { d7 })
      .groupBy('c.mode')
      .getRawMany()
    const byMode: Record<string, number> = {}
    for (const row of modeRaw) byMode[row.mode] = parseInt(row.count, 10)

    // Last ingestion job
    const lastJob = await this.jobRepo.findOne({ order: { createdAt: 'DESC' } })
    const weekJobs = await this.jobRepo
      .createQueryBuilder('j')
      .where('j.createdAt >= :d7', { d7 })
      .getCount()
    const weekFailedJobs = await this.jobRepo
      .createQueryBuilder('j')
      .where('j.createdAt >= :d7', { d7 })
      .andWhere('j.status = :s', { s: 'failed' })
      .getCount()

    return {
      catalog: { totalProducts, totalOffers, activeOffers, staleOffers, outOfStockOffers: outOfStock, categoryCounts },
      merchants: { total: totalMerchants, active: activeMerchants, approved: approvedMerchants, byNetwork },
      clicks: {
        total24h: clicks24h, total7d: clicks7d,
        redirectSuccessRate: successRate,
        topOffers: topOffersRaw.map(r => ({ offerId: r.offerId, count: parseInt(r.count, 10) })),
        byMode,
      },
      ingestion: {
        lastRunAt: lastJob?.completedAt?.toISOString() ?? null,
        lastRunStatus: lastJob?.status ?? null,
        totalJobsThisWeek: weekJobs,
        failedJobsThisWeek: weekFailedJobs,
      },
    }
  }

  // ─── Offer moderation ─────────────────────────────────────────────────────

  async getOffersForModeration(
    filter: 'all' | 'stale' | 'low_confidence' | 'out_of_stock' = 'all',
    page = 1,
    limit = 50,
  ): Promise<{ items: OfferModerationItem[]; total: number }> {
    const qb = this.offerRepo
      .createQueryBuilder('o')
      .leftJoinAndSelect('o.productConcept', 'p')
      .leftJoinAndSelect('o.merchant', 'm')
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('o.updatedAt', 'DESC')

    if (filter === 'stale')          qb.where('o.isPriceStale = true AND o.isActive = true')
    else if (filter === 'low_confidence') qb.where('o.confidenceScore < 0.6 AND o.isActive = true')
    else if (filter === 'out_of_stock')   qb.where("o.availability = 'out_of_stock'")

    const [offers, total] = await qb.getManyAndCount()

    const items: OfferModerationItem[] = offers.map(o => ({
      offerId: o.id,
      productName: o.productConcept?.name ?? '—',
      brand: o.productConcept?.brand ?? '—',
      merchantName: o.merchant?.name ?? '—',
      price: Number(o.price),
      currency: o.currency,
      availability: o.availability,
      confidenceScore: o.confidenceScore,
      isPriceStale: o.isPriceStale,
      priceLastCheckedAt: o.priceLastCheckedAt,
      deeplink: o.deeplink,
      flags: buildFlags(o),
    }))

    return { items, total }
  }

  async deactivateOffer(offerId: string): Promise<void> {
    await this.offerRepo.update(offerId, { isActive: false })
  }

  async approveOffer(offerId: string): Promise<void> {
    await this.offerRepo.update(offerId, { confidenceScore: 1.0, isPriceStale: false })
  }

  // ─── Merchant quality ─────────────────────────────────────────────────────

  async getMerchantQuality(): Promise<MerchantQualityItem[]> {
    const merchants = await this.merchantRepo.find({ order: { qualityScore: 'DESC' } })
    const d7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    return Promise.all(
      merchants.map(async (m) => {
        const [totalOffers, activeOffers, staleOffers, avgConfRow, clickCount7d] =
          await Promise.all([
            this.offerRepo.count({ where: { merchantId: m.id } }),
            this.offerRepo.count({ where: { merchantId: m.id, isActive: true } }),
            this.offerRepo.count({ where: { merchantId: m.id, isPriceStale: true } }),
            this.offerRepo
              .createQueryBuilder('o')
              .select('AVG(o.confidenceScore)', 'avg')
              .where('o.merchantId = :id', { id: m.id })
              .getRawOne(),
            this.clickRepo
              .createQueryBuilder('c')
              .where('c.merchantId = :id', { id: m.id })
              .andWhere('c.createdAt >= :d7', { d7 })
              .getCount(),
          ])

        return {
          merchantId: m.id,
          merchantName: m.name,
          network: m.network,
          qualityScore: m.qualityScore,
          totalOffers,
          activeOffers,
          staleOffers,
          avgConfidence: parseFloat(avgConfRow?.avg ?? '0'),
          clickCount7d,
          isApproved: m.isApproved,
        }
      }),
    )
  }

  async updateMerchantQuality(merchantId: string, score: number, isApproved?: boolean): Promise<void> {
    const update: Partial<Merchant> = { qualityScore: score }
    if (isApproved !== undefined) update.isApproved = isApproved
    await this.merchantRepo.update(merchantId, update)
  }

  // ─── Recommendation QA ────────────────────────────────────────────────────

  async getRecentClicks(limit = 100) {
    return this.clickRepo.find({
      order: { createdAt: 'DESC' },
      take: limit,
    })
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildFlags(o: Offer): string[] {
  const flags: string[] = []
  if (o.isPriceStale)             flags.push('stale_price')
  if (o.confidenceScore < 0.5)    flags.push('low_confidence')
  if (o.availability === 'out_of_stock') flags.push('out_of_stock')
  if (!o.imageUrl)                flags.push('no_image')
  if (!o.deeplink)                flags.push('missing_deeplink')
  return flags
}
