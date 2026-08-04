import { randomUUID } from 'node:crypto';
import {
  Catch,
  HttpException,
  Inject,
  type ArgumentsHost,
  type ExceptionFilter,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { ErrorResponseSchema, RequestIdSchema, type ErrorResponse } from '@autanasoft/contracts';
import { ZodError } from 'zod';
import { PinoLogger } from 'nestjs-pino';
import loggerConfig from '../../config/logger.config';
import { ApplicationError } from './application-error';
import { getErrorDefinition } from './error-code';
import type { Request, Response } from 'express';

type ErrorRequest = Request & { id?: unknown };

function getRequestPath(request: ErrorRequest): string {
  const target = request.originalUrl ?? request.url ?? '/';
  const queryStart = target.indexOf('?');
  const path = queryStart === -1 ? target : target.slice(0, queryStart);

  return path === '' ? '/' : path;
}

function resolveRequestId(
  request: ErrorRequest,
  response: Response,
  requestIdHeader: string,
): string {
  let requestId: string | undefined;

  if (typeof request.id === 'string' && RequestIdSchema.safeParse(request.id).success) {
    requestId = request.id;
  }

  if (requestId === undefined) {
    const responseRequestId = response.getHeader(requestIdHeader);

    if (
      typeof responseRequestId === 'string' &&
      RequestIdSchema.safeParse(responseRequestId).success
    ) {
      requestId = responseRequestId;
    }
  }

  requestId ??= RequestIdSchema.parse(randomUUID());
  response.setHeader(requestIdHeader, requestId);
  return requestId;
}

function getHttpExceptionCode(statusCode: number): string {
  if (statusCode === 400) {
    return 'VALIDATION_FAILED';
  }

  if (statusCode === 404) {
    return 'RESOURCE_NOT_FOUND';
  }

  if (statusCode === 429) {
    return 'RATE_LIMIT_EXCEEDED';
  }

  return statusCode >= 500 ? 'INTERNAL_ERROR' : 'HTTP_ERROR';
}

function getExceptionDetails(exception: unknown): {
  code: string;
  statusCode: number;
  message: string;
} {
  if (exception instanceof ApplicationError) {
    const definition = getErrorDefinition(exception.code);

    if (definition !== undefined) {
      return { code: exception.code, ...definition };
    }
  }

  if (exception instanceof ZodError) {
    const definition = getErrorDefinition('VALIDATION_FAILED');
    return { code: 'VALIDATION_FAILED', ...definition };
  }

  if (exception instanceof HttpException) {
    const statusCode = exception.getStatus();
    const response = exception.getResponse();

    if (statusCode === 429 && typeof response === 'object' && response !== null) {
      const parsed = ErrorResponseSchema.safeParse(response);

      if (parsed.success) {
        return parsed.data;
      }
    }

    const code = getHttpExceptionCode(statusCode);
    const definition = getErrorDefinition(code) ?? getErrorDefinition('INTERNAL_ERROR');

    return {
      code,
      statusCode: statusCode >= 400 && statusCode <= 599 ? statusCode : 500,
      message: definition.message,
    };
  }

  const definition = getErrorDefinition('INTERNAL_ERROR');
  return { code: 'INTERNAL_ERROR', ...definition };
}

function isTerminusHealthResponse(value: unknown): value is {
  status: 'error' | 'shutting_down';
  details: Record<string, unknown>;
  error?: Record<string, unknown>;
  info?: Record<string, unknown>;
} {
  return (
    typeof value === 'object' &&
    value !== null &&
    'status' in value &&
    (value.status === 'error' || value.status === 'shutting_down') &&
    'details' in value &&
    typeof value.details === 'object' &&
    value.details !== null
  );
}

function createErrorResponse(
  details: { code: string; statusCode: number; message: string },
  request: ErrorRequest,
  response: Response,
  requestIdHeader: string,
): ErrorResponse {
  return ErrorResponseSchema.parse({
    statusCode: details.statusCode,
    code: details.code,
    message: details.message,
    timestamp: new Date().toISOString(),
    path: getRequestPath(request),
    requestId: resolveRequestId(request, response, requestIdHeader),
  });
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(
    private readonly logger: PinoLogger,
    @Inject(loggerConfig.KEY)
    private readonly loggingConfig: ConfigType<typeof loggerConfig>,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<ErrorRequest>();
    const response = http.getResponse<Response>();

    if (exception instanceof HttpException && exception.getStatus() === 503) {
      const terminusResponse = exception.getResponse();

      if (isTerminusHealthResponse(terminusResponse)) {
        response.status(503).json(terminusResponse);
        return;
      }
    }

    const details = getExceptionDetails(exception);
    const body = createErrorResponse(
      details,
      request,
      response,
      this.loggingConfig.REQUEST_ID_HEADER,
    );

    if (body.statusCode >= 500) {
      this.logger.error(
        {
          requestId: body.requestId,
          method: request.method,
          path: body.path,
          statusCode: body.statusCode,
          code: body.code,
        },
        'Unhandled HTTP exception',
      );
    }

    response.status(body.statusCode).json(body);
  }
}
