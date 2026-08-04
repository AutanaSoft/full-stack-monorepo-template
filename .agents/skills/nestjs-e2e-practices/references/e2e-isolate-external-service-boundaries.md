---
title: Isolate only external service boundaries in E2E tests
impact: CRITICAL
impactDescription: Preserves the real internal flow while preventing unsafe external side effects
tags: nestjs, e2e, external-service, test-double
---

## Isolate only external service boundaries in E2E tests

**Impact: CRITICAL (preserves the real internal flow while preventing unsafe external side
effects)**

### Rule

Keep controllers, guards, pipes, application and domain services, repositories, authentication, ORM,
and database real. Prefer a safe provider sandbox when it is deterministic and available. Otherwise,
replace only the DI-bound adapter that crosses the process boundary when the dependency is
nondeterministic, destructive, expensive, or unavailable.

The replacement must capture the outgoing contract so the test can assert destination, operation,
template or payload, and relevant metadata without performing the external side effect. Keep the
entire internal path to that adapter real. Report the substituted token, justification, retained
coverage, and residual limitation.

### Why it matters

- Mocking an application service proves the mock rather than NestJS wiring and business behavior.
- A boundary adapter prevents real email, payment, SMS, or webhook side effects in automated runs.
- Capturing the outgoing contract proves that internal orchestration reached the correct boundary.
- Explicit reporting prevents a narrow exception from becoming a default mocking strategy.

### Exceptions and limits

- Email delivery is the canonical permitted exception: replace the mail transport or provider
  adapter, not the password-recovery or notification application service.
- Keep template selection, token generation, persistence, events, and local status changes real when
  they belong to the application.
- Reset captured messages and provider overrides between runs.
- This E2E proves the application-to-provider contract, not provider availability, deliverability,
  or reputation. Test those separately against the provider sandbox or contract API.
- A user may explicitly request a broader mock, but label the resulting test scope accurately rather
  than presenting it as full E2E coverage.

### Examples

**Incorrect (replaces the internal use case):**

```typescript
const recoveryService = app.get(RequestPasswordResetService);
jest.spyOn(recoveryService, 'execute').mockResolvedValue(undefined);

await request(app.getHttpServer())
  .post('/auth/forgot-password')
  .send({ email: user.email })
  .expect(204);
```

**Correct (replaces only the out-of-process transport):**

```typescript
const mailTransport = new CapturingMailTransport();
const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
  .overrideProvider(MAIL_TRANSPORT)
  .useValue(mailTransport)
  .compile();

const app = await createProductionLikeApplication(moduleRef);

await request(app.getHttpServer())
  .post('/auth/forgot-password')
  .send({ email: user.email })
  .expect(204);

expect(mailTransport.messages).toContainEqual(
  expect.objectContaining({
    to: user.email,
    template: 'reset-password',
  }),
);
```

Use the project's actual provider token and bootstrap helper. Centralize the override in the main
E2E environment so every feature sees one explicit boundary policy.

### Related cards

- [Run the real application and isolated infrastructure](./e2e-run-real-application-and-infrastructure.md)
- [Build realistic E2E data and assert public contracts](./e2e-build-data-and-assert-contracts.md)

### References

- [NestJS custom providers](https://docs.nestjs.com/fundamentals/custom-providers)
- [NestJS testing overrides](https://docs.nestjs.com/fundamentals/testing)
