import { createId } from '@paralleldrive/cuid2';
import {
  pgTable,
  varchar,
  text,
  timestamp,
  integer,
} from 'drizzle-orm/pg-core';
import { users } from './user.schema.js';

export const purchases = pgTable('purchases', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  invoiceNumber: varchar('invoice_number', { length: 100 }),
  supplierName: varchar('supplier_name', { length: 255 }),
  userId: text('user_id').references(() => users.id, {
    onDelete: 'set null',
    onUpdate: 'cascade',
  }),
  totalAmount: integer('total_amount').notNull(),
  notes: text('notes'),
  status: varchar('status', { length: 50 }).default('COMPLETED').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .$onUpdateFn(() => new Date())
    .notNull(),
  deletedAt: timestamp('deleted_at'),
});
