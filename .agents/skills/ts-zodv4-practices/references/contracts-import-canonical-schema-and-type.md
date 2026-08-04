---
title: Import the canonical schema and type
impact: HIGH
impactDescription: Prevents parallel DTOs and diverging validation
tags: contracts, imports, typescript
---

## Import the canonical schema and type

**Impact: HIGH (prevents parallel DTOs and diverging validation)**

**Project convention.** Consumers import the schema and type exported by the contract owner; they do
not declare a local DTO or infer the type again. See
[canonical ownership](contracts-assign-canonical-owner.md).

**Incorrect (infers the type in a consumer):**

```typescript
import { z } from 'zod';
import { createUserSchema } from '../contracts/users';
type CreateUserInput = z.infer<typeof createUserSchema>;
```

**Correct (imports the public contract):**

```typescript
import { createUserSchema, type CreateUserInput } from '../contracts/users';
```

Reference: [Zod: Basic usage](https://zod.dev/basics)
