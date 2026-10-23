import type { Database } from '../../database/database.types.js';
import * as schema from '../../database/schema/product.schema.js';

export async function seedProducts(db: Database): Promise<void> {
  console.log('  ⏳ Menanam data products...');

  const productsData: Array<typeof schema.products.$inferInsert> = [
    {
      sku: 'COF-AME-01',
      name: 'Iced Americano',
      description: 'Double espresso with chilled water and ice',
      price: 25000,
      stock: 50,
      isActive: true,
    },
    {
      sku: 'COF-LAT-02',
      name: 'Caffe Latte',
      description: 'Espresso with steamed milk and light layer of foam',
      price: 32000,
      stock: 40,
      isActive: true,
    },
    {
      sku: 'TEA-MAT-01',
      name: 'Matcha Latte',
      description: 'Stone ground Japanese green tea with fresh milk',
      price: 35000,
      stock: 30,
      isActive: true,
    },
    {
      sku: 'BAK-CRO-01',
      name: 'Butter Croissant',
      description: 'Flaky French butter pastry',
      price: 22000,
      stock: 25,
      isActive: true,
    },
    {
      sku: 'BAK-DON-01',
      name: 'Glazed Donut',
      description: 'Classic soft artisanal glazed donut',
      price: 15000,
      stock: 60,
      isActive: true,
    },
    {
      sku: 'BEV-WAT-01',
      name: 'Mineral Water 600ml',
      description: 'Natural mineral spring water',
      price: 8000,
      stock: 100,
      isActive: true,
    },
  ];

  await db
    .insert(schema.products)
    .values(productsData)
    .onConflictDoNothing();

  console.log(`  ✅ Products selesai ditanam (${productsData.length} products)!`);
}
