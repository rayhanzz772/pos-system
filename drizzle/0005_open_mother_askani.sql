ALTER TABLE "orders" ADD COLUMN "currency" varchar(10) DEFAULT 'IDR' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "transaction_id" varchar(255);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "refunded_amount" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_transaction_id_unique" UNIQUE("transaction_id");