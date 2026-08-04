---
title: Customize errors with error
impact: HIGH
impactDescription: Uses the unified Zod 4 error-customization API
tags: zod-4, errors, validation
---

## Customize errors with error

**Impact: HIGH (uses the unified Zod 4 error-customization API)**

Customize errors with `error`; do not use the removed `required_error` or `invalid_type_error`
parameters.

**Incorrect (uses removed parameters):**

```typescript
const UserSchema = z.object({ name: z.string({ required_error: 'Name is required' }) });
```

**Correct (uses `error`):**

```typescript
const UserSchema = z.object({ name: z.string({ error: 'Name is required' }) });
```

Reference:
[Zod 4 migration guide](https://zod.dev/v4/changelog#drops-invalid_type_error-and-required_error)
