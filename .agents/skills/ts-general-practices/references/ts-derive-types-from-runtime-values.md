---
title: Derive types from runtime values
impact: HIGH
impactDescription: Prevents runtime values and their TypeScript types from diverging
tags: typescript, inference, types
---

## Derive types from runtime values

**Impact: HIGH (prevents runtime values and their TypeScript types from diverging)**

When a runtime value defines a domain set, derive its type from that value instead of duplicating a
union declaration.

**Incorrect (duplicates the status values):**

```typescript
type Status = 'active' | 'inactive' | 'pending';
```

**Correct (derives the type from the runtime value):**

```typescript
export const STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PENDING: 'pending',
} as const;

export type Status = (typeof STATUS)[keyof typeof STATUS];
```

Reference:
[TypeScript Handbook: typeof type operators](https://www.typescriptlang.org/docs/handbook/2/typeof-types.html)
