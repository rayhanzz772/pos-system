import {
  Body,
  Controller,
  HttpCode,
  Post,
} from '@nestjs/common';
import { PaymentService } from './payment.service.js';
import { Public } from '../../common/decorators/public.decorator.js';
import { RefundDto } from './dto/refund.dto.js';

@Controller('payments')
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
  ) {}

  @Post('qris')
  async createQris(
    @Body() body: { orderId?: string; amount: number },
  ) {
    return this.paymentService.createQrisPayment(
      body.orderId,
      body.amount,
    );
  }

  @Post('bank-transfer')
  async createBankTransfer(
    @Body()
    body: {
      orderId?: string;
      amount: number;
      bank: 'bca' | 'bni' | 'bri' | 'permata' | 'mandiri' | 'cimb';
    },
  ) {
    return this.paymentService.createBankTransferPayment(
      body.orderId,
      body.amount,
      body.bank,
    );
  }

  @Post('refund')
  async refund(@Body() body: RefundDto) {
    return this.paymentService.processRefund(body);
  }

  @Public()
  @Post('webhook')
  @HttpCode(200)
  async webhook(@Body() payload: Record<string, any>) {
    return this.paymentService.handleNotification(payload);
  }
}
