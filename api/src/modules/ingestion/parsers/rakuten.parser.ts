import { Logger } from '@nestjs/common'
import { parse as parseCsv } from 'csv-parse/sync'
import type { RawFeedItem } from '../types'

const logger = new Logger('RakutenParser')

// Rakuten (LinkShare) feeds come as TSV by default
// Columns vary per advertiser; we map known header aliases

const COLUMN_MAP: Record<string, string> = {
  'productname': 'name', 'name': 'name', 'product name': 'name',
  'price': 'price', 'saleprice': 'price', 'sale price': 'price', 'actualprice': 'price',
  'brand': 'brand', 'brandname': 'brand',
  'category': 'category', 'categoryname': 'category',
  'buyurl': 'deeplink', 'buy url': 'deeplink', 'linkurl': 'deeplink',
  'imageurl': 'imageUrl', 'image url': 'imageUrl', 'largeimageurl': 'imageUrl',
  'sku': 'externalId', 'skuid': 'externalId', 'productid': 'externalId', 'catalogid': 'externalId',
  'upc': 'ean', 'gtin': 'ean',
  'description': 'description', 'longdescription': 'description',
  'instock': 'availability', 'availability': 'availability', 'stockstatus': 'availability',
  'currency': 'currency',
  'retailprice': 'originalPrice', 'listprice': 'originalPrice',
  'manufacturer': 'brand', 'mpn': 'mpn',
}

export function parseRakutenTsv(
  tsv: string,
  advertiserId: string,
  merchantName: string,
): RawFeedItem[] {
  let rows: Record<string, string>[]
  try {
    rows = parseCsv(tsv, {
      delimiter: '\t',
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_quotes: true,
      bom: true,
    }) as Record<string, string>[]
  } catch (err) {
    logger.error(`Rakuten TSV parse error for ${merchantName}: ${err}`)
    return []
  }

  const now = new Date().toISOString()
  const items: RawFeedItem[] = []

  for (const row of rows) {
    try {
      const item = mapRakutenRow(row, advertiserId, merchantName, now)
      if (item) items.push(item)
    } catch (err) {
      logger.debug(`Skipping malformed Rakuten row: ${err}`)
    }
  }

  logger.log(`Rakuten TSV: parsed ${items.length}/${rows.length} rows for ${merchantName}`)
  return items
}

function mapRakutenRow(
  row: Record<string, string>,
  advertiserId: string,
  merchantName: string,
  fetchedAt: string,
): RawFeedItem | null {
  // Normalize keys: lowercase, remove spaces
  const n: Record<string, string> = {}
  for (const [k, v] of Object.entries(row)) {
    const normalized = k.toLowerCase().replace(/\s+/g, '')
    const mapped = COLUMN_MAP[normalized] ?? COLUMN_MAP[k.toLowerCase().trim()] ?? normalized
    n[mapped] = v?.trim() ?? ''
  }

  const name = n.name ?? ''
  const rawPrice = (n.price ?? n.saleprice ?? '').replace(/[^0-9.]/g, '')
  const price = parseFloat(rawPrice)

  if (!name || isNaN(price) || price <= 0) return null
  if (!n.deeplink) return null

  return {
    sourceNetwork: 'rakuten',
    sourceAdvertiserId: advertiserId,
    sourceMerchantName: merchantName,
    feedFetchedAt: fetchedAt,

    externalId: n.externalId ?? n.sku ?? `${advertiserId}_${name.slice(0, 20)}`,
    ean: n.ean || undefined,
    mpn: n.mpn || undefined,

    name,
    brand: n.brand || undefined,
    description: n.description || undefined,
    category: n.category || undefined,

    price,
    currency: (n.currency ?? 'USD').toUpperCase(),
    originalPrice: parseFloat(n.originalPrice ?? '') || undefined,
    availability: n.availability ?? 'unknown',
    inStock: parseAvailability(n.availability),

    productUrl: n.productUrl ?? n.deeplink,
    deeplink: n.deeplink,
    imageUrl: n.imageUrl || undefined,

    geo: ['US'],
  }
}

function parseAvailability(val: string | undefined): boolean {
  if (!val) return true // assume in stock if not stated
  const s = val.toLowerCase().trim()
  return !['0', 'false', 'no', 'out of stock', 'outofstock', 'unavailable'].includes(s)
}
