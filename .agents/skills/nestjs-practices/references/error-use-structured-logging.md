---
title: Use structured runtime logging
impact: HIGH
impactDescription: Produces queryable diagnostic context without exposing sensitive data
tags: nestjs, logging, observability, errors
---

## Use structured runtime logging

**Impact: HIGH (produces queryable diagnostic context without exposing sensitive data)**

Inject the runtime logger, use stable messages, and place variable context in structured fields. Do
not log secrets, tokens, passwords, or full sensitive payloads.

**Incorrect (uses console output and interpolation):**

```typescript
console.error(`Failed syncing ${accountId}: ${error}`);
```

**Correct (uses structured context):**

```typescript
this.logger.error({ err: error, accountId, operation: 'sync' }, 'Failed to sync account');
```

Reference: [NestJS: Logging](https://docs.nestjs.com/techniques/logger)
