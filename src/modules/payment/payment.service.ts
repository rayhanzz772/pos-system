import * as crypto from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import midtransClient from 'midtrans-client';
import { DRIZZLE } from '../../database/database.module.js';
import { orders } from '../../database/schema/order.schema.js';
import type { Database } from '../../database/database.types.js';
import { and, eq, ne } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import { apiResponse } from '../../common/dto/api-response.dto.js';
import { RefundDto } from './dto/refund.dto.js';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private readonly coreApi: any;

  constructor(
    private readonly config: ConfigService,
    @Inject(DRIZZLE)
    private readonly db: Database,
  ) {
    const CoreApiClass =
      midtransClient.CoreApi ??
      (midtransClient as unknown as { default: { CoreApi: typeof midtransClient.CoreApi } })
        ?.default?.CoreApi;

    this.coreApi = new CoreApiClass({
      isProduction:
        this.config.get<string>('MIDTRANS_IS_PRODUCTION') ===
        'true',
      serverKey: this.config.getOrThrow<string>(
        'MIDTRANS_SERVER_KEY',
      ),
      clientKey: this.config.getOrThrow<string>(
        'MIDTRANS_CLIENT_KEY',
      ),
    });
  }

  async createQrisPayment(orderId: string | undefined, amount: number) {
    const finalOrderId = orderId || `ORDER-${createId()}`;

    try {
      const response = await this.coreApi.charge({
        payment_type: 'qris',
        transaction_details: {
          order_id: finalOrderId,
          gross_amount: amount,
        },
        qris: {
          acquirer: 'gopay',
        },
      });

      const existingOrder = await this.db
        .select()
        .from(orders)
        .where(eq(orders.id, finalOrderId));

      if (existingOrder.length === 0) {
        await this.db.insert(orders).values({
          id: finalOrderId,
          userId: 'pmbipbf026u9awlpwl139k4j',
          amount: amount,
          orderStatus: 'PENDING',
          paymentMethod: 'QRIS',
          transactionId: response.transaction_id,
        });
      } else {
        await this.db
          .update(orders)
          .set({ transactionId: response.transaction_id })
          .where(eq(orders.id, finalOrderId));
      }

      const actions = response.actions ?? [];

      const qrAction =
        actions.find(
          (action: any) =>
            action.name === 'generate-qr-code-v2',
        ) ??
        actions.find(
          (action: any) =>
            action.name === 'generate-qr-code',
        );

      if (!qrAction?.url) {
        throw new Error('QRIS URL tidak ditemukan');
      }

      return {
        orderId: response.order_id,
        transactionId: response.transaction_id,
        status: response.transaction_status,
        amount: response.gross_amount,
        qrUrl: qrAction.url,
      };
    } catch (error: any) {
      this.logger.error(
        'Midtrans charge error:',
        error instanceof Error ? error.stack : error,
      );

      if (
        error?.httpStatusCode === '406' ||
        error?.httpStatusCode === 406 ||
        error?.ApiResponse?.status_code === '406'
      ) {
        throw new ConflictException(
          `Order ID "${finalOrderId}" sudah pernah digunakan atau terdapat konflik di Midtrans. Gunakan orderId unik baru.`,
        );
      }

      if (error instanceof ConflictException) {
        throw error;
      }

      throw new InternalServerErrorException(
        error?.ApiResponse?.status_message || 'Gagal membuat transaksi QRIS',
      );
    }
  }

  async createBankTransferPayment(
    orderId: string | undefined,
    amount: number,
    bank: 'bca' | 'bni' | 'bri' | 'permata' | 'mandiri' | 'cimb',
  ) {
    const finalOrderId = orderId || `ORDER-${createId()}`;

    try {
      let chargePayload: Record<string, any>;

      if (bank === 'mandiri') {
        chargePayload = {
          payment_type: 'echannel',
          transaction_details: {
            order_id: finalOrderId,
            gross_amount: amount,
          },
          echannel: {
            bill_info1: 'Payment For:',
            bill_info2: 'Order ' + finalOrderId,
          },
        };
      } else if (bank === 'permata') {
        chargePayload = {
          payment_type: 'permata',
          transaction_details: {
            order_id: finalOrderId,
            gross_amount: amount,
          },
        };
      } else {
        chargePayload = {
          payment_type: 'bank_transfer',
          transaction_details: {
            order_id: finalOrderId,
            gross_amount: amount,
          },
          bank_transfer: {
            bank,
          },
        };
      }

      const response = await this.coreApi.charge(chargePayload);

      const existingOrder = await this.db
        .select()
        .from(orders)
        .where(eq(orders.id, finalOrderId));

      if (existingOrder.length === 0) {
        await this.db.insert(orders).values({
          id: finalOrderId,
          userId: 'pmbipbf026u9awlpwl139k4j',
          amount: amount,
          orderStatus: 'PENDING',
          paymentMethod: `VA_${bank.toUpperCase()}`,
          transactionId: response.transaction_id,
        });
      } else {
        await this.db
          .update(orders)
          .set({ transactionId: response.transaction_id })
          .where(eq(orders.id, finalOrderId));
      }

      let vaNumber: string | undefined;
      let billKey: string | undefined;
      let billerCode: string | undefined;

      if (bank === 'mandiri') {
        billKey = response.bill_key;
        billerCode = response.biller_code;
      } else if (bank === 'permata') {
        vaNumber = response.permata_va_number;
      } else if (response.va_numbers?.length) {
        vaNumber = response.va_numbers[0].va_number;
      }

      return {
        orderId: response.order_id,
        transactionId: response.transaction_id,
        status: response.transaction_status,
        amount: response.gross_amount,
        bank,
        vaNumber,
        billKey,
        billerCode,
        expiryTime: response.expiry_time,
      };
    } catch (error: any) {
      this.logger.error(
        'Midtrans charge error:',
        error instanceof Error ? error.stack : error,
      );

      if (
        error?.httpStatusCode === '406' ||
        error?.httpStatusCode === 406 ||
        error?.ApiResponse?.status_code === '406'
      ) {
        throw new ConflictException(
          `Order ID "${finalOrderId}" sudah pernah digunakan atau terdapat konflik di Midtrans. Gunakan orderId unik baru.`,
        );
      }

      if (error instanceof ConflictException) {
        throw error;
      }

      throw new InternalServerErrorException(
        error?.ApiResponse?.status_message || 'Gagal membuat transaksi Bank Transfer',
      );
    }
  }

  async handleNotification(payload: Record<string, any>) {
    // 1. Validasi signature dan autentisitas webhook payment gateway
    if (payload?.signature_key) {
      const serverKey = this.config.getOrThrow<string>('MIDTRANS_SERVER_KEY');
      const expectedSignature = crypto
        .createHash('sha512')
        .update(
          `${payload.order_id}${payload.status_code}${payload.gross_amount}${serverKey}`,
        )
        .digest('hex');

      if (payload.signature_key !== expectedSignature) {
        this.logger.error(
          `Invalid Midtrans signature for order ${payload.order_id}`,
        );
        throw new UnauthorizedException('Invalid payment gateway signature');
      }
    }

    // Periksa status transaksi melalui Midtrans Core API SDK
    const status = await this.coreApi.transaction.notification(payload);

    const orderId = status.order_id;
    const transactionId = status.transaction_id;
    const transactionStatus = status.transaction_status;
    const grossAmount = Math.round(Number(status.gross_amount));
    const currency = status.currency ?? 'IDR';

    // 2. Validasi kelengkapan order ID dan transaction ID
    if (!orderId) {
      throw new BadRequestException('Missing order_id in payment notification');
    }
    if (!transactionId) {
      throw new BadRequestException('Missing transaction_id in payment notification');
    }

    // 3. Validasi Currency
    if (currency !== 'IDR') {
      throw new BadRequestException(`Invalid currency "${currency}", expected IDR`);
    }

    // 4. Cegah race condition menggunakan database transaction + SELECT ... FOR UPDATE
    return await this.db.transaction(async (tx) => {
      const [order] = await tx
        .select()
        .from(orders)
        .where(eq(orders.id, orderId))
        .for('update');

      if (!order) {
        throw new NotFoundException(`Order with ID "${orderId}" not found`);
      }

      // 5. Validasi nominal pembayaran di backend (cegah underpayment / price tampering)
      if (grossAmount !== order.amount) {
        this.logger.error(
          `Payment amount mismatch for order "${orderId}": expected ${order.amount}, received ${grossAmount}`,
        );
        throw new BadRequestException(
          `Payment amount mismatch: expected ${order.amount}, received ${grossAmount}`,
        );
      }

      // 6. Cegah satu transaksi gateway digunakan untuk menyelesaikan beberapa order
      const existingTxOrder = await tx
        .select({ id: orders.id })
        .from(orders)
        .where(
          and(
            eq(orders.transactionId, transactionId),
            ne(orders.id, orderId),
          ),
        );

      if (existingTxOrder.length > 0) {
        throw new ConflictException(
          `Transaction ID "${transactionId}" is already used by order "${existingTxOrder[0].id}"`,
        );
      }

      // 7. Cegah duplicate payment menggunakan idempotency
      if (
        transactionStatus === 'settlement' ||
        transactionStatus === 'capture'
      ) {
        if (order.orderStatus === 'PAID') {
          this.logger.log(
            `Order "${orderId}" is already PAID. Returning idempotent success.`,
          );
          return {
            received: true,
            idempotent: true,
            orderId,
            transactionStatus,
          };
        }

        await tx
          .update(orders)
          .set({
            orderStatus: 'PAID',
            paidAmount: grossAmount,
            transactionId,
          })
          .where(eq(orders.id, orderId));
      } else if (
        transactionStatus === 'expire' ||
        transactionStatus === 'cancel'
      ) {
        if (order.orderStatus === 'PAID') {
          this.logger.warn(
            `Cannot cancel order "${orderId}" because it is already marked as PAID.`,
          );
          return {
            received: true,
            orderId,
            transactionStatus,
          };
        }

        await tx
          .update(orders)
          .set({
            orderStatus: 'CANCELLED',
            transactionId,
          })
          .where(eq(orders.id, orderId));
      } else if (
        transactionStatus === 'refund' ||
        transactionStatus === 'partial_refund'
      ) {
        // 8. Cegah duplicate refund & refund melebihi nominal yang dibayar via webhook
        const refundAmount = Math.round(
          Number(status.refund_amount ?? grossAmount),
        );
        const currentRefunded = order.refundedAmount ?? 0;
        const totalPaid = order.paidAmount ?? order.amount;
        const remainingRefundable = totalPaid - currentRefunded;

        if (refundAmount > remainingRefundable) {
          throw new BadRequestException(
            `Refund amount (${refundAmount}) exceeds maximum refundable balance (${remainingRefundable})`,
          );
        }

        const newRefundedAmount = currentRefunded + refundAmount;
        const newStatus =
          newRefundedAmount >= totalPaid ? 'REFUNDED' : 'PARTIAL_REFUNDED';

        await tx
          .update(orders)
          .set({
            orderStatus: newStatus,
            refundedAmount: newRefundedAmount,
            transactionId,
          })
          .where(eq(orders.id, orderId));
      }

      return {
        received: true,
        orderId,
        transactionStatus,
      };
    });
  }

  // 9. Process refund internal / manual dengan validasi ketat & race condition protection
  async processRefund(dto: RefundDto) {
    const { orderId, amount, reason } = dto;

    return await this.db.transaction(async (tx) => {
      const [order] = await tx
        .select()
        .from(orders)
        .where(eq(orders.id, orderId))
        .for('update');

      if (!order) {
        throw new NotFoundException(`Order with ID "${orderId}" not found`);
      }

      if (order.orderStatus !== 'PAID' && order.orderStatus !== 'PARTIAL_REFUNDED') {
        throw new BadRequestException(
          `Cannot refund order with status "${order.orderStatus}". Only PAID or PARTIAL_REFUNDED orders can be refunded.`,
        );
      }

      const totalPaid = order.paidAmount ?? order.amount;
      const currentRefunded = order.refundedAmount ?? 0;
      const remainingRefundable = totalPaid - currentRefunded;

      if (remainingRefundable <= 0) {
        throw new BadRequestException(
          `Order "${orderId}" is already fully refunded`,
        );
      }

      if (amount > remainingRefundable) {
        throw new BadRequestException(
          `Refund amount (${amount}) exceeds remaining refundable balance (${remainingRefundable})`,
        );
      }

      const newRefundedAmount = currentRefunded + amount;
      const newStatus =
        newRefundedAmount >= totalPaid ? 'REFUNDED' : 'PARTIAL_REFUNDED';

      await tx
        .update(orders)
        .set({
          orderStatus: newStatus,
          refundedAmount: newRefundedAmount,
        })
        .where(eq(orders.id, orderId));

      return apiResponse(
        {
          orderId,
          refundedAmount: amount,
          totalRefunded: newRefundedAmount,
          remainingBalance: totalPaid - newRefundedAmount,
          orderStatus: newStatus,
          reason: reason ?? null,
        },
        'Refund processed successfully',
      );
    });
  }
}
