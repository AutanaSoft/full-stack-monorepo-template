---
title: Prefer discriminated unions
impact: MEDIUM
impactDescription: Uses a stable key to select an object variant
tags: zod, unions, typescript
---

## Prefer discriminated unions

**Impact: MEDIUM (uses a stable key to select an object variant)**

When object variants share a stable discriminator with finite values, use `z.discriminatedUnion`.
Keep `z.union` when that structure does not exist.

**Incorrect (tries every variant despite a discriminator):**

```typescript
const ResultSchema = z.union([
  z.object({ status: z.literal('success'), data: z.string() }),
  z.object({ status: z.literal('error'), message: z.string() }),
]);
```

**Correct (declares the shared discriminator):**

```typescript
const ResultSchema = z.discriminatedUnion('status', [
  z.object({ status: z.literal('success'), data: z.string() }),
  z.object({ status: z.literal('error'), message: z.string() }),
]);
```

Reference: [Zod: Discriminated unions](https://zod.dev/api#discriminated-unions)
