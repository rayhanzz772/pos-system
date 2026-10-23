import { Test, TestingModule } from '@nestjs/testing';
import { PosService } from './pos.service.js';
import { DRIZZLE } from '../../database/database.module.js';

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
      ],
    }).compile();

    service = module.get<PosService>(PosService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
