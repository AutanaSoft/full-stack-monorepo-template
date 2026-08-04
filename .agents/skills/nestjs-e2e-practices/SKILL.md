---
name: nestjs-e2e-practices
description: >
  Design, implement, review, and repair real HTTP end-to-end tests for source-accessible NestJS
  applications. Use when working on NestJS E2E suites, production-like test bootstrap, Jest
  discovery, main or feature orchestrators, deterministic execution, isolated real databases,
  migrations, HTTP-created fixtures, real authentication, public API contracts, teardown, or
  controlled doubles for external services such as email providers. Do not use for unit tests,
  repository-only integration tests, black-box tests against deployed APIs without NestJS source
  access, non-NestJS E2E tests, or browser-only UI testing.
license: MIT
metadata:
  author: AutanaSoft
  version: '0.1.0'
---

# NestJS E2E Practices

Build E2E suites that prove the delivered NestJS system through its public HTTP boundary. Load only
the cards needed for the current decision; the cards own detailed rules, examples, exceptions, and
sources.

## When to Apply

- Create, extend, review, or repair NestJS HTTP E2E tests.
- Design Jest discovery, a main orchestrator, feature orchestrators, shared context, or teardown.
- Configure a production-like NestJS test application and isolated database lifecycle.
- Create fixtures, validation cases, authentication flows, and public contract assertions.
- Isolate an external email, payment, SMS, webhook, or similar out-of-process dependency.

Do not apply this skill to unit tests, repository-only integration tests, black-box tests against
deployed APIs without NestJS source access, non-NestJS APIs, or browser-only UI testing.

## Hard Rules

- Inspect the target project's production bootstrap, test runner, commands, authentication,
  persistence, migrations, and external dependencies before choosing an implementation.
- Exercise public HTTP endpoints with the real application graph and real persistence.
- Use one runner-discovered main orchestrator, then register feature orchestrators and endpoint
  suites explicitly.
- Substitute only justified out-of-process adapters. Keep controllers, guards, application services,
  repositories, authentication, ORM, and database real.
- Never point destructive E2E lifecycle operations at shared development or production resources.
- Preserve project choices for HTTP adapter, validator, ORM, runner, HTTP client, and package
  manager.

## Workflow

1. Identify whether the task concerns orchestration, runtime infrastructure, data/contracts, or an
   external boundary.
2. Inspect the production root module and bootstrap, including adapter, global pipes, filters,
   interceptors, prefix, logging, and request ID behavior.
3. Inspect Jest or the active runner's discovery, concurrency, setup, teardown, and project
   commands.
4. Inspect database administration, migrations, authentication, and external provider boundaries.
5. Load only the matching cards from the decision map.
6. Design the main and feature ownership boundaries before implementing endpoint suites.
7. Run the focused verification and then the complete main E2E orchestrator when commands exist.
8. Report the Output Contract without exposing credentials, tokens, or secrets.

## Decision Map

| Concern                                                                  | Card                                                                                                              |
| ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| Discovery, order, Jest config, orchestrators, context, cleanup, or close | [Orchestrate E2E execution and lifecycle explicitly](references/e2e-orchestrate-execution-and-lifecycle.md)       |
| Bootstrap, real HTTP, database, migrations, providers, or authentication | [Run the real application and isolated infrastructure](references/e2e-run-real-application-and-infrastructure.md) |
| Fixtures, seeds, payload variants, errors, headers, effects, or secrets  | [Build realistic E2E data and assert public contracts](references/e2e-build-data-and-assert-contracts.md)         |
| Email, payment, SMS, webhooks, or another out-of-process dependency      | [Isolate only external service boundaries in E2E tests](references/e2e-isolate-external-service-boundaries.md)    |

## Verification

- Discover the project's official command for the main E2E orchestrator.
- Run the smallest supported focused target without bypassing the main lifecycle.
- Run the complete E2E project when the environment is available.
- Run repository-defined lint, formatting, and validation for changed artifacts.
- If infrastructure is unavailable, report the exact blocked command and unverified behavior.

## Output Contract

Report all of the following:

- Cards applied and files created or modified.
- Main orchestrator, feature orchestrators, and explicit registration order.
- Real HTTP flows and internal providers exercised.
- Isolated database, migration, and teardown strategy.
- Data created through HTTP and every justified seed.
- Canonical constants or factories reused and invalid variants derived.
- Public contracts, headers, effects, and forbidden fields asserted.
- External adapters substituted, why, and which real flow remains covered.
- Commands executed, results, and residual verification gaps.
