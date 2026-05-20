import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Redis from 'ioredis'

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name)
  private client: Redis

  constructor(private config: ConfigService) {}

  onModuleInit() {
    this.client = new Redis({
      host: this.config.get<string>('redis.host') ?? 'localhost',
      port: this.config.get<number>('redis.port') ?? 6379,
      password: this.config.get<string>('redis.password') || undefined,
      retryStrategy: (times) => Math.min(times * 100, 3000),
      lazyConnect: true,
    })

    this.client.on('error', (err) => {
      this.logger.warn(`Redis error (non-fatal): ${err.message}`)
    })

    this.client.on('connect', () => {
      this.logger.log('Redis connected')
    })

    this.client.connect().catch(() => {
      this.logger.warn('Redis unavailable — falling back to in-memory session')
    })
  }

  async onModuleDestroy() {
    await this.client?.quit()
  }

  async get(key: string): Promise<string | null> {
    try {
      return await this.client.get(key)
    } catch {
      return null
    }
  }

  async set(key: string, value: string, ttlSeconds = 86400): Promise<void> {
    try {
      await this.client.setex(key, ttlSeconds, value)
    } catch {
      // Non-fatal — session just won't persist
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.client.del(key)
    } catch {}
  }

  async keys(pattern: string): Promise<string[]> {
    try {
      return await this.client.keys(pattern)
    } catch {
      return []
    }
  }

  isConnected(): boolean {
    return this.client?.status === 'ready'
  }
}
