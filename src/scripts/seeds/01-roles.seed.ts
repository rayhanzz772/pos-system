import type { Database } from '../../database/database.types.js';
import * as schema from '../../database/schema/role.schema.js';

export async function seedRoles(db: Database): Promise<void> {
  console.log('  ⏳ Menanam data roles...');

  const rolesData: Array<typeof schema.roles.$inferInsert> = [
    {
      name: 'Admin',
      code: 'ADMIN',
      description: 'This is for admin role',
    },
    {
      name: 'Cashier',
      code: 'CASHIER',
      description: 'This is for cashier role',
    },
    {
      name: 'User',
      code: 'USER',
      description: 'This is for user role',
    },
  ];

  await db
    .insert(schema.roles)
    .values(rolesData)
    .onConflictDoNothing();

  console.log(`  ✅ Roles selesai ditanam (${rolesData.length} roles)!`);
}
