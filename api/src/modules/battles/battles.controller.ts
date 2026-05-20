import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common'
import { ApiTags, ApiOperation } from '@nestjs/swagger'
import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator'
import { BattlesService } from './battles.service'

class GetPairDto {
  @IsOptional() @IsString() sessionId?: string
  @IsString() @IsNotEmpty() category: string
  @IsOptional() constraints?: Record<string, string>
  @IsOptional() @IsArray() previousChoices?: Array<{ winnerId: string; loserId: string }>
  @IsOptional() @IsString() geo?: string
}

@ApiTags('battles')
@Controller('battles')
export class BattlesController {
  constructor(private readonly battlesService: BattlesService) {}

  @Post('pair')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get next pair of products to compare, or final result if confidence is high enough' })
  async getPair(@Body() dto: GetPairDto) {
    const result = await this.battlesService.getNextPair(
      dto.sessionId,
      dto.category,
      dto.constraints ?? {},
      dto.previousChoices ?? [],
      dto.geo,
    )
    return { data: result }
  }
}
