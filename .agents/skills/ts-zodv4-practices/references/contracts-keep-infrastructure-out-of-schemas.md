---
title: Keep infrastructure out of schemas
impact: HIGH
impactDescription: Keeps contracts portable across runtimes
tags: contracts, architecture, boundaries
---

## Keep infrastructure out of schemas

**Impact: HIGH (keeps contracts portable across runtimes)**

**Project convention.** A contract module may depend on Zod and domain types, but not an ORM, HTTP
client, logger, or framework. Pass infrastructure to the layer that executes the use case.

**Incorrect (places a database transaction in the contract):**

```typescript
const CreateUserSchema = z.object({
  email: z.email(),
  transaction: z.custom<DatabaseTransaction>(),
});
```

**Correct (keeps the contract transportable):**

```typescript
const CreateUserSchema = z.object({ email: z.email() });
```

Reference: [Zod: Object schemas](https://zod.dev/api#objects)
