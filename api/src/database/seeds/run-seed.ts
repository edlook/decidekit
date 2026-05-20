import { DataSource } from 'typeorm'
import { Client } from '@opensearch-project/opensearch'
import { config } from 'dotenv'
import { ProductConcept } from '../entities/product-concept.entity'
import { Offer } from '../entities/offer.entity'
import { Merchant } from '../entities/merchant.entity'
import { ClickEvent } from '../entities/click-event.entity'
import { FeedIngestionJob } from '../entities/feed-ingestion-job.entity'
import { seed } from './seed'

config()

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  database: process.env.DB_NAME ?? 'decidekitdb',
  username: process.env.DB_USER ?? 'postgres',
  password: process.env.DB_PASS ?? 'password',
  entities: [ProductConcept, Offer, Merchant, ClickEvent, FeedIngestionJob],
  synchronize: true,
  logging: false,
})

async function indexProductsInOpenSearch(products: ProductConcept[]) {
  const url = process.env.OPENSEARCH_URL ?? 'http://localhost:9200'
  const client = new Client({ node: url })

  try {
    await client.cluster.health({})
  } catch {
    console.log('⚠  OpenSearch not reachable — skipping index')
    return
  }

  // Ensure index exists
  const { body: exists } = await client.indices.exists({ index: 'products' }).catch(() => ({ body: false }))
  if (!exists) {
    await client.indices.create({
      index: 'products',
      body: {
        settings: { number_of_shards: 1, number_of_replicas: 0 },
        mappings: {
          properties: {
            id: { type: 'keyword' },
            brand: { type: 'text', fields: { keyword: { type: 'keyword' } } },
            name: { type: 'text', boost: 2 },
            category: { type: 'keyword' },
            subcategory: { type: 'keyword' },
            isActive: { type: 'boolean' },
            confidenceScore: { type: 'float' },
          },
        },
      } as any,
    })
    console.log('  ✓ Created OpenSearch index: products')
  }

  const body = products.flatMap(p => [
    { index: { _index: 'products', _id: p.id } },
    { id: p.id, brand: p.brand, name: p.name, category: p.category, subcategory: p.subcategory, isActive: p.isActive, confidenceScore: p.confidenceScore },
  ])

  const { body: res } = await client.bulk({ body, refresh: 'wait_for' })
  const indexed = products.length - (res.items?.filter((i: any) => i.index?.error).length ?? 0)
  console.log(`  ✓ Indexed ${indexed}/${products.length} products in OpenSearch`)
}

async function main() {
  console.log('📦 Connecting to PostgreSQL…')
  await dataSource.initialize()
  console.log('✅ Connected\n')

  await seed(dataSource)

  // Index all products in OpenSearch
  console.log('\n🔍 Indexing products in OpenSearch…')
  const products = await dataSource.getRepository(ProductConcept).find()
  await indexProductsInOpenSearch(products)

  await dataSource.destroy()
  console.log('\n✅ Done\n')
  process.exit(0)
}

main().catch(err => {
  console.error('❌ Seed failed:', err)
  process.exit(1)
})
