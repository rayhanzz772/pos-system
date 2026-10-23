# NestJS Template

A production-ready NestJS boilerplate with PostgreSQL, Drizzle ORM, and a clean SOLID architecture.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [NestJS](https://nestjs.com/) v12 |
| Language | TypeScript v6 |
| Database | PostgreSQL |
| ORM | [Drizzle ORM](https://orm.drizzle.team/) |
| Validation | class-validator + class-transformer |
| Password Hashing | argon2id |
| Testing | Vitest + Supertest |
| Linting | oxlint |

---

## Project Structure

```
src/
├── common/                        # Shared utilities, filters, interceptors
│   ├── dto/
│   │   ├── api-response.dto.ts    # Standard API response shape
│   │   └── pagination-query.dto.ts # Pagination query params (page, limit)
│   ├── filters/
│   │   └── http-exception.filter.ts # Global error handler
│   ├── interceptors/
│   │   └── response.interceptor.ts  # Auto-wrap responses in ApiResponse shape
│   └── utils/
│       ├── date.util.ts
│       └── pagination.util.ts
│
├── config/                        # Typed configuration via @nestjs/config
│   ├── app.config.ts              # PORT, NODE_ENV, API_PREFIX, CORS_ORIGIN
│   ├── database.config.ts         # DATABASE_URL, DB_HOST, DB_PORT, etc.
│   ├── jwt.config.ts              # JWT_SECRET, JWT_EXPIRES_IN, etc.
│   └── index.ts
│
├── database/                      # Database setup and schema
│   ├── database.module.ts         # Provides DRIZZLE token via factory
│   ├── database.types.ts          # Database type alias
│   └── schema/
│       ├── role.schema.ts         # roles table
│       ├── user.schema.ts         # users table
│       └── index.ts
│
├── modules/                       # Feature modules
│   ├── auth/
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   └── auth.module.ts
│   └── users/
│       ├── dto/
│       │   ├── create-user.dto.ts
│       │   └── update-user.dto.ts
│       ├── users.controller.ts
│       ├── users.service.ts
│       ├── users.service.interface.ts  # IUsersService + USERS_SERVICE token
│       └── users.module.ts
│
├── scripts/                       # Database seed scripts
│   ├── seeds/
│   │   ├── 01-roles.seed.ts
│   │   ├── 02-users.seed.ts
│   │   └── index.ts
│   └── seed.ts
│
├── security/                      # Security utilities
│   ├── password.service.ts        # argon2id hash & verify
│   └── security.module.ts
│
├── app.module.ts                  # Root module
└── main.ts                        # App bootstrap
```

---

## Architecture

This project follows **SOLID principles**:

- **S** — Each class has one responsibility (`PasswordService` hashes only, `UsersService` handles user data only).
- **O** — Adding features means adding new modules, not modifying existing ones.
- **L** — `UsersService` implements `IUsersService`, guaranteeing contract compliance.
- **I** — `IUsersService` exposes only what the controller needs.
- **D** — Controllers and services depend on **tokens/interfaces**, not concrete classes.

```
UsersController
  └─ @Inject(USERS_SERVICE) → IUsersService
                                  └─ UsersService (concrete, swappable)
                                      └─ @Inject(DRIZZLE) → Database
```

---

## API Response Shape

All responses are wrapped automatically by `ResponseInterceptor`.

**Success:**
```json
{
  "success": true,
  "message": "Users retrieved successfully",
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 10,
    "totalItems": 42,
    "totalPages": 5
  }
}
```

**Error:**
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "errors": ["name must be a string"],
  "path": "/api/v1/users",
  "timestamp": "2026-10-17T16:00:00.000Z"
}
```

---

## Database Schema

```
roles
├── id          text (CUID2, PK)
├── name        varchar(100)
├── code        varchar(255) UNIQUE
├── description text
└── created_at  timestamp

users
├── id          text (CUID2, PK)
├── role_id     text (FK → roles.id)
├── name        varchar(100)
├── email       varchar(255) UNIQUE
├── password    varchar(255)
├── created_at  timestamp
├── updated_at  timestamp
└── deleted_at  timestamp (soft delete)
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in the values.

```env
# App
PORT=3000
NODE_ENV=development
API_PREFIX=api/v1
CORS_ORIGIN=http://localhost:5173

# Database
DATABASE_URL=postgresql://dev:postgres@localhost:5432/nest_template
DB_HOST=localhost
DB_PORT=5432
DB_USER=dev
DB_PASSWORD=postgres
DB_NAME=nest_template

# JWT
JWT_SECRET=change_this_in_production
JWT_EXPIRES_IN=1d
JWT_REFRESH_SECRET=change_this_in_production
JWT_REFRESH_EXPIRES_IN=7d
```

---

## Getting Started

```bash
# Install dependencies
npm install

# Run database migrations
npm run db:migrate

# Seed database
npm run db:seed

# Start development server
npm run dev
```

---

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Build for production |
| `npm run start:prod` | Run production build |
| `npm run test` | Run unit tests |
| `npm run test:e2e` | Run end-to-end tests |
| `npm run test:cov` | Run tests with coverage |
| `npm run lint` | Lint source files |
| `npm run db:generate` | Generate Drizzle migration files |
| `npm run db:migrate` | Run migrations |
| `npm run db:push` | Push schema directly to DB |
| `npm run db:studio` | Open Drizzle Studio |
| `npm run db:seed` | Seed the database |

---

## Adding a New Module

1. Create `src/modules/<name>/` directory
2. Define `<name>.service.interface.ts` with `I<Name>Service` and `<NAME>_SERVICE` token
3. Implement `<name>.service.ts` with `implements I<Name>Service`
4. Register token in `<name>.module.ts`:
   ```ts
   providers: [{ provide: NAME_SERVICE, useClass: NameService }]
   ```
5. Inject via token in `<name>.controller.ts`:
   ```ts
   @Inject(NAME_SERVICE) private readonly service: INameService
   ```
6. Import the module in `app.module.ts`
