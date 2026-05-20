import { Controller, Get } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { DataSource } from 'typeorm'
import { RedisService } from '../session/redis.service'
import { SearchService } from '../search/search.service'

@Controller('health')
export class HealthController {
  constructor(
    @InjectDataSource() private db: DataSource,
    private redis: RedisService,
    private search: SearchService,
  ) {}

  @Get()
  async check() {
    const checks = {
      api: 'ok',
      postgres: 'unknown',
      redis: 'unknown',
      opensearch: 'unknown',
    }

    try {
      await this.db.query('SELECT 1')
      checks.postgres = 'ok'
    } catch {
      checks.postgres = 'error'
    }

    checks.redis = this.redis.isConnected() ? 'ok' : 'degraded'
    checks.opensearch = this.search.isAvailable() ? 'ok' : 'degraded'

    const allOk = checks.postgres === 'ok'
    return {
      status: allOk ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      checks,
    }
  }
}
