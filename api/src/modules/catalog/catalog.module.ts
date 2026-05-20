import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ProductConcept } from '../../database/entities/product-concept.entity'
import { Offer } from '../../database/entities/offer.entity'
import { Merchant } from '../../database/entities/merchant.entity'
import { CatalogService } from './catalog.service'
import { CatalogController } from './catalog.controller'
import { SearchModule } from '../search/search.module'

@Module({
  imports: [TypeOrmModule.forFeature([ProductConcept, Offer, Merchant]), SearchModule],
  providers: [CatalogService],
  controllers: [CatalogController],
  exports: [CatalogService],
})
export class CatalogModule {}
