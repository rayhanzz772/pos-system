import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module.js';
import { PurchasesController } from './purchases.controller.js';
import { PurchasesService } from './purchases.service.js';
import { PURCHASES_SERVICE } from './purchases.service.interface.js';

@Module({
  imports: [DatabaseModule],
  controllers: [PurchasesController],
  providers: [
    {
      provide: PURCHASES_SERVICE,
      useClass: PurchasesService,
    },
  ],
  exports: [PURCHASES_SERVICE],
})
export class PurchasesModule {}
