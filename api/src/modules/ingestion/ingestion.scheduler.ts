import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { ConfigService } from '@nestjs/config'
import { IngestionService } from './ingestion.service'

@Injectable()
export class IngestionScheduler {
  private readonly logger = new Logger(IngestionScheduler.name)

  constructor(
    private ingestion: IngestionService,
    private config: ConfigService,
  ) {}

  // Every 6 hours — refresh all configured Awin advertisers
  @Cron(CronExpression.EVERY_6_HOURS)
  async runAwinFeeds() {
    const ids = this.config.get<string[]>('affiliate.awinAdvertiserIds') ?? []
    if (ids.length === 0) {
      this.logger.debug('No Awin advertiser IDs configured — skipping scheduled run')
      return
    }
    this.logger.log(`Scheduled Awin ingestion for ${ids.length} advertiser(s)`)
    for (const advertiserId of ids) {
      try {
        await this.ingestion.runPipeline({
          network: 'awin',
          advertiserId,
          merchantName: `Awin-${advertiserId}`,
        })
      } catch (err) {
        this.logger.error(`Scheduled ingestion failed for advertiser ${advertiserId}: ${err}`)
      }
    }
  }

  // Every day at 2am — mark stale offers
  @Cron('0 2 * * *')
  async markStaleOffers() {
    this.logger.log('Running stale offer check…')
    // Delegated to OfferWriter.deactivateMissingOffers in each pipeline run
    // This is a no-op placeholder for future direct staleness sweep
  }
}
