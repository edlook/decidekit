import { Controller, Get, Param, Query, Req, Res, HttpStatus } from '@nestjs/common'
import { ApiTags, ApiOperation } from '@nestjs/swagger'
import type { Request, Response } from 'express'
import { AffiliateService } from './affiliate.service'
import { AnalyticsService } from '../admin/analytics.service'
import type { FlowMode } from '../../database/entities/click-event.entity'

@ApiTags('affiliate')
@Controller('r')
export class AffiliateController {
  constructor(
    private readonly affiliateService: AffiliateService,
    private readonly analytics: AnalyticsService,
  ) {}

  @Get(':offerId')
  @ApiOperation({ summary: 'Affiliate redirect — log click and redirect to merchant' })
  async redirect(
    @Param('offerId') offerId: string,
    @Query('sid') sessionId: string,
    @Query('mode') mode: string,
    @Query('variant') variant: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const geo = (req.headers['cf-ipcountry'] as string)
      ?? (req.headers['x-country'] as string)
      ?? 'US'
    const userAgent = req.headers['user-agent']
    const sid = sessionId ?? 'anonymous'
    const flowMode = (mode ?? 'direct') as FlowMode

    try {
      const result = await this.affiliateService.processRedirect(
        offerId, sid, flowMode, geo, userAgent, variant,
      )

      // Fire analytics non-blocking
      this.analytics.captureRedirect({
        sessionId: sid,
        offerId,
        merchantId: result.merchantName,
        mode: flowMode,
        geo,
        success: true,
      }).catch(() => {})

      return res.redirect(HttpStatus.FOUND, result.url)
    } catch {
      this.analytics.captureRedirect({
        sessionId: sid, offerId, merchantId: '', mode: flowMode, geo, success: false,
      }).catch(() => {})

      return res.redirect(HttpStatus.FOUND, '/')
    }
  }
}
