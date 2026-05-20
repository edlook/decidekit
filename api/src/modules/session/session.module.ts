import { Module } from '@nestjs/common'
import { SessionService } from './session.service'
import { RedisService } from './redis.service'

@Module({
  providers: [RedisService, SessionService],
  exports: [SessionService, RedisService],
})
export class SessionModule {}
