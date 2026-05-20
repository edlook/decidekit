import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ClickEvent, FlowMode } from '../../database/entities/click-event.entity'
import { Offer } from '../../database/entities/offer.entity'

export interface RedirectResult {
  url: string
  offerId: string
  merchantName: string
}

@Injectable()
export class AffiliateService {
  private readonly logger = new Logger(AffiliateService.name)

  // Allowed destination domains (open redirect protection)
  private readonly ALLOWED_DOMAINS = [
    'amazon.com', 'amazon.co.uk', 'amazon.de',
    'awin1.com', 'aw.de',
    'click.linksynergy.com',
    'go.redirectingat.com',
  ]

  constructor(
    @InjectRepository(ClickEvent)
    private clickRepo: Repository<ClickEvent>,
    @InjectRepository(Offer)
    private offerRepo: Repository<Offer>,
  ) {}

  async processRedirect(
    offerId: string,
    sessionId: string,
    mode: FlowMode = 'direct',
    geo?: string,
    userAgent?: string,
    resultVariant?: string,
  ): Promise<RedirectResult> {
    // 1. Load offer with merchant
    const offer = await this.offerRepo.findOne({
      where: { id: offerId, isActive: true },
      relations: ['merchant', 'productConcept'],
    })

    if (!offer) {
      throw new NotFoundException(`Offer ${offerId} not found or inactive`)
    }

    // 2. Validate destination (open redirect protection)
    const destination = offer.deeplink
    this.validateDestination(destination)

    // 3. Generate subId for tracking
    const subId = this.buildSubId(sessionId, offerId)

    // 4. Inject subId into deeplink
    const deeplink = this.injectSubId(destination, subId, offer.merchant.network)

    // 5. Log click (non-blocking)
    const clickEvent = this.clickRepo.create({
      sessionId,
      offerId,
      merchantId: offer.merchantId,
      productConceptId: offer.productConceptId,
      mode,
      generatedDeeplink: deeplink,
      subId,
      redirectStatus: 'pending',
      geo,
      userAgent,
      resultVariant,
    })

    this.clickRepo.save(clickEvent)
      .then(saved => {
        this.logger.log(`Click logged: ${saved.id} → offer ${offerId}`)
      })
      .catch(err => {
        this.logger.error(`Failed to log click: ${err.message}`)
      })

    return {
      url: deeplink,
      offerId,
      merchantName: offer.merchant.name,
    }
  }

  async updateClickStatus(subId: string, status: 'success' | 'fail'): Promise<void> {
    await this.clickRepo.update({ subId }, { redirectStatus: status })
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  private buildSubId(sessionId: string, offerId: string): string {
    const ts = Date.now().toString(36)
    // Format: sid_oid_ts  (truncated for network limits)
    return `${sessionId.slice(0, 8)}_${offerId.slice(0, 8)}_${ts}`
  }

  private injectSubId(deeplink: string, subId: string, network: string): string {
    try {
      const url = new URL(deeplink)
      switch (network) {
        case 'awin':
          url.searchParams.set('clickref', subId)
          break
        case 'rakuten':
          url.searchParams.set('u1', subId)
          break
        case 'impact':
          url.searchParams.set('subId1', subId)
          break
        default:
          url.searchParams.set('ref', subId)
      }
      return url.toString()
    } catch {
      return deeplink
    }
  }

  private validateDestination(url: string): void {
    try {
      const parsed = new URL(url)
      const hostname = parsed.hostname.replace(/^www\./, '')
      const allowed = this.ALLOWED_DOMAINS.some(
        d => hostname === d || hostname.endsWith(`.${d}`)
      )
      if (!allowed) {
        this.logger.warn(`Blocked redirect to untrusted domain: ${hostname}`)
        throw new BadRequestException('Redirect destination not allowed')
      }
    } catch (err) {
      if (err instanceof BadRequestException) throw err
      throw new BadRequestException('Invalid redirect URL')
    }
  }
}
