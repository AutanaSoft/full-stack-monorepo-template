---
title: Use input and output types for transforms
impact: HIGH
impactDescription: Distinguishes the received value from the transformed value
tags: zod, transforms, typescript
---

## Use input and output types for transforms

**Impact: HIGH (distinguishes the received value from the transformed value)**

When a transform changes a type, use `z.input` for the received value and `z.output` for the
produced value. `z.infer` represents the output.

**Incorrect (uses output as input):**

```typescript
type Input = z.infer<typeof StringToLength>;
```

**Correct (models both sides):**

```typescript
type Input = z.input<typeof StringToLength>;
type Output = z.output<typeof StringToLength>;
```

Reference: [Zod: Transforms](https://zod.dev/api#transforms)
