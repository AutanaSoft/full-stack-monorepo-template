import { z } from 'zod';

export const envSchema = z.looseObject({});

export function validate(config: Record<string, unknown>): Record<string, unknown> {
  return envSchema.parse(config);
}
