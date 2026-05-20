// Shared raw feed item — produced by any network parser before normalization

export interface RawFeedItem {
  // Source metadata
  sourceNetwork: 'awin' | 'rakuten' | 'impact' | 'direct'
  sourceAdvertiserId: string
  sourceMerchantName: string
  feedFetchedAt: string   // ISO timestamp

  // Product identity
  externalId: string      // Network's own product ID
  ean?: string            // EAN/GTIN barcode if present
  mpn?: string            // Manufacturer part number

  // Product data
  name: string
  brand?: string
  description?: string
  category?: string       // Network's own category string (noisy)
  subcategory?: string

  // Commerce data
  price: number
  currency: string
  originalPrice?: number  // Before discount
  availability: string    // Free-form: "in stock", "1", "yes", etc.
  inStock?: boolean

  // Links
  productUrl: string      // Landing page
  deeplink: string        // Affiliate-tracked link
  imageUrl?: string

  // Attributes (network-specific key-value pairs)
  attributes?: Record<string, string>

  // Geo
  geo?: string[]          // Markets where valid
}

// After normalization — clean, typed, ready for entity matching
export interface NormalizedFeedItem extends RawFeedItem {
  // Normalized fields
  normalizedBrand: string
  normalizedCategory: string    // Our taxonomy
  normalizedSubcategory: string
  normalizedAvailability: 'in_stock' | 'low_stock' | 'out_of_stock' | 'unknown'
  normalizedPrice: number       // Always in base currency (USD)
  normalizedCurrency: string

  // Computed
  confidenceScore: number       // 0-1 how clean this item is
  dedupKey: string              // brand:name:category hash for deduplication
  validationErrors: string[]    // Non-blocking issues flagged
}
