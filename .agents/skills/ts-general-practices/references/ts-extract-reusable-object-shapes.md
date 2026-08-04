---
title: Extract reusable object shapes
impact: MEDIUM
impactDescription: Keeps domain types readable and reusable
tags: typescript, interfaces, domain-modeling
---

## Extract reusable object shapes

**Impact: MEDIUM (keeps domain types readable and reusable)**

Extract a nested object shape into a named type when it has domain meaning or will be reused.

**Incorrect (hides a domain shape inline):**

```typescript
interface User {
  id: string;
  name: string;
  address: { street: string; city: string };
}
```

**Correct (names the reusable domain shape):**

```typescript
interface UserAddress {
  street: string;
  city: string;
}

interface User {
  id: string;
  name: string;
  address: UserAddress;
}
```

Reference:
[TypeScript Handbook: Object types](https://www.typescriptlang.org/docs/handbook/2/objects.html)
