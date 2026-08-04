---
title: Keep transforms pure
impact: MEDIUM
impactDescription: Makes transformed values deterministic and reproducible
tags: zod, transforms, validation
---

## Keep transforms pure

**Impact: MEDIUM (makes transformed values deterministic and reproducible)**

**Project convention.** A transform produces output only from its input, without I/O, mutable state,
or exceptions. Put asynchronous coordination outside shared contracts.

**Incorrect (loads infrastructure data during a transform):**

```typescript
const UserSchema = z.object({ email: z.email() }).transform(async (user) => ({
  ...user,
  profile: await profileRepository.findByEmail(user.email),
}));
```

**Correct (normalizes only the received value):**

```typescript
const NormalizedEmailSchema = z.email().transform((email) => email.toLowerCase());
```

Reference: [Zod: Transforms](https://zod.dev/api#transforms)
