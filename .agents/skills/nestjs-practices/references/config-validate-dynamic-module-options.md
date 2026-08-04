---
title: Validate dynamic module options at registration
impact: HIGH
impactDescription:
  Prevents invalid public module options from reaching internal providers and failing later at
  runtime.
tags: nestjs, configuration, dynamic-modules, validation
---

## Validate dynamic module options at registration

**Impact: HIGH (prevents invalid public module options from reaching internal providers and failing
later at runtime)**

Make a dynamic module's public options its own contract and validate them before registering
providers. `forRoot(options)` validates the supplied object before creating its providers. For
`forRootAsync`, resolve the injected or factory-provided object first and pass that result through
the same boundary validator. Internal providers then receive only the validated, read-only result;
they should not repeat the validation.

The module must not assume `process.env` is the source of its options. Callers may provide values
from application configuration, a secret adapter, or another provider. Keep the contract independent
of a particular validation library; the example uses Zod. Expose a stable token for the validated
options so consumers do not depend on private module implementation details.

**Incorrect (registers caller input without validating the public contract):**

```typescript
import { DynamicModule, Module } from '@nestjs/common';

export const PAYMENTS_OPTIONS = Symbol('PAYMENTS_OPTIONS');

@Module({})
export class PaymentsModule {
  static forRoot(options: unknown): DynamicModule {
    return {
      module: PaymentsModule,
      providers: [{ provide: PAYMENTS_OPTIONS, useValue: options }],
      exports: [PAYMENTS_OPTIONS],
    };
  }
}
```

**Correct (validates before exposing the options provider):**

```typescript
import { DynamicModule, Module } from '@nestjs/common';
import { z } from 'zod';

export const PAYMENTS_OPTIONS = Symbol('PAYMENTS_OPTIONS');

const paymentsModuleOptionsSchema = z.object({
  apiUrl: z.string().url(),
  timeoutMs: z.number().int().positive().default(5_000),
});

type PaymentsModuleOptionsInput = Readonly<z.input<typeof paymentsModuleOptionsSchema>>;
type PaymentsModuleOptions = Readonly<z.infer<typeof paymentsModuleOptionsSchema>>;

const validatePaymentsOptions = (options: PaymentsModuleOptionsInput): PaymentsModuleOptions => {
  return paymentsModuleOptionsSchema.parse(options);
};

@Module({})
export class PaymentsModule {
  static forRoot(options: PaymentsModuleOptionsInput): DynamicModule {
    const validatedOptions = validatePaymentsOptions(options);

    return {
      module: PaymentsModule,
      providers: [{ provide: PAYMENTS_OPTIONS, useValue: validatedOptions }],
      exports: [PAYMENTS_OPTIONS],
    };
  }
}
```

For `forRootAsync`, make its provider await the resolved factory result and pass it through the same
validator before returning the `PAYMENTS_OPTIONS` value:

```typescript
const validatedOptions = validatePaymentsOptions(resolvedOptions);
```

The same validator must own both synchronous and asynchronous registration paths. Keep the accepted
input, validated result, and registered token distinct so internal providers receive only the final
read-only contract and do not repeat validation.

References:

- [NestJS Dynamic Modules](https://docs.nestjs.com/fundamentals/dynamic-modules)
- [NestJS Custom Providers](https://docs.nestjs.com/fundamentals/custom-providers)
- [Zod documentation](https://zod.dev/)
