# Full-Stack Monorepo Template

Reusable full-stack monorepo foundation maintained by AutanaSoft. It combines Next.js, NestJS,
shadcn/ui, Turborepo, pnpm, PostgreSQL, shared TypeScript contracts, and workspace tooling in one
starter repository.

## Included

| Workspace                    | Purpose                                                                                      |
| ---------------------------- | -------------------------------------------------------------------------------------------- |
| `apps/web`                   | Next.js web application with the shared UI package.                                          |
| `apps/api`                   | NestJS HTTP API with configuration, security, health, OpenAPI, persistence, and E2E support. |
| `apps/app`                   | Standalone NestJS application-context example without an HTTP listener.                      |
| `packages/contracts`         | Shared Zod contracts for application boundaries.                                             |
| `packages/database`          | Prisma and PostgreSQL database boundary.                                                     |
| `packages/ui`                | Shared shadcn/ui components, styles, hooks, and utilities.                                   |
| `packages/eslint-config`     | Shared ESLint configurations.                                                                |
| `packages/jest-config`       | Shared Jest configurations.                                                                  |
| `packages/typescript-config` | Shared TypeScript configurations.                                                            |

## Requirements

- Node.js `>=20`
- pnpm `10.33.4`
- PostgreSQL for database-backed API development
- `psql` and a PostgreSQL user allowed to create and drop databases for API E2E tests

## Quick Start

Install dependencies from the repository root:

```bash
pnpm install
```

Create local environment files from the safe examples:

```bash
cp apps/api/.env.example apps/api/.env
cp packages/database/.env.example packages/database/.env
```

Set `DATABASE_URL` in both files to a local PostgreSQL database. The API and database packages load
their environment from their own workspace directories when their commands run.

Generate the Prisma client and apply development migrations:

```bash
pnpm db:generate
pnpm db:migrate:dev
```

Start the web application and API together:

```bash
pnpm dev
```

The default development ports are `4002` for the web application and `4001` for the API.

## Workspace Commands

Run these commands from the repository root:

```bash
pnpm dev
pnpm build
pnpm lint
pnpm lint:md
pnpm typecheck
pnpm verify
pnpm db:validate
pnpm db:generate
pnpm db:migrate:dev
pnpm db:migrate:deploy
pnpm db:push
pnpm db:seed
```

Run an application or package command with a workspace filter:

```bash
pnpm --filter web dev
pnpm --filter api test:unit
pnpm --filter api test:e2e
pnpm --filter app test:unit
pnpm --filter @autanasoft/contracts test
pnpm --filter @autanasoft/database test
```

Unit and E2E tasks can also be orchestrated through Turborepo:

```bash
pnpm exec turbo run test:unit
pnpm exec turbo run test:e2e
```

The API E2E suite uses a temporary PostgreSQL database and requires `DATABASE_URL`, `psql`, and a
PostgreSQL user with permission to create and drop databases. See
[`apps/api/README.md`](apps/api/README.md) for the complete configuration contract.

## Git Hooks

Husky installs these repository hooks after dependency installation:

- `pre-commit`: formats and lints staged files through `lint-staged`.
- `commit-msg`: validates Conventional Commit messages with Commitlint.
- `pre-push`: runs `pnpm verify` for lint, typecheck, build, unit tests, and E2E tests.

The pre-push hook requires the local PostgreSQL service and `psql` permissions used by the API E2E
suite. Run `pnpm exec turbo run test:e2e` directly when you need to rerun only the E2E tests. CI
also runs them with a temporary PostgreSQL service.

## Adding UI Components

Run the shadcn CLI from the repository root and target the web application:

```bash
pnpm dlx shadcn@latest add button -c apps/web
```

The generated component is placed in `packages/ui/src/components`. Use it from a workspace app:

```tsx
import { Button } from '@autanasoft/ui/components/button';
```

## Structure

```text
apps/
├── api/       # NestJS HTTP API
├── app/       # Standalone NestJS application context
└── web/       # Next.js application
packages/
├── contracts/ # Shared Zod contracts
├── database/  # Prisma and PostgreSQL boundary
├── eslint-config/
├── jest-config/
├── typescript-config/
└── ui/        # Shared shadcn/ui components
docs/          # API, testing, and implementation documentation
```

## Using This Repository as a Template

1. Open the repository on GitHub.
2. Select **Use this template** and create a new repository.
3. Clone the generated repository locally.
4. Replace the application identity, environment values, and domain modules for the new project.
5. Run the quick-start commands above before adding product functionality.

Template repositories copy files and branches but create unrelated Git histories. The generated
project should establish its own application identity and remote.

## Development Practices

- Keep application behavior inside the owning workspace and shared boundaries explicit.
- Keep HTTP contracts in `packages/contracts` when they cross application boundaries.
- Keep database access behind `packages/database` and application repositories.
- Use Conventional Commits for changes.
- Keep tests and documentation with the behavior they explain.
- Never commit real environment files, credentials, tokens, or generated artifacts.

## License

This template is distributed under the [MIT License](LICENSE). Copyright (c) 2026 AutanaSoft.
