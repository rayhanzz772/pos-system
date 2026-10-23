import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module.js';
import { PosController } from './pos.controller.js';
import { PosService } from './pos.service.js';
import { POS_SERVICE } from './pos.service.interface.js';

@Module({
  imports: [DatabaseModule],
  controllers: [PosController],
  providers: [
    {
      provide: POS_SERVICE,
      useClass: PosService,
    },
  ],
  exports: [POS_SERVICE],
})
export class PosModule {}
