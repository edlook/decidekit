import { Controller, Get, Query, Param } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger'
import { CatalogService } from './catalog.service'

@ApiTags('catalog')
@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get('search')
  @ApiOperation({ summary: 'Search products by keyword' })
  @ApiQuery({ name: 'q', required: true })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async search(
    @Query('q') q: string,
    @Query('category') category?: string,
    @Query('limit') limit = '20',
  ) {
    const products = await this.catalogService.searchProducts(q, category, parseInt(limit, 10))
    return { data: products, total: products.length }
  }

  @Get('products/:id')
  @ApiOperation({ summary: 'Get product concept by ID' })
  async getProduct(@Param('id') id: string) {
    const products = await this.catalogService.searchProducts(id, undefined, 1)
    const product = products.find(p => p.id === id) ?? null
    return { data: product }
  }
}
