import type {
  CorsOptions,
  CustomOrigin,
} from '@nestjs/common/interfaces/external/cors-options.interface';
import type { ConfigType } from '@nestjs/config';
import corsConfig from '../../config/cors.config';

function createOriginOption(origins: readonly string[]): CorsOptions['origin'] {
  if (origins.includes('*')) {
    return '*';
  }

  const originValidator: CustomOrigin = (requestOrigin, callback) => {
    callback(null, requestOrigin === undefined || origins.includes(requestOrigin));
  };

  return originValidator;
}

/** Builds the Express CORS policy from the validated namespace without widening its scope. */
export function createCorsOptions(config: ConfigType<typeof corsConfig>): CorsOptions | undefined {
  if (!config.CORS_ENABLED) {
    return undefined;
  }

  return {
    origin: createOriginOption(config.CORS_ORIGINS),
    methods: [...config.CORS_METHODS],
    allowedHeaders: [...config.CORS_ALLOWED_HEADERS],
    exposedHeaders: [...config.CORS_EXPOSED_HEADERS],
    credentials: config.CORS_CREDENTIALS,
    maxAge: config.CORS_MAX_AGE_SECONDS,
  };
}
