# AGENTS.md — Project Notes

Notes for AI agents working in this repo. Read this before changing code.

## What this is

NestJS v12 template (TypeScript 6, ESM) with PostgreSQL + Drizzle ORM, Midtrans payments, Vitest, oxlint, Prettier. Not a git repo in this workspace.

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

Always run `npm run lint` and `npm test` after changes. Note baseline: 3 of 9 unit tests currently fail (see Known issues).

## Layout

```
src/
  main.ts                 bootstrap: global prefix, CORS, ValidationPipe, interceptor, filter
  app.module.ts           root module; ConfigModule + ObserveModule + feature modules
  app.controller.ts        GET health/db
  app.service.ts           raw SQL health check via DRIZZLE
  config/                  registerAs namespaces: app, database, jwt
  database/
    database.module.ts     exports DRIZZLE token (pg Pool + drizzle)
    database.types.ts      Database type
    schema/                user.schema.ts, role.schema.ts, order.schema.ts, index.ts
  common/
    dto/                   api-response.dto.ts, pagination-query.dto.ts
    filters/               http-exception.filter.ts (global @Catch)
    interceptors/          response.interceptor.ts (auto-wraps responses)
    utils/                 pagination.util.ts; date.util.ts is EMPTY
  modules/
    auth/                  controller + service are EMPTY stubs
    users/                 DTOs, IUsersService + USERS_SERVICE token, CRUD
    products/              DTOs, IProductsService + PRODUCTS_SERVICE token, soft-delete CRUD
    payment/               Midtrans QRIS, bank transfer, webhook
  scripts/seeds/           ordered seeders (01-roles, 02-users)
  security/                PasswordService (argon2id)
```

## Conventions that will bite you

1. **ESM + NodeNext**: every relative import ends in `.js`, even in `.ts` source (`./app.module.js`). `package.json` has `"type": "module"`.
2. **DI via tokens** (SOLID): controllers inject interfaces/tokens, not classes. Users pattern:
   `USERS_SERVICE` string token → `useClass: UsersService`; controller uses `@Inject(USERS_SERVICE)`.
3. **Drizzle injection**: `@Inject(DRIZZLE) private readonly db: Database`. `DRIZZLE` is exported from `DatabaseModule`; import that module in any feature module that needs DB.
4. **Config**: use namespaced keys (`app.port`, `database.url`, `jwt.secret`). Payment reads raw env (`MIDTRANS_*`) directly via `ConfigService.get`/`getOrThrow` because they are not registered as a namespace.
5. **Response envelope**: `ResponseInterceptor` wraps plain returns as `{success, message:'success', data}`. If a service already returns an `apiResponse(...)` object (has `success` + `data`), it is passed through. Errors are shaped by `HttpExceptionFilter`.
6. **Validation** is global: `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`. DTO fields need class-validator decorators.
7. **Pagination**: use `PaginationQueryDto` (`page`, `limit`, getter `offset`) + `createPaginationMeta(...)`.
8. **IDs**: CUID2 via `createId()` defaults in schemas; camelCase TS fields map to snake_case columns.

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

- `GET /health/db`
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
- Payments (`@Controller('payments')`): `POST /payments/qris`, `POST /payments/bank-transfer`, `POST /payments/webhook`
- Auth: none yet (empty classes).

## Database schema

- `roles`: id (CUID2 PK), name, code (unique), description, created_at
- `users`: id (CUID2 PK), role_id → roles.id, name, email (unique), password, created_at, updated_at, deleted_at
- `orders`: id (CUID2 PK), user_id → users.id, amount (integer), order_status, payment_method, created_at, updated_at, deleted_at
- `products`: id (CUID2 PK), sku (unique), name, description, price (integer), stock (integer, default 0), is_active (boolean, default true), created_at, updated_at, deleted_at

Migrations live in `drizzle/`; config in `drizzle.config.ts` (schema entry: `src/database/schema/index.ts`).

## Environment

`.env` (present, do not commit). Required keys: `PORT, NODE_ENV, API_PREFIX, CORS_ORIGIN`, `DATABASE_URL` plus `DB_*`, `JWT_*`, and `MIDTRANS_IS_PRODUCTION, MIDTRANS_SERVER_KEY, MIDTRANS_CLIENT_KEY, MIDTRANS_MERCHANT_ID`.

Defaults if unset: port 3000, prefix `api/v1`, CORS `http://localhost:5173`.

## Tests

- Vitest, not Jest. Config: `vitest.config.ts` (`**/*.spec.ts`), `vitest.config.e2e.ts` (`**/*.e2e-spec.ts`). Globals enabled.
- Unit tests colocated in `src/**/*.spec.ts`; e2e in `test/`.
- E2E `test/app.e2e-spec.ts` is stale: it expects `GET /` → `"Hello World!"`, but that route does not exist.

## Known issues (verified 2026-10-23)

- `npm test`: 3 failing tests (of 9) — `users.service.spec.ts` and `users.controller.spec.ts` do not provide `DRIZZLE`/`USERS_SERVICE`; `app.controller.spec.ts` expects removed `Hello World!` route. Products specs pass.
- `npm run lint`: warnings only — empty `src/common/utils/date.util.ts`; unused `IsOptional` import in `create-user.dto.ts`.
- Auth module is a stub; JWT config exists but no JWT library/guards are wired.
- `PaymentService` hardcodes `userId: 'pmbipbf026u9awlpwl139k4j'` when inserting orders.
- `CreateUserDto` accepts a plaintext `password`, but `UsersService.create` does not hash it (PasswordService is not used).
- `UpdateUserDto` has a `bio` field that does not exist in the `users` schema.
- `UsersService.delete` hard-deletes despite the `deleted_at` soft-delete column.
- `date.util.ts` is empty.
- `dist/` and `drizzle/` are committed/present build artifacts; ignore them unless doing build/migration work.

## Adding a feature module

1. `src/modules/<name>/<name>.service.interface.ts` → `I<Name>Service` + `<NAME>_SERVICE` token.
2. `<name>.service.ts` → `implements I<Name>Service`, inject `DRIZZLE`.
3. `<name>.module.ts` → `providers: [{ provide: NAME_SERVICE, useClass: NameService }]`, import `DatabaseModule`.
4. `<name>.controller.ts` → `@Inject(NAME_SERVICE)`.
5. Register the module in `app.module.ts`.
6. For tables: add schema file, export from `schema/index.ts`, then `npm run db:generate` + `npm run db:migrate`.
