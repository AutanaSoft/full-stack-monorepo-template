---
title: Compose existing schemas
impact: HIGH
impactDescription: Prevents duplicated validation when creating contract variants
tags: zod, schema-composition, contracts
---

## Compose existing schemas

**Impact: HIGH (prevents duplicated validation when creating contract variants)**

**Project convention.** Derive variants with `pick`, `omit`, `partial`, `required`, `extend`, or
spread instead of duplicating fields. In Zod 4, `merge` is deprecated and `deepPartial` was removed.

**Incorrect (duplicates variant fields):**

```typescript
const UpdateUserSchema = z.object({ email: z.email().optional() });
```

**Correct (derives from the source schema):**

```typescript
const UpdateUserSchema = UserSchema.pick({ email: true }).partial();
```

Reference: [Zod: Object schemas](https://zod.dev/api#pick)
