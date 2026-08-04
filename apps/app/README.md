# Standalone NestJS console application

`apps/app` is a one-shot NestJS application context. It does not start an HTTP listener or wait for
a request.

## Run the application

```bash
# development
pnpm --filter app start

# watch mode
pnpm --filter app dev

# production mode
pnpm --filter app build
pnpm --filter app start:prod
```

After successful initialization, the application prints exactly:

```text
Hello World!
```

It then closes the application context and exits successfully.

## Run tests

```bash
pnpm --filter app test
pnpm --filter app test:unit
pnpm --filter app test:e2e
pnpm --filter app typecheck
pnpm --filter app lint
```
