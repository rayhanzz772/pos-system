import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { DRIZZLE } from './database/database.module.js';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: DRIZZLE,
          useValue: {
            execute: vi.fn().mockResolvedValue({ rows: [] }),
          },
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('health', () => {
    it('should return database health', async () => {
      const result = await appController.getDatabaseHealth();
      expect(result).toBeDefined();
      expect(result.message).toBe('Database connected successfully');
    });
  });
});
