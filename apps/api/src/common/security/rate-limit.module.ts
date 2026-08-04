import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import type { ConfigType } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import type { ThrottlerModuleOptions } from '@nestjs/throttler';
import rateLimitConfig from '../../config/rate-limit.config';
import { getIpTracker, RateLimitGuard } from './rate-limit.guard';

export function createRateLimitOptions(
  config: ConfigType<typeof rateLimitConfig>,
): ThrottlerModuleOptions {
  if (config.RATE_LIMIT_TRACKER !== 'ip') {
    throw new Error('Unsupported rate-limit tracker. Only the IP tracker is implemented.');
  }

  return {
    throttlers: [
      {
        name: 'default',
        ttl: config.RATE_LIMIT_TTL_MS,
        limit: config.RATE_LIMIT_MAX,
      },
    ],
    skipIf: () => !config.RATE_LIMIT_ENABLED,
    getTracker: (request) => getIpTracker(request),
    setHeaders: true,
  };
}

/**
 * Health routes added in Phase 9 can use SkipRateLimit() for probe traffic. The built-in storage
 * is process-local and requires a shared ThrottlerStorage adapter before horizontal scaling.
 */
@Module({
  imports: [
    ConfigModule,
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [rateLimitConfig.KEY],
      useFactory: (config: ConfigType<typeof rateLimitConfig>) => createRateLimitOptions(config),
    }),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: RateLimitGuard,
    },
  ],
})
export class RateLimitModule {}
