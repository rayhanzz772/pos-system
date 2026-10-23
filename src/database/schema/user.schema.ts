
import { createId } from '@paralleldrive/cuid2';
import {
    pgTable,
    varchar,
    text,
    timestamp,
} from 'drizzle-orm/pg-core';
import { roles } from './role.schema.js';

export const users = pgTable('users', {
    id: text('id')
        .primaryKey()
        .$defaultFn(() => createId()),
    roleId: text('role_id')
        .notNull()
        .references(() => roles.id, {
            onDelete: 'restrict',
            onUpdate: 'cascade'
        }),
    name: varchar('name', { length: 100 }).notNull(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    password: varchar('password', { length: 255 }).notNull(),
    createdAt: timestamp('created_at')
        .defaultNow()
        .notNull(),
    updatedAt: timestamp('updated_at')
        .$onUpdateFn(() => new Date())
        .notNull(),
    deletedAt: timestamp('deleted_at')
});
