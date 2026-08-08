import type {
  CorsOptions,
  CustomOrigin,
} from '@nestjs/common/interfaces/external/cors-options.interface';
import type { ConfigType } from '@nestjs/config';
import corsConfig from '../../config/cors.config';
import { createCorsOptions } from './cors.options';

const allowedOrigin = 'https://allowed.example.com';

function makeCorsConfig(
  overrides: Partial<ConfigType<typeof corsConfig>> = {}
): ConfigType<typeof corsConfig> {
  return {
    CORS_ENABLED: true,
    CORS_ORIGINS: [allowedOrigin],
    CORS_METHODS: ['GET', 'OPTIONS'],
    CORS_ALLOWED_HEADERS: ['content-type', 'authorization'],
    CORS_EXPOSED_HEADERS: ['x-request-id'],
    CORS_CREDENTIALS: true,
    CORS_MAX_AGE_SECONDS: 900,
    ...overrides,
  };
}

function getOriginValidator(options: CorsOptions): CustomOrigin {
  if (typeof options.origin !== 'function') {
    throw new Error('Expected a dynamic CORS origin validator.');
  }

  return options.origin;
}

describe('CORS options', () => {
  it('returns undefined when CORS is disabled', () => {
    expect(createCorsOptions(makeCorsConfig({ CORS_ENABLED: false }))).toBeUndefined();
  });

  it('maps the configured policy fields to Express CORS options', () => {
    const options = createCorsOptions(makeCorsConfig());

    if (options === undefined) {
      throw new Error('Expected CORS options to be enabled.');
    }

    expect(typeof options.origin).toBe('function');
    expect(options).toMatchObject({
      methods: ['GET', 'OPTIONS'],
      allowedHeaders: ['content-type', 'authorization'],
      exposedHeaders: ['x-request-id'],
      credentials: true,
      maxAge: 900,
    });
  });

  it('allows non-browser requests and only configured browser origins', () => {
    const options = createCorsOptions(makeCorsConfig());

    if (options === undefined) {
      throw new Error('Expected CORS options to be enabled.');
    }

    const originValidator = getOriginValidator(options);
    const callback = jest.fn();

    originValidator(undefined, callback);
    expect(callback).toHaveBeenLastCalledWith(null, true);

    originValidator(allowedOrigin, callback);
    expect(callback).toHaveBeenLastCalledWith(null, true);

    originValidator('https://blocked.example.com', callback);
    expect(callback).toHaveBeenLastCalledWith(null, false);
  });

  it('normalizes wildcard origins to the static wildcard accepted by cors', () => {
    const options = createCorsOptions(
      makeCorsConfig({ CORS_ORIGINS: ['*', allowedOrigin], CORS_CREDENTIALS: false })
    );

    expect(options?.origin).toBe('*');
  });
});
