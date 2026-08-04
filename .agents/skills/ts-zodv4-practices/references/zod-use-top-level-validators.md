---
title: Use Zod 4 top-level validators
impact: HIGH
impactDescription: Avoids deprecated Zod 3 format APIs
tags: zod-4, validation, api
---

## Use Zod 4 top-level validators

**Impact: HIGH (avoids deprecated Zod 3 format APIs)**

Use Zod 4 top-level validators for email, URL, UUID, and ISO formats. The corresponding `z.string()`
methods remain available but are deprecated.

**Incorrect (uses deprecated format methods):**

```typescript
const UserSchema = z.object({ id: z.string().uuid(), email: z.string().email() });
```

**Correct (uses top-level validators):**

```typescript
const UserSchema = z.object({ id: z.uuid(), email: z.email() });
```

Reference: [Zod 4 migration guide](https://zod.dev/v4/changelog#deprecates-email-etc)
