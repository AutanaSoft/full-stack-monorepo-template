---
title: Export schemas and types through a public API
impact: HIGH
impactDescription: Makes shared contracts discoverable and stable
tags: contracts, exports, modules
---

## Export schemas and types through a public API

**Impact: HIGH (makes shared contracts discoverable and stable)**

**Project convention.** The owning module exports both the schema and its type through a stable
public entry point. Consumers do not use deep imports.

**Incorrect (exports only the type):**

```typescript
// contracts/users/index.ts
export type { CreateUserInput } from './create-user';
```

**Correct (exports the full public contract):**

```typescript
// contracts/users/index.ts
export { createUserSchema } from './create-user';
export type { CreateUserInput } from './create-user';
```

Reference:
[TypeScript Handbook: Modules](https://www.typescriptlang.org/docs/handbook/2/modules.html)
