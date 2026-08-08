import { registerAs } from '@nestjs/config';
import { z } from 'zod';

import {
  DEFAULT_HEALTH_DISK_PATH,
  DEFAULT_HEALTH_DISK_THRESHOLD_PERCENT,
  DEFAULT_HEALTH_ENABLED,
} from './config.defaults';
import {
  booleanFromEnvironment,
  directoryPathSchema,
  integerFromEnvironment,
  selectEnvironment,
} from './config.parsers';
import type { EnvironmentInput } from './config.parsers';

const healthEnvironmentKeys = [
  'HEALTH_ENABLED',
  'HEALTH_DISK_PATH',
  'HEALTH_DISK_THRESHOLD_PERCENT',
] as const;

export const HealthConfigSchema = z.strictObject({
  HEALTH_ENABLED: booleanFromEnvironment(DEFAULT_HEALTH_ENABLED),
  HEALTH_DISK_PATH: directoryPathSchema.default(DEFAULT_HEALTH_DISK_PATH),
  HEALTH_DISK_THRESHOLD_PERCENT: integerFromEnvironment(
    DEFAULT_HEALTH_DISK_THRESHOLD_PERCENT,
    0,
    100
  ),
});

export type HealthConfig = z.infer<typeof HealthConfigSchema>;

export const healthConfigFactory = (env: EnvironmentInput = process.env): HealthConfig =>
  HealthConfigSchema.parse(selectEnvironment(env, healthEnvironmentKeys));

export default registerAs<HealthConfig>('healthConfig', healthConfigFactory);
