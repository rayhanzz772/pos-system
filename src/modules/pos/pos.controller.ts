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
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { POS_SERVICE } from './pos.service.interface.js';
import type { IPosService } from './pos.service.interface.js';

@Controller('pos')
export class PosController {
  constructor(
    @Inject(POS_SERVICE)
    private readonly posService: IPosService,
  ) {}

  @Post('checkout')
  checkout(
    @Body() body: CheckoutDto,
    @CurrentUser('sub') currentUserId?: string,
  ) {
    return this.posService.checkout(body, currentUserId);
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
