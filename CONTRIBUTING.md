# Contributing

This repository is a reusable full-stack monorepo template. Contributions should improve the
template's foundations, documentation, or reusable application boundaries without introducing
product-specific assumptions.

## Before Opening a Pull Request

Install dependencies and run the checks relevant to your change:

```bash
pnpm install --frozen-lockfile
pnpm verify
```

The `verify` command includes the real E2E suite and requires PostgreSQL with the permissions
described in `apps/api/README.md`. To rerun only the E2E suite:

```bash
pnpm exec turbo run test:e2e
```

## Contribution Rules

- Use Conventional Commits.
- Keep a change focused on one behavior or maintenance concern.
- Include tests with the behavior they verify.
- Update documentation when commands, configuration, or public contracts change.
- Do not commit `.env` files, credentials, tokens, logs, coverage, or generated artifacts.
- Preserve the workspace boundaries defined by the existing package structure.

## Pull Requests

Describe the motivation, affected workspaces, verification commands, and any infrastructure required
to reproduce the result. Call out known limitations instead of marking unavailable checks as passed.
