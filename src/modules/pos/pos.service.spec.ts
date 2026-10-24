import { Test, TestingModule } from '@nestjs/testing';
import { PosService } from './pos.service.js';
import { DRIZZLE } from '../../database/database.module.js';
import { PaymentService } from '../payment/payment.service.js';

describe('PosService', () => {
  let service: PosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PosService,
        {
          provide: DRIZZLE,
          useValue: {},
        },
        {
          provide: PaymentService,
          useValue: {
            createQrisPayment: vi.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PosService>(PosService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
