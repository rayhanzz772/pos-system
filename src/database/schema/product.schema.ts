import { createId } from '@paralleldrive/cuid2';
import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';

export const products = pgTable('products', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  sku: varchar('sku', { length: 100 }).notNull().unique(),
  name: varchar('name', { length: 150 }).notNull(),
  description: text('description'),
  price: integer('price').notNull(),
  stock: integer('stock').default(0).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .$onUpdateFn(() => new Date())
    .notNull(),
  deletedAt: timestamp('deleted_at'),
});
