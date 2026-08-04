---
title: Run the real application and isolated infrastructure
impact: CRITICAL
impactDescription: Ensures E2E results represent the delivered runtime and persistence behavior
tags: nestjs, e2e, database, bootstrap
---

## Run the real application and isolated infrastructure

**Impact: CRITICAL (ensures E2E results represent the delivered runtime and persistence behavior)**

### Rule

Start E2E from the same root module and shared bootstrap decisions as production. Reproduce the HTTP
adapter, global pipes, filters, interceptors, prefix, serialization, logging, and request ID
behavior that affect public requests. Initialize the adapter fully before sending HTTP traffic.

Use a real temporary database dedicated to the main E2E run. Validate an E2E-only administrative
URL, create an unpredictable database name, apply committed migrations, point NestJS at that
database, and then start the application. Exercise public endpoints and real providers, including
login or token issuance through HTTP. On teardown, close NestJS, ORM clients, pools, transports, and
the temporary database, then restore environment state even after failure.

### Why it matters

- A different root module, adapter, or global pipeline can make green tests represent another app.
- Real migrations prove that the schema used by persistence can be created from committed history.
- Real providers verify dependency injection, validation, authorization, persistence, and
  serialization together.
- Isolated resources prevent cross-run contamination and protect development or production data.

### Exceptions and limits

- Use Fastify, Express, Zod, Prisma, Drizzle, or another technology only when the target project
  uses it. The capabilities are required; the brands are not.
- Create data through HTTP when a public route exists. Use ORM-backed seeds only for preconditions
  that cannot be produced through public behavior.
- An administrative PostgreSQL client may create and drop the temporary database outside the domain
  model. Application data access must still use the production persistence path.
- Fail closed if the database URL is shared, ambiguous, or resembles production. Never infer safety
  from a database name alone.
- Keep the application in the main orchestrator's process rather than attempting to pass it from
  Jest `globalSetup`.

### Examples

**Incorrect (replaces the runtime and persistence boundary):**

```typescript
const moduleRef = await Test.createTestingModule({
  imports: [UsersModule],
})
  .overrideProvider(USER_REPOSITORY)
  .useValue(inMemoryUsers)
  .compile();

const app = moduleRef.createNestApplication();
const accessToken = 'preissued-token';
```

**Correct (creates a migrated isolated environment and uses real HTTP authentication):**

```typescript
export async function createE2EEnvironment(): Promise<E2EEnvironment> {
  assertDedicatedE2EAdminUrl(process.env.DATABASE_ADMIN_URL);
  const database = await temporaryDatabase.create();

  try {
    await migrations.apply(database.url);
    const app = await createProductionLikeApplication({ databaseUrl: database.url });
    await app.init();
    await waitForHttpAdapter(app);

    return createEnvironmentHandle(app, database);
  } catch (error: unknown) {
    await database.drop();
    throw error;
  }
}

const session = await request(environment.app.getHttpServer())
  .post('/auth/sign-in')
  .send(credentials)
  .expect(200);
```

The helper names are illustrative. For Prisma projects, applying committed migrations commonly maps
to `prisma migrate deploy`; use the target project's official migration command rather than
hardcoding one package manager.

### Related cards

- [Orchestrate E2E execution and lifecycle explicitly](./e2e-orchestrate-execution-and-lifecycle.md)
- [Isolate only external service boundaries in E2E tests](./e2e-isolate-external-service-boundaries.md)

### References

- [NestJS testing](https://docs.nestjs.com/fundamentals/testing)
- [NestJS lifecycle events](https://docs.nestjs.com/fundamentals/lifecycle-events)
- [NestJS Fastify adapter](https://docs.nestjs.com/techniques/performance)
- [Prisma migrate deploy](https://www.prisma.io/docs/orm/reference/prisma-cli-reference#migrate-deploy)
