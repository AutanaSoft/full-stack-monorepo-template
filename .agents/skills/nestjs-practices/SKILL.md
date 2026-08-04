---
name: nestjs-practices
description: >
  Apply NestJS practices for modules, services, repositories, dependency injection, configuration
  with @nestjs/config, namespaced registerAs factories, application-context registration, typed
  injection, dynamic module options, external configuration sources, bootstrap, logging and errors,
  external contracts, data integration, and standalone application contexts. Use this skill whenever
  organizing NestJS configuration, reviewing @nestjs/config usage, creating typed configuration
  namespaces, separating worker and API configuration, validating dynamic module options, isolating
  process.env access, handling secrets, or performing broader NestJS architecture and runtime work.
  Do not use this skill for end-to-end test design, test-runner orchestration, E2E fixtures, E2E
  infrastructure lifecycle, or black-box testing against a deployed API without NestJS source
  access.
license: MIT
metadata:
  author: AutanaSoft
  version: '0.4.0'
---

# NestJS Practices

Apply the smallest relevant set of NestJS decision cards. The cards own normative guidance,
examples, exceptions, and sources; this entry point activates the catalog and routes the work.

## Activation Contract

- Load this skill for NestJS modules, services, repositories, dependency injection, configuration,
  bootstrap, logging and errors, external contracts, data integration, or standalone application
  contexts.
- Do not load it for end-to-end test design, test-runner orchestration, E2E fixtures, or E2E
  infrastructure lifecycle.
- Do not activate it for black-box testing against a deployed API without NestJS source access.
- Do not activate it for generic TypeScript work that has no NestJS-specific decision.

## Workflow

1. Identify the NestJS concern and load only the matching cards in the decision map.
2. Apply the cards using the project's existing architecture, names, providers, clients, and
   commands.
3. Run the relevant repository checks for the NestJS changes.

## Rule Categories by Priority

| Priority                                          | Prefix    | Use for                                                                                                  |
| ------------------------------------------------- | --------- | -------------------------------------------------------------------------------------------------------- |
| Critical boundary and integration risk            | `api-`    | External service input and output contracts                                                              |
| High configuration and framework integration risk | `config-` | Configuration ownership, construction, validation, registration, injection, dynamic options, and secrets |
| High application design risk                      | `arch-`   | Coordinators, service boundaries, repositories, and standalone contexts                                  |
| High diagnostics risk                             | `error-`  | Structured logging and safe caught-error handling                                                        |
| High NestJS data integration risk                 | `nestjs-` | Drizzle database module wiring and lifecycle                                                             |

## Quick Reference

Load the first matching card for the decision. Each physical reference card appears once in this
map.

| Concern                               | Card                                                                                                                  |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Configuration location and ownership  | [Locate configuration by architectural ownership](references/config-locate-configuration-by-ownership.md)             |
| Namespace construction and validation | [Build and validate namespaced configuration](references/config-build-and-validate-namespaced-configuration.md)       |
| Application-context registration      | [Register configuration per application context](references/config-register-configuration-per-application-context.md) |
| Typed namespace injection             | [Inject typed namespaced configuration](references/config-inject-namespaced-configuration.md)                         |
| External source isolation             | [Isolate external configuration sources](references/config-isolate-external-configuration-sources.md)                 |
| Dynamic module option validation      | [Validate dynamic module options](references/config-validate-dynamic-module-options.md)                               |
| Secret handling and diagnostics       | [Keep secrets out of source and diagnostics](references/config-avoid-hardcoded-secrets.md)                            |
| Cross-module workflows                | [Use flow coordinators for cross-module workflows](references/arch-use-flow-coordinators.md)                          |
| Service responsibility                | [Keep services focused on one domain](references/arch-service-repository-responsibility.md)                           |
| Drizzle persistence access            | [Use repositories for Drizzle persistence access](references/arch-use-repository-pattern.md)                          |
| Non-HTTP NestJS processes             | [Use a standalone NestJS application context](references/arch-use-standalone-application.md)                          |
| Structured logging                    | [Use structured runtime logging](references/error-use-structured-logging.md)                                          |
| Caught error narrowing                | [Handle caught errors as unknown](references/error-handle-unknown-catches.md)                                         |
| External service boundaries           | [Validate external service contracts](references/api-use-external-service-contracts.md)                               |
| Drizzle database module integration   | [Provide Drizzle through a NestJS database module](references/nestjs-use-drizzle-database-module.md)                  |

## How to Use

Read the card that owns the decision before applying it. Follow links from that card only when the
task crosses into a related concern; do not copy its normative guidance into this entry point.
