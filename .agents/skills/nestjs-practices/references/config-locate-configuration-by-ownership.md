---
title: Locate configuration by architectural ownership
impact: MEDIUM
impactDescription:
  Keeps configuration discoverable without imposing a repository-wide folder that conflicts with
  project architecture.
tags: nestjs, configuration, architecture, file-organization
---

## Locate configuration by architectural ownership

**Impact: MEDIUM (keeps configuration discoverable without imposing a repository-wide folder that
conflicts with project architecture)**

Choose a configuration location from the repository's conventions and the owning architectural
boundary, not from a universal path. Use `src/common/config` when `src/common` is the established
home for cross-cutting infrastructure. Use `src/config` when that is the project convention or no
stronger owner exists. Feature-owned configuration may live inside its module. Keep defaults beside
their owner, and extract them only when there is real reuse and a clear owner. Avoid vague global
folders that hide ownership.

**Incorrect (moves feature-owned configuration to a global folder only because the path is
universal):**

```text
src/
├── config/
│   └── payments.config.ts
└── modules/
    └── payments/
        └── payments.module.ts
```

**Correct (keeps a feature-owned namespace with its module):**

```text
src/
└── modules/
    └── payments/
        ├── config/
        │   └── payments.config.ts
        └── payments.module.ts
```

Pair the location decision with
[Build and validate namespaced configuration](./config-build-and-validate-namespaced-configuration.md)
and
[Register configuration per application context](./config-register-configuration-per-application-context.md).

Reference: [NestJS Configuration](https://docs.nestjs.com/techniques/configuration)
