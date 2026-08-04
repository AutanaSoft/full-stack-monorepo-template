---
title: Register configuration per application context
impact: HIGH
impactDescription:
  Prevents unrelated applications, workers, and commands from sharing an oversized or incorrectly
  initialized configuration graph.
tags: nestjs, configuration, modules, application-context
---

## Register configuration per application context

**Impact: HIGH (prevents unrelated applications, workers, and commands from sharing an oversized or
incorrectly initialized configuration graph)**

Treat every application context as its own composition root. HTTP applications, workers, CLI
commands, cron processes, and standalone NestJS contexts may require different namespaces, so call
`ConfigModule.forRoot({ load })` with only the configuration required by that context. Reuse the
same factories when multiple contexts need them, but do not impose one universal `AppModule` or one
monorepo-wide initialization graph. `isGlobal: true` can simplify injection inside one context; it
is a local convenience, not a universal policy.

Use `ConfigModule.forFeature(namespace)` when a feature module should perform partial registration
for its own namespace. Keep any optional aggregate validation in the context that consumes it, while
the namespace factory remains responsible for its own final shape.

**Incorrect (loads every application's namespaces into one shared root):**

```typescript
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, paymentsConfig, workerConfig, cliConfig],
    }),
  ],
})
export class SharedRootModule {}
```

**Correct (registers only the namespaces required by each context):**

```typescript
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, paymentsConfig],
    }),
  ],
})
export class ApiAppModule {}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, workerConfig],
    }),
  ],
})
export class PaymentsWorkerModule {}
```

Build each namespace with
[Build and validate namespaced configuration](./config-build-and-validate-namespaced-configuration.md)
before exposing it to consumers.

Reference: [NestJS Configuration](https://docs.nestjs.com/techniques/configuration)
