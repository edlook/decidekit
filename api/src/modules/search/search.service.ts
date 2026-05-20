import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Client } from '@opensearch-project/opensearch'
import type { ProductConcept } from '../../database/entities/product-concept.entity'

const INDEX = 'products'

const INDEX_MAPPING = {
  settings: {
    number_of_shards: 1,
    number_of_replicas: 0,
    analysis: {
      analyzer: {
        product_analyzer: {
          type: 'custom',
          tokenizer: 'standard',
          filter: ['lowercase', 'asciifolding', 'stop'],
        },
      },
    },
  },
  mappings: {
    properties: {
      id:          { type: 'keyword' },
      brand:       { type: 'text', analyzer: 'product_analyzer', fields: { keyword: { type: 'keyword' } } },
      name:        { type: 'text', analyzer: 'product_analyzer', boost: 2 },
      category:    { type: 'keyword' },
      subcategory: { type: 'keyword' },
      attributes:  { type: 'object', enabled: true },
      isActive:    { type: 'boolean' },
      confidenceScore: { type: 'float' },
      updatedAt:   { type: 'date' },
    },
  },
}

export interface SearchHit {
  id: string
  brand: string
  name: string
  category: string
  subcategory: string
  score: number
}

@Injectable()
export class SearchService implements OnModuleInit {
  private readonly logger = new Logger(SearchService.name)
  private client: Client
  private available = false

  constructor(private config: ConfigService) {
    const url = this.config.get<string>('opensearch.url') ?? 'http://localhost:9200'
    this.client = new Client({ node: url })
  }

  async onModuleInit() {
    try {
      await this.client.cluster.health({})
      await this.ensureIndex()
      this.available = true
      this.logger.log('OpenSearch connected')
    } catch {
      this.logger.warn('OpenSearch unavailable — search will fall back to PostgreSQL')
    }
  }

  // ─── Index a product ────────────────────────────────────────────────────

  async indexProduct(product: ProductConcept): Promise<void> {
    if (!this.available) return
    try {
      await this.client.index({
        index: INDEX,
        id: product.id,
        body: {
          id: product.id,
          brand: product.brand,
          name: product.name,
          category: product.category,
          subcategory: product.subcategory,
          attributes: product.attributes,
          isActive: product.isActive,
          confidenceScore: product.confidenceScore,
          updatedAt: new Date().toISOString(),
        },
        refresh: 'wait_for',
      })
    } catch (err) {
      this.logger.warn(`Failed to index product ${product.id}: ${err}`)
    }
  }

  async indexBatch(products: ProductConcept[]): Promise<void> {
    if (!this.available || products.length === 0) return
    const body = products.flatMap(p => [
      { index: { _index: INDEX, _id: p.id } },
      {
        id: p.id, brand: p.brand, name: p.name,
        category: p.category, subcategory: p.subcategory,
        attributes: p.attributes, isActive: p.isActive,
        confidenceScore: p.confidenceScore, updatedAt: new Date().toISOString(),
      },
    ])
    try {
      const { body: res } = await this.client.bulk({ body, refresh: 'wait_for' })
      if (res.errors) {
        this.logger.warn('Bulk index had errors — check individual items')
      }
    } catch (err) {
      this.logger.warn(`Bulk index failed: ${err}`)
    }
  }

  // ─── Full-text + faceted search ─────────────────────────────────────────

  async search(
    query: string,
    filters: { category?: string; minConfidence?: number } = {},
    limit = 20,
  ): Promise<SearchHit[]> {
    if (!this.available) return []

    try {
      const must: any[] = [
        {
          multi_match: {
            query,
            fields: ['name^3', 'brand^2', 'category', 'subcategory', 'attributes.*'],
            type: 'best_fields',
            fuzziness: 'AUTO',
            minimum_should_match: '75%',
          },
        },
        { term: { isActive: true } },
      ]

      if (filters.category) must.push({ term: { category: filters.category } })
      if (filters.minConfidence) {
        must.push({ range: { confidenceScore: { gte: filters.minConfidence } } })
      }

      const { body } = await this.client.search({
        index: INDEX,
        body: {
          query: { bool: { must } },
          sort: [{ _score: 'desc' }, { confidenceScore: 'desc' }],
          size: limit,
          _source: ['id', 'brand', 'name', 'category', 'subcategory'],
        },
      })

      return body.hits.hits.map((h: any) => ({
        ...h._source,
        score: h._score,
      }))
    } catch (err) {
      this.logger.warn(`Search failed: ${err}`)
      return []
    }
  }

  // ─── Suggest / autocomplete ─────────────────────────────────────────────

  async suggest(prefix: string, limit = 5): Promise<string[]> {
    if (!this.available) return []
    try {
      const { body } = await this.client.search({
        index: INDEX,
        body: {
          query: {
            bool: {
              should: [
                { prefix: { 'name': { value: prefix.toLowerCase(), boost: 2 } } },
                { prefix: { 'brand.keyword': { value: prefix } } },
              ],
            },
          },
          size: limit,
          _source: ['name', 'brand'],
        },
      })
      return body.hits.hits.map((h: any) => `${h._source.brand} ${h._source.name}`)
    } catch {
      return []
    }
  }

  isAvailable() { return this.available }

  private async ensureIndex(): Promise<void> {
    const { body: exists } = await this.client.indices.exists({ index: INDEX })
    if (!exists) {
      await this.client.indices.create({ index: INDEX, body: INDEX_MAPPING as any })
      this.logger.log(`Created OpenSearch index: ${INDEX}`)
    }
  }
}
