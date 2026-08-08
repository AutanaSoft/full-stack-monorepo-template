import type { INestApplication } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import type { TestingModule } from '@nestjs/testing';
import request from 'supertest';
import type { Response as SupertestResponse } from 'supertest';
import type { App } from 'supertest/types';
import { getStorageToken } from '@nestjs/throttler';
import type { ThrottlerStorageService } from '@nestjs/throttler';
import type { DatabaseConnection } from '@autanasoft/database';
import { ErrorResponseSchema, RequestIdSchema } from '@autanasoft/contracts';
import appConfig from './../src/config/app.config';
import corsConfig from './../src/config/cors.config';
import rateLimitConfig from './../src/config/rate-limit.config';
import swaggerConfig from './../src/config/swagger.config';
import { applicationOptions, configureApplication } from './../src/app.bootstrap';
import { AppModule } from './../src/app.module';
import { DATABASE_CONNECTION } from './../src/database/database.tokens';
import { RateLimitFixtureModule } from './fixtures/rate-limit.fixture';
import { ErrorsFixtureModule } from './fixtures/errors.fixture';
import { ZodHttpFixtureModule } from './fixtures/zod-http.fixture';

const allowedOrigin = 'https://allowed.example.com';
const blockedOrigin = 'https://blocked.example.com';
const corsSettings = {
  CORS_ENABLED: true,
  CORS_ORIGINS: [allowedOrigin],
  CORS_METHODS: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  CORS_ALLOWED_HEADERS: ['content-type', 'authorization', 'x-request-id'],
  CORS_EXPOSED_HEADERS: ['x-request-id'],
  CORS_CREDENTIALS: true,
  CORS_MAX_AGE_SECONDS: 600,
} satisfies ConfigType<typeof corsConfig>;

function createMockDatabaseConnection(): DatabaseConnection {
  return {
    client: {} as DatabaseConnection['client'],
    connect: jest.fn().mockResolvedValue(undefined),
    close: jest.fn().mockResolvedValue(undefined),
  };
}

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  const originalEnvironment = { ...process.env };

  function restoreEnvironment(): void {
    for (const key of Object.keys(process.env)) {
      delete process.env[key];
    }

    Object.assign(process.env, originalEnvironment);
  }

  beforeEach(async () => {
    process.env.DATABASE_URL = 'postgresql://user:password@localhost:5432/test';
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule, ErrorsFixtureModule, ZodHttpFixtureModule],
    })
      .overrideProvider(DATABASE_CONNECTION)
      .useValue(createMockDatabaseConnection())
      .overrideProvider(corsConfig.KEY)
      .useValue(corsSettings)
      .compile();

    app = configureApplication(
      moduleFixture.createNestApplication<INestApplication<App>>(applicationOptions)
    );
    await app.init();
  });

  it('/api/v1 (GET)', async () => {
    const response = await request(app.getHttpServer()).get('/api/v1').expect(200);

    expect(response.text).toBe('Hello World!');
    expect(response.headers['access-control-allow-origin']).toBeUndefined();
    await request(app.getHttpServer()).get('/').expect(404);
  });

  it('applies Helmet security headers with the default CSP', async () => {
    const response = await request(app.getHttpServer()).get('/api/v1').expect(200);

    expect(response.headers['content-security-policy']).toContain("default-src 'self'");
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-frame-options']).toBe('SAMEORIGIN');
    expect(response.headers['referrer-policy']).toBe('no-referrer');
  });

  it('does not expose Swagger routes when disabled by configuration', async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(DATABASE_CONNECTION)
      .useValue(createMockDatabaseConnection())
      .overrideProvider(swaggerConfig.KEY)
      .useValue({ SWAGGER_ENABLED: false, SWAGGER_PATH: 'disabled-docs' })
      .compile();
    const disabledApp = configureApplication(
      moduleFixture.createNestApplication<INestApplication<App>>(applicationOptions)
    );

    await disabledApp.init();
    try {
      await request(disabledApp.getHttpServer()).get('/api/disabled-docs').expect(404);
      await request(disabledApp.getHttpServer()).get('/api/disabled-docs-json').expect(404);
      await request(disabledApp.getHttpServer()).get('/api/v1').expect(200);
    } finally {
      await disabledApp.close();
    }
  });

  it('allows configured CORS preflight with methods, headers, max age, and credentials', async () => {
    const response = await request(app.getHttpServer())
      .options('/api/v1')
      .set('Origin', allowedOrigin)
      .set('Access-Control-Request-Method', 'GET')
      .set('Access-Control-Request-Headers', 'authorization, x-request-id')
      .expect(204);

    expect(response.headers['access-control-allow-origin']).toBe(allowedOrigin);
    expect(response.headers['access-control-allow-methods']).toBe(
      'GET,HEAD,POST,PUT,PATCH,DELETE,OPTIONS'
    );
    expect(response.headers['access-control-allow-headers']).toBe(
      'content-type,authorization,x-request-id'
    );
    expect(response.headers['access-control-max-age']).toBe('600');
    expect(response.headers['access-control-allow-credentials']).toBe('true');
  });

  it('does not authorize a rejected CORS origin', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1')
      .set('Origin', blockedOrigin)
      .expect(200);

    expect(response.headers['access-control-allow-origin']).toBeUndefined();
    expect(response.headers['access-control-allow-credentials']).toBeUndefined();
    expect(response.headers['access-control-expose-headers']).toBeUndefined();
  });

  it('exposes the request ID to an allowed browser origin', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1')
      .set('Origin', allowedOrigin)
      .set('x-request-id', 'e2e-cors-request');

    expect(response.status).toBe(200);
    expect(response.headers['access-control-allow-origin']).toBe(allowedOrigin);
    expect(response.headers['access-control-allow-credentials']).toBe('true');
    expect(response.headers['access-control-expose-headers']).toBe('x-request-id');
    expect(response.headers['x-request-id']).toBe('e2e-cors-request');
  });

  it('preserves a valid request ID and returns it in the configured header', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1')
      .set('x-request-id', 'e2e-request-123');

    expect(response.status).toBe(200);
    expect(response.headers['x-request-id']).toBe('e2e-request-123');
  });

  it('replaces an invalid request ID with a contract-compliant UUID', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1')
      .set('x-request-id', 'bad id');

    expect(response.status).toBe(200);
    expect(RequestIdSchema.safeParse(response.headers['x-request-id']).success).toBe(true);
    expect(response.headers['x-request-id']).not.toBe('bad id');
  });

  it('normalizes validation, not-found, and unknown failures without leaking details', async () => {
    const invalidResponse = await request(app.getHttpServer())
      .post('/api/v1/zod-fixture')
      .set('x-request-id', 'errors-validation-request')
      .send({ email: 'invalid', userName: 'x', password: 'short' })
      .expect(400);
    const notFoundResponse = await request(app.getHttpServer())
      .get('/api/v1/does-not-exist?secret=hidden')
      .set('x-request-id', 'errors-not-found-request')
      .expect(404);
    const knownResponse = await request(app.getHttpServer())
      .get('/api/v1/errors-fixture/known?secret=hidden')
      .set('x-request-id', 'errors-known-request')
      .expect(404);
    const unknownResponse = await request(app.getHttpServer())
      .get('/api/v1/errors-fixture/unknown?secret=hidden')
      .set('x-request-id', 'errors-unknown-request')
      .expect(500);

    function parseErrorResponse(response: SupertestResponse) {
      const parsed = ErrorResponseSchema.safeParse(response.body);

      expect(parsed.success).toBe(true);
      if (!parsed.success) {
        throw new Error('Expected a contract-compliant error response.');
      }

      expect(parsed.data.timestamp).toEqual(expect.any(String));
      expect(parsed.data.path).not.toContain('?');
      expect(RequestIdSchema.safeParse(parsed.data.requestId).success).toBe(true);
      expect(response.headers['x-request-id']).toBe(parsed.data.requestId);
      return parsed.data;
    }

    const invalidBody = parseErrorResponse(invalidResponse);
    const notFoundBody = parseErrorResponse(notFoundResponse);
    const knownBody = parseErrorResponse(knownResponse);
    const unknownBody = parseErrorResponse(unknownResponse);

    expect(invalidBody).toEqual(
      expect.objectContaining({ statusCode: 400, code: 'VALIDATION_FAILED' })
    );
    expect(notFoundBody).toEqual(
      expect.objectContaining({ statusCode: 404, code: 'RESOURCE_NOT_FOUND' })
    );
    expect(knownBody).toEqual(
      expect.objectContaining({ statusCode: 404, code: 'RESOURCE_NOT_FOUND' })
    );
    expect(unknownBody).toEqual(
      expect.objectContaining({
        statusCode: 500,
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred.',
      })
    );
    expect(JSON.stringify(unknownBody)).not.toMatch(/SQL|secret|internal\/path|stack/i);
  });

  afterEach(async () => {
    await app.close();
    restoreEnvironment();
  });
});

describe('Rate limiting (e2e)', () => {
  let app: INestApplication<App> | undefined;
  const originalEnvironment = { ...process.env };

  function restoreEnvironment(): void {
    for (const key of Object.keys(process.env)) {
      delete process.env[key];
    }

    Object.assign(process.env, originalEnvironment);
  }

  function createRateLimitSettings(
    enabled: boolean,
    max: number
  ): ConfigType<typeof rateLimitConfig> {
    return {
      RATE_LIMIT_ENABLED: enabled,
      RATE_LIMIT_TTL_MS: 60_000,
      RATE_LIMIT_MAX: max,
      RATE_LIMIT_TRACKER: 'ip',
    };
  }

  function createAppSettings(
    trustProxy: ConfigType<typeof appConfig>['TRUST_PROXY']
  ): ConfigType<typeof appConfig> {
    return {
      NODE_ENV: 'test',
      PORT: 0,
      API_PREFIX: 'api',
      API_VERSION: 1,
      TRUST_PROXY: trustProxy,
    };
  }

  async function createRateLimitApplication(
    settings: ConfigType<typeof rateLimitConfig>,
    trustProxy: ConfigType<typeof appConfig>['TRUST_PROXY'] = false
  ): Promise<INestApplication<App>> {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule, RateLimitFixtureModule],
    })
      .overrideProvider(DATABASE_CONNECTION)
      .useValue(createMockDatabaseConnection())
      .overrideProvider(rateLimitConfig.KEY)
      .useValue(settings)
      .overrideProvider(appConfig.KEY)
      .useValue(createAppSettings(trustProxy))
      .compile();

    const testApp = configureApplication(
      moduleFixture.createNestApplication<INestApplication<App>>(applicationOptions)
    );
    await testApp.init();
    return testApp;
  }

  function fixturePath(route: string): string {
    return `/api/v1/rate-limit-fixture/${route}`;
  }

  beforeEach(() => {
    process.env.DATABASE_URL = 'postgresql://user:password@localhost:5432/test';
  });

  afterEach(async () => {
    if (app !== undefined) {
      await app.close();
      app = undefined;
    }

    restoreEnvironment();
  });

  it('enforces the configured global maximum', async () => {
    app = await createRateLimitApplication(createRateLimitSettings(true, 2));

    await request(app.getHttpServer()).get(fixturePath('global')).expect(200);
    await request(app.getHttpServer()).get(fixturePath('global')).expect(200);
    await request(app.getHttpServer()).get(fixturePath('global')).expect(429);
  });

  it('disables enforcement when RATE_LIMIT_ENABLED is false', async () => {
    app = await createRateLimitApplication(createRateLimitSettings(false, 1));

    await request(app.getHttpServer()).get(fixturePath('global')).expect(200);
    await request(app.getHttpServer()).get(fixturePath('global')).expect(200);
    await request(app.getHttpServer()).get(fixturePath('global')).expect(200);
  });

  it('applies the strict semantic policy without changing the controller', async () => {
    app = await createRateLimitApplication(createRateLimitSettings(true, 100));

    for (let index = 0; index < 10; index += 1) {
      await request(app.getHttpServer()).get(fixturePath('strict')).expect(200);
    }

    await request(app.getHttpServer()).get(fixturePath('strict')).expect(429);
  });

  it('applies the expanded semantic policy over the global policy', async () => {
    app = await createRateLimitApplication(createRateLimitSettings(true, 1));

    await request(app.getHttpServer()).get(fixturePath('expanded')).expect(200);
    await request(app.getHttpServer()).get(fixturePath('expanded')).expect(200);
    await request(app.getHttpServer()).get(fixturePath('expanded')).expect(200);
  });

  it('bypasses the global policy through the explicit semantic decorator', async () => {
    app = await createRateLimitApplication(createRateLimitSettings(true, 1));

    await request(app.getHttpServer()).get(fixturePath('bypass')).expect(200);
    await request(app.getHttpServer()).get(fixturePath('bypass')).expect(200);
    await request(app.getHttpServer()).get(fixturePath('bypass')).expect(200);
  });

  it('returns the public 429 contract with effective request ID and rate headers', async () => {
    app = await createRateLimitApplication(createRateLimitSettings(true, 1));
    const requestId = 'rate-limit-contract-request';

    await request(app.getHttpServer())
      .get(fixturePath('global'))
      .set('x-request-id', requestId)
      .expect(200);

    const response = await request(app.getHttpServer())
      .get(fixturePath('global'))
      .set('x-request-id', requestId)
      .expect(429);
    const parsed = ErrorResponseSchema.safeParse(response.body);

    expect(parsed.success).toBe(true);
    if (!parsed.success) {
      throw new Error('Expected a contract-compliant throttling response.');
    }

    const { timestamp, ...stableResponse } = parsed.data;

    expect(stableResponse).toEqual({
      statusCode: 429,
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests. Please try again later.',
      path: fixturePath('global'),
      requestId,
    });
    expect(Number.isNaN(Date.parse(timestamp))).toBe(false);
    expect(response.headers['x-request-id']).toBe(requestId);
    expect(response.headers['retry-after']).toMatch(/^\d+$/);
    expect(response.headers['x-ratelimit-limit']).toBe('1');
    expect(response.headers['x-ratelimit-remaining']).toBe('0');
    expect(response.headers['x-ratelimit-reset']).toMatch(/^\d+$/);
    expect(Object.keys(parsed.data).sort()).toEqual([
      'code',
      'message',
      'path',
      'requestId',
      'statusCode',
      'timestamp',
    ]);
    expect(JSON.stringify(parsed.data)).not.toContain('ThrottlerException');
    expect(JSON.stringify(parsed.data)).not.toContain('127.0.0.1');
  });

  it('does not let X-Forwarded-For choose trackers when proxy trust is disabled', async () => {
    app = await createRateLimitApplication(createRateLimitSettings(true, 1), false);

    await request(app.getHttpServer())
      .get(fixturePath('global'))
      .set('x-forwarded-for', '203.0.113.10')
      .expect(200);
    await request(app.getHttpServer())
      .get(fixturePath('global'))
      .set('x-forwarded-for', '198.51.100.10')
      .expect(429);
  });

  it('follows Express req.ip when proxy trust is explicitly enabled', async () => {
    app = await createRateLimitApplication(createRateLimitSettings(true, 1), true);

    await request(app.getHttpServer())
      .get(fixturePath('global'))
      .set('x-forwarded-for', '203.0.113.10')
      .expect(200);
    await request(app.getHttpServer())
      .get(fixturePath('global'))
      .set('x-forwarded-for', '198.51.100.10')
      .expect(200);
  });

  it('closes the real throttler storage during application shutdown', async () => {
    app = await createRateLimitApplication(createRateLimitSettings(true, 1));
    const storage = app.get<ThrottlerStorageService>(getStorageToken());
    const shutdown = jest.spyOn(storage, 'onApplicationShutdown');

    await app.close();
    app = undefined;

    expect(shutdown).toHaveBeenCalledTimes(1);
  });
});
