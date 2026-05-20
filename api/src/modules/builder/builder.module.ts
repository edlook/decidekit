import { Module } from '@nestjs/common'
import { BuilderService } from './builder.service'
import { BuilderController } from './builder.controller'
import { AiModule } from '../ai/ai.module'
import { CatalogModule } from '../catalog/catalog.module'
import { SessionModule } from '../session/session.module'

@Module({
  imports: [AiModule, CatalogModule, SessionModule],
  providers: [BuilderService],
  controllers: [BuilderController],
})
export class BuilderModule {}
