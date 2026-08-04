---
title: Provide Drizzle through a NestJS database module
impact: HIGH
impactDescription:
  Centralizes database client lifecycle, configuration, and dependency-injection tokens
tags: nestjs, drizzle, database, dependency-injection
---

## Provide Drizzle through a NestJS database module

**Impact: HIGH (centralizes database client lifecycle, configuration, and dependency-injection
tokens)**

Create a database module that owns Drizzle client construction, explicit DI tokens, and pool
shutdown. Obtain configuration through `ConfigModule`; business services consume repositories rather
than constructing or injecting the database client directly.

**Incorrect (each consumer creates a database client):**

```typescript
@Module({
  providers: [{ provide: 'USERS_DB', useFactory: () => drizzle(process.env.DATABASE_URL) }],
})
export class UsersModule {}
```

**Correct (a module exports the database provider):**

```typescript
export const DATABASE_CLIENT = Symbol('DATABASE_CLIENT');

@Module({
  providers: [
    DatabaseConnectionService,
    {
      provide: DATABASE_CLIENT,
      useFactory: (service: DatabaseConnectionService) => service.client,
      inject: [DatabaseConnectionService],
    },
  ],
  exports: [DATABASE_CLIENT],
})
export class DatabaseModule {}
```

Reference: [NestJS: Custom providers](https://docs.nestjs.com/fundamentals/custom-providers)
