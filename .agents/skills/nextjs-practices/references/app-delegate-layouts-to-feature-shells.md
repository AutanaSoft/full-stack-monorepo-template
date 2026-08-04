---
title: Delegate layouts to feature shells
impact: HIGH
impactDescription: Keeps layouts focused on framework boundaries instead of product UI composition
tags: nextjs, app-router, layouts, architecture
---

## Delegate layouts to feature shells

**Impact: HIGH (keeps layouts focused on framework boundaries instead of product UI composition)**

Apply framework boundaries in `layout.tsx` and delegate complex product UI to a feature shell.

**Incorrect (the layout builds the product shell):**

```tsx
export default function FeatureLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <aside>Navigation</aside>
      <header>Header</header>
      <main>{children}</main>
    </div>
  );
}
```

**Correct (the layout delegates composition):**

```tsx
import type { ReactNode } from 'react';
import { FeatureShell } from '@/features/feature/layout/feature-shell';

export default function FeatureLayout({ children }: { children: ReactNode }) {
  return <FeatureShell>{children}</FeatureShell>;
}
```

Reference: [Next.js: layout.js](https://nextjs.org/docs/app/api-reference/file-conventions/layout)
