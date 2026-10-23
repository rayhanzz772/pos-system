
import { createId } from '@paralleldrive/cuid2';
import {
  pgTable,
  varchar,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

export const roles = pgTable('roles', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  name: varchar('name', { length: 100 }).notNull(),
  code: varchar('code', { length: 255 }).notNull().unique(),
  description: text('description'),
  createdAt: timestamp('created_at')
    .defaultNow()
    .notNull(),
});
