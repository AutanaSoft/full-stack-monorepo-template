---
title: Build realistic E2E data and assert public contracts
impact: HIGH
impactDescription: Keeps scenarios valid, isolated, and capable of detecting public API regressions
tags: nestjs, e2e, fixtures, api-contract
---

## Build realistic E2E data and assert public contracts

**Impact: HIGH (keeps scenarios valid, isolated, and capable of detecting public API regressions)**

### Rule

Create fixtures through public HTTP endpoints whenever the capability exists. Reserve a real
ORM-backed seed for a precondition that cannot be produced through HTTP, and document why it is
necessary. Use canonical valid payload constants or factories with unique identities. Derive each
invalid case from a fresh valid value, changing only the property under test and copying every
nested branch that changes.

For each important outcome, assert the semantic status, public response or error contract, relevant
headers, and observable effect. Explicitly assert that passwords, hashes, secrets, internal
metadata, and tokens not owned by that endpoint's contract are absent. Prefer public schemas or
focused structural matchers over opaque snapshots and brittle equality on volatile values.

### Why it matters

- HTTP-created data verifies the same validation and business invariants consumers use.
- A valid canonical base isolates which mutation causes an invalid request.
- Fresh factories and unique identities prevent order dependence and parallel-run collisions.
- Status-only assertions miss serialization regressions and sensitive-field exposure.
- Observable follow-up requests prove that a command changed persisted behavior.

### Exceptions and limits

- Seed an administrative or legacy state only when no public route can create it.
- Object spread is shallow. Copy every modified nested object or array, or use a factory that
  creates a fresh graph.
- A login endpoint may intentionally return access and refresh tokens. Assert their public shape
  there, while forbidding them from unrelated responses.
- Do not freeze generated IDs, timestamps, or order unless the public contract guarantees them.
- Avoid shared mutable fixtures even when Jest currently executes the suite serially.

### Examples

**Incorrect (mutates shared data and checks only status):**

```typescript
VALID_USER_PAYLOAD.profile.displayName = '';

await request(app.getHttpServer()).post('/users').send(VALID_USER_PAYLOAD).expect(400);
```

**Correct (uses fresh data and asserts public intent):**

```typescript
const validPayload = createValidUserPayload();
const created = await request(app.getHttpServer()).post('/users').send(validPayload).expect(201);

expect(created.body).toEqual(
  expect.objectContaining({
    id: expect.any(String),
    email: validPayload.email,
  }),
);
expect(created.body).not.toHaveProperty('password');
expect(created.body).not.toHaveProperty('passwordHash');

const validInvalidBase = createValidUserPayload();
const invalidPayload = { ...validInvalidBase, email: 'invalid-email' };
const invalid = await request(app.getHttpServer()).post('/users').send(invalidPayload).expect(400);

expect(invalid.body).toEqual(expect.objectContaining({ error: expect.anything() }));
```

For a nested mutation, copy the branch explicitly:

```typescript
const base = createValidUserPayload();
const invalidProfile = {
  ...base,
  profile: { ...base.profile, displayName: '' },
};
```

### Related cards

- [Orchestrate E2E execution and lifecycle explicitly](./e2e-orchestrate-execution-and-lifecycle.md)
- [Run the real application and isolated infrastructure](./e2e-run-real-application-and-infrastructure.md)

### References

- [NestJS testing](https://docs.nestjs.com/fundamentals/testing)
- [NestJS serialization](https://docs.nestjs.com/techniques/serialization)
- [Jest expect matchers](https://jestjs.io/docs/expect)
- [MDN spread syntax](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax)
