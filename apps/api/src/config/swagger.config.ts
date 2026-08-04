import { registerAs } from '@nestjs/config';
import { z } from 'zod';

import { DEFAULT_SWAGGER_ENABLED, DEFAULT_SWAGGER_PATH } from './config.defaults';
import {
  booleanFromEnvironment,
  prepareEnvironmentInput,
  routeSegmentSchema,
  selectEnvironment,
} from './config.parsers';
import type { EnvironmentInput } from './config.parsers';

const swaggerEnvironmentKeys = ['SWAGGER_ENABLED', 'SWAGGER_PATH'] as const;

export const SwaggerConfigSchema = z.strictObject({
  SWAGGER_ENABLED: booleanFromEnvironment(DEFAULT_SWAGGER_ENABLED),
  SWAGGER_PATH: routeSegmentSchema.default(DEFAULT_SWAGGER_PATH),
});

export type SwaggerConfig = z.infer<typeof SwaggerConfigSchema>;

export const swaggerConfigFactory = (env: EnvironmentInput = process.env): SwaggerConfig =>
  SwaggerConfigSchema.parse(
    selectEnvironment(prepareEnvironmentInput(env), swaggerEnvironmentKeys),
  );

export default registerAs<SwaggerConfig>('swaggerConfig', swaggerConfigFactory);
