# AGENTS.md — Project Notes

Notes for AI agents working in this repo. Read this before changing code.

## What this is

NestJS v12 template (TypeScript 6, ESM) with PostgreSQL + Drizzle ORM, Midtrans payments, Vitest, oxlint, Prettier. Git repository on branch `main`.

## Commands

| Task | Command |
|---|---|
| Dev server (watch) | `npm run dev` |
| Build | `npm run build` |
| Prod | `npm run start:prod` (`node dist/main`) |
| Unit tests | `npm test` (Vitest) |
| E2E tests | `npm run test:e2e` |
| Lint | `npm run lint` (`oxlint --type-aware src/ test/`) |
| Format | `npm run format` |
| Generate migration | `npm run db:generate` |
| Migrate | `npm run db:migrate` |
| Push schema | `npm run db:push` |
| Drizzle Studio | `npm run db:studio` |
| Seed | `npm run db:seed` (`tsx src/scripts/seed.ts`) |

Always run `npm run lint` and `npm test` after changes. All tests and lint pass cleanly (0 errors, 0 warnings).

## Layout

```
src/
  main.ts                 bootstrap: global prefix (api/v1), CORS, ValidationPipe, interceptor, filter
  app.module.ts           root module; ConfigModule + ObserveModule + feature modules + global AuthGuard
  app.controller.ts        GET health/db (@Public)
  app.service.ts           raw SQL health check via DRIZZLE
  config/                  registerAs namespaces: app, database, jwt
  database/
    database.module.ts     exports DRIZZLE token (pg Pool + drizzle)
    database.types.ts      Database type
    schema/                user.schema.ts, role.schema.ts, product.schema.ts, order.schema.ts, order-item.schema.ts, index.ts
  common/
    dto/                   api-response.dto.ts, pagination-query.dto.ts
    filters/               http-exception.filter.ts (global @Catch)
    interceptors/          response.interceptor.ts (auto-wraps responses)
    logger/                http-logger.middleware.ts
    utils/                 pagination.util.ts, date.util.ts
  modules/
    auth/                  AuthController, AuthService, AuthGuard, @Public(), @CurrentUser(), login/register DTOs
    users/                 DTOs, IUsersService + USERS_SERVICE token, CRUD
    products/              DTOs, IProductsService + PRODUCTS_SERVICE token, soft-delete CRUD
    pos/                   DTOs (CheckoutDto), IPosService + POS_SERVICE token, orders & checkout
    payment/               Midtrans QRIS, bank transfer, webhook
  scripts/seeds/           ordered seeders (01-roles, 02-users, 03-products, 04-pos-orders)
  security/                PasswordService (argon2id)
```

## Conventions that will bite you

1. **ESM + NodeNext**: every relative import ends in `.js`, even in `.ts` source (`./app.module.js`). `package.json` has `"type": "module"`.
2. **DI via tokens** (SOLID): controllers inject interfaces/tokens, not classes. Example:
   `USERS_SERVICE` string token → `useClass: UsersService`; controller uses `@Inject(USERS_SERVICE)`.
3. **Drizzle injection**: `@Inject(DRIZZLE) private readonly db: Database`. `DRIZZLE` is exported from `DatabaseModule`; import that module in any feature module that needs DB.
4. **Config**: use namespaced keys (`app.port`, `database.url`, `jwt.secret`). Payment reads raw env (`MIDTRANS_*`) directly via `ConfigService.get`/`getOrThrow` because they are not registered as a namespace.
5. **Response envelope**: `ResponseInterceptor` wraps plain returns as `{success, message:'success', data}`. If a service already returns an `apiResponse(...)` object (has `success` + `data`), it is passed through. Errors are shaped by `HttpExceptionFilter`.
6. **Validation** is global: `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`. DTO fields need class-validator decorators.
7. **Pagination**: use `PaginationQueryDto` (`page`, `limit`, getter `offset`) + `createPaginationMeta(...)`.
8. **IDs**: CUID2 via `createId()` defaults in schemas; camelCase TS fields map to snake_case columns.
9. **Auth Guard**: `AuthGuard` is registered globally as `APP_GUARD` in `AppModule`. Public endpoints must be explicitly decorated with `@Public()`.

## Request flow

```
main.ts
  └─ ValidationPipe
  └─ ResponseInterceptor  → wraps success
  └─ HttpExceptionFilter  → shapes errors
Controller (@Inject(TOKEN) interface)
  └─ Service (implements interface)
      └─ @Inject(DRIZZLE) Database
          └─ PostgreSQL
```

## Routes (prefix `api/v1`)

- App:
  - `GET /health/db` (`@Public()`)
- Auth (`@Controller('auth')`):
  - `POST /auth/register` (`@Public()`)
  - `POST /auth/login` (`@Public()`)
  - `GET /auth/me` (requires Bearer token)
- Users (`@Controller('users')`):
  - `GET /users`
  - `GET /users/:id/get`
  - `POST /users/create`
  - `PUT /users/:id/update`
  - `DELETE /users/:id/delete`
- Products (`@Controller('products')`):
  - `GET /products`
  - `GET /products/:id/get`
  - `POST /products/create`
  - `PUT /products/:id/update`
  - `DELETE /products/:id/delete` (soft delete: sets `deleted_at` + `is_active=false`)
- POS (`@Controller('pos')`):
  - `POST /pos/checkout`
  - `GET /pos/orders`
  - `GET /pos/orders/:id`
- Payments (`@Controller('payments')`):
  - `POST /payments/qris`
  - `POST /payments/bank-transfer`
  - `POST /payments/webhook`

## Database schema

- `roles`: id (CUID2 PK), name, code (unique), description, created_at
- `users`: id (CUID2 PK), role_id → roles.id, name, email (unique), password (argon2id), created_at, updated_at, deleted_at
- `products`: id (CUID2 PK), sku (unique), name, description, price (integer), stock (integer, default 0), is_active (boolean, default true), created_at, updated_at, deleted_at
- `orders`: id (CUID2 PK), invoice_number, user_id → users.id, amount (integer), paid_amount (integer), change_amount (integer), order_status, payment_method, created_at, updated_at, deleted_at
- `order_items`: id (CUID2 PK), order_id → orders.id (cascade delete), product_id → products.id, quantity (integer), unit_price (integer), subtotal (integer), created_at

Migrations live in `drizzle/` (`0000` to `0003`); config in `drizzle.config.ts` (schema entry: `src/database/schema/index.ts`).

## Environment

`.env` (present, do not commit). Required keys: `PORT, NODE_ENV, API_PREFIX, CORS_ORIGIN`, `DATABASE_URL` plus `DB_*`, `JWT_*`, and `MIDTRANS_IS_PRODUCTION, MIDTRANS_SERVER_KEY, MIDTRANS_CLIENT_KEY, MIDTRANS_MERCHANT_ID`.

Defaults if unset: port 3000, prefix `api/v1`, CORS `http://localhost:5173`.

## Verification Status (verified 2026-10-24)

- `npm test`: 11 of 11 unit tests PASS.
- `npm run test:e2e`: 1 of 1 e2e test PASS (`GET /health/db`).
- `npm run lint`: 0 errors, 0 warnings.
- `npm run build`: successful.
- `npm run db:migrate`: all 4 migrations applied.
- `npm run db:seed`: all 4 seeders (roles, users, products, pos-orders) complete successfully.

## Known issues & Technical Debt

- `PaymentService` hardcodes `userId: 'pmbipbf026u9awlpwl139k4j'` when inserting sandbox orders.
- `CreateUserDto` accepts plaintext `password`, but `UsersService.create` does not hash with `PasswordService` (use `AuthService.register` instead or inject `PasswordService`).
- `UpdateUserDto` has `bio` field which does not exist in the current `users` schema.
- `UsersService.delete` hard-deletes rather than soft-deleting with `deleted_at`.

## Adding a feature module

1. `src/modules/<name>/<name>.service.interface.ts` → `I<Name>Service` + `<NAME>_SERVICE` token.
2. `<name>.service.ts` → `implements I<Name>Service`, inject `DRIZZLE`.
3. `<name>.module.ts` → `providers: [{ provide: NAME_SERVICE, useClass: NameService }]`, import `DatabaseModule`.
4. `<name>.controller.ts` → `@Inject(NAME_SERVICE)`.
5. Register the module in `app.module.ts`.
6. For tables: add schema file, export from `schema/index.ts`, then `npm run db:generate` + `npm run db:migrate`.
