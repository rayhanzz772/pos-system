import type { Database } from '../../database/database.types.js';
import * as schema from '../../database/schema/user.schema.js';
import { PasswordService } from '../../security/password.service.js';
import { roles } from '../../database/schema/role.schema.js';
import { eq } from 'drizzle-orm';

export async function seedUsers(db: Database): Promise<void> {
  console.log('  ⏳ Menanam data users...');

  const password = await new PasswordService().hash('password123');

  const userRole = (await db.select({ id: roles.id }).from(roles).where(eq(roles.code, 'USER')).limit(1))[0];
  const adminRole = (await db.select({ id: roles.id }).from(roles).where(eq(roles.code, 'ADMIN')).limit(1))[0];
  const cashierRole = (await db.select({ id: roles.id }).from(roles).where(eq(roles.code, 'CASHIER')).limit(1))[0];

  if (!userRole || !adminRole) {
    throw new Error('Role USER atau ADMIN tidak ditemukan. Pastikan seeder roles sudah dijalankan.');
  }

  const usersData: Array<typeof schema.users.$inferInsert> = [
    {
      name: 'Thag Caveman',
      email: 'thag@cave.local',
      password: password,
      roleId: userRole.id,
    },
    {
      name: 'Oog Hunter',
      email: 'oog@cave.local',
      password: password,
      roleId: userRole.id,
    },
    {
      name: 'Grok Cashier',
      email: 'grok@cave.local',
      password: password,
      roleId: (cashierRole ?? userRole).id,
    },
    {
      name: 'Admin Cave',
      email: 'admin@cave.local',
      password: password,
      roleId: adminRole.id,
    },
  ];

  await db
    .insert(schema.users)
    .values(usersData)
    .onConflictDoNothing();

  console.log(`  ✅ Users selesai ditanam (${usersData.length} users)!`);
}
