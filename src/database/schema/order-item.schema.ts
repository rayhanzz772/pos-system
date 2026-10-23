import { createId } from '@paralleldrive/cuid2';
import { integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { orders } from './order.schema.js';
import { products } from './product.schema.js';

export const orderItems = pgTable('order_items', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  orderId: text('order_id')
    .notNull()
    .references(() => orders.id, {
      onDelete: 'cascade',
      onUpdate: 'cascade',
    }),
  productId: text('product_id')
    .notNull()
    .references(() => products.id, {
      onDelete: 'restrict',
      onUpdate: 'cascade',
    }),
  quantity: integer('quantity').notNull(),
  unitPrice: integer('unit_price').notNull(),
  subtotal: integer('subtotal').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
