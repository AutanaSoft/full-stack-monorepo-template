import { randomUUID } from 'node:crypto';
import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { InjectThrottlerOptions, InjectThrottlerStorage, ThrottlerGuard } from '@nestjs/throttler';
import type {
  ThrottlerLimitDetail,
  ThrottlerModuleOptions,
  ThrottlerStorage,
} from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { ErrorResponseSchema, RequestIdSchema } from '@autanasoft/contracts';
import type { ErrorResponse } from '@autanasoft/contracts';
import loggerConfig from '../../config/logger.config';

export const RATE_LIMIT_ERROR_CODE = 'RATE_LIMIT_EXCEEDED';
export const RATE_LIMIT_ERROR_MESSAGE = 'Too many requests. Please try again later.';

export type RateLimitRequest = Request & {
  id?: unknown;
};

/** Returns the IP resolved by Express without reading or parsing forwarded headers. */
export function getIpTracker(request: Record<string, unknown>): string {
  const ip = request['ip'];

  if (typeof ip !== 'string' || ip.length === 0) {
    throw new Error('Unable to resolve the client IP for rate limiting.');
  }

  return ip;
}

function resolveRequestId(
  request: RateLimitRequest,
  response: Response,
  requestIdHeader: string,
): string {
  if (typeof request.id === 'string' && RequestIdSchema.safeParse(request.id).success) {
    return request.id;
  }

  const responseRequestId = response.getHeader(requestIdHeader);

  if (
    typeof responseRequestId === 'string' &&
    RequestIdSchema.safeParse(responseRequestId).success
  ) {
    return responseRequestId;
  }

  const generatedRequestId = RequestIdSchema.parse(randomUUID());
  response.setHeader(requestIdHeader, generatedRequestId);
  return generatedRequestId;
}

function getRequestPath(request: RateLimitRequest): string {
  const target = request.originalUrl ?? request.url ?? '/';
  const queryStart = target.indexOf('?');
  const path = queryStart === -1 ? target : target.slice(0, queryStart);

  return path === '' ? '/' : path;
}

function setRateLimitHeaders(response: Response, details: ThrottlerLimitDetail): void {
  response.setHeader('X-RateLimit-Limit', details.limit);
  response.setHeader('X-RateLimit-Remaining', Math.max(0, details.limit - details.totalHits));
  response.setHeader('X-RateLimit-Reset', details.timeToExpire);
}

export function createRateLimitErrorResponse(
  request: RateLimitRequest,
  response: Response,
  requestIdHeader: string,
): ErrorResponse {
  return ErrorResponseSchema.parse({
    statusCode: HttpStatus.TOO_MANY_REQUESTS,
    code: RATE_LIMIT_ERROR_CODE,
    message: RATE_LIMIT_ERROR_MESSAGE,
    timestamp: new Date().toISOString(),
    path: getRequestPath(request),
    requestId: resolveRequestId(request, response, requestIdHeader),
  });
}

@Injectable()
export class RateLimitGuard extends ThrottlerGuard {
  constructor(
    @InjectThrottlerOptions() options: ThrottlerModuleOptions,
    @InjectThrottlerStorage() storageService: ThrottlerStorage,
    reflector: Reflector,
    @Inject(loggerConfig.KEY)
    private readonly loggingConfig: ConfigType<typeof loggerConfig>,
  ) {
    super(options, storageService, reflector);
  }

  protected throwThrottlingException(
    context: ExecutionContext,
    throttlerLimitDetail: ThrottlerLimitDetail,
  ): Promise<void> {
    const request = context.switchToHttp().getRequest<RateLimitRequest>();
    const response = context.switchToHttp().getResponse<Response>();

    setRateLimitHeaders(response, throttlerLimitDetail);

    throw new HttpException(
      createRateLimitErrorResponse(request, response, this.loggingConfig.REQUEST_ID_HEADER),
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}
