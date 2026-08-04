---
title: Derive types in the schema owner
impact: HIGH
impactDescription: Maintains one source for validation and inferred types
tags: contracts, zod, type-safety
---

## Derive types in the schema owner

**Impact: HIGH (maintains one source for validation and inferred types)**

**Project convention.** A module that declares a shared schema also derives and exports its type;
consumers import it instead of inferring locally.

**Incorrect (infers in a consumer):**

```typescript
type User = z.infer<typeof userSchema>;
```

**Correct (exports the inferred type beside the schema):**

```typescript
export const userSchema = z.object({ id: z.uuid(), email: z.email() });
export type User = z.infer<typeof userSchema>;
```

Reference: [Zod: Basic usage](https://zod.dev/basics)
