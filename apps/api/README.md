# API

NestJS HTTP API for the monorepo. Production and E2E use the same `configureApplication` pipeline:
global prefix, URI versioning, CORS, Helmet, request IDs, error responses, rate limiting, and
Swagger.

## Configuration

Configuration is loaded from `apps/api/.env` and validated with Zod before the application accepts
traffic. `DATABASE_URL` is required and must be a PostgreSQL URL. Never commit credentials or paste
real secrets into examples.

| Area          | Variables                                                                                                                                  | Safe defaults                                                                                                                              |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Application   | `NODE_ENV`, `PORT`, `API_PREFIX`, `API_VERSION`, `TRUST_PROXY`                                                                             | `development`, `4001`, `api`, `1`, `false`                                                                                                 |
| CORS          | `CORS_ENABLED`, `CORS_ORIGINS`, `CORS_METHODS`, `CORS_ALLOWED_HEADERS`, `CORS_EXPOSED_HEADERS`, `CORS_CREDENTIALS`, `CORS_MAX_AGE_SECONDS` | enabled, empty origins, standard HTTP methods, `content-type,authorization,x-request-id`, `x-request-id`, `false`, `600`                   |
| Helmet        | `HELMET_ENABLED`                                                                                                                           | `true`                                                                                                                                     |
| Swagger       | `SWAGGER_ENABLED`, `SWAGGER_PATH`                                                                                                          | enabled outside production, `docs`                                                                                                         |
| Rate limiting | `RATE_LIMIT_ENABLED`, `RATE_LIMIT_TTL_MS`, `RATE_LIMIT_MAX`, `RATE_LIMIT_TRACKER`                                                          | `true`, `60000`, `100`, `ip`                                                                                                               |
| Logger        | `LOG_LEVEL`, `LOG_FILES_ENABLED`, `LOG_DIRECTORY`, `LOG_WARN_FILE`, `LOG_ERROR_FILE`, `REQUEST_ID_HEADER`                                  | debug in development, info in production, silent in test; files enabled outside test; `logs`, `warnings.log`, `errors.log`, `x-request-id` |
| Health        | `HEALTH_ENABLED`, `HEALTH_DISK_PATH`, `HEALTH_DISK_THRESHOLD_PERCENT`                                                                      | `true`, `.`, `90`                                                                                                                          |
| Argon2        | `ARGON2_MEMORY_COST`, `ARGON2_TIME_COST`, `ARGON2_PARALLELISM`                                                                             | `65536`, `3`, `1`                                                                                                                          |
| Database      | `DATABASE_URL`                                                                                                                             | required; no fallback                                                                                                                      |

List values such as `CORS_ORIGINS` are comma-separated. Production CORS requires explicit origins
and does not allow wildcard origins with credentials. Swagger is available at `/api/docs` and
`/api/docs-json` when enabled. Health endpoints are `/api/v1/health/live` and
`/api/v1/health/ready`.

## Safe Example

Use placeholders for credentials and restrict origins to known clients:

```dotenv
NODE_ENV=development
PORT=4001
API_PREFIX=api
API_VERSION=1
TRUST_PROXY=false

CORS_ENABLED=true
CORS_ORIGINS=https://app.example.test
CORS_CREDENTIALS=false

SWAGGER_ENABLED=true
SWAGGER_PATH=docs
HELMET_ENABLED=true

RATE_LIMIT_ENABLED=true
RATE_LIMIT_TTL_MS=60000
RATE_LIMIT_MAX=100
RATE_LIMIT_TRACKER=ip

LOG_LEVEL=debug
LOG_FILES_ENABLED=false
REQUEST_ID_HEADER=x-request-id

HEALTH_ENABLED=true
ARGON2_MEMORY_COST=65536
ARGON2_TIME_COST=3
ARGON2_PARALLELISM=1

DATABASE_URL=postgresql://DB_USER:DB_PASSWORD@DB_HOST:5432/DB_NAME?sslmode=require
```

## Commands

Run these commands from the repository root:

```bash
pnpm --filter api start
pnpm --filter api test:unit
pnpm --filter api test:e2e
pnpm --filter api typecheck
pnpm --filter api build
```

The E2E suite requires `psql`, permission for the configured PostgreSQL user to create and drop
databases, and a valid `DATABASE_URL`. It creates a uniquely named temporary database, applies all
migrations from scratch, writes warn/error JSONL files under `apps/api/.tmp`, flushes and closes the
logger transport, then removes the temporary database and log directory.

Apply migrations to an explicitly configured database with:

```bash
pnpm --filter @autanasoft/database db:migrate:deploy
```
