import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common'
import { ApiTags, ApiOperation } from '@nestjs/swagger'
import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator'
import { DupeService } from './dupe.service'
import type { DupeRecognizeResult } from '../ai/ai.service'

class RecognizeDto {
  @IsString() @IsNotEmpty() input: string
  @IsOptional() @IsString() sessionId?: string
  @IsOptional() @IsString() geo?: string
}

class GetAlternativesDto {
  @IsString() @IsNotEmpty() sessionId: string
  @IsObject() recognizedItem: DupeRecognizeResult
  @IsString() @IsNotEmpty() goal: string
  @IsOptional() @IsString() geo?: string
}

@ApiTags('dupe')
@Controller('dupe')
export class DupeController {
  constructor(private readonly dupeService: DupeService) {}

  @Post('recognize')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Recognize product from URL, name, or description' })
  async recognize(@Body() dto: RecognizeDto) {
    const result = await this.dupeService.recognizeProduct(dto.input, dto.sessionId, dto.geo)
    return { data: result }
  }

  @Post('alternatives')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get alternatives for a recognized product' })
  async getAlternatives(@Body() dto: GetAlternativesDto) {
    const result = await this.dupeService.getAlternatives(
      dto.sessionId,
      dto.recognizedItem,
      dto.goal,
      dto.geo,
    )
    return { data: result }
  }
}
