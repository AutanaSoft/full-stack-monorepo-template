import type { ConfigType } from '@nestjs/config';
import { ConfigModule } from '@nestjs/config';
import type { ExecutionContext } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getOptionsToken, getStorageToken, ThrottlerStorageService } from '@nestjs/throttler';
import type { ThrottlerModuleOptions } from '@nestjs/throttler';
import { createRateLimitOptions, RateLimitModule } from './rate-limit.module';
import rateLimitConfig from '../../config/rate-limit.config';
import loggerConfig from '../../config/logger.config';

const loggerSettings = {
  LOG_LEVEL: 'silent',
  LOG_FILES_ENABLED: false,
  LOG_DIRECTORY: 'logs',
  LOG_WARN_FILE: 'warnings.log',
  LOG_ERROR_FILE: 'errors.log',
  REQUEST_ID_HEADER: 'x-request-id',
} satisfies ConfigType<typeof loggerConfig>;

function createRateLimitSettings(
  enabled: boolean,
  max: number
): ConfigType<typeof rateLimitConfig> {
  return {
    RATE_LIMIT_ENABLED: enabled,
    RATE_LIMIT_TTL_MS: 12_345,
    RATE_LIMIT_MAX: max,
    RATE_LIMIT_TRACKER: 'ip',
  };
}

describe('RateLimitModule', () => {
  it('uses the validated enabled flag, TTL, max, and IP tracker', () => {
    const options = createRateLimitOptions(createRateLimitSettings(true, 7));

    expect(Array.isArray(options)).toBe(false);

    if (Array.isArray(options)) {
      throw new Error('Expected the object form of throttler options.');
    }

    expect(options.throttlers).toEqual([
      {
        name: 'default',
        ttl: 12_345,
        limit: 7,
      },
    ]);
    expect(options.skipIf?.({} as ExecutionContext)).toBe(false);
    expect(options.getTracker?.({ ip: '127.0.0.1' }, {} as ExecutionContext)).toBe('127.0.0.1');
  });

  it('skips enforcement when rate limiting is disabled', () => {
    const options = createRateLimitOptions(createRateLimitSettings(false, 1));

    expect(Array.isArray(options)).toBe(false);

    if (Array.isArray(options)) {
      throw new Error('Expected the object form of throttler options.');
    }

    expect(options.skipIf?.({} as ExecutionContext)).toBe(true);
  });

  it('rejects tracker strategies that are not implemented', () => {
    const unsupportedConfig = {
      ...createRateLimitSettings(true, 1),
      RATE_LIMIT_TRACKER: 'forwarded',
    } as unknown as ConfigType<typeof rateLimitConfig>;

    expect(() => createRateLimitOptions(unsupportedConfig)).toThrow(
      'Only the IP tracker is implemented'
    );
  });

  it('registers the async options and built-in storage through Nest DI', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [rateLimitConfig, loggerConfig],
        }),
        RateLimitModule,
      ],
    })
      .overrideProvider(rateLimitConfig.KEY)
      .useValue(createRateLimitSettings(true, 3))
      .overrideProvider(loggerConfig.KEY)
      .useValue(loggerSettings)
      .compile();

    try {
      const options = moduleRef.get<ThrottlerModuleOptions>(getOptionsToken());

      expect(Array.isArray(options)).toBe(false);
      if (Array.isArray(options)) {
        throw new Error('Expected the object form of throttler options.');
      }

      expect(options.throttlers[0]).toMatchObject({ ttl: 12_345, limit: 3 });
      expect(moduleRef.get(getStorageToken())).toBeInstanceOf(ThrottlerStorageService);
    } finally {
      await moduleRef.close();
    }
  });
});
