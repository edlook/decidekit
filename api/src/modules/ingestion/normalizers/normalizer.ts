import { createHash } from 'crypto'
import type { RawFeedItem, NormalizedFeedItem } from '../types'

// ─── Our product taxonomy ─────────────────────────────────────────────────

// Maps noisy network category strings → our clean taxonomy
const CATEGORY_MAP: Array<[RegExp, string, string]> = [
  // [pattern, normalizedCategory, normalizedSubcategory]
  [/headphone|earphone|earbud|earphone/i,   'audio',      'headphones'],
  [/speaker|soundbar/i,                      'audio',      'speakers'],
  [/microphone|mic\b/i,                      'audio',      'microphones'],
  [/laptop|notebook|macbook/i,               'computing',  'laptops'],
  [/desktop|pc tower|gaming pc/i,            'computing',  'desktops'],
  [/monitor|display screen/i,                'computing',  'monitors'],
  [/keyboard/i,                              'computing',  'keyboards'],
  [/mouse\b|gaming mouse/i,                  'computing',  'mice'],
  [/camera\b|dslr|mirrorless/i,              'photography','cameras'],
  [/lens\b/i,                                'photography','lenses'],
  [/tripod|gimbal/i,                         'photography','accessories'],
  [/phone|smartphone|iphone|android/i,       'mobile',     'smartphones'],
  [/tablet|ipad/i,                           'mobile',     'tablets'],
  [/tv\b|television|oled|qled/i,             'home',       'tvs'],
  [/vacuum|dyson|hoover/i,                   'home',       'cleaning'],
  [/coffee|espresso|nespresso/i,             'kitchen',    'coffee'],
  [/blender|mixer|food processor/i,          'kitchen',    'appliances'],
  [/chair|desk|office/i,                     'furniture',  'office'],
  [/sofa|couch|bed frame/i,                  'furniture',  'living'],
  [/shoe|trainer|sneaker|boot/i,             'fashion',    'footwear'],
  [/jacket|coat|hoodie|shirt|dress/i,        'fashion',    'clothing'],
  [/skincare|moisturiser|serum/i,            'beauty',     'skincare'],
  [/makeup|lipstick|foundation/i,            'beauty',     'makeup'],
  [/perfume|cologne|fragrance/i,             'beauty',     'fragrance'],
  [/supplement|protein|vitamin/i,            'health',     'supplements'],
  [/fitness|gym|dumbbell|kettlebell/i,       'sports',     'fitness'],
  [/yoga|pilates/i,                          'sports',     'yoga'],
  [/bicycle|bike\b|cycling/i,                'sports',     'cycling'],
  [/gaming|console|playstation|xbox/i,       'gaming',     'consoles'],
  [/game\b|video game/i,                     'gaming',     'games'],
  [/backpack|bag\b|luggage/i,                'travel',     'bags'],
]

// Known brand normalizations
const BRAND_ALIASES: Record<string, string> = {
  'apple inc': 'Apple', 'apple computers': 'Apple',
  'sony corp': 'Sony', 'sony corporation': 'Sony',
  'bose corporation': 'Bose',
  'samsung electronics': 'Samsung',
  'lg electronics': 'LG',
  'microsoft corp': 'Microsoft', 'microsoft corporation': 'Microsoft',
  'dyson ltd': 'Dyson',
  'philips': 'Philips', 'philips electronics': 'Philips',
}

// ─── Main normalizer ──────────────────────────────────────────────────────

export function normalizeItem(raw: RawFeedItem): NormalizedFeedItem {
  const errors: string[] = []

  // Brand
  const normalizedBrand = normalizeBrand(raw.brand ?? raw.name)

  // Category
  const { category, subcategory } = normalizeCategory(
    raw.category ?? '',
    raw.name,
    raw.description ?? '',
  )

  // Availability
  const normalizedAvailability = normalizeAvailability(raw.availability, raw.inStock)

  // Price / currency
  const { price, currency } = normalizePrice(raw.price, raw.currency)
  if (price <= 0) errors.push('invalid_price')

  // Validate deeplink
  if (!isValidUrl(raw.deeplink)) errors.push('invalid_deeplink')

  // Name cleaning
  const cleanName = cleanProductName(raw.name, normalizedBrand)

  // Confidence score
  const confidence = computeConfidence(raw, errors, category)

  // Dedup key: hash of brand+name+category (for deduplication across merchants)
  const dedupKey = createHash('md5')
    .update(`${normalizedBrand.toLowerCase()}|${cleanName.toLowerCase()}|${category}`)
    .digest('hex')
    .slice(0, 16)

  return {
    ...raw,
    name: cleanName,
    normalizedBrand,
    normalizedCategory: category,
    normalizedSubcategory: subcategory,
    normalizedAvailability,
    normalizedPrice: price,
    normalizedCurrency: currency,
    confidenceScore: confidence,
    dedupKey,
    validationErrors: errors,
  }
}

export function normalizeItems(items: RawFeedItem[]): NormalizedFeedItem[] {
  return items
    .map(item => {
      try {
        return normalizeItem(item)
      } catch {
        return null
      }
    })
    .filter((item): item is NormalizedFeedItem => item !== null)
    // Drop items with critical errors
    .filter(item => !item.validationErrors.includes('invalid_deeplink'))
}

// ─── Field normalizers ────────────────────────────────────────────────────

function normalizeBrand(rawBrand: string): string {
  if (!rawBrand) return 'Unknown'
  const lower = rawBrand.toLowerCase().trim()
  // Check alias map
  const alias = BRAND_ALIASES[lower]
  if (alias) return alias
  // Title-case
  return rawBrand.trim().replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
}

function normalizeCategory(
  rawCategory: string,
  name: string,
  description: string,
): { category: string; subcategory: string } {
  const searchText = `${rawCategory} ${name} ${description}`.toLowerCase()

  for (const [pattern, cat, sub] of CATEGORY_MAP) {
    if (pattern.test(searchText)) {
      return { category: cat, subcategory: sub }
    }
  }

  // Fallback: clean up the raw category string
  if (rawCategory) {
    const clean = rawCategory.split(/[>/|,]/)[0].trim().toLowerCase()
    return { category: clean || 'other', subcategory: '' }
  }

  return { category: 'other', subcategory: '' }
}

function normalizeAvailability(
  raw: string,
  inStock?: boolean,
): NormalizedFeedItem['normalizedAvailability'] {
  if (inStock === false) return 'out_of_stock'
  if (inStock === true) return 'in_stock'

  const s = (raw ?? '').toLowerCase().trim()
  if (['1', 'true', 'yes', 'in stock', 'instock', 'available', 'in-stock'].includes(s)) return 'in_stock'
  if (['0', 'false', 'no', 'out of stock', 'outofstock', 'unavailable', 'out-of-stock'].includes(s)) return 'out_of_stock'
  if (['low', 'limited', 'low stock', 'last few', '2', '3'].includes(s)) return 'low_stock'
  if (!s) return 'unknown'

  // Numeric stock count
  const num = parseInt(s, 10)
  if (!isNaN(num)) {
    if (num === 0) return 'out_of_stock'
    if (num <= 3) return 'low_stock'
    return 'in_stock'
  }

  return 'unknown'
}

function normalizePrice(
  price: number,
  currency: string,
): { price: number; currency: string } {
  const c = (currency ?? 'USD').toUpperCase().trim()
  // Round to 2 decimal places
  const p = Math.round(price * 100) / 100

  // Basic currency validation
  if (!['USD', 'GBP', 'EUR', 'AUD', 'CAD', 'SEK', 'NOK', 'DKK', 'CHF', 'JPY'].includes(c)) {
    return { price: p, currency: 'USD' }
  }

  return { price: p, currency: c }
}

function cleanProductName(name: string, brand: string): string {
  let clean = name.trim()
  // Remove duplicate brand prefix: "Sony Sony WH-1000XM5" → "Sony WH-1000XM5"
  const brandLower = brand.toLowerCase()
  const nameLower = clean.toLowerCase()
  if (nameLower.startsWith(brandLower + ' ' + brandLower)) {
    clean = clean.slice(brand.length + 1)
  }
  // Remove excessive whitespace
  clean = clean.replace(/\s+/g, ' ').trim()
  // Truncate if absurdly long (feed names sometimes include the entire description)
  if (clean.length > 200) clean = clean.slice(0, 197) + '…'
  return clean
}

// ─── Confidence scoring ───────────────────────────────────────────────────

function computeConfidence(
  item: RawFeedItem,
  errors: string[],
  category: string,
): number {
  let score = 1.0

  // Deductions
  if (!item.brand)              score -= 0.10
  if (!item.imageUrl)           score -= 0.08
  if (!item.description)        score -= 0.05
  if (!item.ean && !item.mpn)   score -= 0.08
  if (category === 'other')     score -= 0.15
  if (item.name.length < 5)     score -= 0.20
  if (errors.includes('invalid_price')) score -= 0.30

  // Deductions for incomplete attributes
  const attrCount = Object.keys(item.attributes ?? {}).length
  if (attrCount === 0) score -= 0.05

  return Math.max(0, Math.min(1, Math.round(score * 100) / 100))
}

function isValidUrl(url: string): boolean {
  if (!url) return false
  try {
    const u = new URL(url)
    return u.protocol === 'https:' || u.protocol === 'http:'
  } catch {
    return false
  }
}
