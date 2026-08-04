import { registerAs } from '@nestjs/config';
import { z } from 'zod';

import {
  DEFAULT_RATE_LIMIT_ENABLED,
  DEFAULT_RATE_LIMIT_MAX,
  DEFAULT_RATE_LIMIT_TRACKER,
  DEFAULT_RATE_LIMIT_TTL_MS,
} from './config.defaults';
import {
  booleanFromEnvironment,
  integerFromEnvironment,
  selectEnvironment,
} from './config.parsers';
import type { EnvironmentInput } from './config.parsers';

const rateLimitEnvironmentKeys = [
  'RATE_LIMIT_ENABLED',
  'RATE_LIMIT_TTL_MS',
  'RATE_LIMIT_MAX',
  'RATE_LIMIT_TRACKER',
] as const;

export const RateLimitConfigSchema = z.strictObject({
  RATE_LIMIT_ENABLED: booleanFromEnvironment(DEFAULT_RATE_LIMIT_ENABLED),
  RATE_LIMIT_TTL_MS: integerFromEnvironment(DEFAULT_RATE_LIMIT_TTL_MS, 1),
  RATE_LIMIT_MAX: integerFromEnvironment(DEFAULT_RATE_LIMIT_MAX, 1),
  RATE_LIMIT_TRACKER: z
    .string({ error: 'must be a supported rate-limit tracker' })
    .trim()
    .toLowerCase()
    .pipe(z.enum(['ip'], { error: 'must be a supported rate-limit tracker' }))
    .default(DEFAULT_RATE_LIMIT_TRACKER),
});

export type RateLimitConfig = z.infer<typeof RateLimitConfigSchema>;

export const rateLimitConfigFactory = (env: EnvironmentInput = process.env): RateLimitConfig =>
  RateLimitConfigSchema.parse(selectEnvironment(env, rateLimitEnvironmentKeys));

export default registerAs<RateLimitConfig>('rateLimitConfig', rateLimitConfigFactory);
