---
title: Isolate external configuration sources
impact: HIGH
impactDescription:
  Prevents application consumers from coupling business logic to environment variables, secret
  providers, or deployment mechanisms.
tags: nestjs, configuration, dependency-injection, environment
---

## Isolate external configuration sources

**Impact: HIGH (prevents application consumers from coupling business logic to environment
variables, secret providers, or deployment mechanisms)**

Keep `process.env`, Vault, AWS Secrets Manager, Azure Key Vault, Google Secret Manager, Kubernetes
secret mounts, external files, and configuration APIs behind a boundary: a configuration factory, a
bootstrap adapter, or a dynamic-module provider. Consumers should depend on a validated token or
typed contract instead of knowing where a value is stored. When a source is asynchronous, use an
async provider or the owning dynamic module's `forRootAsync`; do not force a synchronous
`registerAs` factory to reach an asynchronous source.

**Incorrect (a business service reaches into a secret provider):**

```typescript
@Injectable()
export class PaymentsClient {
  constructor(private readonly vault: VaultClient) {}

  async getAuthorizationHeader(): Promise<string> {
    const apiKey = await this.vault.read('payments/api-key');
    return `Bearer ${apiKey}`;
  }
}
```

**Correct (an async provider isolates the source before injection):**

```typescript
import { Inject, Injectable } from '@nestjs/common';

const PAYMENTS_SECRETS = Symbol('PAYMENTS_SECRETS');

type PaymentsSecrets = Readonly<{ apiKey: string }>;

const paymentsSecretsProvider = {
  provide: PAYMENTS_SECRETS,
  inject: [VaultClient],
  useFactory: async (vault: VaultClient): Promise<PaymentsSecrets> => {
    const apiKey = await vault.read('payments/api-key');

    if (!apiKey) {
      throw new Error('Payments API key is unavailable');
    }

    return { apiKey };
  },
};

@Injectable()
export class PaymentsClient {
  constructor(
    @Inject(PAYMENTS_SECRETS)
    private readonly secrets: PaymentsSecrets,
  ) {}

  getAuthorizationHeader(): string {
    return `Bearer ${this.secrets.apiKey}`;
  }
}
```

Keep the module option contract at its registration boundary with
[Validate dynamic module options](./config-validate-dynamic-module-options.md), and use
[typed namespaced injection](./config-inject-namespaced-configuration.md) when the source becomes
application configuration.

References:

- [NestJS Custom Providers](https://docs.nestjs.com/fundamentals/custom-providers)
- [NestJS Dynamic Modules](https://docs.nestjs.com/fundamentals/dynamic-modules)
