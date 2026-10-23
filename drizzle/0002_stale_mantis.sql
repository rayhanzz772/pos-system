CREATE TABLE "products" (
	"id" text PRIMARY KEY NOT NULL,
	"sku" varchar(100) NOT NULL,
	"name" varchar(150) NOT NULL,
	"description" text,
	"price" integer NOT NULL,
	"stock" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "products_sku_unique" UNIQUE("sku")
);
