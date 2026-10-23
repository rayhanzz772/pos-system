import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { CheckoutDto } from './dto/checkout.dto.js';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';
import { POS_SERVICE } from './pos.service.interface.js';
import type { IPosService } from './pos.service.interface.js';

@Controller('pos')
export class PosController {
  constructor(
    @Inject(POS_SERVICE)
    private readonly posService: IPosService,
  ) {}

  @Post('checkout')
  checkout(@Body() body: CheckoutDto) {
    return this.posService.checkout(body);
  }

  @Get('orders')
  getOrderHistory(@Query() query: PaginationQueryDto) {
    return this.posService.getOrderHistory(query);
  }

  @Get('orders/:id')
  getOrderById(@Param('id') id: string) {
    return this.posService.getOrderById(id);
  }
}
