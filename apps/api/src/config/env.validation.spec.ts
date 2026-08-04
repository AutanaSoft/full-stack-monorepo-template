import { EnvValidationSchema, validate } from './env.validation';

const validDatabaseUrl = 'postgresql://user:password@localhost:5432/test';

function validEnvironment(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    DATABASE_URL: validDatabaseUrl,
    ...overrides,
  };
}

describe('API environment validation', () => {
  it('composes defaults and preserves unknown environment keys', () => {
    const result = validate(
      validEnvironment({
        NODE_ENV: 'test',
        CUSTOM_ENV: 'preserved',
      }),
    );

    expect(result).toMatchObject({
      NODE_ENV: 'test',
      PORT: 4001,
      API_PREFIX: 'api',
      API_VERSION: 1,
      TRUST_PROXY: false,
      SWAGGER_ENABLED: true,
      LOG_LEVEL: 'silent',
      LOG_FILES_ENABLED: false,
    });
    expect(result.CUSTOM_ENV).toBe('preserved');
  });

  it('uses production-safe defaults and accepts explicit production origins', () => {
    const result = validate(
      validEnvironment({
        NODE_ENV: 'production',
        CORS_ORIGINS: 'https://example.com',
      }),
    );

    expect(result).toMatchObject({
      NODE_ENV: 'production',
      CORS_ORIGINS: ['https://example.com'],
      SWAGGER_ENABLED: false,
      LOG_LEVEL: 'info',
      LOG_FILES_ENABLED: true,
    });
  });

  it('allows explicit Swagger activation in production', () => {
    expect(
      validate(
        validEnvironment({
          NODE_ENV: 'production',
          CORS_ORIGINS: 'https://example.com',
          SWAGGER_ENABLED: 'true',
        }),
      ).SWAGGER_ENABLED,
    ).toBe(true);
  });

  it.each([
    { NODE_ENV: 'production' },
    { NODE_ENV: 'production', CORS_ORIGINS: '*' },
    { CORS_CREDENTIALS: 'true', CORS_ORIGINS: '*' },
    { API_PREFIX: 'api', SWAGGER_PATH: 'api' },
    { LOG_WARN_FILE: 'same.log', LOG_ERROR_FILE: 'same.log' },
  ])('rejects unsafe cross-field environment settings: %p', (overrides) => {
    expect(() => validate(validEnvironment(overrides))).toThrow(
      /Invalid environment configuration/,
    );
  });

  it('parses explicit false rather than applying JavaScript truthiness', () => {
    expect(validate(validEnvironment({ CORS_ENABLED: 'false' })).CORS_ENABLED).toBe(false);
  });

  it.each([
    { CORS_ENABLED: 'yes' },
    { CORS_METHODS: 'GET,INVALID' },
    { CORS_ALLOWED_HEADERS: 'Content-Type,bad header' },
    { REQUEST_ID_HEADER: 'bad header' },
    { LOG_WARN_FILE: '../warnings.log' },
    { LOG_LEVEL: 'verbose' },
    { RATE_LIMIT_TRACKER: 'forwarded' },
    { HEALTH_DISK_THRESHOLD_PERCENT: '-1' },
    { ARGON2_TIME_COST: '0' },
  ])('rejects malformed declared values: %p', (overrides) => {
    expect(() => validate(validEnvironment(overrides))).toThrow(
      /Invalid environment configuration/,
    );
  });

  it('rejects missing and empty DATABASE_URL values', () => {
    expect(() => validate({})).toThrow(/DATABASE_URL/);
    expect(() => validate(validEnvironment({ DATABASE_URL: '   ' }))).toThrow(/DATABASE_URL/);
  });

  it('does not expose a database URL or credentials in validation errors', () => {
    const secretUrl = 'mysql://user:super-secret@localhost:3306/test';

    try {
      validate({ DATABASE_URL: secretUrl });
      throw new Error('expected validation to fail');
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toContain('DATABASE_URL');
      expect((error as Error).message).not.toContain(secretUrl);
      expect((error as Error).message).not.toContain('super-secret');
    }
  });

  it('keeps the composed schema available for direct safe parsing', () => {
    expect(EnvValidationSchema.safeParse(validEnvironment()).success).toBe(true);
  });
});
