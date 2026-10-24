import { Test, TestingModule } from '@nestjs/testing';
import { PurchasesController } from './purchases.controller.js';
import { PURCHASES_SERVICE } from './purchases.service.interface.js';

describe('PurchasesController', () => {
  let controller: PurchasesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PurchasesController],
      providers: [
        {
          provide: PURCHASES_SERVICE,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<PurchasesController>(PurchasesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
