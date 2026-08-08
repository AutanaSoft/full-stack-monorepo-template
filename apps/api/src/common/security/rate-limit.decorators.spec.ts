import type { ExecutionContext } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { getOptionsToken, getStorageToken } from '@nestjs/throttler';
import type { ThrottlerModuleOptions, ThrottlerStorage } from '@nestjs/throttler';
import loggerConfig from '../../config/logger.config';
import {
  ExpandedRateLimit,
  RATE_LIMIT_POLICIES,
  SkipRateLimit,
  StrictRateLimit,
} from './rate-limit.decorators';
import { getIpTracker, RateLimitGuard } from './rate-limit.guard';

const loggerSettings = {
  LOG_LEVEL: 'silent',
  LOG_FILES_ENABLED: false,
  LOG_DIRECTORY: 'logs',
  LOG_WARN_FILE: 'warnings.log',
  LOG_ERROR_FILE: 'errors.log',
  REQUEST_ID_HEADER: 'x-request-id',
} satisfies ConfigType<typeof loggerConfig>;

class StrictFixtureController {
  @StrictRateLimit()
  strict(this: void): string {
    return 'strict';
  }
}

class ExpandedFixtureController {
  @ExpandedRateLimit()
  expanded(this: void): string {
    return 'expanded';
  }
}

class BypassFixtureController {
  @SkipRateLimit()
  bypass(this: void): string {
    return 'bypass';
  }
}

async function createGuard(storage: ThrottlerStorage): Promise<RateLimitGuard> {
  const options: ThrottlerModuleOptions = {
    throttlers: [{ name: 'default', limit: 1, ttl: 1_000 }],
    getTracker: (request) => getIpTracker(request),
  };
  const moduleRef = await Test.createTestingModule({
    providers: [
      RateLimitGuard,
      Reflector,
      { provide: getOptionsToken(), useValue: options },
      { provide: getStorageToken(), useValue: storage },
      { provide: loggerConfig.KEY, useValue: loggerSettings },
    ],
  }).compile();
  const guard = moduleRef.get(RateLimitGuard);

  await guard.onModuleInit();
  return guard;
}

function createContext(
  handler: () => string,
  classReference: object,
  response: { header: jest.Mock }
): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ ip: '127.0.0.1' }),
      getResponse: () => response,
    }),
    getHandler: () => handler,
    getClass: () => classReference,
  } as unknown as ExecutionContext;
}

describe('application rate-limit decorators', () => {
  it('centralizes the strict and expanded policy values', () => {
    expect(RATE_LIMIT_POLICIES).toEqual({
      strict: { limit: 10, ttl: 60_000 },
      expanded: { limit: 300, ttl: 60_000 },
    });
  });

  it.each([
    [StrictFixtureController.prototype.strict, StrictFixtureController, 10, 60_000],
    [ExpandedFixtureController.prototype.expanded, ExpandedFixtureController, 300, 60_000],
  ])('overrides the global policy for an endpoint', async (handler, classReference, limit, ttl) => {
    const increment: jest.MockedFunction<ThrottlerStorage['increment']> = jest.fn();
    increment.mockResolvedValue({
      totalHits: 1,
      timeToExpire: ttl,
      isBlocked: false,
      timeToBlockExpire: 0,
    });
    const storage: ThrottlerStorage = { increment };
    const guard = await createGuard(storage);
    const response = { header: jest.fn() };

    await expect(guard.canActivate(createContext(handler, classReference, response))).resolves.toBe(
      true
    );

    expect(increment).toHaveBeenCalledWith(expect.any(String), ttl, limit, ttl, 'default');
  });

  it('bypasses the global policy explicitly', async () => {
    const increment: jest.MockedFunction<ThrottlerStorage['increment']> = jest.fn();
    increment.mockResolvedValue({
      totalHits: 1,
      timeToExpire: 1_000,
      isBlocked: false,
      timeToBlockExpire: 0,
    });
    const storage: ThrottlerStorage = { increment };
    const guard = await createGuard(storage);

    await expect(
      guard.canActivate(
        createContext(BypassFixtureController.prototype.bypass, BypassFixtureController, {
          header: jest.fn(),
        })
      )
    ).resolves.toBe(true);

    expect(increment).not.toHaveBeenCalled();
  });
});
