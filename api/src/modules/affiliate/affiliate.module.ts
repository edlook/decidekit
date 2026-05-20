import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AffiliateService } from './affiliate.service'
import { AffiliateController } from './affiliate.controller'
import { AnalyticsService } from '../admin/analytics.service'
import { ClickEvent } from '../../database/entities/click-event.entity'
import { Offer } from '../../database/entities/offer.entity'

@Module({
  imports: [TypeOrmModule.forFeature([ClickEvent, Offer])],
  providers: [AffiliateService, AnalyticsService],
  controllers: [AffiliateController],
  exports: [AffiliateService],
})
export class AffiliateModule {}
