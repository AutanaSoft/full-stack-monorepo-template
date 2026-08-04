---
title: Validate external service contracts
impact: HIGH
impactDescription: Prevents invalid external payloads from reaching domain logic or persistence
tags: nestjs, integrations, zod, validation
---

## Validate external service contracts

**Impact: HIGH (prevents invalid external payloads from reaching domain logic or persistence)**

Validate outgoing input and incoming responses at an integration boundary. Keep transport,
normalization, and application behavior explicit; do not persist or return raw provider payloads.

**Incorrect (returns an unvalidated provider payload):**

```typescript
async getOperations(input: ListOperationsInput) {
  const response = await this.httpClient.post('/graphql', { variables: input });
  return response.data.operations;
}
```

**Correct (validates and normalizes the payload):**

```typescript
async getOperations(input: unknown): Promise<OperationRecord[]> {
  const variables = listOperationsSchema.parse(input);
  const response = await this.httpClient.post('/graphql', { variables });
  return operationsResponseSchema.parse(response.data).operations.map(toOperationRecord);
}
```

Reference: [Zod: Basic usage](https://zod.dev/basics)
