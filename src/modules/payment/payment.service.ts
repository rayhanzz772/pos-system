import {
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import midtransClient from 'midtrans-client';
import { DRIZZLE } from '../../database/database.module.js';
import { orders } from '../../database/schema/order.schema.js';
import type { Database } from '../../database/database.types.js';
import { eq } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

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

      await this.db.insert(orders).values({
        id: finalOrderId,
        userId: 'pmbipbf026u9awlpwl139k4j',
        amount: amount,
        orderStatus: 'PENDING',
        paymentMethod: 'QRIS',
      });

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

      await this.db.insert(orders).values({
        id: finalOrderId,
        userId: 'pmbipbf026u9awlpwl139k4j',
        amount: amount,
        orderStatus: 'PENDING',
        paymentMethod: `VA_${bank.toUpperCase()}`,
      });

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
    // SDK memeriksa status transaksi melalui Midtrans.
    const status = await this.coreApi.transaction.notification(
      payload,
    );

    const orderId = status.order_id;
    const transactionStatus = status.transaction_status;

    if (transactionStatus === 'settlement') {
      await this.db.update(orders).set({
        orderStatus: 'PAID',
      }).where(eq(orders.id, orderId));
    } else if (
      transactionStatus === 'expire' ||
      transactionStatus === 'cancel'
    ) {
      await this.db.update(orders).set({
        orderStatus: 'CANCELLED',
      }).where(eq(orders.id, orderId));
    }

    return {
      received: true,
      orderId,
      transactionStatus,
    };
  }
}
