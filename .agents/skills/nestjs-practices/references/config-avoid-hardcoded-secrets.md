---
title: Keep secrets out of source and diagnostics
impact: CRITICAL
impactDescription:
  Prevents credential disclosure through source code, defaults, logs, errors, or serialized
  configuration.
tags: nestjs, configuration, secrets, security
---

## Keep secrets out of source and diagnostics

**Impact: CRITICAL (prevents credential disclosure through source code, defaults, logs, errors, or
serialized configuration)**

Never hardcode passwords, API keys, tokens, private keys, or usable credential-like defaults. Use
the repository's established environment or external secret provider and validate presence and
format at the configuration boundary. Do not serialize a namespace or `process.env` wholesale, and
do not include secret values in logs or exceptions. A safe diagnostic may identify the variable or
provider path, expected type, or failed constraint without revealing the value. Sanitize structured
data before logging it.

**Incorrect (uses an unsafe credential-like fallback):**

```typescript
const paymentsConfig = {
  apiKey: process.env.PAYMENTS_API_KEY ?? 'change-me',
};
```

**Correct (requires the external value and reports only safe metadata):**

```typescript
import { z } from 'zod';

const paymentsSchema = z.object({
  apiKey: z.string().min(1),
});

type PaymentsConfig = Readonly<z.infer<typeof paymentsSchema>>;

export function loadPaymentsConfig(): PaymentsConfig {
  const candidate = {
    apiKey: process.env.PAYMENTS_API_KEY,
  };

  try {
    return paymentsSchema.parse(candidate);
  } catch {
    throw new Error('Invalid payments configuration: PAYMENTS_API_KEY is missing or malformed');
  }
}
```

This simplified example demonstrates the boundary that prevents secret exposure; it is not a
universal error-handling policy. When a project needs structured diagnostics or causal chains,
preserve the original cause through its sanitized error mechanism while excluding secret values.

Keep construction and final validation in
[Build and validate namespaced configuration](./config-build-and-validate-namespaced-configuration.md),
and isolate external secret providers with
[Isolate external configuration sources](./config-isolate-external-configuration-sources.md).

References:

- [NestJS Configuration](https://docs.nestjs.com/techniques/configuration)
- [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
