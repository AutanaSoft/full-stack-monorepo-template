---
title: Use generics and utility types for derived shapes
impact: MEDIUM
impactDescription: Avoids duplicating type transformations
tags: typescript, generics, utility-types
---

## Use generics and utility types for derived shapes

**Impact: MEDIUM (avoids duplicating type transformations)**

Use generics and built-in utility types when a type is a transformation of another type.

**Incorrect (duplicates a derived shape):**

```typescript
interface UserSummary {
  id: string;
  name: string;
}
```

**Correct (derives the shape):**

```typescript
interface User {
  id: string;
  name: string;
  email: string;
}

function first<T>(items: T[]): T | undefined {
  return items[0];
}

type UserSummary = Pick<User, 'id' | 'name'>;
type CreateUserInput = Omit<User, 'id'>;
type UserPatch = Partial<CreateUserInput>;
type UsersById = Record<string, User>;
```

Reference:
[TypeScript Handbook: Utility types](https://www.typescriptlang.org/docs/handbook/utility-types.html)
