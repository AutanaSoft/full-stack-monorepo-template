---
title: Limit coercion to input boundaries
impact: MEDIUM
impactDescription: Avoids implicit conversions in already typed domain data
tags: zod, coercion, boundaries
---

## Limit coercion to input boundaries

**Impact: MEDIUM (avoids implicit conversions in already typed domain data)**

**Project convention.** Use `z.coerce` for external input and non-coercive schemas after a value has
an internal type.

**Incorrect (coerces a typed domain value):**

```typescript
const UserSchema = z.object({ age: z.coerce.number().int() });
```

**Correct (coerces only query input):**

```typescript
const QuerySchema = z.object({ age: z.coerce.number().int() });
const UserSchema = z.object({ age: z.number().int() });
```

Reference: [Zod: Coercion](https://zod.dev/api#coercion)
