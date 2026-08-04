import { registerAs } from '@nestjs/config';
import { z } from 'zod';

import {
  DEFAULT_LOG_DIRECTORY,
  DEFAULT_LOG_ERROR_FILE,
  DEFAULT_LOG_FILES_ENABLED,
  DEFAULT_LOG_LEVEL,
  DEFAULT_LOG_WARN_FILE,
  DEFAULT_REQUEST_ID_HEADER,
} from './config.defaults';
import {
  booleanFromEnvironment,
  directoryPathSchema,
  fileNameSchema,
  headerNameSchema,
  prepareEnvironmentInput,
  selectEnvironment,
} from './config.parsers';
import type { EnvironmentInput } from './config.parsers';

const loggerEnvironmentKeys = [
  'LOG_LEVEL',
  'LOG_FILES_ENABLED',
  'LOG_DIRECTORY',
  'LOG_WARN_FILE',
  'LOG_ERROR_FILE',
  'REQUEST_ID_HEADER',
] as const;

const logLevelSchema = z
  .string({ error: 'must be trace, debug, info, warn, error, fatal, or silent' })
  .trim()
  .toLowerCase()
  .pipe(
    z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal', 'silent'], {
      error: 'must be trace, debug, info, warn, error, fatal, or silent',
    }),
  )
  .default(DEFAULT_LOG_LEVEL);

export const LoggerConfigSchema = z.strictObject({
  LOG_LEVEL: logLevelSchema,
  LOG_FILES_ENABLED: booleanFromEnvironment(DEFAULT_LOG_FILES_ENABLED),
  LOG_DIRECTORY: directoryPathSchema.default(DEFAULT_LOG_DIRECTORY),
  LOG_WARN_FILE: fileNameSchema.default(DEFAULT_LOG_WARN_FILE),
  LOG_ERROR_FILE: fileNameSchema.default(DEFAULT_LOG_ERROR_FILE),
  REQUEST_ID_HEADER: headerNameSchema.default(DEFAULT_REQUEST_ID_HEADER),
});

export type LoggerConfig = z.infer<typeof LoggerConfigSchema>;

export const loggerConfigFactory = (env: EnvironmentInput = process.env): LoggerConfig =>
  LoggerConfigSchema.parse(selectEnvironment(prepareEnvironmentInput(env), loggerEnvironmentKeys));

export default registerAs<LoggerConfig>('loggerConfig', loggerConfigFactory);
