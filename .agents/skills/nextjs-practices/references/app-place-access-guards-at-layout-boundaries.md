---
title: Place access guards at layout boundaries
impact: HIGH
impactDescription: Centralizes shared access policy and avoids repeated page-level checks
tags: nextjs, app-router, authentication, layouts
---

## Place access guards at layout boundaries

**Impact: HIGH (centralizes shared access policy and avoids repeated page-level checks)**

When routes share an access policy, enforce it in their nearest shared layout or a server-only
helper called by that layout. Do not repeat the same guard in every nested page.

**Incorrect (repeats the guard in pages):**

```tsx
export default async function ModulePage() {
  await requireAccess();
  return <ModuleScreen />;
}
```

**Correct (guards the shared boundary):**

```tsx
import type { ReactNode } from 'react';
import { requireAccess } from '@/features/access/server/require-access';

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  await requireAccess();
  return children;
}
```

Reference: [Next.js: layout.js](https://nextjs.org/docs/app/api-reference/file-conventions/layout)
