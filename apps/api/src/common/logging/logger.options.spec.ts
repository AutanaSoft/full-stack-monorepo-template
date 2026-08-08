import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { PassThrough } from 'node:stream';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';
import pino from 'pino';
import type { ApiAppConfig, ApiLoggerConfig } from './logger.options';
import {
  createHttpLogObject,
  createLoggerTransport,
  createPinoHttpOptions,
  createRequestSerializer,
  normalizeRequestPath,
  prepareLogDestinations,
  REDACTION_PATHS,
} from './logger.options';

function makeLoggerConfig(overrides: Partial<ApiLoggerConfig> = {}): ApiLoggerConfig {
  return {
    LOG_LEVEL: 'info',
    LOG_FILES_ENABLED: false,
    LOG_DIRECTORY: 'logs',
    LOG_WARN_FILE: 'warnings.log',
    LOG_ERROR_FILE: 'errors.log',
    REQUEST_ID_HEADER: 'x-request-id',
    ...overrides,
  };
}

function makeAppConfig(overrides: Partial<ApiAppConfig> = {}): ApiAppConfig {
  return {
    NODE_ENV: 'test',
    PORT: 4001,
    API_PREFIX: 'api',
    API_VERSION: 1,
    TRUST_PROXY: false,
    ...overrides,
  };
}

describe('Pino HTTP logger options', () => {
  it('normalizes paths and omits query, body, and headers from the request serializer', () => {
    const request = {
      method: 'GET',
      url: '/api/v1?password=fake-query-secret',
      id: 'request-123',
      headers: { authorization: 'fake-authorization' },
      body: { password: 'fake-body-secret' },
      query: { password: 'fake-query-secret' },
      params: { password: 'fake-param-secret' },
    } as unknown as IncomingMessage;

    expect(normalizeRequestPath(request.url)).toBe('/api/v1');
    expect(createRequestSerializer(false)(request)).toEqual({
      method: 'GET',
      path: '/api/v1',
      requestId: 'request-123',
    });
  });

  it('adds duration, status, request ID, and proxy-trusted client IP to HTTP records', () => {
    const request = {
      method: 'GET',
      url: '/api/v1?token=fake-query-secret',
      id: 'request-123',
      ip: '203.0.113.10',
    } as unknown as IncomingMessage;
    const response = { statusCode: 200 } as ServerResponse;

    expect(createHttpLogObject(request, response, { responseTime: 12 }, true)).toEqual({
      method: 'GET',
      path: '/api/v1',
      statusCode: 200,
      requestId: 'request-123',
      durationMs: 12,
      clientIp: '203.0.113.10',
    });
  });

  it('redacts nested sensitive values while preserving the centralized policy', () => {
    const options = createPinoHttpOptions(makeLoggerConfig(), makeAppConfig());
    const output = new PassThrough();
    const chunks: string[] = [];
    const fakeSecret = 'fake-secret-sentinel';

    output.on('data', (chunk: Buffer) => chunks.push(chunk.toString('utf8')));

    const logger = pino(
      {
        level: 'info',
        redact: options.redact,
      },
      output
    );

    logger.info(
      {
        req: {
          headers: {
            authorization: fakeSecret,
            cookie: fakeSecret,
            'x-api-key': fakeSecret,
          },
          body: {
            user: {
              password: fakeSecret,
              passwordHash: fakeSecret,
            },
          },
          query: { filters: { accessToken: fakeSecret } },
          params: { recovery: { recoveryCode: fakeSecret } },
        },
      },
      'redaction test'
    );

    const serialized = chunks.join('');
    const record = JSON.parse(serialized) as {
      req?: { headers?: { authorization?: unknown } };
    };

    expect(serialized).not.toContain(fakeSecret);
    expect(record.req?.headers?.authorization).toBe('[Redacted]');
    expect(REDACTION_PATHS).toContain('req.headers.authorization');
  });

  it.each(['development', 'production'] as const)(
    'uses pino-pretty for %s console output',
    (environment) => {
      const transport = createLoggerTransport(
        makeLoggerConfig(),
        makeAppConfig({ NODE_ENV: environment })
      );

      expect(transport).toMatchObject({
        targets: [{ target: 'pino-pretty', level: 'trace' }],
        worker: { autoEnd: true },
      });
    }
  );

  it('creates configured file destinations only when file logging is enabled', () => {
    const root = mkdtempSync(join(tmpdir(), 'monorepo-logger-options-'));
    const directory = join(root, 'logs');

    try {
      const transport = createLoggerTransport(
        makeLoggerConfig({ LOG_DIRECTORY: directory }),
        makeAppConfig()
      );

      expect(transport).toBeUndefined();
      expect(existsSync(directory)).toBe(false);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('prepares files and exposes an actionable secret-safe error on failure', () => {
    const root = mkdtempSync(join(tmpdir(), 'monorepo-logger-failure-'));
    const blocked = join(root, 'blocked');
    const fakeSecret = 'fake-secret-path-segment';

    try {
      writeFileSync(blocked, 'not-a-directory', 'utf8');

      expect(() =>
        prepareLogDestinations(
          makeLoggerConfig({ LOG_DIRECTORY: join(blocked, fakeSecret), LOG_FILES_ENABLED: true })
        )
      ).toThrow('Unable to prepare logging destinations');

      let failure: unknown;

      try {
        prepareLogDestinations(
          makeLoggerConfig({ LOG_DIRECTORY: join(blocked, fakeSecret), LOG_FILES_ENABLED: true })
        );
      } catch (error: unknown) {
        failure = error;
      }

      expect(failure).toBeInstanceOf(Error);
      expect((failure as Error).message).not.toContain(fakeSecret);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
