import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import OpenAI from 'openai'

export interface IntentParseResult {
  intent: string
  category: string
  inferredBudget: number | null
  constraints: string[]
  clarificationQuestions: Array<{
    id: string
    question: string
    type: 'chips' | 'range' | 'text'
    options?: string[]
  }>
}

export interface SolutionGenerateResult {
  summary: string
  assumptions: string[]
  budgetKit: KitSuggestion
  balancedKit: KitSuggestion
  premiumKit: KitSuggestion
  tradeoffs: string[]
}

export interface KitSuggestion {
  items: Array<{
    role: string
    searchQuery: string
    rationale: string
    estimatedPriceMin: number
    estimatedPriceMax: number
  }>
}

export interface DupeRecognizeResult {
  recognized: boolean
  name?: string
  brand?: string
  category?: string
  estimatedPrice?: number
  keyAttributes?: string[]
  confidence: number
  errorCode?: 'not_identified' | 'ambiguous'
}

export interface AlternativesResult {
  alternatives: Array<{
    searchQuery: string
    badge: string
    reason: string
    estimatedPriceRange?: { min: number; max: number }
  }>
}

export interface BattleInferenceResult {
  preferenceSignals: Record<string, number>
  confidence: number
  isDone: boolean
  reasoning?: string
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name)
  private openai: OpenAI

  constructor(private config: ConfigService) {
    const key = this.config.get<string>('ai.openaiKey')
    if (key) {
      this.openai = new OpenAI({ apiKey: key })
    }
  }

  // ─── Intent parsing ───────────────────────────────────────────────────────

  async parseBuilderIntent(text: string, geo = 'US'): Promise<IntentParseResult> {
    const prompt = `
You are an AI assistant helping users build product kits. Parse the following user request.
Return ONLY valid JSON matching this schema:
{
  "intent": "short description of what they want",
  "category": "primary product category (e.g. audio, computing, photography)",
  "inferredBudget": number or null,
  "constraints": ["list of constraints extracted from text"],
  "clarificationQuestions": [
    {
      "id": "budget",
      "question": "What is your budget?",
      "type": "range"
    },
    {
      "id": "country",
      "question": "Where are you located?",
      "type": "chips",
      "options": ["US", "UK", "DE", "FR", "AU", "CA"]
    }
  ]
}
Ask 2-4 clarification questions relevant to this specific request.
User request: "${text}"
Geo context: ${geo}
`
    return this.callStructured<IntentParseResult>(prompt, 'intent', {
      intent: text,
      category: 'general',
      inferredBudget: null,
      constraints: [],
      clarificationQuestions: [
        { id: 'budget', question: 'What is your budget?', type: 'range' },
        { id: 'country', question: 'Where are you located?', type: 'chips', options: ['US', 'UK', 'DE', 'FR', 'AU'] },
      ],
    })
  }

  // ─── Solution generation ──────────────────────────────────────────────────

  async generateSolutionKits(
    intent: string,
    clarifications: Record<string, string | number>,
    budget: number,
    priorities: string[],
  ): Promise<SolutionGenerateResult> {
    const prompt = `
You are an AI assistant building product kit recommendations.
Return ONLY valid JSON with Budget / Balanced / Premium kit suggestions.
Schema:
{
  "summary": "one sentence description of the solution",
  "assumptions": ["assumption 1", "assumption 2"],
  "budgetKit": {
    "items": [{ "role": "Main item", "searchQuery": "specific search terms for this component", "rationale": "why this", "estimatedPriceMin": 50, "estimatedPriceMax": 80 }]
  },
  "balancedKit": { "items": [...] },
  "premiumKit": { "items": [...] },
  "tradeoffs": ["tradeoff 1", "tradeoff 2"]
}
Intent: ${intent}
Budget: $${budget}
Priorities: ${priorities.join(', ')}
Clarifications: ${JSON.stringify(clarifications)}
Include 2-5 items per kit. searchQuery should be specific enough to find real products.
`
    return this.callStructured<SolutionGenerateResult>(prompt, 'solution', {
      summary: intent,
      assumptions: [],
      budgetKit: { items: [] },
      balancedKit: { items: [] },
      premiumKit: { items: [] },
      tradeoffs: [],
    })
  }

  // ─── Product recognition ──────────────────────────────────────────────────

  async recognizeProduct(input: string): Promise<DupeRecognizeResult> {
    const prompt = `
Identify the product from this input. Return ONLY valid JSON:
{
  "recognized": true/false,
  "name": "product name",
  "brand": "brand name",
  "category": "product category",
  "estimatedPrice": 299,
  "keyAttributes": ["key feature 1", "key feature 2"],
  "confidence": 0.9
}
If not recognized, return { "recognized": false, "confidence": 0, "errorCode": "not_identified" }
Input: "${input}"
`
    return this.callStructured<DupeRecognizeResult>(prompt, 'recognize', {
      recognized: false,
      confidence: 0,
      errorCode: 'not_identified',
    })
  }

  // ─── Alternative generation ───────────────────────────────────────────────

  async generateAlternatives(
    originalProduct: DupeRecognizeResult,
    goal: string,
    geo = 'US',
  ): Promise<AlternativesResult> {
    const prompt = `
Suggest product alternatives. Return ONLY valid JSON:
{
  "alternatives": [
    {
      "searchQuery": "specific search terms",
      "badge": "lower_price|best_value|closest_style|same_function|premium_upgrade|faster_ship",
      "reason": "one sentence explanation",
      "estimatedPriceRange": { "min": 100, "max": 150 }
    }
  ]
}
Original product: ${JSON.stringify(originalProduct)}
User goal: ${goal}
Geo: ${geo}
Provide 3-5 alternatives. Be specific in searchQuery so it can find real products.
`
    return this.callStructured<AlternativesResult>(prompt, 'alternatives', { alternatives: [] })
  }

  // ─── Battles inference ────────────────────────────────────────────────────

  async inferBattlePreferences(
    choices: Array<{ winnerId: string; loserId: string; winnerAttrs: string[]; loserAttrs: string[] }>,
    category: string,
  ): Promise<BattleInferenceResult> {
    const prompt = `
Infer user preferences from product battle choices. Return ONLY valid JSON:
{
  "preferenceSignals": { "price_sensitivity": 0.7, "quality_weight": 0.8, "brand_sensitivity": 0.3 },
  "confidence": 0.75,
  "isDone": false,
  "reasoning": "User consistently chose higher quality items"
}
Category: ${category}
Choices (winner vs loser with attributes): ${JSON.stringify(choices)}
isDone=true when confidence > 0.80 or choices >= 5
`
    return this.callStructured<BattleInferenceResult>(prompt, 'battles', {
      preferenceSignals: {},
      confidence: 0,
      isDone: false,
    })
  }

  // ─── Internal: structured call with fallback ──────────────────────────────

  private async callStructured<T>(prompt: string, context: string, fallback: T): Promise<T> {
    if (!this.openai) {
      this.logger.warn(`[AI:${context}] No OpenAI key configured — returning fallback`)
      return fallback
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: this.config.get<string>('ai.modelIntent') ?? 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        max_tokens: 1500,
        temperature: 0.2,
      })

      const content = response.choices[0]?.message?.content
      if (!content) return fallback

      const parsed = JSON.parse(content) as T
      return parsed
    } catch (err) {
      this.logger.error(`[AI:${context}] Error: ${err instanceof Error ? err.message : String(err)}`)
      return fallback
    }
  }
}
