import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';
import { PRODUCTS_SERVICE } from './products.service.interface.js';
import type { IProductsService } from './products.service.interface.js';

@Controller('products')
export class ProductsController {
  constructor(
    @Inject(PRODUCTS_SERVICE)
    private readonly productsService: IProductsService,
  ) {}

  @Get()
  findAll(@Query() query: PaginationQueryDto) {
    return this.productsService.findAll(query);
  }

  @Get(':id/get')
  findById(@Param('id') id: string) {
    return this.productsService.findById(id);
  }

  @Post('create')
  create(@Body() body: CreateProductDto) {
    return this.productsService.create(body);
  }

  @Put(':id/update')
  update(@Param('id') id: string, @Body() body: UpdateProductDto) {
    return this.productsService.update(id, body);
  }

  @Delete(':id/delete')
  delete(@Param('id') id: string) {
    return this.productsService.delete(id);
  }
}
