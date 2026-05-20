import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, Like, FindOptionsWhere, In } from 'typeorm'
import { ProductConcept } from '../../database/entities/product-concept.entity'
import { Offer } from '../../database/entities/offer.entity'
import { Merchant } from '../../database/entities/merchant.entity'
import { SearchService } from '../search/search.service'

export interface OfferWithProduct {
  offer: Offer
  product: ProductConcept
  merchant: Merchant
}

export interface RankedKit {
  role: string
  product: ProductConcept
  offer: Offer
  merchant: Merchant
  isLowConfidence: boolean
}

@Injectable()
export class CatalogService {
  private readonly logger = new Logger(CatalogService.name)

  constructor(
    @InjectRepository(ProductConcept)
    private productRepo: Repository<ProductConcept>,
    @InjectRepository(Offer)
    private offerRepo: Repository<Offer>,
    @InjectRepository(Merchant)
    private merchantRepo: Repository<Merchant>,
    private search: SearchService,
  ) {}

  // ─── Product search ───────────────────────────────────────────────────────

  async searchProducts(
    query: string,
    category?: string,
    limit = 20,
  ): Promise<ProductConcept[]> {
    // Try OpenSearch first (better relevance)
    if (this.search.isAvailable()) {
      const hits = await this.search.search(query, { category }, limit)
      if (hits.length > 0) {
        const ids = hits.map(h => h.id)
        const products = await this.productRepo.findBy({ id: In(ids) })
        // Re-sort by OpenSearch score order
        return ids.map(id => products.find(p => p.id === id)).filter(Boolean) as ProductConcept[]
      }
    }

    // Fallback: PostgreSQL ILIKE
    const where: FindOptionsWhere<ProductConcept>[] = [
      { name: Like(`%${query}%`), isActive: true },
      { brand: Like(`%${query}%`), isActive: true },
    ]
    if (category) {
      where.forEach(w => { w.category = category })
    }
    return this.productRepo.find({
      where,
      take: limit,
      order: { confidenceScore: 'DESC', updatedAt: 'DESC' },
    })
  }

  // ─── Best offer per product ───────────────────────────────────────────────

  async getBestOffers(
    productConceptIds: string[],
    geo = 'US',
    maxPricePerItem?: number,
  ): Promise<Map<string, Offer & { merchant: Merchant }>> {
    const results = new Map<string, Offer & { merchant: Merchant }>()

    for (const pcId of productConceptIds) {
      const offer = await this.offerRepo
        .createQueryBuilder('offer')
        .leftJoinAndSelect('offer.merchant', 'merchant')
        .where('offer.productConceptId = :pcId', { pcId })
        .andWhere('offer.isActive = true')
        .andWhere('offer.availability != :oos', { oos: 'out_of_stock' })
        .andWhere(':geo = ANY(offer.geo)', { geo })
        .andWhere(maxPricePerItem ? 'offer.price <= :max' : '1=1', { max: maxPricePerItem })
        .orderBy('(merchant.qualityScore * offer.confidenceScore)', 'DESC')
        .addOrderBy('offer.price', 'ASC')
        .getOne()

      if (offer) {
        results.set(pcId, offer as Offer & { merchant: Merchant })
      }
    }

    return results
  }

  // ─── Kit builder: find best items for each role/query ────────────────────

  async buildKit(
    items: Array<{ role: string; searchQuery: string; estimatedPriceMin: number; estimatedPriceMax: number }>,
    geo = 'US',
    budget?: number,
  ): Promise<RankedKit[]> {
    const kit: RankedKit[] = []

    // Budget per item = proportional to estimated range
    const totalEstimate = items.reduce((sum, i) => sum + (i.estimatedPriceMin + i.estimatedPriceMax) / 2, 0)

    for (const item of items) {
      const itemBudgetRatio = budget
        ? ((item.estimatedPriceMin + item.estimatedPriceMax) / 2) / totalEstimate
        : 1
      const itemMaxPrice = budget ? budget * itemBudgetRatio * 1.2 : undefined

      const products = await this.searchProducts(item.searchQuery, undefined, 10)

      if (products.length === 0) {
        this.logger.warn(`No products found for query: ${item.searchQuery}`)
        continue
      }

      // Find best offer among top candidates
      const productIds = products.map(p => p.id)
      const offerMap = await this.getBestOffers(productIds, geo, itemMaxPrice)

      // Pick the product with best offer
      let bestProduct: ProductConcept | null = null
      let bestOffer: (Offer & { merchant: Merchant }) | null = null

      for (const product of products) {
        const offer = offerMap.get(product.id)
        if (offer) {
          bestProduct = product
          bestOffer = offer
          break
        }
      }

      if (bestProduct && bestOffer) {
        kit.push({
          role: item.role,
          product: bestProduct,
          offer: bestOffer,
          merchant: bestOffer.merchant,
          isLowConfidence: bestProduct.confidenceScore < 0.7 || bestOffer.confidenceScore < 0.7,
        })
      } else {
        // Include with low confidence flag if no offer found
        if (products[0]) {
          kit.push({
            role: item.role,
            product: products[0],
            offer: null as unknown as Offer,
            merchant: null as unknown as Merchant,
            isLowConfidence: true,
          })
        }
      }
    }

    return kit
  }

  // ─── Substitutes / alternatives ──────────────────────────────────────────

  async findAlternatives(
    productConceptId: string,
    type: 'substitutes' | 'upgrades',
    geo = 'US',
  ): Promise<OfferWithProduct[]> {
    const product = await this.productRepo.findOne({ where: { id: productConceptId } })
    if (!product) return []

    const relatedIds = product.relationships?.[type] ?? []
    if (relatedIds.length === 0) return []

    const products = await this.productRepo.findBy({ id: In(relatedIds) })
    const offerMap = await this.getBestOffers(relatedIds, geo)

    return products
      .map(p => {
        const offer = offerMap.get(p.id)
        if (!offer) return null
        return { offer, product: p, merchant: offer.merchant }
      })
      .filter(Boolean) as OfferWithProduct[]
  }

  // ─── Admin: upsert product concept ───────────────────────────────────────

  async upsertProductConcept(
    data: Partial<ProductConcept> & { brand: string; name: string; category: string },
  ): Promise<ProductConcept> {
    const existing = await this.productRepo.findOne({
      where: { brand: data.brand, name: data.name },
    })

    if (existing) {
      return this.productRepo.save({ ...existing, ...data })
    }
    return this.productRepo.save(this.productRepo.create(data))
  }

  async upsertOffer(data: Partial<Offer> & {
    productConceptId: string
    merchantId: string
    price: number
    deeplink: string
  }): Promise<Offer> {
    const existing = await this.offerRepo.findOne({
      where: { productConceptId: data.productConceptId, merchantId: data.merchantId },
    })

    if (existing) {
      return this.offerRepo.save({ ...existing, ...data })
    }
    return this.offerRepo.save(this.offerRepo.create(data))
  }
}
