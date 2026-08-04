import { LoggerConfigSchema, loggerConfigFactory } from './logger.config';

describe('API logger configuration', () => {
  it('uses the test-safe logger defaults for test environment', () => {
    expect(loggerConfigFactory({ NODE_ENV: 'test' })).toEqual({
      LOG_LEVEL: 'silent',
      LOG_FILES_ENABLED: false,
      LOG_DIRECTORY: 'logs',
      LOG_WARN_FILE: 'warnings.log',
      LOG_ERROR_FILE: 'errors.log',
      REQUEST_ID_HEADER: 'x-request-id',
    });
  });

  it('selects environment defaults and normalizes explicit values', () => {
    expect(
      loggerConfigFactory({
        NODE_ENV: 'development',
        LOG_LEVEL: ' WARN ',
        LOG_FILES_ENABLED: 'false',
        LOG_DIRECTORY: 'var/log/api',
        LOG_WARN_FILE: 'warning.jsonl',
        LOG_ERROR_FILE: 'error.jsonl',
        REQUEST_ID_HEADER: ' X-Trace-Id ',
      }),
    ).toEqual({
      LOG_LEVEL: 'warn',
      LOG_FILES_ENABLED: false,
      LOG_DIRECTORY: 'var/log/api',
      LOG_WARN_FILE: 'warning.jsonl',
      LOG_ERROR_FILE: 'error.jsonl',
      REQUEST_ID_HEADER: 'x-trace-id',
    });
  });

  it.each([
    { LOG_LEVEL: 'verbose' },
    { LOG_DIRECTORY: '../logs' },
    { LOG_WARN_FILE: '../warnings.log' },
    { LOG_ERROR_FILE: 'errors/log' },
    { REQUEST_ID_HEADER: 'bad header' },
  ])('rejects unsafe logger input: %p', (input) => {
    expect(() => LoggerConfigSchema.parse(input)).toThrow();
  });
});
