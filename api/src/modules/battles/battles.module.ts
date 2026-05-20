import { Module } from '@nestjs/common'
import { BattlesService } from './battles.service'
import { BattlesController } from './battles.controller'
import { AiModule } from '../ai/ai.module'
import { CatalogModule } from '../catalog/catalog.module'
import { SessionModule } from '../session/session.module'

@Module({
  imports: [AiModule, CatalogModule, SessionModule],
  providers: [BattlesService],
  controllers: [BattlesController],
})
export class BattlesModule {}
