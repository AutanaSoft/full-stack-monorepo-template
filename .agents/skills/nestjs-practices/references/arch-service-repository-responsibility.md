---
title: Keep services focused on one domain
impact: CRITICAL
impactDescription: Prevents services from mixing unrelated domain responsibilities
tags: nestjs, services, architecture, domain
---

## Keep services focused on one domain

**Impact: CRITICAL (prevents services from mixing unrelated domain responsibilities)**

Keep each service focused on one domain, aggregate, or resource. It may expose several cohesive
operations, but cross-domain orchestration belongs in an explicit coordinator.

**Incorrect (one service owns unrelated domains):**

```typescript
class UsersService {
  constructor(
    private users: UsersRepository,
    private operations: OperationsRepository,
  ) {}

  updateUser() {
    return this.users.update();
  }
  updateOperation() {
    return this.operations.update();
  }
}
```

**Correct (one service per domain responsibility):**

```typescript
class UsersService {
  constructor(private readonly users: UsersRepository) {}
  update() {
    return this.users.update();
  }
}

class OperationsService {
  constructor(private readonly operations: OperationsRepository) {}
  update() {
    return this.operations.update();
  }
}
```

Reference: [NestJS: Providers](https://docs.nestjs.com/providers)
