import { registerAs } from '@nestjs/config';
import { z } from 'zod';

import { DEFAULT_HELMET_ENABLED } from './config.defaults';
import { booleanFromEnvironment, selectEnvironment } from './config.parsers';
import type { EnvironmentInput } from './config.parsers';

const helmetEnvironmentKeys = ['HELMET_ENABLED'] as const;

export const HelmetConfigSchema = z.strictObject({
  HELMET_ENABLED: booleanFromEnvironment(DEFAULT_HELMET_ENABLED),
});

export type HelmetConfig = z.infer<typeof HelmetConfigSchema>;

export const helmetConfigFactory = (env: EnvironmentInput = process.env): HelmetConfig =>
  HelmetConfigSchema.parse(selectEnvironment(env, helmetEnvironmentKeys));

export default registerAs<HelmetConfig>('helmetConfig', helmetConfigFactory);
