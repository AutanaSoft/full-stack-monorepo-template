import type { IncomingMessage, ServerResponse } from 'node:http';
import { closeSync, existsSync, mkdirSync, openSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { ConfigType } from '@nestjs/config';
import type { LoggerOptions } from 'pino';
import type { Params } from 'nestjs-pino';
import appConfig from '../../config/app.config';
import loggerConfig from '../../config/logger.config';
import { resolveRequestId } from './request-id';

export const WARN_LOG_LEVEL = 40;
export const ERROR_LOG_LEVEL = 50;

const SENSITIVE_FIELDS = [
  'accessToken',
  'apiKey',
  'api_key',
  'authorization',
  'clientSecret',
  'cookie',
  'password',
  'passwordHash',
  'recoveryCode',
  'recoveryCodes',
  'refreshToken',
  'secret',
  'token',
] as const;

const SENSITIVE_OBJECT_ROOTS = [
  'body',
  'params',
  'query',
  'req.body',
  'req.params',
  'req.query',
  'request.body',
  'request.params',
  'request.query',
] as const;

const nestedSensitivePaths = SENSITIVE_OBJECT_ROOTS.flatMap((root) =>
  SENSITIVE_FIELDS.flatMap((field) =>
    [0, 1, 2, 3].map(
      (depth) => `${root}${depth === 0 ? '' : `.${'*.'.repeat(depth).slice(0, -1)}`}.${field}`
    )
  )
);

export const REDACTION_PATHS = [
  'req.headers.authorization',
  'req.headers.cookie',
  "req.headers['set-cookie']",
  "req.headers['x-api-key']",
  "req.headers['x-api-secret']",
  "req.headers['api-key']",
  'req.body.password',
  'req.body.passwordHash',
  'req.body.accessToken',
  'req.body.refreshToken',
  'req.body.recoveryCode',
  'req.query.password',
  'req.query.accessToken',
  'req.query.refreshToken',
  'req.query.recoveryCode',
  'req.params.password',
  'req.params.accessToken',
  'req.params.refreshToken',
  'req.params.recoveryCode',
  ...SENSITIVE_FIELDS.flatMap((field) => [field, `*.${field}`, `*.*.${field}`, `*.*.*.${field}`]),
  ...nestedSensitivePaths,
] satisfies readonly string[];

export interface LogDestinationPaths {
  directory: string;
  warnings: string;
  errors: string;
}

export type ApiAppConfig = ConfigType<typeof appConfig>;
export type ApiLoggerConfig = ConfigType<typeof loggerConfig>;

export interface PinoHttpOptions {
  enabled: boolean;
  level: ApiLoggerConfig['LOG_LEVEL'];
  base: Record<string, string | number>;
  redact: { paths: string[]; censor: string };
  serializers: {
    req: (request: IncomingMessage) => Record<string, unknown>;
    res: (response: ServerResponse) => Record<string, unknown>;
  };
  wrapSerializers: boolean;
  genReqId: (request: IncomingMessage, response: ServerResponse) => string;
  customProps: (request: IncomingMessage) => Record<string, unknown>;
  customSuccessObject: (
    request: IncomingMessage,
    response: ServerResponse,
    value: unknown
  ) => Record<string, unknown>;
  customErrorObject: (
    request: IncomingMessage,
    response: ServerResponse,
    error: Error,
    value: unknown
  ) => Record<string, unknown>;
  customLogLevel: typeof selectHttpLogLevel;
  quietReqLogger: boolean;
  quietResLogger: boolean;
  transport?: LoggerOptions['transport'];
}

export function isProxyTrustEnabled(value: ApiAppConfig['TRUST_PROXY']): boolean {
  return value === true || (typeof value === 'number' && value > 0);
}

export function normalizeRequestPath(url: string | undefined): string {
  const target = url ?? '/';
  const queryStart = target.indexOf('?');
  const path = queryStart === -1 ? target : target.slice(0, queryStart);

  return path === '' ? '/' : path;
}

function getRequestId(request: IncomingMessage): string | undefined {
  return typeof request.id === 'string' ? request.id : undefined;
}

function getClientIp(request: IncomingMessage): string | undefined {
  const candidate = (request as IncomingMessage & { ip?: unknown }).ip;
  return typeof candidate === 'string' ? candidate : undefined;
}

export function createRequestSerializer(includeClientIp: boolean) {
  return (request: IncomingMessage): Record<string, unknown> => {
    const serialized: Record<string, unknown> = {
      method: request.method,
      path: normalizeRequestPath(request.url),
      requestId: getRequestId(request),
    };

    if (includeClientIp) {
      const clientIp = getClientIp(request);

      if (clientIp !== undefined) {
        serialized.clientIp = clientIp;
      }
    }

    return serialized;
  };
}

export function serializeResponse(response: ServerResponse): Record<string, unknown> {
  return { statusCode: response.statusCode };
}

function getResponseTime(value: unknown): number | undefined {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return undefined;
  }

  const responseTime = (value as Record<string, unknown>).responseTime;
  return typeof responseTime === 'number' ? responseTime : undefined;
}

export function createHttpLogObject(
  request: IncomingMessage,
  response: ServerResponse,
  value: unknown,
  includeClientIp: boolean,
  error?: Error
): Record<string, unknown> {
  const logObject: Record<string, unknown> = {
    method: request.method,
    path: normalizeRequestPath(request.url),
    statusCode: response.statusCode,
    requestId: getRequestId(request),
  };
  const durationMs = getResponseTime(value);

  if (durationMs !== undefined) {
    logObject.durationMs = durationMs;
  }

  if (includeClientIp) {
    const clientIp = getClientIp(request);

    if (clientIp !== undefined) {
      logObject.clientIp = clientIp;
    }
  }

  if (error !== undefined) {
    logObject.err = error;
  }

  return logObject;
}

export function selectHttpLogLevel(
  _request: IncomingMessage,
  response: ServerResponse,
  error?: Error
): 'error' | 'warn' | 'info' {
  if (error !== undefined || response.statusCode >= 500) {
    return 'error';
  }

  if (response.statusCode >= 400) {
    return 'warn';
  }

  return 'info';
}

export function resolveLogDestinationPaths(config: ApiLoggerConfig): LogDestinationPaths {
  const directory = resolve(config.LOG_DIRECTORY);

  return {
    directory,
    warnings: join(directory, config.LOG_WARN_FILE),
    errors: join(directory, config.LOG_ERROR_FILE),
  };
}

function prepareLogFile(filePath: string): void {
  const descriptor = openSync(filePath, 'a');
  closeSync(descriptor);
}

/** Creates and probes every configured destination before the logger worker starts. */
export function prepareLogDestinations(config: ApiLoggerConfig): LogDestinationPaths {
  const paths = resolveLogDestinationPaths(config);

  try {
    mkdirSync(paths.directory, { recursive: true });

    if (!statSync(paths.directory).isDirectory()) {
      throw new Error('log destination is not a directory');
    }

    prepareLogFile(paths.warnings);
    prepareLogFile(paths.errors);
  } catch {
    throw new Error(
      'Unable to prepare logging destinations. Check LOG_DIRECTORY and log file permissions.'
    );
  }

  return paths;
}

function fileTransportTarget(): string {
  const colocatedTarget = join(__dirname, 'file-transport.js');

  return existsSync(colocatedTarget)
    ? colocatedTarget
    : resolve(process.cwd(), 'dist/common/logging/file-transport.js');
}

export function createLoggerTransport(
  logger: ApiLoggerConfig,
  app: ApiAppConfig
): LoggerOptions['transport'] {
  const targets: Array<{
    target: string;
    level: 'trace' | 'warn' | 'error';
    options?: Record<string, boolean | number | string>;
  }> = [];

  if (app.NODE_ENV !== 'test') {
    targets.push({
      target: 'pino-pretty',
      level: 'trace',
      options: {
        colorize: app.NODE_ENV === 'development',
        singleLine: true,
        translateTime: 'SYS:standard',
      },
    });
  }

  if (logger.LOG_FILES_ENABLED) {
    const paths = prepareLogDestinations(logger);

    targets.push(
      {
        target: fileTransportTarget(),
        level: 'warn',
        options: { destination: paths.warnings, level: WARN_LOG_LEVEL },
      },
      {
        target: fileTransportTarget(),
        level: 'error',
        options: { destination: paths.errors, level: ERROR_LOG_LEVEL },
      }
    );
  }

  if (targets.length === 0) {
    return undefined;
  }

  return {
    targets,
    worker: { autoEnd: true },
  };
}

export function createPinoHttpOptions(logger: ApiLoggerConfig, app: ApiAppConfig): PinoHttpOptions {
  const includeClientIp = isProxyTrustEnabled(app.TRUST_PROXY);

  return {
    enabled: app.NODE_ENV !== 'test' || logger.LOG_FILES_ENABLED,
    level: logger.LOG_LEVEL,
    base: {
      service: 'api',
      environment: app.NODE_ENV,
      apiVersion: app.API_VERSION,
    },
    redact: {
      paths: [...REDACTION_PATHS],
      censor: '[Redacted]',
    },
    serializers: {
      req: createRequestSerializer(includeClientIp),
      res: serializeResponse,
    },
    wrapSerializers: false,
    genReqId: (request: IncomingMessage, response: ServerResponse): string => {
      const requestId = resolveRequestId(request.headers, logger.REQUEST_ID_HEADER);
      response.setHeader(logger.REQUEST_ID_HEADER, requestId);
      return requestId;
    },
    customProps: (request: IncomingMessage): Record<string, unknown> => ({
      requestId: getRequestId(request),
    }),
    customSuccessObject: (
      request: IncomingMessage,
      response: ServerResponse,
      value: unknown
    ): Record<string, unknown> => createHttpLogObject(request, response, value, includeClientIp),
    customErrorObject: (
      request: IncomingMessage,
      response: ServerResponse,
      error: Error,
      value: unknown
    ): Record<string, unknown> =>
      createHttpLogObject(request, response, value, includeClientIp, error),
    customLogLevel: selectHttpLogLevel,
    quietReqLogger: true,
    quietResLogger: true,
    transport: createLoggerTransport(logger, app),
  };
}

export function createLoggerParams(logger: ApiLoggerConfig, app: ApiAppConfig): Params {
  return { pinoHttp: createPinoHttpOptions(logger, app) };
}
