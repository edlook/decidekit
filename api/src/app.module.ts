import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ThrottlerModule } from '@nestjs/throttler'
import configuration from './config/configuration'
import { ProductConcept } from './database/entities/product-concept.entity'
import { Offer } from './database/entities/offer.entity'
import { Merchant } from './database/entities/merchant.entity'
import { ClickEvent } from './database/entities/click-event.entity'
import { FeedIngestionJob } from './database/entities/feed-ingestion-job.entity'
import { AiModule } from './modules/ai/ai.module'
import { SessionModule } from './modules/session/session.module'
import { CatalogModule } from './modules/catalog/catalog.module'
import { BuilderModule } from './modules/builder/builder.module'
import { DupeModule } from './modules/dupe/dupe.module'
import { BattlesModule } from './modules/battles/battles.module'
import { AffiliateModule } from './modules/affiliate/affiliate.module'
import { AdminModule } from './modules/admin/admin.module'
import { IngestionModule } from './modules/ingestion/ingestion.module'
import { ScheduleModule } from '@nestjs/schedule'
import { SearchModule } from './modules/search/search.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('database.host'),
        port: config.get<number>('database.port'),
        database: config.get<string>('database.name'),
        username: config.get<string>('database.user'),
        password: config.get<string>('database.pass'),
        entities: [ProductConcept, Offer, Merchant, ClickEvent, FeedIngestionJob],
        synchronize: config.get<boolean>('database.synchronize'),
        logging: config.get<boolean>('database.logging'),
        ssl: config.get<string>('app.nodeEnv') === 'production'
          ? { rejectUnauthorized: false }
          : false,
      }),
    }),

    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([{
      name: 'short',
      ttl: 1000,
      limit: 10,
    }, {
      name: 'medium',
      ttl: 60000,
      limit: 200,
    }]),

    AiModule,
    SessionModule,
    CatalogModule,
    BuilderModule,
    DupeModule,
    BattlesModule,
    AffiliateModule,
    IngestionModule,
    AdminModule,
    SearchModule,
  ],
})
export class AppModule {}
