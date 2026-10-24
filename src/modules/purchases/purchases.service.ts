import {
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { count, desc, eq, inArray } from 'drizzle-orm';
import { DRIZZLE } from '../../database/database.module.js';
import type { Database } from '../../database/database.types.js';
import { purchases } from '../../database/schema/purchase.schema.js';
import { purchaseItems } from '../../database/schema/purchase-item.schema.js';
import { products } from '../../database/schema/product.schema.js';
import { CreatePurchaseDto } from './dto/create-purchase.dto.js';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';
import { createPaginationMeta } from '../../common/utils/pagination.util.js';
import { apiResponse } from '../../common/dto/api-response.dto.js';
import type { IPurchasesService } from './purchases.service.interface.js';

@Injectable()
export class PurchasesService implements IPurchasesService {
  constructor(
    @Inject(DRIZZLE)
    private readonly db: Database,
  ) {}

  async createPurchase(
    dto: CreatePurchaseDto,
    authenticatedUserId?: string,
  ) {
    const productIds = dto.items.map((item) => item.productId);

    return await this.db.transaction(async (tx) => {
      const dbProducts = await tx
        .select()
        .from(products)
        .where(inArray(products.id, productIds));

      const productMap = new Map(dbProducts.map((p) => [p.id, p]));

      for (const item of dto.items) {
        const product = productMap.get(item.productId);
        if (!product || product.deletedAt) {
          throw new NotFoundException(
            `Product with ID "${item.productId}" was not found or is inactive`,
          );
        }
      }

      let totalAmount = 0;
      const itemsToInsert: {
        productId: string;
        quantity: number;
        unitCost: number;
        subtotal: number;
        name: string;
      }[] = [];

      for (const item of dto.items) {
        const product = productMap.get(item.productId)!;
        const subtotal = item.unitCost * item.quantity;
        totalAmount += subtotal;

        itemsToInsert.push({
          productId: item.productId,
          quantity: item.quantity,
          unitCost: item.unitCost,
          subtotal,
          name: product.name,
        });
      }

      const invoiceNumber = `PO-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const targetUserId = dto.userId ?? authenticatedUserId ?? null;

      const [newPurchase] = await tx
        .insert(purchases)
        .values({
          invoiceNumber,
          supplierName: dto.supplierName ?? null,
          userId: targetUserId,
          totalAmount,
          notes: dto.notes ?? null,
          status: 'COMPLETED',
        })
        .returning();

      for (const item of itemsToInsert) {
        await tx.insert(purchaseItems).values({
          purchaseId: newPurchase.id,
          productId: item.productId,
          quantity: item.quantity,
          unitCost: item.unitCost,
          subtotal: item.subtotal,
        });

        const currentProduct = productMap.get(item.productId)!;
        await tx
          .update(products)
          .set({ stock: currentProduct.stock + item.quantity })
          .where(eq(products.id, item.productId));
      }

      return apiResponse(
        {
          purchase: newPurchase,
          items: itemsToInsert,
        },
        'Purchase completed and inventory restocked successfully',
      );
    });
  }

  async getPurchases(query: PaginationQueryDto) {
    const { page, limit, offset } = query;

    const [data, totalResult] = await Promise.all([
      this.db
        .select()
        .from(purchases)
        .orderBy(desc(purchases.createdAt))
        .limit(limit)
        .offset(offset),
      this.db.select({ count: count() }).from(purchases),
    ]);

    const totalItems = Number(totalResult[0]?.count ?? 0);
    const meta = createPaginationMeta(page, limit, totalItems);

    return apiResponse(data, 'Purchases retrieved successfully', meta);
  }

  async getPurchaseById(id: string) {
    const purchaseResult = await this.db
      .select()
      .from(purchases)
      .where(eq(purchases.id, id));

    const purchase = purchaseResult[0];
    if (!purchase) {
      throw new NotFoundException(`Purchase with ID "${id}" not found`);
    }

    const items = await this.db
      .select({
        id: purchaseItems.id,
        productId: purchaseItems.productId,
        productName: products.name,
        sku: products.sku,
        quantity: purchaseItems.quantity,
        unitCost: purchaseItems.unitCost,
        subtotal: purchaseItems.subtotal,
      })
      .from(purchaseItems)
      .innerJoin(products, eq(purchaseItems.productId, products.id))
      .where(eq(purchaseItems.purchaseId, id));

    return apiResponse(
      {
        purchase,
        items,
      },
      'Purchase details retrieved successfully',
    );
  }
}
