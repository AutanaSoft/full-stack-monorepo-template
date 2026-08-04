---
title: Model nullability explicitly
impact: MEDIUM
impactDescription: Distinguishes omission, explicit null, and both conditions
tags: zod, nullability, typescript
---

## Model nullability explicitly

**Impact: MEDIUM (distinguishes omission, explicit null, and both conditions)**

Use `optional()` for absence or `undefined`, `nullable()` for explicit `null`, and `nullish()` only
when both conditions are valid.

**Incorrect (models absence as null):**

```typescript
const ProfilePatchSchema = z.object({ nickname: z.string().nullable() });
```

**Correct (models omission explicitly):**

```typescript
const ProfilePatchSchema = z.object({ nickname: z.string().optional() });
```

Reference: [Zod: Optionals, nullables, and nullish](https://zod.dev/api#optionals)
