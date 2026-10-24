import { createId } from '@paralleldrive/cuid2';
import { integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { purchases } from './purchase.schema.js';
import { products } from './product.schema.js';

export const purchaseItems = pgTable('purchase_items', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  purchaseId: text('purchase_id')
    .notNull()
    .references(() => purchases.id, {
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
  unitCost: integer('unit_cost').notNull(),
  subtotal: integer('subtotal').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
