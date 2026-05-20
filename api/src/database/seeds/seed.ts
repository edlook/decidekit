// Run with: npx ts-node src/database/seeds/seed.ts
// Or import SeedService into a NestJS command

import { DataSource } from 'typeorm'
import { ProductConcept } from '../entities/product-concept.entity'
import { Merchant } from '../entities/merchant.entity'
import { Offer } from '../entities/offer.entity'

// ─── Seed data ────────────────────────────────────────────────────────────

const MERCHANTS = [
  { name: 'Amazon US',      network: 'awin' as const, qualityScore: 9.2, geoMarkets: ['US', 'CA'], networkMerchantId: 'amz-us' },
  { name: 'Amazon UK',      network: 'awin' as const, qualityScore: 9.0, geoMarkets: ['GB'],       networkMerchantId: 'amz-uk' },
  { name: 'Best Buy',       network: 'rakuten' as const, qualityScore: 8.5, geoMarkets: ['US'],    networkMerchantId: 'bbuy' },
  { name: 'B&H Photo',      network: 'rakuten' as const, qualityScore: 8.8, geoMarkets: ['US'],    networkMerchantId: 'bhphoto' },
  { name: 'Currys',         network: 'awin' as const, qualityScore: 8.0, geoMarkets: ['GB'],       networkMerchantId: 'currys' },
  { name: 'Thomann',        network: 'awin' as const, qualityScore: 8.6, geoMarkets: ['DE', 'GB'], networkMerchantId: 'thomann' },
]

const PRODUCTS: Array<{
  brand: string; name: string; category: string; subcategory: string
  attributes: Record<string, string>
  relationships?: { substitutes?: number[]; upgrades?: number[] }
  offers: Array<{ merchantIdx: number; price: number; currency: string; geo: string[] }>
}> = [
  // ── Headphones ──────────────────────────────────────────────────────────
  {
    brand: 'Sony', name: 'WH-1000XM5', category: 'audio', subcategory: 'headphones',
    attributes: { type: 'over-ear', connectivity: 'bluetooth', anc: 'yes', battery: '30hr', weight: '250g', color: 'black' },
    offers: [
      { merchantIdx: 0, price: 279.99, currency: 'USD', geo: ['US'] },
      { merchantIdx: 2, price: 299.99, currency: 'USD', geo: ['US'] },
      { merchantIdx: 4, price: 249.00, currency: 'GBP', geo: ['GB'] },
    ],
  },
  {
    brand: 'Sony', name: 'WH-1000XM4', category: 'audio', subcategory: 'headphones',
    attributes: { type: 'over-ear', connectivity: 'bluetooth', anc: 'yes', battery: '30hr', weight: '254g', color: 'black' },
    offers: [
      { merchantIdx: 0, price: 199.99, currency: 'USD', geo: ['US'] },
      { merchantIdx: 2, price: 219.99, currency: 'USD', geo: ['US'] },
    ],
  },
  {
    brand: 'Bose', name: 'QuietComfort 45', category: 'audio', subcategory: 'headphones',
    attributes: { type: 'over-ear', connectivity: 'bluetooth', anc: 'yes', battery: '24hr', weight: '238g', color: 'white' },
    offers: [
      { merchantIdx: 0, price: 249.00, currency: 'USD', geo: ['US'] },
      { merchantIdx: 4, price: 219.00, currency: 'GBP', geo: ['GB'] },
    ],
  },
  {
    brand: 'Apple', name: 'AirPods Pro (2nd gen)', category: 'audio', subcategory: 'headphones',
    attributes: { type: 'in-ear', connectivity: 'bluetooth', anc: 'yes', battery: '6hr', case_battery: '30hr', color: 'white' },
    offers: [
      { merchantIdx: 0, price: 199.00, currency: 'USD', geo: ['US'] },
      { merchantIdx: 2, price: 189.99, currency: 'USD', geo: ['US'] },
    ],
  },
  {
    brand: 'Anker', name: 'Soundcore Q45', category: 'audio', subcategory: 'headphones',
    attributes: { type: 'over-ear', connectivity: 'bluetooth', anc: 'yes', battery: '50hr', weight: '265g', color: 'black' },
    offers: [
      { merchantIdx: 0, price: 79.99, currency: 'USD', geo: ['US'] },
    ],
  },
  {
    brand: 'Sennheiser', name: 'HD 560S', category: 'audio', subcategory: 'headphones',
    attributes: { type: 'over-ear', connectivity: 'wired', impedance: '120ohm', weight: '240g' },
    offers: [
      { merchantIdx: 0, price: 149.95, currency: 'USD', geo: ['US'] },
      { merchantIdx: 5, price: 129.00, currency: 'EUR', geo: ['DE'] },
    ],
  },

  // ── Microphones ─────────────────────────────────────────────────────────
  {
    brand: 'Blue', name: 'Yeti USB Microphone', category: 'audio', subcategory: 'microphones',
    attributes: { type: 'usb', polar_pattern: 'cardioid/omni/bidirectional/stereo', frequency: '20Hz-20kHz', color: 'black' },
    offers: [
      { merchantIdx: 0, price: 99.99, currency: 'USD', geo: ['US'] },
      { merchantIdx: 2, price: 109.99, currency: 'USD', geo: ['US'] },
    ],
  },
  {
    brand: 'Rode', name: 'NT-USB Mini', category: 'audio', subcategory: 'microphones',
    attributes: { type: 'usb', polar_pattern: 'cardioid', frequency: '20Hz-20kHz' },
    offers: [
      { merchantIdx: 0, price: 99.00, currency: 'USD', geo: ['US'] },
      { merchantIdx: 5, price: 89.00, currency: 'EUR', geo: ['DE'] },
    ],
  },
  {
    brand: 'Shure', name: 'SM7B', category: 'audio', subcategory: 'microphones',
    attributes: { type: 'xlr', polar_pattern: 'cardioid', frequency: '50Hz-20kHz', weight: '766g' },
    offers: [
      { merchantIdx: 0, price: 359.00, currency: 'USD', geo: ['US'] },
      { merchantIdx: 3, price: 379.95, currency: 'USD', geo: ['US'] },
    ],
  },

  // ── Laptops ─────────────────────────────────────────────────────────────
  {
    brand: 'Apple', name: 'MacBook Pro 14" M3', category: 'computing', subcategory: 'laptops',
    attributes: { screen: '14.2"', chip: 'M3', ram: '8GB', storage: '512GB SSD', battery: '22hr', weight: '1.55kg', color: 'silver' },
    offers: [
      { merchantIdx: 0, price: 1599.00, currency: 'USD', geo: ['US'] },
      { merchantIdx: 2, price: 1599.00, currency: 'USD', geo: ['US'] },
    ],
  },
  {
    brand: 'Apple', name: 'MacBook Air 15" M2', category: 'computing', subcategory: 'laptops',
    attributes: { screen: '15.3"', chip: 'M2', ram: '8GB', storage: '256GB SSD', battery: '18hr', weight: '1.51kg', color: 'midnight' },
    offers: [
      { merchantIdx: 0, price: 1299.00, currency: 'USD', geo: ['US'] },
      { merchantIdx: 2, price: 1249.99, currency: 'USD', geo: ['US'] },
    ],
  },
  {
    brand: 'Dell', name: 'XPS 13 9340', category: 'computing', subcategory: 'laptops',
    attributes: { screen: '13.4"', cpu: 'Intel Core Ultra 5', ram: '16GB', storage: '512GB SSD', weight: '1.17kg', color: 'platinum' },
    offers: [
      { merchantIdx: 0, price: 999.00, currency: 'USD', geo: ['US'] },
      { merchantIdx: 2, price: 1049.99, currency: 'USD', geo: ['US'] },
    ],
  },
  {
    brand: 'Lenovo', name: 'ThinkPad X1 Carbon Gen 12', category: 'computing', subcategory: 'laptops',
    attributes: { screen: '14"', cpu: 'Intel Core Ultra 7', ram: '16GB', storage: '512GB SSD', weight: '1.12kg' },
    offers: [
      { merchantIdx: 0, price: 1449.00, currency: 'USD', geo: ['US'] },
    ],
  },
  {
    brand: 'ASUS', name: 'VivoBook 15', category: 'computing', subcategory: 'laptops',
    attributes: { screen: '15.6"', cpu: 'AMD Ryzen 5 7520U', ram: '8GB', storage: '512GB SSD', weight: '1.7kg' },
    offers: [
      { merchantIdx: 0, price: 449.99, currency: 'USD', geo: ['US'] },
      { merchantIdx: 2, price: 479.99, currency: 'USD', geo: ['US'] },
    ],
  },

  // ── Monitors ────────────────────────────────────────────────────────────
  {
    brand: 'LG', name: 'UltraFine 27" 4K USB-C', category: 'computing', subcategory: 'monitors',
    attributes: { size: '27"', resolution: '4K UHD', panel: 'IPS', refresh: '60Hz', connectivity: 'USB-C', hdr: 'HDR400' },
    offers: [
      { merchantIdx: 0, price: 549.99, currency: 'USD', geo: ['US'] },
      { merchantIdx: 2, price: 579.99, currency: 'USD', geo: ['US'] },
    ],
  },
  {
    brand: 'Dell', name: 'S2722QC 27" 4K', category: 'computing', subcategory: 'monitors',
    attributes: { size: '27"', resolution: '4K UHD', panel: 'IPS', refresh: '60Hz', connectivity: 'USB-C/HDMI' },
    offers: [
      { merchantIdx: 0, price: 379.99, currency: 'USD', geo: ['US'] },
    ],
  },
]

// ─── Seed runner ──────────────────────────────────────────────────────────

export async function seed(dataSource: DataSource): Promise<void> {
  const conceptRepo = dataSource.getRepository(ProductConcept)
  const merchantRepo = dataSource.getRepository(Merchant)
  const offerRepo = dataSource.getRepository(Offer)

  console.log('🌱 Seeding database…')

  // Create merchants
  const merchantEntities: Merchant[] = []
  for (const m of MERCHANTS) {
    let merchant = await merchantRepo.findOne({ where: { name: m.name } })
    if (!merchant) {
      merchant = await merchantRepo.save(
        merchantRepo.create({ ...m, isActive: true, isApproved: true }),
      )
      console.log(`  ✓ Merchant: ${m.name}`)
    }
    merchantEntities.push(merchant)
  }

  // Create products + offers
  let conceptCount = 0
  let offerCount = 0

  for (const p of PRODUCTS) {
    let concept = await conceptRepo.findOne({ where: { brand: p.brand, name: p.name } })
    if (!concept) {
      concept = await conceptRepo.save(
        conceptRepo.create({
          brand: p.brand,
          name: p.name,
          category: p.category,
          subcategory: p.subcategory,
          attributes: p.attributes,
          relationships: { substitutes: [], upgrades: [], bundles: [], compatible: [] },
          confidenceScore: 0.95,
          source: 'seed',
          isActive: true,
        }),
      )
      conceptCount++
    }

    for (const o of p.offers) {
      const merchant = merchantEntities[o.merchantIdx]
      const existing = await offerRepo.findOne({
        where: { productConceptId: concept.id, merchantId: merchant.id },
      })
      if (!existing) {
        await offerRepo.save(
          offerRepo.create({
            productConceptId: concept.id,
            merchantId: merchant.id,
            price: o.price,
            currency: o.currency,
            availability: 'in_stock',
            geo: o.geo,
            deeplink: `https://example.com/r/${concept.id}?merchant=${merchant.id}`,
            imageUrl: `https://via.placeholder.com/300x300.png?text=${encodeURIComponent(p.name)}`,
            confidenceScore: 0.9,
            isPriceStale: false,
            priceLastCheckedAt: new Date(),
            isActive: true,
          }),
        )
        offerCount++
      }
    }
  }

  // Wire up relationships (substitutes/upgrades) after all concepts created
  const allConcepts = await conceptRepo.find()
  const findByName = (name: string) => allConcepts.find(c => c.name === name)

  const xm5 = findByName('WH-1000XM5')
  const xm4 = findByName('WH-1000XM4')
  const qc45 = findByName('QuietComfort 45')
  const q45 = findByName('Soundcore Q45')

  if (xm5 && xm4 && qc45 && q45) {
    xm5.relationships = { substitutes: [qc45.id, xm4.id], upgrades: [], bundles: [], compatible: [] }
    xm4.relationships = { substitutes: [qc45.id, q45.id], upgrades: [xm5.id], bundles: [], compatible: [] }
    qc45.relationships = { substitutes: [xm5.id, xm4.id], upgrades: [], bundles: [], compatible: [] }
    q45.relationships = { substitutes: [xm4.id], upgrades: [xm5.id, qc45.id], bundles: [], compatible: [] }
    await conceptRepo.save([xm5, xm4, qc45, q45])
  }

  console.log(`\n✅ Seed complete: ${conceptCount} products, ${offerCount} offers, ${merchantEntities.length} merchants\n`)
}
