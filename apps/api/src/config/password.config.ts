import { registerAs } from '@nestjs/config';
import { z } from 'zod';

import {
  DEFAULT_ARGON2_MEMORY_COST,
  DEFAULT_ARGON2_PARALLELISM,
  DEFAULT_ARGON2_TIME_COST,
} from './config.defaults';
import { integerFromEnvironment, selectEnvironment } from './config.parsers';
import type { EnvironmentInput } from './config.parsers';

const passwordEnvironmentKeys = [
  'ARGON2_MEMORY_COST',
  'ARGON2_TIME_COST',
  'ARGON2_PARALLELISM',
] as const;

export const PasswordConfigSchema = z.strictObject({
  ARGON2_MEMORY_COST: integerFromEnvironment(DEFAULT_ARGON2_MEMORY_COST, 8, 4_194_304),
  ARGON2_TIME_COST: integerFromEnvironment(DEFAULT_ARGON2_TIME_COST, 2, 10),
  ARGON2_PARALLELISM: integerFromEnvironment(DEFAULT_ARGON2_PARALLELISM, 1, 32),
});

export type PasswordConfig = z.infer<typeof PasswordConfigSchema>;

export const passwordConfigFactory = (env: EnvironmentInput = process.env): PasswordConfig =>
  PasswordConfigSchema.parse(selectEnvironment(env, passwordEnvironmentKeys));

export default registerAs<PasswordConfig>('passwordConfig', passwordConfigFactory);
