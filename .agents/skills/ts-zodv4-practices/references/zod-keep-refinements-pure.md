---
title: Keep refinements pure
impact: MEDIUM
impactDescription: Makes validation deterministic and easy to test
tags: zod, refinements, validation
---

## Keep refinements pure

**Impact: MEDIUM (makes validation deterministic and easy to test)**

**Project convention.** A refinement depends only on its input: it does not perform I/O, read
mutable state, or throw. Put asynchronous coordination in an application service.

**Incorrect (performs I/O inside a refinement):**

```typescript
const EmailSchema = z.email().refine(async (email) => accountRepository.exists(email));
```

**Correct (checks deterministic input):**

```typescript
const CompanyEmailSchema = z.email().refine((email) => email.endsWith('@example.com'));
```

Reference: [Zod: Refinements](https://zod.dev/api#refine)
