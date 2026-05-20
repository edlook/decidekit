// Typed API client — all backend calls go through here

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'

// ─── Generic fetch wrapper ────────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })

  if (!res.ok) {
    let errMsg = `API error ${res.status}`
    try {
      const body = await res.json()
      errMsg = body.error ?? errMsg
    } catch {}
    throw new ApiError(errMsg, res.status)
  }

  const body = await res.json()
  // Unwrap {data: ...} envelope
  return ('data' in body ? body.data : body) as T
}

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message)
    this.name = 'ApiError'
  }
}

// ─── Builder ──────────────────────────────────────────────────────────────

export interface IntentResponse {
  sessionId: string
  intent: string
  category: string
  inferredBudget: number | null
  clarificationQuestions: Array<{
    id: string
    question: string
    type: 'chips' | 'range' | 'text'
    options?: string[]
  }>
}

export interface KitItem {
  role: string
  product: { id: string; brand: string; name: string; category: string; attributes: Record<string, string> }
  offer: { id: string; price: number; currency: string; availability: string; deeplink: string; imageUrl?: string } | null
  merchant: { id: string; name: string; qualityScore: number } | null
  isLowConfidence: boolean
}

export interface BuilderResultResponse {
  sessionId: string
  query: string
  summary: string
  assumptions: string[]
  variants: {
    budget:   { items: KitItem[]; totalPrice: number; isPartial: boolean }
    balanced: { items: KitItem[]; totalPrice: number; isPartial: boolean }
    premium:  { items: KitItem[]; totalPrice: number; isPartial: boolean }
  }
  tradeoffs: string[]
  hasSufficientCoverage: boolean
}

export const builderApi = {
  parseIntent: (text: string, sessionId?: string, geo?: string) =>
    apiFetch<IntentResponse>('/builder/intent', {
      method: 'POST',
      body: JSON.stringify({ text, sessionId, geo }),
    }),

  generateResult: (params: {
    sessionId: string
    intent: string
    clarifications: Record<string, string | number>
    budget: number
    priorities: string[]
    geo?: string
  }) =>
    apiFetch<BuilderResultResponse>('/builder/result', {
      method: 'POST',
      body: JSON.stringify(params),
    }),
}

// ─── Dupe ─────────────────────────────────────────────────────────────────

export interface RecognizeResponse {
  sessionId: string
  recognized: boolean
  item?: {
    name: string; brand?: string; category?: string
    estimatedPrice?: number; keyAttributes?: string[]; confidence: number
  }
  errorCode?: string
}

export interface DupeAlternative {
  searchQuery: string
  badge: string
  reason: string
  isLowConfidence: boolean
  product?: { id: string; brand: string; name: string; category: string; attributes: Record<string, string> } | null
  offer?: { id: string; price: number; currency: string; availability: string; deeplink: string; imageUrl?: string } | null
  merchant?: { id: string; name: string; qualityScore: number } | null
}

export interface AlternativesResponse {
  sessionId: string
  originalItem: RecognizeResponse['item']
  alternatives: DupeAlternative[]
  hasResults: boolean
}

export const dupeApi = {
  recognize: (input: string, sessionId?: string, geo?: string) =>
    apiFetch<RecognizeResponse>('/dupe/recognize', {
      method: 'POST',
      body: JSON.stringify({ input, sessionId, geo }),
    }),

  getAlternatives: (params: {
    sessionId: string
    recognizedItem: RecognizeResponse['item']
    goal: string
    geo?: string
  }) =>
    apiFetch<AlternativesResponse>('/dupe/alternatives', {
      method: 'POST',
      body: JSON.stringify(params),
    }),
}

// ─── Battles ─────────────────────────────────────────────────────────────

export interface BattleProduct {
  id: string; brand: string; name: string; attributes: Record<string, string>
  price?: number; currency?: string; offerId?: string; imageUrl?: string
}

export interface BattlePairResponse {
  sessionId: string
  left: BattleProduct
  right: BattleProduct
  battleIndex: number
  confidence: number
  isDone: boolean
  winner?: BattleProduct
  winnerReasoning?: string
  alternatives?: BattleProduct[]
}

export const battlesApi = {
  getPair: (params: {
    sessionId?: string
    category: string
    constraints?: Record<string, string>
    previousChoices?: Array<{ winnerId: string; loserId: string }>
    geo?: string
  }) =>
    apiFetch<BattlePairResponse>('/battles/pair', {
      method: 'POST',
      body: JSON.stringify(params),
    }),
}

// ─── Catalog ──────────────────────────────────────────────────────────────

export const catalogApi = {
  search: (q: string, category?: string, limit = 20) =>
    apiFetch<{ data: any[]; total: number }>(
      `/catalog/search?q=${encodeURIComponent(q)}${category ? `&category=${category}` : ''}&limit=${limit}`,
    ),
}

// ─── Admin ────────────────────────────────────────────────────────────────

export const adminApi = {
  getStats: () => apiFetch<any>('/admin/stats'),
  getOffers: (filter = 'all', page = 1, limit = 50) =>
    apiFetch<any>(`/admin/offers?filter=${filter}&page=${page}&limit=${limit}`),
  deactivateOffer: (id: string) =>
    apiFetch<void>(`/admin/offers/${id}`, { method: 'DELETE' }),
  approveOffer: (id: string) =>
    apiFetch<void>(`/admin/offers/${id}/approve`, { method: 'POST' }),
  getMerchants: () => apiFetch<any>('/admin/merchants'),
  updateMerchant: (id: string, qualityScore: number, isApproved?: boolean) =>
    apiFetch<any>(`/admin/merchants/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ qualityScore, isApproved }),
    }),
  getClicks: (limit = 100) => apiFetch<any>(`/admin/clicks?limit=${limit}`),
  runIngestion: (params: { network: string; advertiserId: string; merchantName: string; dryRun?: boolean }) =>
    apiFetch<any>('/admin/ingestion/run', { method: 'POST', body: JSON.stringify(params) }),
  getIngestionJobs: () => apiFetch<any>('/admin/ingestion/jobs'),
}
