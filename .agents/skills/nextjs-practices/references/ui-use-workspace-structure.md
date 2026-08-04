---
title: Separate shared UI from application composition
impact: HIGH
impactDescription: Keeps a shared UI package independent of application routes and product domain
tags: nextjs, ui, monorepo, architecture
---

## Separate shared UI from application composition

**Impact: HIGH (keeps a shared UI package independent of application routes and product domain)**

A shared UI package contains reusable, domain-free components. Keep application routes, product
features, access policy, and product-specific composition in the application that owns them.

**Incorrect (a shared primitive knows an application route):**

```tsx
import Link from 'next/link';

export function OperationBadge() {
  return <Link href="/operations">Operations</Link>;
}
```

**Correct (the shared primitive is domain-free):**

```tsx
export function StatusBadge({ label }: { label: string }) {
  return <span>{label}</span>;
}
```

Reference:
[Next.js: Project structure](https://nextjs.org/docs/app/getting-started/project-structure)
