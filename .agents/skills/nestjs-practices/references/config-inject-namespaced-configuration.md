---
title: Inject typed namespaced configuration
impact: HIGH
impactDescription: Preserves typed and explicit configuration dependencies at the consumer boundary.
tags: nestjs, configuration, dependency-injection, typescript
---

## Inject typed namespaced configuration

**Impact: HIGH (preserves typed and explicit configuration dependencies at the consumer boundary)**

For one known `registerAs` namespace, inject `config.KEY` and use `ConfigType<typeof config>` rather
than scattering string paths through consumers. Keep the injected property and its contract
read-only; the factory's return type should carry that contract when possible. Reserve
`ConfigService` for genuinely dynamic lookup or consumers that intentionally combine multiple
namespaces. Consumers should not revalidate or mutate bootstrap configuration, and mutable runtime
settings should use a separate boundary.

**Incorrect (uses a string lookup for one known namespace):**

```typescript
import { ConfigService } from '@nestjs/config';

export class PaymentsClient {
  constructor(private readonly configService: ConfigService) {}

  getApiUrl(): string | undefined {
    return this.configService.get<string>('payments.apiUrl');
  }
}
```

**Correct (injects the known namespace through its typed token):**

```typescript
import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import paymentsConfig from './config/payments.config';

@Injectable()
export class PaymentsClient {
  constructor(
    @Inject(paymentsConfig.KEY)
    private readonly config: Readonly<ConfigType<typeof paymentsConfig>>,
  ) {}

  getApiUrl(): string {
    return this.config.apiUrl;
  }
}
```

The namespace must be registered in the consuming context as described by
[Register configuration per application context](./config-register-configuration-per-application-context.md)
and built by
[Build and validate namespaced configuration](./config-build-and-validate-namespaced-configuration.md).
TypeScript `Readonly` protects the contract at compile time; use runtime freezing only when the
project needs that additional guarantee.

Reference: [NestJS Configuration](https://docs.nestjs.com/techniques/configuration)
