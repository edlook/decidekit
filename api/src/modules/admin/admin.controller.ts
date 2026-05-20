import {
  Controller, Get, Post, Patch, Delete,
  Param, Query, Body, HttpCode, HttpStatus,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger'
import { IsNumber, IsOptional, IsBoolean, Min, Max } from 'class-validator'
import { AdminService } from './admin.service'

class UpdateMerchantDto {
  @IsNumber() @Min(0) @Max(10)
  qualityScore: number

  @IsOptional() @IsBoolean()
  isApproved?: boolean
}

@ApiTags('admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ── Dashboard ──────────────────────────────────────────────────────────

  @Get('stats')
  @ApiOperation({ summary: 'Dashboard stats — catalog, clicks, ingestion overview' })
  async getStats() {
    return { data: await this.adminService.getDashboardStats() }
  }

  // ── Offer moderation ───────────────────────────────────────────────────

  @Get('offers')
  @ApiOperation({ summary: 'Get offers for moderation with optional filter' })
  @ApiQuery({ name: 'filter', enum: ['all', 'stale', 'low_confidence', 'out_of_stock'], required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getOffers(
    @Query('filter') filter: 'all' | 'stale' | 'low_confidence' | 'out_of_stock' = 'all',
    @Query('page') page = '1',
    @Query('limit') limit = '50',
  ) {
    return this.adminService.getOffersForModeration(filter, +page, +limit)
  }

  @Delete('offers/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deactivate an offer' })
  async deactivateOffer(@Param('id') id: string) {
    await this.adminService.deactivateOffer(id)
  }

  @Post('offers/:id/approve')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Approve and reset confidence on an offer' })
  async approveOffer(@Param('id') id: string) {
    await this.adminService.approveOffer(id)
  }

  // ── Merchant quality ───────────────────────────────────────────────────

  @Get('merchants')
  @ApiOperation({ summary: 'All merchants with quality metrics' })
  async getMerchants() {
    return { data: await this.adminService.getMerchantQuality() }
  }

  @Patch('merchants/:id')
  @ApiOperation({ summary: 'Update merchant quality score and approval status' })
  async updateMerchant(
    @Param('id') id: string,
    @Body() dto: UpdateMerchantDto,
  ) {
    await this.adminService.updateMerchantQuality(id, dto.qualityScore, dto.isApproved)
    return { data: { updated: true } }
  }

  // ── Click / redirect logs ──────────────────────────────────────────────

  @Get('clicks')
  @ApiOperation({ summary: 'Recent click events for QA' })
  @ApiQuery({ name: 'limit', required: false })
  async getClicks(@Query('limit') limit = '100') {
    const clicks = await this.adminService.getRecentClicks(+limit)
    return { data: clicks, total: clicks.length }
  }
}
