import type { ExecutionContext } from '@nestjs/common';
import { HttpException } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { getOptionsToken, getStorageToken } from '@nestjs/throttler';
import type { ThrottlerModuleOptions, ThrottlerStorage } from '@nestjs/throttler';
import { ErrorResponseSchema } from '@autanasoft/contracts';
import loggerConfig from '../../config/logger.config';
import {
  getIpTracker,
  RATE_LIMIT_ERROR_CODE,
  RATE_LIMIT_ERROR_MESSAGE,
  RateLimitGuard,
} from './rate-limit.guard';

const loggerSettings = {
  LOG_LEVEL: 'silent',
  LOG_FILES_ENABLED: false,
  LOG_DIRECTORY: 'logs',
  LOG_WARN_FILE: 'warnings.log',
  LOG_ERROR_FILE: 'errors.log',
  REQUEST_ID_HEADER: 'x-request-id',
} satisfies ConfigType<typeof loggerConfig>;

describe('RateLimitGuard', () => {
  it('uses only Express req.ip and rejects an absent resolved IP', () => {
    expect(getIpTracker({ ip: '203.0.113.10', 'x-forwarded-for': '198.51.100.10' })).toBe(
      '203.0.113.10',
    );
    expect(() => getIpTracker({ 'x-forwarded-for': '198.51.100.10' })).toThrow(
      'Unable to resolve the client IP',
    );
  });

  it('adapts throttling failures to the public error contract and preserves headers', async () => {
    const increment: jest.MockedFunction<ThrottlerStorage['increment']> = jest.fn();
    increment.mockResolvedValue({
      totalHits: 2,
      timeToExpire: 58_000,
      isBlocked: true,
      timeToBlockExpire: 5_000,
    });
    const storage: ThrottlerStorage = { increment };
    const options: ThrottlerModuleOptions = {
      throttlers: [{ name: 'default', limit: 1, ttl: 60_000 }],
      getTracker: (request) => getIpTracker(request),
      setHeaders: true,
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

    try {
      const guard = moduleRef.get(RateLimitGuard);
      await guard.onModuleInit();

      const response = {
        header: jest.fn(),
        getHeader: jest.fn().mockReturnValue(undefined),
        setHeader: jest.fn(),
      };
      const request = {
        id: 'unit-rate-limit-request',
        ip: '127.0.0.1',
        originalUrl: '/api/v1/limited?secret=should-not-appear',
      };
      function handler(): string {
        return 'ok';
      }
      class TestController {}
      const context = {
        switchToHttp: () => ({
          getRequest: () => request,
          getResponse: () => response,
        }),
        getHandler: () => handler,
        getClass: () => TestController,
      } as unknown as ExecutionContext;

      let caught: unknown;
      try {
        await guard.canActivate(context);
      } catch (error: unknown) {
        caught = error;
      }

      expect(caught).toBeInstanceOf(HttpException);
      if (!(caught instanceof HttpException)) {
        throw new Error('Expected a throttling HttpException.');
      }

      const body = caught.getResponse();
      const parsed = ErrorResponseSchema.safeParse(body);

      expect(parsed.success).toBe(true);
      if (!parsed.success) {
        throw new Error('Expected a contract-compliant throttling response.');
      }

      const { timestamp, ...stableResponse } = parsed.data;

      expect(stableResponse).toEqual({
        statusCode: 429,
        code: RATE_LIMIT_ERROR_CODE,
        message: RATE_LIMIT_ERROR_MESSAGE,
        path: '/api/v1/limited',
        requestId: 'unit-rate-limit-request',
      });
      expect(Number.isNaN(Date.parse(timestamp))).toBe(false);
      expect(Object.keys(parsed.data).sort()).toEqual([
        'code',
        'message',
        'path',
        'requestId',
        'statusCode',
        'timestamp',
      ]);
      expect(JSON.stringify(parsed.data)).not.toContain('127.0.0.1');
      expect(JSON.stringify(parsed.data)).not.toContain('secret');
      expect(response.header).toHaveBeenCalledWith('Retry-After', 5_000);
      expect(response.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', 1);
      expect(response.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', 0);
      expect(response.setHeader).toHaveBeenCalledWith('X-RateLimit-Reset', 58_000);
    } finally {
      await moduleRef.close();
    }
  });
});
