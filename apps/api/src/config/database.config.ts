import { registerAs } from '@nestjs/config';
import { z } from 'zod';

import { selectEnvironment } from './config.parsers';
import type { EnvironmentInput } from './config.parsers';

const databaseEnvironmentKeys = ['DATABASE_URL'] as const;

const databaseUrlSchema = z.preprocess(
  (value) => (typeof value === 'string' ? value.trim() : value),
  z
    .url({ error: 'must be a valid PostgreSQL URL' })
    .refine((value) => /^postgres(?:ql)?:\/\//i.test(value), {
      error: 'must use the PostgreSQL URL scheme',
    }),
);

export const DatabaseConfigSchema = z.strictObject({
  DATABASE_URL: databaseUrlSchema,
});

export type DatabaseConfig = z.infer<typeof DatabaseConfigSchema>;

export const databaseConfigFactory = (env: EnvironmentInput = process.env): DatabaseConfig => {
  try {
    return DatabaseConfigSchema.parse(selectEnvironment(env, databaseEnvironmentKeys));
  } catch {
    throw new Error('Invalid database configuration: DATABASE_URL must be a PostgreSQL URL.');
  }
};

export default registerAs<DatabaseConfig>('databaseConfig', databaseConfigFactory);
