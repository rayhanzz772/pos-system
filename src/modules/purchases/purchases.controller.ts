import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { CreatePurchaseDto } from './dto/create-purchase.dto.js';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { PURCHASES_SERVICE } from './purchases.service.interface.js';
import type { IPurchasesService } from './purchases.service.interface.js';

@Controller('purchases')
export class PurchasesController {
  constructor(
    @Inject(PURCHASES_SERVICE)
    private readonly purchasesService: IPurchasesService,
  ) {}

  @Post()
  createPurchase(
    @Body() body: CreatePurchaseDto,
    @CurrentUser('sub') userId?: string,
  ) {
    return this.purchasesService.createPurchase(body, userId);
  }

  @Get()
  getPurchases(@Query() query: PaginationQueryDto) {
    return this.purchasesService.getPurchases(query);
  }

  @Get(':id')
  getPurchaseById(@Param('id') id: string) {
    return this.purchasesService.getPurchaseById(id);
  }
}
