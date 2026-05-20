// ─── User Flow Types ────────────────────────────────────────────────────────

export type FlowMode = 'builder' | 'dupe' | 'battles'

export type BuilderStep = 'intent' | 'clarify' | 'priorities' | 'results' | 'refine'
export type DupeStep    = 'input' | 'recognize' | 'goal' | 'results'
export type BattlesStep = 'category' | 'setup' | 'battle' | 'result'

// ─── Product / Catalog ───────────────────────────────────────────────────────

export interface ProductConcept {
  id: string
  brand: string
  name: string
  category: string
  attributes: Record<string, string>
  imageUrl?: string
  relationships?: {
    substitutes?: string[]
    upgrades?: string[]
    bundles?: string[]
  }
}

export interface Offer {
  id: string
  productConceptId: string
  merchantId: string
  merchantName: string
  price: number
  currency: string
  availability: 'in_stock' | 'low_stock' | 'out_of_stock'
  deeplink: string
  affiliateNetwork: 'awin' | 'rakuten' | 'impact'
  lastUpdated: string
  confidenceScore: number
  imageUrl?: string
}

export interface Merchant {
  id: string
  name: string
  logoUrl?: string
  qualityScore: number
  network: 'awin' | 'rakuten' | 'impact'
}

// ─── Recommendation Result ───────────────────────────────────────────────────

export type ResultVariant = 'budget' | 'balanced' | 'premium'

export interface KitItem {
  role: string
  productConceptId: string
  productName: string
  offer: Offer
  isLowConfidence?: boolean
}

export interface SolutionResult {
  sessionId: string
  query: string
  assumptions: string[]
  variants: {
    budget:   { items: KitItem[]; totalPrice: number }
    balanced: { items: KitItem[]; totalPrice: number }
    premium:  { items: KitItem[]; totalPrice: number }
  }
  explanation: string
  tradeoffs: string[]
  activeVariant: ResultVariant
}

export interface DupeResult {
  sessionId: string
  originalItem: {
    name: string
    brand?: string
    imageUrl?: string
    price?: number
  }
  alternatives: DupeAlternative[]
}

export interface DupeAlternative {
  product: ProductConcept
  offer: Offer
  badge: 'lower_price' | 'best_value' | 'closest_style' | 'faster_ship' | 'premium_upgrade'
  reason: string
  isLowConfidence?: boolean
}

export interface BattlesResult {
  sessionId: string
  winner: ProductConcept
  winnerOffer: Offer
  reasoning: string
  alternatives: Array<{ product: ProductConcept; offer: Offer }>
}

// ─── Session (anonymous) ─────────────────────────────────────────────────────

export interface Session {
  sessionId: string
  mode?: FlowMode
  createdAt: number
}

// ─── Analytics ───────────────────────────────────────────────────────────────

export type AnalyticsEvent =
  | 'page_view_home'
  | 'mode_card_click'
  | 'example_prompt_click'
  | 'builder_start'
  | 'builder_input_submit'
  | 'builder_result_view'
  | 'builder_offer_click'
  | 'builder_component_swap'
  | 'dupe_start'
  | 'dupe_input_submit'
  | 'dupe_recognition_success'
  | 'dupe_recognition_fail'
  | 'dupe_result_view'
  | 'dupe_offer_click'
  | 'battles_start'
  | 'battles_category_select'
  | 'battles_pair_shown'
  | 'battles_choice_left'
  | 'battles_choice_right'
  | 'battles_skip'
  | 'battles_complete'
  | 'battles_result_view'
  | 'battles_offer_click'
  | 'redirect_init'
  | 'redirect_success'
  | 'redirect_fail'

// ─── API Contracts ───────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data?: T
  error?: string
  code?: string
}

export interface BuilderIntentRequest {
  text: string
  sessionId: string
}

export interface BuilderIntentResponse {
  intent: string
  category: string
  clarificationQuestions: Array<{
    id: string
    question: string
    type: 'chips' | 'range' | 'text'
    options?: string[]
  }>
}

export interface BuilderResultRequest {
  sessionId: string
  intent: string
  clarifications: Record<string, string | number>
  budget: number
  priorities: string[]
  geo: string
}

export interface DupeRecognizeRequest {
  input: string        // URL, name, or description
  sessionId: string
}

export interface DupeRecognizeResponse {
  recognized: boolean
  item?: {
    name: string
    brand?: string
    category?: string
    price?: number
    imageUrl?: string
    confidence: number
  }
  errorCode?: 'invalid_url' | 'unsupported_source' | 'not_identified'
}

export interface BattlesPairRequest {
  sessionId: string
  category: string
  constraints: Record<string, string>
  previousChoices: Array<{ winnerId: string; loserId: string }>
}

export interface BattlesPairResponse {
  left: ProductConcept & { offer: Offer }
  right: ProductConcept & { offer: Offer }
  battleIndex: number
  confidence: number
  isDone: boolean
}
