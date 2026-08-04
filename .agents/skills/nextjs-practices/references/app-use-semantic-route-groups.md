---
title: Use semantic route groups
impact: MEDIUM
impactDescription: Separates route surfaces without changing their URLs
tags: nextjs, app-router, route-groups, routing
---

## Use semantic route groups

**Impact: MEDIUM (separates route surfaces without changing their URLs)**

Name route groups for a real architectural responsibility, such as access level, audience, or
experience. Parenthesized route groups organize routes without adding a URL segment.

**Incorrect (uses generic group names):**

```text
app/
├─ (app)/
├─ (main)/
└─ (routes)/
```

**Correct (names the responsibility):**

```text
app/
├─ (public)/
│  └─ pricing/
└─ (protected)/
   └─ dashboard/
```

Reference:
[Next.js: Route Groups](https://nextjs.org/docs/app/api-reference/file-conventions/route-groups)
