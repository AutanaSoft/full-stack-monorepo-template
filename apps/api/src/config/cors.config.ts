import { registerAs } from '@nestjs/config';
import { z } from 'zod';

import {
  DEFAULT_CORS_CREDENTIALS,
  DEFAULT_CORS_ENABLED,
  DEFAULT_CORS_MAX_AGE_SECONDS,
} from './config.defaults';
import {
  booleanFromEnvironment,
  corsOriginSchema,
  defaultCorsAllowedHeaders,
  defaultCorsExposedHeaders,
  defaultCorsMethods,
  defaultCorsOrigins,
  headerNameSchema,
  httpMethodSchema,
  integerFromEnvironment,
  parseStringList,
  selectEnvironment,
} from './config.parsers';
import type { EnvironmentInput } from './config.parsers';

const corsEnvironmentKeys = [
  'CORS_ENABLED',
  'CORS_ORIGINS',
  'CORS_METHODS',
  'CORS_ALLOWED_HEADERS',
  'CORS_EXPOSED_HEADERS',
  'CORS_CREDENTIALS',
  'CORS_MAX_AGE_SECONDS',
] as const;

export const CorsConfigSchema = z.strictObject({
  CORS_ENABLED: booleanFromEnvironment(DEFAULT_CORS_ENABLED),
  CORS_ORIGINS: z.preprocess(
    parseStringList,
    z.array(corsOriginSchema).default(defaultCorsOrigins),
  ),
  CORS_METHODS: z.preprocess(
    parseStringList,
    z
      .array(httpMethodSchema)
      .min(1, { error: 'must include at least one HTTP method' })
      .default(defaultCorsMethods),
  ),
  CORS_ALLOWED_HEADERS: z.preprocess(
    parseStringList,
    z
      .array(headerNameSchema)
      .min(1, { error: 'must include at least one allowed header' })
      .default(defaultCorsAllowedHeaders),
  ),
  CORS_EXPOSED_HEADERS: z.preprocess(
    parseStringList,
    z.array(headerNameSchema).default(defaultCorsExposedHeaders),
  ),
  CORS_CREDENTIALS: booleanFromEnvironment(DEFAULT_CORS_CREDENTIALS),
  CORS_MAX_AGE_SECONDS: integerFromEnvironment(DEFAULT_CORS_MAX_AGE_SECONDS, 0),
});

export type CorsConfig = z.infer<typeof CorsConfigSchema>;

export const corsConfigFactory = (env: EnvironmentInput = process.env): CorsConfig =>
  CorsConfigSchema.parse(selectEnvironment(env, corsEnvironmentKeys));

export default registerAs<CorsConfig>('corsConfig', corsConfigFactory);
