import { Logger } from '@nestjs/common'
import { XMLParser } from 'fast-xml-parser'
import { parse as parseCsv } from 'csv-parse/sync'
import type { RawFeedItem } from '../types'

const logger = new Logger('AwinParser')

// Awin feeds come as XML (standard) or CSV (advertiser-specific)
// XML schema: <merchant><products><product>...</product></products></merchant>

export function parseAwinXml(xml: string, advertiserId: string, merchantName: string): RawFeedItem[] {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    isArray: (name) => ['product', 'merchant'].includes(name),
  })

  let parsed: any
  try {
    parsed = parser.parse(xml)
  } catch (err) {
    logger.error(`Awin XML parse error: ${err}`)
    return []
  }

  // Handle both <feed><products> and <merchant><products> root shapes
  const root = parsed?.feed ?? parsed?.merchant ?? parsed
  const products: any[] = root?.products?.product ?? root?.product ?? []

  if (!Array.isArray(products) || products.length === 0) {
    logger.warn(`Awin XML: no products found for advertiser ${advertiserId}`)
    return []
  }

  const now = new Date().toISOString()
  const items: RawFeedItem[] = []

  for (const p of products) {
    try {
      const item = mapAwinProduct(p, advertiserId, merchantName, now)
      if (item) items.push(item)
    } catch (err) {
      logger.debug(`Skipping malformed Awin product: ${err}`)
    }
  }

  logger.log(`Awin XML: parsed ${items.length}/${products.length} products for ${merchantName}`)
  return items
}

export function parseAwinCsv(csv: string, advertiserId: string, merchantName: string): RawFeedItem[] {
  let rows: Record<string, string>[]
  try {
    rows = parseCsv(csv, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_quotes: true,
    }) as Record<string, string>[]
  } catch (err) {
    logger.error(`Awin CSV parse error: ${err}`)
    return []
  }

  const now = new Date().toISOString()
  const items: RawFeedItem[] = []

  for (const row of rows) {
    try {
      const item = mapAwinCsvRow(row, advertiserId, merchantName, now)
      if (item) items.push(item)
    } catch (err) {
      logger.debug(`Skipping malformed Awin CSV row: ${err}`)
    }
  }

  logger.log(`Awin CSV: parsed ${items.length}/${rows.length} rows for ${merchantName}`)
  return items
}

// ─── Awin XML → RawFeedItem ───────────────────────────────────────────────

function mapAwinProduct(
  p: any,
  advertiserId: string,
  merchantName: string,
  fetchedAt: string,
): RawFeedItem | null {
  const name = str(p.name ?? p.product_name ?? p.title)
  const price = parseFloat(str(p.price ?? p.aw_deep_link_price ?? p['price:sale'] ?? '0'))

  if (!name || isNaN(price) || price <= 0) return null

  return {
    sourceNetwork: 'awin',
    sourceAdvertiserId: advertiserId,
    sourceMerchantName: merchantName,
    feedFetchedAt: fetchedAt,

    externalId: str(p.id ?? p.product_id ?? p.aw_product_id),
    ean: str(p.ean ?? p.gtin ?? p.barcode) || undefined,
    mpn: str(p.mpn ?? p.manufacturer_part_no) || undefined,

    name,
    brand: str(p.brand_name ?? p.brand ?? p.manufacturer) || undefined,
    description: str(p.description ?? p.long_description) || undefined,
    category: str(p.category_name ?? p.merchant_category ?? p.google_category) || undefined,
    subcategory: str(p.subcategory ?? p.merchant_subcategory) || undefined,

    price,
    currency: str(p.currency_code ?? p.currency ?? 'GBP').toUpperCase(),
    originalPrice: parseFloat(str(p.was_price ?? p.rrp ?? '0')) || undefined,
    availability: str(p.in_stock ?? p.availability ?? p.stock_quantity ?? ''),
    inStock: parseBool(p.in_stock ?? p.availability),

    productUrl: str(p.merchant_product_second_image ?? p.aw_product_url ?? p.product_url),
    deeplink: str(p.aw_deep_link ?? p.deep_link ?? p.buy_url),
    imageUrl: str(p.aw_image_url ?? p.merchant_image_url ?? p.image_url) || undefined,

    attributes: extractAttributes(p),
    geo: ['GB'],
  }
}

// ─── Awin CSV → RawFeedItem ───────────────────────────────────────────────

// Awin CSV columns vary by advertiser; map common aliases
const CSV_MAP: Record<string, string> = {
  'product name': 'name', 'title': 'name', 'product title': 'name',
  'aw deep link': 'deeplink', 'deep link': 'deeplink', 'tracking url': 'deeplink',
  'search price': 'price', 'price': 'price', 'sale price': 'price',
  'brand name': 'brand', 'brand': 'brand', 'manufacturer': 'brand',
  'category name': 'category', 'merchant category': 'category',
  'aw image url': 'imageUrl', 'merchant image url': 'imageUrl',
  'product id': 'externalId', 'aw product id': 'externalId', 'id': 'externalId',
  'ean': 'ean', 'gtin': 'ean',
  'in stock': 'availability', 'availability': 'availability',
  'currency': 'currency', 'currency code': 'currency',
  'description': 'description',
}

function mapAwinCsvRow(
  row: Record<string, string>,
  advertiserId: string,
  merchantName: string,
  fetchedAt: string,
): RawFeedItem | null {
  // Normalize header keys
  const normalized: Record<string, string> = {}
  for (const [key, val] of Object.entries(row)) {
    const mapped = CSV_MAP[key.toLowerCase().trim()]
    if (mapped) normalized[mapped] = val
    else normalized[key.toLowerCase().trim()] = val
  }

  const name = str(normalized.name)
  const price = parseFloat(str(normalized.price ?? '0').replace(/[^0-9.]/g, ''))

  if (!name || isNaN(price) || price <= 0) return null
  if (!normalized.deeplink) return null

  return {
    sourceNetwork: 'awin',
    sourceAdvertiserId: advertiserId,
    sourceMerchantName: merchantName,
    feedFetchedAt: fetchedAt,
    externalId: str(normalized.externalId ?? `${advertiserId}_${name.slice(0, 20)}`),
    ean: normalized.ean || undefined,
    name,
    brand: normalized.brand || undefined,
    description: normalized.description || undefined,
    category: normalized.category || undefined,
    price,
    currency: (normalized.currency ?? 'GBP').toUpperCase(),
    availability: normalized.availability ?? '',
    inStock: parseBool(normalized.availability),
    productUrl: normalized.productUrl ?? normalized.deeplink,
    deeplink: normalized.deeplink,
    imageUrl: normalized.imageUrl || undefined,
    geo: ['GB'],
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function str(val: unknown): string {
  if (val === null || val === undefined) return ''
  return String(val).trim()
}

function parseBool(val: unknown): boolean {
  const s = str(val).toLowerCase()
  return ['1', 'true', 'yes', 'in stock', 'instock', 'available'].includes(s)
}

function extractAttributes(p: any): Record<string, string> {
  const attrs: Record<string, string> = {}
  const attrKeys = ['colour', 'color', 'size', 'material', 'weight', 'dimensions',
    'condition', 'age_group', 'gender', 'pattern', 'model_number']
  for (const key of attrKeys) {
    const val = str(p[key] ?? p[key.replace('_', '-')])
    if (val) attrs[key] = val
  }
  // Also grab custom_1 … custom_5
  for (let i = 1; i <= 5; i++) {
    const val = str(p[`custom_${i}`])
    if (val) attrs[`custom_${i}`] = val
  }
  return attrs
}
