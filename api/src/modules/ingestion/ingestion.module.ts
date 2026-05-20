import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { IngestionService } from './ingestion.service'
import { IngestionController } from './ingestion.controller'
import { FeedFetcher } from './feed-fetcher'
import { EntityMatcher } from './matchers/entity-matcher'
import { RelationshipEnricher } from './matchers/relationship-enricher'
import { IngestionScheduler } from './ingestion.scheduler'
import { OfferWriter } from './writers/offer-writer'
import { FeedIngestionJob } from '../../database/entities/feed-ingestion-job.entity'
import { SearchModule } from '../search/search.module'
import { ProductConcept } from '../../database/entities/product-concept.entity'
import { Offer } from '../../database/entities/offer.entity'
import { Merchant } from '../../database/entities/merchant.entity'

@Module({
  imports: [
    TypeOrmModule.forFeature([FeedIngestionJob, ProductConcept, Offer, Merchant]),
    SearchModule,
  ],
  providers: [IngestionService, FeedFetcher, EntityMatcher, OfferWriter, RelationshipEnricher, IngestionScheduler],
  controllers: [IngestionController],
  exports: [IngestionService],
})
export class IngestionModule {}
