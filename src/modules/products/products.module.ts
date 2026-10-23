import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module.js';
import { ProductsController } from './products.controller.js';
import { ProductsService } from './products.service.js';
import { PRODUCTS_SERVICE } from './products.service.interface.js';

@Module({
  imports: [DatabaseModule],
  controllers: [ProductsController],
  providers: [
    {
      provide: PRODUCTS_SERVICE,
      useClass: ProductsService,
    },
  ],
})
export class ProductsModule {}
