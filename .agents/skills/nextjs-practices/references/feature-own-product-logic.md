---
title: Let features own product logic
impact: HIGH
impactDescription: Prevents product logic from being distributed across routes and shared packages
tags: nextjs, features, architecture, modules
---

## Let features own product logic

**Impact: HIGH (prevents product logic from being distributed across routes and shared packages)**

Put product-specific screens, actions, queries, schemas, configuration, and internal modules in the
owning feature. Code that knows product entities, routes, permissions, or product navigation does
not belong in `app/`, global components, or a shared UI package.

**Incorrect (keeps feature logic in the route):**

```text
app/(group)/feature/module/
├─ page.tsx
├─ module-table.tsx
└─ get-module-items.ts
```

**Correct (the feature owns its modules):**

```text
features/feature/
├─ screens/
├─ components/
├─ config/
└─ modules/module/
   ├─ actions/
   ├─ queries/
   └─ schemas/
```

Reference:
[Next.js: Project structure](https://nextjs.org/docs/app/getting-started/project-structure)
