import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import pLimit from 'p-limit'
import { FeedIngestionJob } from '../../database/entities/feed-ingestion-job.entity'
import { FeedFetcher } from './feed-fetcher'
import { parseAwinXml, parseAwinCsv } from './parsers/awin.parser'
import { parseRakutenTsv } from './parsers/rakuten.parser'
import { normalizeItems } from './normalizers/normalizer'
import { EntityMatcher } from './matchers/entity-matcher'
import { OfferWriter } from './writers/offer-writer'
import { RelationshipEnricher } from './matchers/relationship-enricher'

export interface PipelineRunOptions {
  network: 'awin' | 'rakuten'
  advertiserId: string
  merchantName: string
  feedUrl?: string   // Override default API URL (for testing with local files)
  dryRun?: boolean   // Parse + normalize + match, but skip DB writes
}

export interface PipelineRunResult {
  jobId: string
  network: string
  advertiserId: string
  totalFetched: number
  totalNormalized: number
  totalMatched: number
  totalWritten: number
  totalSkipped: number
  durationMs: number
  status: 'completed' | 'failed'
  error?: string
}

// Batch sizes and concurrency limits
const NORMALIZE_BATCH = 500
const MATCH_CONCURRENCY = 5   // Concurrent DB lookups during entity matching
const WRITE_BATCH = 200

@Injectable()
export class IngestionService {
  private readonly logger = new Logger(IngestionService.name)

  constructor(
    @InjectRepository(FeedIngestionJob)
    private jobRepo: Repository<FeedIngestionJob>,
    private fetcher: FeedFetcher,
    private matcher: EntityMatcher,
    private writer: OfferWriter,
    private enricher: RelationshipEnricher,
  ) {}

  async runPipeline(options: PipelineRunOptions): Promise<PipelineRunResult> {
    const startedAt = new Date()
    const startMs = Date.now()

    // Create job record
    const job = await this.jobRepo.save(
      this.jobRepo.create({
        network: options.network,
        advertiserId: options.advertiserId,
        status: 'running',
        startedAt,
      }),
    )

    this.logger.log(
      `[Job ${job.id}] Starting pipeline: ${options.network} / ${options.merchantName}`,
    )

    try {
      // ── Step 1: Fetch ─────────────────────────────────────────────────
      this.logger.log(`[Job ${job.id}] Step 1: Fetching feed…`)
      const fetchResult = options.feedUrl
        ? await this.fetcher.fetchFromUrl(options.feedUrl, options.merchantName)
        : options.network === 'awin'
          ? await this.fetcher.fetchAwinFeed(options.advertiserId)
          : null

      if (!fetchResult) {
        throw new Error('Feed fetch returned null — check API keys and advertiser ID')
      }

      this.logger.log(
        `[Job ${job.id}] Fetched ${(fetchResult.contentLength / 1024).toFixed(1)}KB (format: ${fetchResult.format})`,
      )

      // ── Step 2: Parse ─────────────────────────────────────────────────
      this.logger.log(`[Job ${job.id}] Step 2: Parsing ${fetchResult.format}…`)
      let rawItems: import('./types').RawFeedItem[] = []

      if (options.network === 'awin') {
        rawItems = fetchResult.format === 'xml'
          ? parseAwinXml(fetchResult.content, options.advertiserId, options.merchantName)
          : parseAwinCsv(fetchResult.content, options.advertiserId, options.merchantName)
      } else if (options.network === 'rakuten') {
        rawItems = parseRakutenTsv(fetchResult.content, options.advertiserId, options.merchantName)
      }

      this.logger.log(`[Job ${job.id}] Parsed ${rawItems.length} raw items`)

      // ── Step 3: Normalize ─────────────────────────────────────────────
      this.logger.log(`[Job ${job.id}] Step 3: Normalizing…`)
      const normalized = normalizeItems(rawItems)
      const dropped = rawItems.length - normalized.length

      this.logger.log(
        `[Job ${job.id}] Normalized: ${normalized.length} valid, ${dropped} dropped`,
      )

      // ── Step 4: Deduplicate (within this batch) ───────────────────────
      this.logger.log(`[Job ${job.id}] Step 4: Deduplicating…`)
      const dedupMap = new Map<string, typeof normalized[0]>()
      for (const item of normalized) {
        const existing = dedupMap.get(item.dedupKey)
        // Keep the higher-confidence item when deduplicating
        if (!existing || item.confidenceScore > existing.confidenceScore) {
          dedupMap.set(item.dedupKey, item)
        }
      }
      const deduped = [...dedupMap.values()]
      this.logger.log(
        `[Job ${job.id}] After dedup: ${deduped.length} (removed ${normalized.length - deduped.length} dupes)`,
      )

      if (options.dryRun) {
        this.logger.log(`[Job ${job.id}] DRY RUN — skipping DB writes`)
        await this.updateJob(job.id, {
          status: 'completed',
          totalFetched: rawItems.length,
          totalNormalized: normalized.length,
          totalMatched: deduped.length,
          totalSkipped: dropped,
          completedAt: new Date(),
        })
        return buildResult(job.id, options, rawItems.length, normalized.length, deduped.length, 0, dropped, startMs, 'completed')
      }

      // ── Step 5: Entity matching (batched + concurrent) ────────────────
      this.logger.log(`[Job ${job.id}] Step 5: Entity matching…`)
      const limit = pLimit(MATCH_CONCURRENCY)
      const allMatches: import('./matchers/entity-matcher').MatchResult[] = []

      for (let i = 0; i < deduped.length; i += NORMALIZE_BATCH) {
        const batch = deduped.slice(i, i + NORMALIZE_BATCH)
        const batchMatches = await this.matcher.matchBatch(batch)
        allMatches.push(...batchMatches)
        this.logger.log(
          `[Job ${job.id}] Matched batch ${Math.floor(i / NORMALIZE_BATCH) + 1}` +
          `/${Math.ceil(deduped.length / NORMALIZE_BATCH)}: ${allMatches.length} total`,
        )
      }

      // ── Step 6: Write offers ──────────────────────────────────────────
      this.logger.log(`[Job ${job.id}] Step 6: Writing ${allMatches.length} offers…`)
      let totalWritten = 0
      let totalSkippedWrite = 0

      for (let i = 0; i < allMatches.length; i += WRITE_BATCH) {
        const batch = allMatches.slice(i, i + WRITE_BATCH)
        const writeStats = await this.writer.writeBatch(batch)
        totalWritten += writeStats.created + writeStats.updated
        totalSkippedWrite += writeStats.skipped
      }

      // ── Step 7: Deactivate missing offers ─────────────────────────────
      this.logger.log(`[Job ${job.id}] Step 7: Deactivating missing offers…`)
      const seenProductIds = allMatches.map(m => m.productConcept.id)
      const merchantId = allMatches[0]?.merchant?.id
      if (merchantId) {
        await this.writer.deactivateMissingOffers(merchantId, seenProductIds)
      }

      // ── Complete ──────────────────────────────────────────────────────
      const duration = Date.now() - startMs
      await this.updateJob(job.id, {
        status: 'completed',
        totalFetched: rawItems.length,
        totalNormalized: normalized.length,
        totalMatched: allMatches.length,
        totalErrors: totalSkippedWrite,
        completedAt: new Date(),
      })

      this.logger.log(
        `[Job ${job.id}] ✅ Pipeline complete in ${(duration / 1000).toFixed(1)}s. ` +
        `Written: ${totalWritten}, skipped: ${totalSkippedWrite}`,
      )

      return buildResult(
        job.id, options,
        rawItems.length, normalized.length, allMatches.length,
        totalWritten, totalSkippedWrite,
        startMs, 'completed',
      )

    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      this.logger.error(`[Job ${job.id}] ❌ Pipeline failed: ${message}`)

      await this.updateJob(job.id, {
        status: 'failed',
        errorMessage: message,
        completedAt: new Date(),
      })

      return buildResult(
        job.id, options, 0, 0, 0, 0, 0, startMs, 'failed', message,
      )
    }
  }

  async getJobHistory(limit = 20): Promise<FeedIngestionJob[]> {
    return this.jobRepo.find({
      order: { createdAt: 'DESC' },
      take: limit,
    })
  }

  private async updateJob(
    id: string,
    partial: Partial<FeedIngestionJob>,
  ): Promise<void> {
    await this.jobRepo.update(id, partial as any)
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function buildResult(
  jobId: string,
  opts: PipelineRunOptions,
  fetched: number,
  normalized: number,
  matched: number,
  written: number,
  skipped: number,
  startMs: number,
  status: 'completed' | 'failed',
  error?: string,
): PipelineRunResult {
  return {
    jobId,
    network: opts.network,
    advertiserId: opts.advertiserId,
    totalFetched: fetched,
    totalNormalized: normalized,
    totalMatched: matched,
    totalWritten: written,
    totalSkipped: skipped,
    durationMs: Date.now() - startMs,
    status,
    error,
  }
}
