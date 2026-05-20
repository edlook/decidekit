import { Controller, Post, Get, Body, Query } from '@nestjs/common'
import { ApiTags, ApiOperation } from '@nestjs/swagger'
import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsIn } from 'class-validator'
import { IngestionService } from './ingestion.service'

class RunPipelineDto {
  @IsString() @IsNotEmpty()
  @IsIn(['awin', 'rakuten'])
  network: 'awin' | 'rakuten'

  @IsString() @IsNotEmpty()
  advertiserId: string

  @IsString() @IsNotEmpty()
  merchantName: string

  @IsOptional() @IsString()
  feedUrl?: string

  @IsOptional() @IsBoolean()
  dryRun?: boolean
}

@ApiTags('ingestion')
@Controller('admin/ingestion')
export class IngestionController {
  constructor(private readonly ingestionService: IngestionService) {}

  @Post('run')
  @ApiOperation({ summary: 'Manually trigger a feed ingestion pipeline run' })
  async run(@Body() dto: RunPipelineDto) {
    const result = await this.ingestionService.runPipeline(dto)
    return { data: result }
  }

  @Get('jobs')
  @ApiOperation({ summary: 'Get recent ingestion job history' })
  async getJobs(@Query('limit') limit = '20') {
    const jobs = await this.ingestionService.getJobHistory(parseInt(limit, 10))
    return { data: jobs, total: jobs.length }
  }
}
