import {
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, count, eq, isNull } from 'drizzle-orm';
import { DRIZZLE } from '../../database/database.module.js';
import { products } from '../../database/schema/product.schema.js';
import type { Database } from '../../database/database.types.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';
import { createPaginationMeta } from '../../common/utils/pagination.util.js';
import { apiResponse } from '../../common/dto/api-response.dto.js';
import type { IProductsService } from './products.service.interface.js';

@Injectable()
export class ProductsService implements IProductsService {
  constructor(
    @Inject(DRIZZLE)
    private readonly db: Database,
  ) {}

  async findAll(query: PaginationQueryDto) {
    const { page, limit, offset } = query;
    const activeFilter = isNull(products.deletedAt);

    const [data, totalResult] = await Promise.all([
      this.db
        .select()
        .from(products)
        .where(activeFilter)
        .limit(limit)
        .offset(offset),
      this.db
        .select({ count: count() })
        .from(products)
        .where(activeFilter),
    ]);

    const totalItems = Number(totalResult[0]?.count ?? 0);
    const meta = createPaginationMeta(page, limit, totalItems);

    return apiResponse(data, 'Products retrieved successfully', meta);
  }

  async findById(id: string) {
    const result = await this.db
      .select()
      .from(products)
      .where(and(eq(products.id, id), isNull(products.deletedAt)));

    const product = result[0];

    if (!product) {
      throw new NotFoundException(`Product with id "${id}" not found`);
    }

    return product;
  }

  async create(data: CreateProductDto) {
    const result = await this.db.insert(products).values(data).returning();
    return result[0];
  }

  async update(id: string, data: UpdateProductDto) {
    await this.findById(id);

    const result = await this.db
      .update(products)
      .set(data)
      .where(eq(products.id, id))
      .returning();

    return result[0];
  }

  async delete(id: string) {
    await this.findById(id);

    const result = await this.db
      .update(products)
      .set({ deletedAt: new Date(), isActive: false })
      .where(eq(products.id, id))
      .returning();

    return result[0];
  }
}
