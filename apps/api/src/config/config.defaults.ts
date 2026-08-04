export const DEFAULT_NODE_ENV = 'development' as const;
export const DEFAULT_PORT = 4001;
export const DEFAULT_API_PREFIX = 'api';
export const DEFAULT_API_VERSION = 1;
export const DEFAULT_TRUST_PROXY = false;

export const DEFAULT_CORS_ENABLED = true;
export const DEFAULT_CORS_ORIGINS: readonly string[] = [];
export const DEFAULT_CORS_METHODS = [
  'GET',
  'HEAD',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
  'OPTIONS',
] as const;
export const DEFAULT_CORS_ALLOWED_HEADERS = [
  'content-type',
  'authorization',
  'x-request-id',
] as const;
export const DEFAULT_CORS_EXPOSED_HEADERS = ['x-request-id'] as const;
export const DEFAULT_CORS_CREDENTIALS = false;
export const DEFAULT_CORS_MAX_AGE_SECONDS = 600;

export const DEFAULT_SWAGGER_ENABLED = true;
export const DEFAULT_SWAGGER_PATH = 'docs';

export const DEFAULT_HELMET_ENABLED = true;

export const DEFAULT_LOG_LEVEL = 'info' as const;
export const DEFAULT_LOG_FILES_ENABLED = false;
export const DEFAULT_LOG_DIRECTORY = 'logs';
export const DEFAULT_LOG_WARN_FILE = 'warnings.log';
export const DEFAULT_LOG_ERROR_FILE = 'errors.log';
export const DEFAULT_REQUEST_ID_HEADER = 'x-request-id';

export const DEFAULT_RATE_LIMIT_ENABLED = true;
export const DEFAULT_RATE_LIMIT_TTL_MS = 60_000;
export const DEFAULT_RATE_LIMIT_MAX = 100;
export const DEFAULT_RATE_LIMIT_TRACKER = 'ip' as const;

export const DEFAULT_HEALTH_ENABLED = true;
export const DEFAULT_HEALTH_DISK_PATH = '.';
export const DEFAULT_HEALTH_DISK_THRESHOLD_PERCENT = 90;

export const DEFAULT_ARGON2_MEMORY_COST = 65_536;
export const DEFAULT_ARGON2_TIME_COST = 3;
export const DEFAULT_ARGON2_PARALLELISM = 1;

export function defaultSwaggerEnabled(nodeEnv: unknown): boolean {
  return nodeEnv !== 'production';
}

export function defaultLogLevel(nodeEnv: unknown): string {
  if (nodeEnv === 'test') {
    return 'silent';
  }

  if (nodeEnv === 'production') {
    return 'info';
  }

  return 'debug';
}

export function defaultLogFilesEnabled(nodeEnv: unknown): boolean {
  return nodeEnv !== 'test';
}
