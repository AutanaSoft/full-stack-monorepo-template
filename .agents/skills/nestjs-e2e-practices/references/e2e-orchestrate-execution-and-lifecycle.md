---
title: Orchestrate E2E execution and lifecycle explicitly
impact: CRITICAL
impactDescription: Prevents duplicate suites, order-dependent state, and competing lifecycle owners
tags: nestjs, e2e, orchestration, lifecycle
---

## Orchestrate E2E execution and lifecycle explicitly

**Impact: CRITICAL (prevents duplicate suites, order-dependent state, and competing lifecycle
owners)**

### Rule

Use one main E2E orchestrator as the only file discovered by the runner. Register feature
orchestrators from the main file in the required order, then register focused endpoint suites from
each feature orchestrator. Give the main orchestrator ownership of the application, temporary
database, global environment, and final teardown. Give each feature orchestrator a typed context and
cleanup for resources in its scope.

For Jest, define a dedicated E2E project whose `testMatch` or `testRegex` discovers only the main
orchestrator. Place imported orchestrators and endpoint suites under names or paths outside that
pattern. Jest executes tests in one discovered file serially in encounter order unless concurrent
APIs are used; do not use `test.concurrent` for flows sharing mutable context.

Treat `maxWorkers: 1` or `--runInBand` as protection for shared infrastructure, not as the ordering
mechanism. Do not use a custom `testSequencer` to compensate for multiple discovered owners.
`globalSetup` cannot expose its variables to test suites, so create and close the Nest application
inside the main orchestrator's test process. Reserve `setupFilesAfterEnv` for matchers and hygiene
hooks. Keep `forceExit` disabled and repair leaked handles instead.

### Why it matters

- Default Jest patterns discover `.spec` and `.test` files, including files an orchestrator imports.
- Explicit registration makes order and ownership reviewable without relying on filenames.
- One lifecycle owner prevents premature close, duplicate migrations, and competing cleanup.
- Typed feature contexts expose deliberate flow dependencies and discourage hidden mutable globals.
- A worker limit cannot prevent duplicate execution caused by an incorrect discovery pattern.

### Exceptions and limits

- Adapt suffixes and paths to the runner configuration actually used by the project.
- Prefer independent tests. Share state only when the created resource is intentionally part of one
  ordered business flow.
- `detectOpenHandles` is diagnostic and may be enabled only in CI or troubleshooting if its runtime
  cost is material.
- `globalSetup` may create an external resource that is addressed through serialized configuration,
  but it must not own the in-process Nest application used by the suites.
- If the test harness already owns global close, the main orchestrator must not close the same
  resource a second time.

### Recommended structure

Use this structure as the default model when the project does not already have an equivalent E2E
layout:

```text
jest.config.e2e.ts                         # Discovers only the main orchestrator
test/
├── main.e2e-spec.ts                       # Global setup, registration order, and teardown
├── support/
│   ├── e2e-environment.ts                # Database, migrations, environment, and disposal
│   ├── real-e2e-application.ts           # Production-derived NestJS bootstrap
│   ├── external-boundary-overrides.ts    # Explicit out-of-process adapter replacements
│   └── e2e-assertions.ts                 # Focused public-contract helpers
├── fixtures/
│   ├── auth.fixture.ts                   # Fresh canonical auth data factories
│   └── users.fixture.ts                  # Fresh canonical user data factories
└── modules/
    ├── auth/
    │   ├── auth.e2e-orchestrator.ts      # Auth context, suite order, and feature cleanup
    │   ├── auth.e2e-context.ts
    │   └── suites/
    │       ├── sign-up.e2e-suite.ts
    │       ├── sign-in.e2e-suite.ts
    │       └── reset-password.e2e-suite.ts
    ├── users/
    │   ├── users.e2e-orchestrator.ts     # Users context, suite order, and feature cleanup
    │   ├── users.e2e-context.ts
    │   └── suites/
    │       ├── create-user.e2e-suite.ts
    │       ├── list-users.e2e-suite.ts
    │       └── update-user.e2e-suite.ts
    └── health/
        ├── health.e2e-orchestrator.ts
        └── suites/
            ├── live-health.e2e-suite.ts
            └── ready-health.e2e-suite.ts
```

Adapt folder names and suffixes to the target repository, but preserve the ownership boundaries:

- Jest discovers only `main.e2e-spec.ts` or its local equivalent.
- The main orchestrator imports feature orchestrators.
- Each feature orchestrator imports its endpoint suites.
- `support/` owns shared runtime capabilities, not feature assertions.
- `fixtures/` exports fresh canonical factories and does not own mutable suite state.
- Imported orchestrators, contexts, and suites remain outside direct runner discovery.

For a genuinely small API, feature orchestrators may contain their endpoint cases directly. Keep the
main orchestrator and single-entry discovery; do not flatten lifecycle ownership merely to reduce
file count.

### Examples

**Incorrect (discovers multiple owners and relies on worker serialization):**

```typescript
const config: Config = {
  testMatch: ['<rootDir>/test/**/*.spec.ts', '<rootDir>/test/**/*.e2e-spec.ts'],
  maxWorkers: 1,
  forceExit: true,
};

// test/users.e2e-spec.ts imports a file Jest also discovers independently.
import './users-create.spec';
```

**Correct (discovers one main owner and imports non-discovered suites):**

```typescript
import type { Config } from 'jest';

const config: Config = {
  displayName: 'e2e',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/test/main.e2e-spec.ts'],
  maxWorkers: 1,
  detectOpenHandles: true,
  forceExit: false,
};

export default config;
```

```typescript
describe('API E2E', () => {
  let environment: E2EEnvironment;

  beforeAll(async () => {
    environment = await createE2EEnvironment();
  });

  registerAuthE2E(() => environment);
  registerUsersE2E(() => environment);
  registerSettingsE2E(() => environment);

  afterAll(async () => {
    await environment.dispose();
  });
});
```

Use project-specific transforms, aliases, `rootDir`, and commands. Imported files can use a suffix
such as `*.e2e-suite.ts` only after confirming the runner excludes it.

### Related cards

- [Run the real application and isolated infrastructure](./e2e-run-real-application-and-infrastructure.md)
- [Build realistic E2E data and assert public contracts](./e2e-build-data-and-assert-contracts.md)

### References

- [Jest configuration](https://jestjs.io/docs/configuration)
- [Jest setup and teardown](https://jestjs.io/docs/setup-teardown)
- [Jest CLI options](https://jestjs.io/docs/cli)
- [NestJS testing](https://docs.nestjs.com/fundamentals/testing)
