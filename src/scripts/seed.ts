import 'dotenv/config';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '../database/schema/index.js';
import type { Database } from '../database/database.types.js';
import * as seed from './seeds/index.js';

interface SeedTask {
  name: string;
  run: (db: Database) => Promise<void>;
}

const seedTasks: SeedTask[] = [
  { name: '01 - Roles', run: seed.seedRoles },
  { name: '02 - Users', run: seed.seedUsers },
  { name: '03 - Products', run: seed.seedProducts },
  { name: '04 - POS Orders', run: seed.seedPosOrders },
];

async function runMasterSeed() {
  console.log('🌱 [Seeder] Memulai proses seeding database...\n');
  const startTime = Date.now();

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL belum diatur di file .env!');
  }

  const pool = new Pool({ connectionString });
  const db: Database = drizzle({ client: pool, schema });

  try {
    for (const task of seedTasks) {
      console.log(`▶ [${task.name}]`);
      await task.run(db);
      console.log('');
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`🎉 [Seeder] Semua seeder selesai dieksekusi dalam ${duration} detik!`);
  } catch (error) {
    console.error('💥 [Seeder] Gagal mengeksekusi seeder:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

void runMasterSeed();
