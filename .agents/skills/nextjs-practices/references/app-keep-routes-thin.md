---
title: Keep routes thin
impact: HIGH
impactDescription: Prevents the app directory from becoming a difficult-to-maintain product layer
tags: nextjs, app-router, routes, architecture
---

## Keep routes thin

**Impact: HIGH (prevents the app directory from becoming a difficult-to-maintain product layer)**

In the App Router, `app/` represents URLs and framework boundaries. Keep queries, complex forms,
business rules, and module composition in the owning feature.

**Incorrect (the route implements product logic):**

```tsx
// app/(group)/feature/module/page.tsx
import { ModuleTable } from './module-table';
import { getModuleItems } from './get-module-items';

export default async function ModulePage() {
  return <ModuleTable items={await getModuleItems()} />;
}
```

**Correct (the route delegates to its feature):**

```tsx
// app/(group)/feature/module/page.tsx
import { ModuleScreen } from '@/features/feature/modules/module/screens/module-screen';

export default function ModulePage() {
  return <ModuleScreen />;
}
```

Reference:
[Next.js: Project structure](https://nextjs.org/docs/app/getting-started/project-structure)
