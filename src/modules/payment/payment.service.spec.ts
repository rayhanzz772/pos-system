import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { PaymentService } from './payment.service.js';

describe('PaymentService', () => {
  let service: PaymentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => (key === 'MIDTRANS_IS_PRODUCTION' ? 'false' : undefined),
            getOrThrow: (key: string) => `mock-${key}`,
          },
        },
        {
          provide: 'DRIZZLE',
          useValue: {
            insert: () => ({ values: () => Promise.resolve() }),
            update: () => ({ set: () => ({ where: () => Promise.resolve() }) }),
          },
        },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
