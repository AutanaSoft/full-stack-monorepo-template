---
title: Use type-only imports
impact: LOW
impactDescription: Makes compile-time-only dependencies explicit
tags: typescript, imports, modules
---

## Use type-only imports

**Impact: LOW (makes compile-time-only dependencies explicit)**

Use `import type` when an import is only needed by the type system.

**Incorrect (uses a value import for a type):**

```typescript
import { User } from './types';

function readUser(user: User): string {
  return user.id;
}
```

**Correct (declares the import as type-only):**

```typescript
import type { User } from './types';

function readUser(user: User): string {
  return user.id;
}
```

Reference:
[TypeScript Handbook: Modules](https://www.typescriptlang.org/docs/handbook/2/modules.html)
