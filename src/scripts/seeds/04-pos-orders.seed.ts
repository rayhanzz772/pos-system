import type { Database } from '../../database/database.types.js';
import { orders } from '../../database/schema/order.schema.js';
import { orderItems } from '../../database/schema/order-item.schema.js';
import { products } from '../../database/schema/product.schema.js';
import { users } from '../../database/schema/user.schema.js';

export async function seedPosOrders(db: Database): Promise<void> {
  console.log('  ⏳ Menanam sample POS orders...');

  const cashier = (await db.select({ id: users.id }).from(users).limit(1))[0];
  const allProducts = await db.select().from(products).limit(3);

  if (allProducts.length < 2) {
    console.log('  ⚠️ Tidak cukup products untuk membuat sample order. Lewati.');
    return;
  }

  const p1 = allProducts[0];
  const p2 = allProducts[1];
  const qty1 = 2;
  const qty2 = 1;
  const subtotal1 = p1.price * qty1;
  const subtotal2 = p2.price * qty2;
  const totalAmount = subtotal1 + subtotal2;
  const paidAmount = totalAmount + 10000;
  const changeAmount = 10000;

  const invoiceNumber = `INV-${Date.now()}-1001`;

  const [order] = await db
    .insert(orders)
    .values({
      invoiceNumber,
      userId: cashier?.id,
      amount: totalAmount,
      paidAmount,
      changeAmount,
      orderStatus: 'COMPLETED',
      paymentMethod: 'CASH',
    })
    .returning();

  await db.insert(orderItems).values([
    {
      orderId: order.id,
      productId: p1.id,
      quantity: qty1,
      unitPrice: p1.price,
      subtotal: subtotal1,
    },
    {
      orderId: order.id,
      productId: p2.id,
      quantity: qty2,
      unitPrice: p2.price,
      subtotal: subtotal2,
    },
  ]);

  console.log(`  ✅ POS sample order selesai ditanam (Invoice: ${invoiceNumber})!`);
}
