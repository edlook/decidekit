import { Module } from '@nestjs/common'
import { DupeService } from './dupe.service'
import { DupeController } from './dupe.controller'
import { AiModule } from '../ai/ai.module'
import { CatalogModule } from '../catalog/catalog.module'
import { SessionModule } from '../session/session.module'

@Module({
  imports: [AiModule, CatalogModule, SessionModule],
  providers: [DupeService],
  controllers: [DupeController],
})
export class DupeModule {}
