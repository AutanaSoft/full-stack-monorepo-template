---
title: Handle caught errors as unknown
impact: HIGH
impactDescription: Prevents unsafe assumptions about runtime error shapes
tags: nestjs, errors, unknown, type-safety
---

## Handle caught errors as unknown

**Impact: HIGH (prevents unsafe assumptions about runtime error shapes)**

Treat caught values as `unknown` and narrow them before reading properties. Translate external or
infrastructure errors at the appropriate boundary without exposing sensitive details.

**Incorrect (assumes a caught value has `message`):**

```typescript
try {
  await client.fetch();
} catch (error) {
  throw new ExternalApiError(error.message);
}
```

**Correct (narrows the error first):**

```typescript
try {
  await client.fetch();
} catch (error: unknown) {
  const message = error instanceof Error ? error.message : 'Unknown error';
  throw new ExternalApiError(message);
}
```

Reference:
[TypeScript: useUnknownInCatchVariables](https://www.typescriptlang.org/tsconfig/useUnknownInCatchVariables.html)
