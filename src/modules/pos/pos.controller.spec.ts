import { Test, TestingModule } from '@nestjs/testing';
import { PosController } from './pos.controller.js';
import { POS_SERVICE } from './pos.service.interface.js';

describe('PosController', () => {
  let controller: PosController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PosController],
      providers: [
        {
          provide: POS_SERVICE,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<PosController>(PosController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
