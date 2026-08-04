---
title: Use repositories for Drizzle persistence access
impact: HIGH
impactDescription: Keeps Drizzle queries and persistence mapping outside services
tags: nestjs, drizzle, repositories, persistence
---

## Use repositories for Drizzle persistence access

**Impact: HIGH (keeps Drizzle queries and persistence mapping outside services)**

Keep Drizzle tables, operators, query shapes, persistence schemas, and mappers in repositories.
Services consume a domain-oriented repository API; repository operations that join a transaction
accept its executor rather than creating an independent transaction.

**Incorrect (a service contains a Drizzle query):**

```typescript
class RateInfoService {
  async update(id: string, input: UpdateInput) {
    return this.db.update(rateInfo).set(input).where(eq(rateInfo.id, id));
  }
}
```

**Correct (the service delegates persistence):**

```typescript
class RateInfoService {
  constructor(private readonly repository: RateInfoRepository) {}
  async update(id: string, input: UpdateInput) {
    return this.repository.updateById(id, input);
  }
}
```

Reference: [NestJS: Providers](https://docs.nestjs.com/providers)
