---
title: Use flow coordinators for cross-module workflows
impact: HIGH
impactDescription: Keeps orchestration out of domain services and repositories
tags: nestjs, architecture, orchestration, modules
---

## Use flow coordinators for cross-module workflows

**Impact: HIGH (keeps orchestration out of domain services and repositories)**

Put workflows that coordinate modules, external calls, continuation decisions, or multiple
persistence operations in an explicit coordinator. Keep a CLI runner as an operator entrypoint and
repositories focused on data access. When a project has an established convention, use its
`*Coordinator` or `*FlowService` naming.

**Incorrect (the runner orchestrates persistence):**

```typescript
class CliRunner {
  async run() {
    const operations = await this.client.fetchOperations();
    for (const operation of operations) await this.repository.create(operation);
  }
}
```

**Correct (the runner delegates to a coordinator):**

```typescript
class CliRunner {
  constructor(private readonly syncCoordinator: SyncCoordinator) {}
  async run() {
    await this.syncCoordinator.sync();
  }
}
```

Reference: [NestJS: Providers](https://docs.nestjs.com/providers)
