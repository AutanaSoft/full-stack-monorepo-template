import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorResponseSchema } from '@autanasoft/contracts';
import type { PinoLogger } from 'nestjs-pino';
import loggerConfig from '../../config/logger.config';
import { ApplicationError } from './application-error';
import { HttpExceptionFilter } from './http-exception.filter';

const settings = {
  LOG_LEVEL: 'silent',
  LOG_FILES_ENABLED: false,
  LOG_DIRECTORY: 'logs',
  LOG_WARN_FILE: 'warnings.log',
  LOG_ERROR_FILE: 'errors.log',
  REQUEST_ID_HEADER: 'x-request-id',
} satisfies ReturnType<typeof loggerConfig>;

interface MockResponse {
  getHeader: jest.MockedFunction<() => string | undefined>;
  setHeader: jest.MockedFunction<(name: string, value: string) => void>;
  status: jest.MockedFunction<(statusCode: number) => MockResponse>;
  json: jest.MockedFunction<(body: unknown) => void>;
}

function createHost(requestId = 'unit-error-request') {
  const response: MockResponse = {
    getHeader: jest.fn<string | undefined, []>().mockReturnValue(requestId),
    setHeader: jest.fn<void, [string, string]>(),
    status: jest.fn<MockResponse, [number]>().mockReturnThis(),
    json: jest.fn<void, [unknown]>(),
  };
  const request = {
    id: requestId,
    method: 'GET',
    originalUrl: '/api/v1/users?secret=hidden',
    url: '/',
  };
  const host = {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => response,
    }),
  };

  return {
    filter: new HttpExceptionFilter({ error: jest.fn() } as unknown as PinoLogger, settings),
    host,
    response,
  };
}

describe('HttpExceptionFilter', () => {
  it.each([
    [new HttpException('bad request', HttpStatus.BAD_REQUEST), 400, 'VALIDATION_FAILED'],
    [new HttpException('missing', HttpStatus.NOT_FOUND), 404, 'RESOURCE_NOT_FOUND'],
    [
      new ApplicationError('RESOURCE_NOT_FOUND', 'internal missing detail'),
      404,
      'RESOURCE_NOT_FOUND',
    ],
  ])('normalizes expected exception to the public contract', (exception, statusCode, code) => {
    const { filter, host, response } = createHost();

    filter.catch(exception, host as never);

    const body: unknown = response.json.mock.calls[0]?.[0];
    const parsed = ErrorResponseSchema.safeParse(body);

    expect(parsed.success).toBe(true);
    expect(body).toEqual(
      expect.objectContaining({
        statusCode,
        code,
        path: '/api/v1/users',
        requestId: 'unit-error-request',
      }),
    );
    expect(JSON.stringify(body)).not.toContain('secret');
  });

  it('uses a generic public response and logs diagnostics for unknown failures', () => {
    const loggerError = jest.fn<void, [unknown, string]>();
    const logger = { error: loggerError } as unknown as PinoLogger;
    const { host, response } = createHost('unit-error-500');
    const filter = new HttpExceptionFilter(logger, settings);

    const error = new Error('SQL password=secret', {
      cause: new Error('/internal/path/cause'),
    });

    filter.catch(error, host as never);

    const body: unknown = response.json.mock.calls[0]?.[0];

    expect(body).toEqual(
      expect.objectContaining({
        statusCode: 500,
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred.',
      }),
    );
    expect(JSON.stringify(body)).not.toContain('SQL');
    expect(loggerError).toHaveBeenCalledWith(
      {
        requestId: 'unit-error-500',
        method: 'GET',
        path: '/api/v1/users',
        statusCode: 500,
        code: 'INTERNAL_ERROR',
      },
      'Unhandled HTTP exception',
    );

    const loggerPayload: unknown = loggerError.mock.calls[0]?.[0];
    expect(JSON.stringify(loggerPayload)).not.toMatch(
      /SQL|secret|internal\/path|cause|stack|message/i,
    );
    expect(loggerPayload).not.toHaveProperty('err');
    expect(loggerPayload).not.toHaveProperty('message');
    expect(loggerPayload).not.toHaveProperty('cause');
  });
});
