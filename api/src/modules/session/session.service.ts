import { Injectable, Logger } from '@nestjs/common'
import { v4 as uuidv4 } from 'uuid'
import { RedisService } from './redis.service'

export interface SessionData {
  sessionId: string
  mode?: 'builder' | 'dupe' | 'battles'
  geo?: string
  createdAt: number
  lastActiveAt: number
  metadata?: Record<string, unknown>
}

const SESSION_PREFIX = 'session:'
const SESSION_TTL = 86400 // 24h

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name)
  // Fallback in-memory store when Redis is unavailable
  private memStore = new Map<string, SessionData>()

  constructor(private redis: RedisService) {}

  async create(geo?: string): Promise<SessionData> {
    const session: SessionData = {
      sessionId: uuidv4(),
      geo,
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
    }
    await this.save(session)
    return session
  }

  async get(sessionId: string): Promise<SessionData | null> {
    try {
      if (this.redis.isConnected()) {
        const raw = await this.redis.get(`${SESSION_PREFIX}${sessionId}`)
        return raw ? (JSON.parse(raw) as SessionData) : null
      }
    } catch {}
    return this.memStore.get(sessionId) ?? null
  }

  async touch(sessionId: string, partial?: Partial<SessionData>): Promise<SessionData | null> {
    const session = await this.get(sessionId)
    if (!session) return null
    const updated = { ...session, ...partial, lastActiveAt: Date.now() }
    await this.save(updated)
    return updated
  }

  async validateOrCreate(sessionId: string | undefined, geo?: string): Promise<SessionData> {
    if (sessionId) {
      const existing = await this.get(sessionId)
      if (existing) {
        await this.touch(sessionId)
        return existing
      }
    }
    return this.create(geo)
  }

  private async save(session: SessionData): Promise<void> {
    const json = JSON.stringify(session)
    if (this.redis.isConnected()) {
      await this.redis.set(`${SESSION_PREFIX}${session.sessionId}`, json, SESSION_TTL)
    }
    this.memStore.set(session.sessionId, session)
  }
}
