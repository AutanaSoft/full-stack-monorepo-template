# NestJS Practices

This inventory covers the active atomic decision cards for NestJS architecture and runtime work. The
entry point, `SKILL.md`, handles activation and task-time routing; this file is for catalog review
and maintenance.

## Structure

- `SKILL.md` - Activation and rule index.
- `references/` - Active atomic rule cards.

## Domains and Prefixes

| Prefix    | Domain                                                                                                                     |
| --------- | -------------------------------------------------------------------------------------------------------------------------- |
| `config-` | Configuration ownership, construction, validation, registration, injection, external sources, dynamic options, and secrets |
| `arch-`   | Application structure and process boundaries                                                                               |
| `error-`  | Errors and observability                                                                                                   |
| `api-`    | External service contracts                                                                                                 |
| `nestjs-` | NestJS and Drizzle integration                                                                                             |

## Configuration Cards

| Card                                                    | Purpose                                                                    |
| ------------------------------------------------------- | -------------------------------------------------------------------------- |
| `config-locate-configuration-by-ownership`              | Choose a location from repository conventions and architectural ownership. |
| `config-build-and-validate-namespaced-configuration`    | Build complete namespaces and validate their final shape.                  |
| `config-register-configuration-per-application-context` | Load only the namespaces required by each application context.             |
| `config-inject-namespaced-configuration`                | Inject typed, read-only namespace contracts.                               |
| `config-isolate-external-configuration-sources`         | Keep consumers independent from environment and secret providers.          |
| `config-validate-dynamic-module-options`                | Validate `forRoot` and `forRootAsync` inputs at registration.              |
| `config-avoid-hardcoded-secrets`                        | Prevent secret leakage in source, defaults, logs, and errors.              |

The configuration catalog uses one normative owner per decision. Historical migration details remain
in the implementation plan; do not add aliases or duplicate guidance when extending the catalog.

## Architecture Cards

- `references/arch-use-flow-coordinators.md` - Use flow coordinators for cross-module workflows
- `references/arch-service-repository-responsibility.md` - Keep services focused on one domain
- `references/arch-use-repository-pattern.md` - Use repositories for Drizzle persistence access
- `references/arch-use-standalone-application.md` - Use a standalone NestJS application context

## Errors and Observability Cards

- `references/error-use-structured-logging.md` - Use structured runtime logging
- `references/error-handle-unknown-catches.md` - Handle caught errors as unknown

## External Contract Cards

- `references/api-use-external-service-contracts.md` - Validate external service contracts

## NestJS and Drizzle Integration Cards

- `references/nestjs-use-drizzle-database-module.md` - Provide Drizzle through a NestJS database
  module

## Maintenance

1. Confirm that a proposed rule belongs to NestJS rather than TypeScript, Zod, or Drizzle.
2. Add or update an atomic card in `references/`.
3. Use an accepted impact, at most four tags, focused examples, and an official HTTPS source.
4. Update `SKILL.md` and this inventory when the catalog changes.

End-to-end testing conventions are outside this catalog's scope.
