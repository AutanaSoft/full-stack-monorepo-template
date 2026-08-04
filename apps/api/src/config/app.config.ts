import { registerAs } from '@nestjs/config';
import { z } from 'zod';

import {
  DEFAULT_API_PREFIX,
  DEFAULT_API_VERSION,
  DEFAULT_NODE_ENV,
  DEFAULT_PORT,
  DEFAULT_TRUST_PROXY,
} from './config.defaults';
import {
  integerFromEnvironment,
  parseTrustProxy,
  routeSegmentSchema,
  selectEnvironment,
} from './config.parsers';
import type { EnvironmentInput } from './config.parsers';

const appEnvironmentKeys = [
  'NODE_ENV',
  'PORT',
  'API_PREFIX',
  'API_VERSION',
  'TRUST_PROXY',
] as const;

const nodeEnvironmentSchema = z
  .string({ error: 'must be development, test, or production' })
  .trim()
  .pipe(
    z.enum(['development', 'test', 'production'], {
      error: 'must be development, test, or production',
    }),
  )
  .default(DEFAULT_NODE_ENV);

const trustProxySchema = z.preprocess(
  parseTrustProxy,
  z.union([z.boolean(), z.number().int().min(0)]).default(DEFAULT_TRUST_PROXY),
);

export const AppConfigSchema = z.strictObject({
  NODE_ENV: nodeEnvironmentSchema,
  PORT: integerFromEnvironment(DEFAULT_PORT, 0, 65535),
  API_PREFIX: routeSegmentSchema.default(DEFAULT_API_PREFIX),
  API_VERSION: integerFromEnvironment(DEFAULT_API_VERSION, 1),
  TRUST_PROXY: trustProxySchema,
});

export type AppConfig = z.infer<typeof AppConfigSchema>;

export const appConfigFactory = (env: EnvironmentInput = process.env): AppConfig =>
  AppConfigSchema.parse(selectEnvironment(env, appEnvironmentKeys));

export default registerAs<AppConfig>('appConfig', appConfigFactory);
