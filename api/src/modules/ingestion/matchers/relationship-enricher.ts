import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, In } from 'typeorm'
import { ProductConcept } from '../../../database/entities/product-concept.entity'

// After writing a batch of products, enrich their relationship graphs.
// Uses price + brand + attribute similarity heuristics.

@Injectable()
export class RelationshipEnricher {
  private readonly logger = new Logger(RelationshipEnricher.name)

  constructor(
    @InjectRepository(ProductConcept)
    private productRepo: Repository<ProductConcept>,
  ) {}

  async enrichBatch(productIds: string[]): Promise<void> {
    if (productIds.length === 0) return

    const products = await this.productRepo.findBy({ id: In(productIds) })
    let updated = 0

    for (const product of products) {
      // Find peers: same category, different brand or model
      const peers = await this.productRepo
        .createQueryBuilder('p')
        .where('p.category = :cat', { cat: product.category })
        .andWhere('p.id != :id', { id: product.id })
        .andWhere('p.isActive = true')
        .limit(30)
        .getMany()

      if (peers.length === 0) continue

      const substitutes: string[] = []
      const upgrades: string[] = []

      for (const peer of peers) {
        const rel = this.classifyRelationship(product, peer)
        if (rel === 'substitute') substitutes.push(peer.id)
        else if (rel === 'upgrade') upgrades.push(peer.id)
      }

      // Only update if relationships changed meaningfully
      const existing = product.relationships ?? { substitutes: [], upgrades: [], bundles: [], compatible: [] }
      const newSubs = dedupMerge(existing.substitutes, substitutes, 6)
      const newUps  = dedupMerge(existing.upgrades, upgrades, 4)

      if (
        newSubs.length !== existing.substitutes.length ||
        newUps.length !== existing.upgrades.length
      ) {
        await this.productRepo.update(product.id, {
          relationships: {
            ...existing,
            substitutes: newSubs,
            upgrades: newUps,
          },
        })
        updated++
      }
    }

    if (updated > 0) {
      this.logger.log(`Relationship enricher: updated ${updated}/${products.length} products`)
    }
  }

  private classifyRelationship(
    base: ProductConcept,
    peer: ProductConcept,
  ): 'substitute' | 'upgrade' | 'unrelated' {
    // Same subcategory = potential substitute
    if (base.subcategory && peer.subcategory && base.subcategory === peer.subcategory) {
      return 'substitute'
    }

    // Same category, peer has higher confidence = potential upgrade suggestion
    if (base.category === peer.category && peer.confidenceScore > base.confidenceScore + 0.1) {
      return 'upgrade'
    }

    return 'unrelated'
  }
}

function dedupMerge(existing: string[], incoming: string[], max: number): string[] {
  const set = new Set([...existing, ...incoming])
  return [...set].slice(0, max)
}
