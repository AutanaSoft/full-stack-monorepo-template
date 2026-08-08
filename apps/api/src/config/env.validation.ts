import { z } from 'zod';
import { AppConfigSchema } from './app.config';
import { CorsConfigSchema } from './cors.config';
import { DatabaseConfigSchema } from './database.config';
import { HealthConfigSchema } from './health.config';
import { HelmetConfigSchema } from './helmet.config';
import { LoggerConfigSchema } from './logger.config';
import { PasswordConfigSchema } from './password.config';
import { RateLimitConfigSchema } from './rate-limit.config';
import { SwaggerConfigSchema } from './swagger.config';
import { prepareEnvironmentInput } from './config.parsers';

const ComposedEnvironmentSchema = z.looseObject({
  ...AppConfigSchema.shape,
  ...CorsConfigSchema.shape,
  ...DatabaseConfigSchema.shape,
  ...HealthConfigSchema.shape,
  ...HelmetConfigSchema.shape,
  ...LoggerConfigSchema.shape,
  ...PasswordConfigSchema.shape,
  ...RateLimitConfigSchema.shape,
  ...SwaggerConfigSchema.shape,
});

export const EnvValidationSchema = z
  .preprocess(prepareEnvironmentInput, ComposedEnvironmentSchema)
  .refine(
    (config) =>
      config.NODE_ENV !== 'production' ||
      !config.CORS_ENABLED ||
      (config.CORS_ORIGINS.length > 0 && !config.CORS_ORIGINS.includes('*')),
    {
      error: 'production CORS requires at least one explicit non-wildcard origin when enabled',
      path: ['CORS_ORIGINS'],
    }
  )
  .refine((config) => !config.CORS_CREDENTIALS || !config.CORS_ORIGINS.includes('*'), {
    error: 'CORS credentials cannot be enabled with a wildcard origin',
    path: ['CORS_ORIGINS'],
  })
  .refine((config) => config.SWAGGER_PATH !== config.API_PREFIX, {
    error: 'Swagger path must not collide with the API prefix',
    path: ['SWAGGER_PATH'],
  })
  .refine((config) => config.LOG_WARN_FILE !== config.LOG_ERROR_FILE, {
    error: 'warning and error log files must be different',
    path: ['LOG_ERROR_FILE'],
  });

export type EnvConfig = z.infer<typeof EnvValidationSchema>;

export function validate(config: Record<string, unknown>): EnvConfig {
  const result = EnvValidationSchema.safeParse(config);

  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => {
        const path = issue.path.join('.') || 'environment';

        if (issue.path[0] === 'DATABASE_URL') {
          return `${path}: must be a valid non-empty PostgreSQL URL`;
        }

        return `${path}: ${issue.message}`;
      })
      .join('; ');

    throw new Error(`Invalid environment configuration: ${issues}`);
  }

  return result.data;
}
