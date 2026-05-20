import { Module } from '@nestjs/common'
import { SessionModule } from '../session/session.module'
import { SearchModule } from '../search/search.module'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AdminService } from './admin.service'
import { HealthController } from './health.controller'
import { AnalyticsService } from './analytics.service'
import { AdminController } from './admin.controller'
import { ProductConcept } from '../../database/entities/product-concept.entity'
import { Offer } from '../../database/entities/offer.entity'
import { Merchant } from '../../database/entities/merchant.entity'
import { ClickEvent } from '../../database/entities/click-event.entity'
import { FeedIngestionJob } from '../../database/entities/feed-ingestion-job.entity'

@Module({
  imports: [TypeOrmModule.forFeature([ProductConcept, Offer, Merchant, ClickEvent, FeedIngestionJob]), SessionModule, SearchModule],
  providers: [AdminService, AnalyticsService],
  controllers: [AdminController, HealthController],
  exports: [AnalyticsService],
})
export class AdminModule {}
