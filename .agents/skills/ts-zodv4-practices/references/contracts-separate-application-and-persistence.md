---
title: Separate application and persistence contracts
impact: HIGH
impactDescription: Prevents persistence columns from becoming business input
tags: contracts, persistence, architecture
---

## Separate application and persistence contracts

**Impact: HIGH (prevents persistence columns from becoming business input)**

**Project convention.** Model application input and persistence records with separate schemas even
when they share fields. Do not use a database record schema as an input DTO.

**Incorrect (uses a record schema as input):**

```typescript
const UserSchema = z.object({ id: z.uuid(), email: z.email(), createdAt: z.date() });
function createUser(input: unknown) {
  return UserSchema.parse(input);
}
```

**Correct (separates responsibilities):**

```typescript
const CreateUserSchema = z.object({ email: z.email() });
const UserRecordSchema = z.object({ id: z.uuid(), email: z.email(), createdAt: z.date() });
```

Reference: [Zod: Object schemas](https://zod.dev/api#objects)
