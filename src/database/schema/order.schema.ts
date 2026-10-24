import { createId } from '@paralleldrive/cuid2';
import {
  pgTable,
  varchar,
  text,
  timestamp,
  integer,
} from 'drizzle-orm/pg-core';
import { users } from './user.schema.js';

export const orders = pgTable('orders', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  invoiceNumber: varchar('invoice_number', { length: 100 }),
  userId: text('user_id')
    .references(() => users.id, {
      onDelete: 'restrict',
      onUpdate: 'cascade',
    }),
  amount: integer('amount').notNull(),
  paidAmount: integer('paid_amount'),
  changeAmount: integer('change_amount').default(0),
  currency: varchar('currency', { length: 10 }).default('IDR').notNull(),
  transactionId: varchar('transaction_id', { length: 255 }).unique(),
  refundedAmount: integer('refunded_amount').default(0).notNull(),
  orderStatus: varchar('order_status', { length: 100 }).notNull(),
  paymentMethod: varchar('payment_method', { length: 100 }).notNull(),
  createdAt: timestamp('created_at')
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at')
    .$onUpdateFn(() => new Date())
    .notNull(),
  deletedAt: timestamp('deleted_at'),
});
