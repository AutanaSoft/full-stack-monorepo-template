---
title: Use a standalone NestJS application context
impact: HIGH
impactDescription: Avoids adding an unnecessary HTTP layer to CLI, worker, and batch processes
tags: nestjs, standalone, cli, bootstrap
---

## Use a standalone NestJS application context

**Impact: HIGH (avoids adding an unnecessary HTTP layer to CLI, worker, and batch processes)**

For a process without an intentional HTTP interface, bootstrap with
`NestFactory.createApplicationContext(AppModule)`, run the entry provider, and close the context. Do
not add controllers, HTTP routes, or HTTP tests solely to execute a CLI or worker.

**Incorrect (starts an HTTP server for a CLI):**

```typescript
const app = await NestFactory.create(AppModule);
await app.listen(3000);
```

**Correct (uses an application context):**

```typescript
const app = await NestFactory.createApplicationContext(AppModule);
try {
  await app.get(CliRunner).run();
} finally {
  await app.close();
}
```

Reference: [NestJS: Application context](https://docs.nestjs.com/standalone-applications)
