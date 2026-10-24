import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { PaymentService } from './payment.service.js';
import {
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';

describe('PaymentService', () => {
  let service: PaymentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) =>
              key === 'MIDTRANS_IS_PRODUCTION' ? 'false' : undefined,
            getOrThrow: (key: string) => `mock-${key}`,
          },
        },
        {
          provide: 'DRIZZLE',
          useValue: {
            insert: () => ({ values: () => Promise.resolve() }),
            update: () => ({ set: () => ({ where: () => Promise.resolve() }) }),
            transaction: async (cb: any) =>
              cb({
                select: () => ({
                  from: () => ({
                    where: () => ({
                      for: () =>
                        Promise.resolve([
                          {
                            id: 'ord-123',
                            amount: 50000,
                            paidAmount: 50000,
                            refundedAmount: 0,
                            orderStatus: 'PAID',
                            transactionId: 'tx-123',
                          },
                        ]),
                    }),
                  }),
                }),
                update: () => ({
                  set: () => ({
                    where: () => Promise.resolve(),
                  }),
                }),
              }),
          },
        },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should reject webhook with invalid signature', async () => {
    const badPayload = {
      order_id: 'ord-123',
      status_code: '200',
      gross_amount: '50000.00',
      signature_key: 'invalid_sha512_hash',
    };

    await expect(service.handleNotification(badPayload)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should reject refund exceeding remaining refundable balance', async () => {
    await expect(
      service.processRefund({
        orderId: 'ord-123',
        amount: 60000, // order paidAmount is 50000
      }),
    ).rejects.toThrow(BadRequestException);
  });
});
