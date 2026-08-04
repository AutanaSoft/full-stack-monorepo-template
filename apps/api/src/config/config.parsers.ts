import { z } from 'zod';
import {
  defaultLogFilesEnabled,
  defaultLogLevel,
  defaultSwaggerEnabled,
  DEFAULT_CORS_ALLOWED_HEADERS,
  DEFAULT_CORS_EXPOSED_HEADERS,
  DEFAULT_CORS_METHODS,
  DEFAULT_CORS_ORIGINS,
} from './config.defaults';

export type EnvironmentInput = Readonly<Record<string, unknown>>;

const HTTP_METHODS = DEFAULT_CORS_METHODS;
const HTTP_TOKEN_PATTERN = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/;
const SAFE_ROUTE_SEGMENT_PATTERN = /^[A-Za-z0-9](?:[A-Za-z0-9._~-]*[A-Za-z0-9_-])?$/;
const SAFE_FILE_NAME_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

export function isEnvironmentInput(value: unknown): value is EnvironmentInput {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function selectEnvironment(
  input: EnvironmentInput,
  keys: readonly string[],
): Record<string, unknown> {
  return Object.fromEntries(keys.map((key) => [key, input[key]]));
}

export function withDynamicConfigurationDefaults(input: EnvironmentInput): EnvironmentInput {
  return {
    ...input,
    SWAGGER_ENABLED:
      input.SWAGGER_ENABLED === undefined
        ? defaultSwaggerEnabled(input.NODE_ENV)
        : input.SWAGGER_ENABLED,
    LOG_LEVEL: input.LOG_LEVEL === undefined ? defaultLogLevel(input.NODE_ENV) : input.LOG_LEVEL,
    LOG_FILES_ENABLED:
      input.LOG_FILES_ENABLED === undefined
        ? defaultLogFilesEnabled(input.NODE_ENV)
        : input.LOG_FILES_ENABLED,
  };
}

export function prepareEnvironmentInput(input: EnvironmentInput): EnvironmentInput;
export function prepareEnvironmentInput(input: unknown): unknown;
export function prepareEnvironmentInput(input: unknown): unknown {
  return isEnvironmentInput(input) ? withDynamicConfigurationDefaults(input) : input;
}

export function parseBoolean(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value;
  }

  const normalized = value.trim().toLowerCase();

  if (normalized === 'true') {
    return true;
  }

  if (normalized === 'false') {
    return false;
  }

  return value;
}

export function booleanFromEnvironment(defaultValue: boolean): z.ZodType<boolean> {
  return z.preprocess(parseBoolean, z.boolean().default(defaultValue));
}

export function parseNumber(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value;
  }

  const normalized = value.trim();
  return normalized === '' ? undefined : Number(normalized);
}

export function integerFromEnvironment(
  defaultValue: number,
  minimum: number,
  maximum?: number,
): z.ZodType<number> {
  let schema = z.number().int().min(minimum);

  if (maximum !== undefined) {
    schema = schema.max(maximum);
  }

  return z.preprocess(parseNumber, schema.default(defaultValue));
}

export function parseStringList(value: unknown): unknown {
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }

  if (Array.isArray(value)) {
    const items: unknown[] = value;

    return items
      .map((item) => (typeof item === 'string' ? item.trim() : item))
      .filter((item) => item !== '');
  }

  return value;
}

export const routeSegmentSchema = z
  .string({ error: 'must be a non-empty safe route segment' })
  .trim()
  .min(1, { error: 'must be a non-empty safe route segment' })
  .max(64, { error: 'must be at most 64 characters' })
  .regex(SAFE_ROUTE_SEGMENT_PATTERN, {
    error: 'must contain only safe route segment characters',
  });

export const headerNameSchema = z
  .string({ error: 'must be a valid HTTP header name' })
  .trim()
  .min(1, { error: 'must be a valid HTTP header name' })
  .max(128, { error: 'must be at most 128 characters' })
  .regex(HTTP_TOKEN_PATTERN, { error: 'must be a valid HTTP header name' })
  .transform((value) => value.toLowerCase());

export const fileNameSchema = z
  .string({ error: 'must be a safe file name' })
  .trim()
  .min(1, { error: 'must be a safe file name' })
  .max(255, { error: 'must be at most 255 characters' })
  .regex(SAFE_FILE_NAME_PATTERN, { error: 'must be a safe file name' })
  .refine((value) => value !== '.' && value !== '..', {
    error: 'must be a safe file name',
  });

export const directoryPathSchema = z
  .string({ error: 'must be a safe directory path' })
  .trim()
  .min(1, { error: 'must be a safe directory path' })
  .max(4096, { error: 'must be at most 4096 characters' })
  .refine(
    (value) => {
      if (
        [...value].some((character) => {
          const code = character.charCodeAt(0);
          return code < 32 || code === 127;
        })
      ) {
        return false;
      }

      return value.split(/[\\/]+/).every((segment) => segment !== '..');
    },
    { error: 'must not contain parent-directory traversal' },
  );

export const httpMethodSchema = z
  .string({ error: 'must be a supported HTTP method' })
  .trim()
  .transform((value) => value.toUpperCase())
  .pipe(z.enum(HTTP_METHODS, { error: 'must be a supported HTTP method' }));

export const corsOriginSchema = z.union([
  z.literal('*'),
  z
    .url({ error: 'must be a valid HTTP origin or *' })
    .refine(
      (value) => {
        const url = new URL(value);

        return (
          (url.protocol === 'http:' || url.protocol === 'https:') &&
          url.pathname === '/' &&
          url.search === '' &&
          url.hash === '' &&
          url.username === '' &&
          url.password === ''
        );
      },
      { error: 'must be a valid HTTP origin or *' },
    )
    .transform((value) => (value.endsWith('/') ? value.slice(0, -1) : value)),
]);

export const defaultCorsOrigins = [...DEFAULT_CORS_ORIGINS];
export const defaultCorsMethods = [...DEFAULT_CORS_METHODS];
export const defaultCorsAllowedHeaders = [...DEFAULT_CORS_ALLOWED_HEADERS];
export const defaultCorsExposedHeaders = [...DEFAULT_CORS_EXPOSED_HEADERS];

export function parseTrustProxy(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value;
  }

  const normalized = value.trim().toLowerCase();

  if (normalized === 'true') {
    return true;
  }

  if (normalized === 'false') {
    return false;
  }

  if (/^\d+$/.test(normalized)) {
    return Number(normalized);
  }

  return value;
}
