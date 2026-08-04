---
title: Assign a canonical contract owner
impact: HIGH
impactDescription: Eliminates duplicate sources for shared contracts
tags: contracts, ownership, architecture
---

## Assign a canonical contract owner

**Impact: HIGH (eliminates duplicate sources for shared contracts)**

**Project convention.** Each shared Zod contract has one owning module, such as a contracts folder,
package, or domain library. Other modules consume that owner.

**Incorrect (two modules declare the same contract):**

```typescript
// orders/checkout-schema.ts and billing/checkout-schema.ts both declare checkoutSchema.
```

**Correct (one module owns the contract):**

```typescript
// contracts/checkout-schema.ts
export const checkoutSchema = z.object({ email: z.email(), total: z.number().positive() });
```

Reference: [Zod: Object schemas](https://zod.dev/api#objects)
