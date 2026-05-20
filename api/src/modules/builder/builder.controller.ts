import { Controller, Post, Body, HttpCode, HttpStatus, Headers } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger'
import { IsString, IsNotEmpty, IsNumber, IsOptional, IsArray, Min, Max } from 'class-validator'
import { BuilderService } from './builder.service'

class ParseIntentDto {
  @IsString()
  @IsNotEmpty()
  text: string

  @IsOptional()
  @IsString()
  sessionId?: string

  @IsOptional()
  @IsString()
  geo?: string
}

class GenerateResultDto {
  @IsString()
  @IsNotEmpty()
  sessionId: string

  @IsString()
  @IsNotEmpty()
  intent: string

  @IsOptional()
  clarifications?: Record<string, string | number>

  @IsNumber()
  @Min(10)
  @Max(100000)
  budget: number

  @IsOptional()
  @IsArray()
  priorities?: string[]

  @IsOptional()
  @IsString()
  geo?: string
}

@ApiTags('builder')
@Controller('builder')
export class BuilderController {
  constructor(private readonly builderService: BuilderService) {}

  @Post('intent')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Parse free-text intent and return clarification questions' })
  @ApiBody({ type: ParseIntentDto })
  async parseIntent(
    @Body() dto: ParseIntentDto,
    @Headers('x-session-id') headerSessionId?: string,
  ) {
    const sessionId = dto.sessionId ?? headerSessionId
    const result = await this.builderService.parseIntent(dto.text, sessionId, dto.geo)
    return { data: result }
  }

  @Post('result')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate Budget / Balanced / Premium kit recommendations' })
  @ApiBody({ type: GenerateResultDto })
  async generateResult(@Body() dto: GenerateResultDto) {
    const result = await this.builderService.generateResult(
      dto.sessionId,
      dto.intent,
      dto.clarifications ?? {},
      dto.budget,
      dto.priorities ?? [],
      dto.geo,
    )
    return { data: result }
  }
}
