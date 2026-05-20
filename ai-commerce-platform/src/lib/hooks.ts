'use client'

import { useState, useCallback } from 'react'
import { builderApi, dupeApi, battlesApi, type BuilderResultResponse, type RecognizeResponse, type AlternativesResponse, type BattlePairResponse, type BattleProduct, ApiError } from './api'
import { getOrCreateSession, updateSession, track } from './utils'

// ─── Builder hook ─────────────────────────────────────────────────────────

export function useBuilder() {
  const [sessionId, setSessionId] = useState<string>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<BuilderResultResponse | null>(null)
  const [clarificationQuestions, setClarificationQuestions] = useState<any[]>([])
  const [intent, setIntentState] = useState('')

  const parseIntent = useCallback(async (text: string, geo?: string) => {
    setLoading(true)
    setError(null)
    track('builder_start')
    try {
      const session = getOrCreateSession()
      const data = await builderApi.parseIntent(text, session.sessionId, geo)
      setSessionId(data.sessionId)
      setIntentState(data.intent)
      setClarificationQuestions(data.clarificationQuestions)
      updateSession({ mode: 'builder' })
      track('builder_input_submit', { category: data.category })
      return data
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Something went wrong'
      setError(msg)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const generateResult = useCallback(async (params: {
    clarifications: Record<string, string | number>
    budget: number
    priorities: string[]
    geo?: string
  }) => {
    if (!sessionId || !intent) return null
    setLoading(true)
    setError(null)
    try {
      const data = await builderApi.generateResult({ sessionId, intent, ...params })
      setResult(data)
      track('builder_result_view', { hasCoverage: data.hasSufficientCoverage })
      return data
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to generate recommendations'
      setError(msg)
      return null
    } finally {
      setLoading(false)
    }
  }, [sessionId, intent])

  return { loading, error, result, clarificationQuestions, parseIntent, generateResult, sessionId }
}

// ─── Dupe hook ────────────────────────────────────────────────────────────

export function useDupe() {
  const [sessionId, setSessionId] = useState<string>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [recognized, setRecognized] = useState<RecognizeResponse | null>(null)
  const [alternatives, setAlternatives] = useState<AlternativesResponse | null>(null)

  const recognize = useCallback(async (input: string, geo?: string) => {
    setLoading(true)
    setError(null)
    setAlternatives(null)
    track('dupe_start')
    try {
      const session = getOrCreateSession()
      const data = await dupeApi.recognize(input, session.sessionId, geo)
      setSessionId(data.sessionId)
      setRecognized(data)
      if (data.recognized) {
        track('dupe_recognition_success')
      } else {
        track('dupe_recognition_fail', { errorCode: data.errorCode })
      }
      return data
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to identify product'
      setError(msg)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const getAlternatives = useCallback(async (goal: string, geo?: string) => {
    if (!sessionId || !recognized?.item) return null
    setLoading(true)
    setError(null)
    try {
      const data = await dupeApi.getAlternatives({
        sessionId, recognizedItem: recognized.item, goal, geo,
      })
      setAlternatives(data)
      track('dupe_result_view', { hasResults: data.hasResults })
      return data
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to find alternatives'
      setError(msg)
      return null
    } finally {
      setLoading(false)
    }
  }, [sessionId, recognized])

  return { loading, error, recognized, alternatives, recognize, getAlternatives, sessionId }
}

// ─── Battles hook ─────────────────────────────────────────────────────────

export function useBattles() {
  const [sessionId, setSessionId] = useState<string>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPair, setCurrentPair] = useState<BattlePairResponse | null>(null)
  const [choices, setChoices] = useState<Array<{ winnerId: string; loserId: string }>>([])
  const [isDone, setIsDone] = useState(false)

  const startBattles = useCallback(async (category: string, constraints?: Record<string, string>, geo?: string) => {
    setLoading(true)
    setError(null)
    setChoices([])
    setIsDone(false)
    track('battles_start', { category })
    try {
      const session = getOrCreateSession()
      const data = await battlesApi.getPair({ sessionId: session.sessionId, category, constraints, previousChoices: [], geo })
      setSessionId(data.sessionId)
      setCurrentPair(data)
      if (data.isDone) setIsDone(true)
      track('battles_pair_shown', { battleIndex: data.battleIndex })
      return data
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to start battles'
      setError(msg)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const choose = useCallback(async (
    winnerId: string,
    loserId: string,
    category: string,
    geo?: string,
  ) => {
    if (!sessionId) return null
    const newChoices = [...choices, { winnerId, loserId }]
    setChoices(newChoices)
    track('battles_choice_left', { battleIndex: newChoices.length })

    setLoading(true)
    try {
      const data = await battlesApi.getPair({ sessionId, category, previousChoices: newChoices, geo })
      setCurrentPair(data)
      if (data.isDone) {
        setIsDone(true)
        track('battles_complete', { rounds: newChoices.length })
      } else {
        track('battles_pair_shown', { battleIndex: data.battleIndex })
      }
      return data
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to get next pair'
      setError(msg)
      return null
    } finally {
      setLoading(false)
    }
  }, [sessionId, choices])

  const skip = useCallback(() => {
    track('battles_skip')
    // Re-request without recording this choice
  }, [])

  return { loading, error, currentPair, choices, isDone, startBattles, choose, skip, sessionId }
}
