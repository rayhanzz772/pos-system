import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { count, desc, eq, inArray } from 'drizzle-orm';
import { DRIZZLE } from '../../database/database.module.js';
import type { Database } from '../../database/database.types.js';
import { orders } from '../../database/schema/order.schema.js';
import { orderItems } from '../../database/schema/order-item.schema.js';
import { products } from '../../database/schema/product.schema.js';
import { CheckoutDto, PaymentMethod } from './dto/checkout.dto.js';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';
import { createPaginationMeta } from '../../common/utils/pagination.util.js';
import { apiResponse } from '../../common/dto/api-response.dto.js';
import type { IPosService } from './pos.service.interface.js';

@Injectable()
export class PosService implements IPosService {
  constructor(
    @Inject(DRIZZLE)
    private readonly db: Database,
  ) {}

  async checkout(dto: CheckoutDto) {
    const productIds = dto.items.map((item) => item.productId);

    return await this.db.transaction(async (tx) => {
      const dbProducts = await tx
        .select()
        .from(products)
        .where(inArray(products.id, productIds));

      const productMap = new Map(dbProducts.map((p) => [p.id, p]));

      for (const item of dto.items) {
        const product = productMap.get(item.productId);
        if (!product || product.deletedAt || !product.isActive) {
          throw new NotFoundException(
            `Product with ID "${item.productId}" is not available`,
          );
        }

        if (product.stock < item.quantity) {
          throw new BadRequestException(
            `Insufficient stock for "${product.name}". Available: ${product.stock}, Requested: ${item.quantity}`,
          );
        }
      }

      let totalAmount = 0;
      const itemsToInsert: {
        productId: string;
        quantity: number;
        unitPrice: number;
        subtotal: number;
        name: string;
      }[] = [];

      for (const item of dto.items) {
        const product = productMap.get(item.productId)!;
        const subtotal = product.price * item.quantity;
        totalAmount += subtotal;

        itemsToInsert.push({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: product.price,
          subtotal,
          name: product.name,
        });
      }

      if (
        dto.paymentMethod === PaymentMethod.CASH &&
        dto.paidAmount < totalAmount
      ) {
        throw new BadRequestException(
          `Paid amount (${dto.paidAmount}) is less than total amount (${totalAmount})`,
        );
      }

      const changeAmount = Math.max(0, dto.paidAmount - totalAmount);
      const invoiceNumber = `INV-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

      const [newOrder] = await tx
        .insert(orders)
        .values({
          invoiceNumber,
          userId: dto.userId ?? null,
          amount: totalAmount,
          paidAmount: dto.paidAmount,
          changeAmount,
          orderStatus: 'COMPLETED',
          paymentMethod: dto.paymentMethod,
        })
        .returning();

      for (const item of itemsToInsert) {
        await tx.insert(orderItems).values({
          orderId: newOrder.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: item.subtotal,
        });

        const currentProduct = productMap.get(item.productId)!;
        await tx
          .update(products)
          .set({ stock: currentProduct.stock - item.quantity })
          .where(eq(products.id, item.productId));
      }

      return apiResponse(
        {
          order: newOrder,
          items: itemsToInsert,
        },
        'POS transaction completed successfully',
      );
    });
  }

  async getOrderHistory(query: PaginationQueryDto) {
    const { page, limit, offset } = query;

    const [data, totalResult] = await Promise.all([
      this.db
        .select()
        .from(orders)
        .orderBy(desc(orders.createdAt))
        .limit(limit)
        .offset(offset),
      this.db.select({ count: count() }).from(orders),
    ]);

    const totalItems = Number(totalResult[0]?.count ?? 0);
    const meta = createPaginationMeta(page, limit, totalItems);

    return apiResponse(data, 'POS orders retrieved successfully', meta);
  }

  async getOrderById(id: string) {
    const orderResult = await this.db
      .select()
      .from(orders)
      .where(eq(orders.id, id));

    const order = orderResult[0];
    if (!order) {
      throw new NotFoundException(`Order with ID "${id}" not found`);
    }

    const items = await this.db
      .select({
        id: orderItems.id,
        productId: orderItems.productId,
        productName: products.name,
        sku: products.sku,
        quantity: orderItems.quantity,
        unitPrice: orderItems.unitPrice,
        subtotal: orderItems.subtotal,
      })
      .from(orderItems)
      .innerJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, id));

    return apiResponse(
      {
        order,
        items,
      },
      'Order details retrieved successfully',
    );
  }
}
