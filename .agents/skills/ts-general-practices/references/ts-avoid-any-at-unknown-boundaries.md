---
title: Avoid any at unknown-data boundaries
impact: HIGH
impactDescription: Preserves type safety when untrusted values enter the application
tags: typescript, unknown, type-safety
---

## Avoid any at unknown-data boundaries

**Impact: HIGH (preserves type safety when untrusted values enter the application)**

Accept untrusted values as `unknown` and narrow them before accessing their properties. Do not use
`any` to bypass validation at a runtime boundary.

**Incorrect (accepts and returns `any`):**

```typescript
function parseUser(input: any): any {
  return input;
}
```

**Correct (narrows an unknown value):**

```typescript
interface User {
  id: string;
  name: string;
}

function isUser(value: unknown): value is User {
  return typeof value === 'object' && value !== null && 'id' in value && 'name' in value;
}

function parseUser(input: unknown): User {
  if (isUser(input)) {
    return input;
  }

  throw new Error('Invalid user');
}
```

Reference:
[TypeScript Handbook: Narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)
