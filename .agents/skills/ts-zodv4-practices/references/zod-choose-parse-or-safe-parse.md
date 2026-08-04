---
title: Choose parse or safeParse deliberately
impact: HIGH
impactDescription: Makes validation failure behavior explicit
tags: zod, parsing, validation
---

## Choose parse or safeParse deliberately

**Impact: HIGH (makes validation failure behavior explicit)**

Use `parse` when invalid input aborts the flow. Use `safeParse` when the flow must inspect or
translate validation failure without throwing.

**Incorrect (expects `parse` to return a result object):**

```typescript
const result = UserSchema.parse(input);
return result.success ? result.data : null;
```

**Correct (uses `safeParse` for an expected failure branch):**

```typescript
const result = UserSchema.safeParse(input);
return result.success ? result.data : null;
```

Reference: [Zod: Basic usage](https://zod.dev/basics)
