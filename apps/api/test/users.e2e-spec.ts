import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import type { Response as SupertestResponse } from 'supertest';
import { PinoLogger } from 'nestjs-pino';
import { getStorageToken } from '@nestjs/throttler';
import type { ThrottlerStorageService } from '@nestjs/throttler';
import {
  ErrorResponseSchema,
  UserListResponseSchema,
  UserResponseSchema,
} from '@autanasoft/contracts';
import type { UserResponse } from '@autanasoft/contracts';
import { createRealE2EApplication, type RealE2EApplication } from './support/real-e2e-application';

type UserPayload = {
  email: string;
  userName: string;
  password: string;
};

interface UsersE2EContext {
  readonly credentials: UserPayload;
  readonly userId: string;
  readonly creation: UserResponse;
  cleanup(): Promise<void>;
}

const VALID_USER_PAYLOAD = Object.freeze({
  email: 'e2e-user@example.test',
  userName: 'E2E User',
  password: 'correct-horse-battery-staple',
});

function createValidUserPayload(suffix: string): UserPayload {
  return {
    ...VALID_USER_PAYLOAD,
    email: `e2e-${suffix}@example.test`,
    userName: `E2E User ${suffix}`,
  };
}

function assertPublicUser(body: unknown): UserResponse {
  const parsed = UserResponseSchema.parse(body);
  expect(body).not.toHaveProperty('password');
  expect(body).not.toHaveProperty('passwordHash');
  expect(body).not.toHaveProperty('status');
  expect(body).not.toHaveProperty('role');
  expect(body).not.toHaveProperty('verifiedAt');
  return parsed;
}

function assertPublicError(body: unknown, statusCode: number, code: string): void {
  expect(ErrorResponseSchema.parse(body)).toEqual(expect.objectContaining({ statusCode, code }));
  expect(JSON.stringify(body)).not.toMatch(/password|hash|secret|P2002/i);
}

function assertNoContentResponse(response: SupertestResponse): void {
  expect(response.status).toBe(204);
  expect(response.text).toBe('');
  expect(response.body).toEqual({});
}

async function createUsersE2EContext(
  app: INestApplication<App>,
  suffix: string
): Promise<UsersE2EContext> {
  const credentials = {
    ...createValidUserPayload(suffix),
    userName: `E2E_User_${suffix}`,
  };
  const response = await request(app.getHttpServer())
    .post('/api/v1/users')
    .set('x-request-id', 'users-create-request')
    .send({ ...credentials, email: credentials.email.toUpperCase() })
    .expect(201);
  const creation = assertPublicUser(response.body);

  return {
    credentials,
    userId: creation.id,
    creation,
    cleanup(): Promise<void> {
      return request(app.getHttpServer())
        .delete(`/api/v1/users/${creation.id}`)
        .expect(204)
        .then(() => undefined);
    },
  };
}

describe('Users HTTP endpoints (e2e)', () => {
  let applicationContext: RealE2EApplication;
  let app: INestApplication<App> | undefined;
  let userContext: UsersE2EContext | undefined;

  function currentApp(): INestApplication<App> {
    if (app === undefined) {
      throw new Error('Users E2E application was not initialized.');
    }

    return app;
  }

  function resetRateLimitStorage(httpApp: INestApplication<App>): void {
    const storage = httpApp.get<ThrottlerStorageService>(getStorageToken());
    const resettableStorage = storage as unknown as {
      onApplicationShutdown(): void;
      storage: Map<unknown, unknown>;
    };

    resettableStorage.onApplicationShutdown();
    resettableStorage.storage.clear();
  }

  beforeAll(async () => {
    applicationContext = await createRealE2EApplication();
    app = applicationContext.app;
  });

  afterEach(async () => {
    let cleanupFailure: unknown;

    try {
      await userContext?.cleanup();
    } catch (error: unknown) {
      cleanupFailure = error;
    } finally {
      resetRateLimitStorage(currentApp());
      userContext = undefined;
    }

    if (cleanupFailure !== undefined) {
      expect.getState().suppressedErrors.push(new Error('Users E2E resource cleanup failed.'));
    }
  });

  afterAll(async () => {
    let cleanupFailure: unknown;
    let closeFailure: unknown;
    let closed: Awaited<ReturnType<RealE2EApplication['close']>> | undefined;

    try {
      try {
        await userContext?.cleanup();
      } catch (error: unknown) {
        cleanupFailure = error;
      }
    } finally {
      try {
        const close = jest.spyOn(applicationContext.database, 'close');
        closed = await applicationContext.close();
        expect(close).toHaveBeenCalledTimes(1);
      } catch (error: unknown) {
        closeFailure = error;
      } finally {
        app = undefined;
        userContext = undefined;
      }
    }

    if (cleanupFailure !== undefined) {
      expect.getState().suppressedErrors.push(new Error('Users E2E resource cleanup failed.'));
    }

    if (closed !== undefined) {
      expect(closed.warnings).toContain('"level":40');
      expect(closed.errors).not.toContain('password');
      expect(closed.logDirectoryRemoved).toBe(true);
    }

    if (closeFailure !== undefined) {
      throw closeFailure;
    }
  });

  it('serves health, Swagger, and the production security pipeline', async () => {
    const httpApp = currentApp();
    await request(httpApp.getHttpServer()).get('/api/v1/health/live').expect(200);
    await request(httpApp.getHttpServer()).get('/api/v1/health/ready').expect(200);

    const swagger = await request(httpApp.getHttpServer()).get('/api/docs-json').expect(200);
    const swaggerBody = swagger.body as { paths: Record<string, unknown> };
    expect(swaggerBody.paths).toHaveProperty('/api/v1/users');

    const response = await request(httpApp.getHttpServer()).get('/api/v1').expect(200);
    expect(response.headers['content-security-policy']).toContain("default-src 'self'");
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-request-id']).toEqual(expect.any(String));
  });

  it('flushes and closes logger transports without retaining sensitive query data', async () => {
    const httpApp = currentApp();
    const response = await request(httpApp.getHttpServer())
      .get('/api/v1/does-not-exist?password=not-a-secret')
      .expect(404);
    assertPublicError(response.body, 404, 'RESOURCE_NOT_FOUND');
    (await httpApp.resolve(PinoLogger)).warn(
      { requestId: 'logger-lifecycle-test' },
      'Logger lifecycle test'
    );
    await new Promise<void>((resolve) => setImmediate(resolve));
  });

  it('creates a user through PostgreSQL and exposes only the public contract', async () => {
    const usersContext = (userContext = await createUsersE2EContext(currentApp(), 'create'));
    expect(usersContext.creation.email).toBe(usersContext.credentials.email);
  });

  it('lists users and searches exact identities case-insensitively', async () => {
    const httpApp = currentApp();
    const usersContext = (userContext = await createUsersE2EContext(httpApp, 'list'));
    const list = await request(httpApp.getHttpServer())
      .get('/api/v1/users')
      .set('x-request-id', 'users-list-request')
      .expect(200);
    const parsedList = UserListResponseSchema.parse(list.body);
    expect(list.headers['x-request-id']).toBe('users-list-request');
    expect(parsedList.data).toHaveLength(1);
    expect(parsedList.data).toEqual([
      expect.objectContaining({
        id: usersContext.userId,
        email: usersContext.credentials.email,
        userName: usersContext.credentials.userName,
      }),
    ]);
    expect(parsedList.pagination).toEqual(
      expect.objectContaining({ page: 1, total: 1, totalPages: 1 })
    );
    parsedList.data.forEach((user) => {
      expect(user).not.toHaveProperty('password');
      expect(user).not.toHaveProperty('passwordHash');
      expect(user).not.toHaveProperty('role');
      expect(user).not.toHaveProperty('status');
      expect(user).not.toHaveProperty('verifiedAt');
    });

    const search = await request(httpApp.getHttpServer())
      .get(
        `/api/v1/users/search?userName=${encodeURIComponent(usersContext.credentials.userName.toLowerCase())}`
      )
      .expect(200);
    const searched = assertPublicUser(search.body);
    expect(searched.id).toBe(usersContext.userId);

    const missingSearch = await request(httpApp.getHttpServer())
      .get('/api/v1/users/search?userName=NotTheFullIdentity')
      .set('x-request-id', 'users-search-missing-request')
      .expect(404);
    assertPublicError(missingSearch.body, 404, 'USER_NOT_FOUND');
    expect(missingSearch.headers['x-request-id']).toBe('users-search-missing-request');
  });

  it('returns useful 400, 404, and 409 contracts without leaking internals', async () => {
    const httpApp = currentApp();
    const usersContext = (userContext = await createUsersE2EContext(httpApp, 'errors'));
    const invalidPayload = { ...createValidUserPayload('invalid'), email: 'not-an-email' };
    const invalid = await request(httpApp.getHttpServer())
      .post('/api/v1/users')
      .send(invalidPayload)
      .expect(400);
    assertPublicError(invalid.body, 400, 'VALIDATION_FAILED');

    const invalidId = await request(httpApp.getHttpServer())
      .get('/api/v1/users/not-a-uuid')
      .expect(400);
    assertPublicError(invalidId.body, 400, 'VALIDATION_FAILED');

    const missing = await request(httpApp.getHttpServer())
      .get('/api/v1/users/00000000-0000-4000-8000-000000000000')
      .expect(404);
    assertPublicError(missing.body, 404, 'USER_NOT_FOUND');

    const duplicate = await request(httpApp.getHttpServer())
      .post('/api/v1/users')
      .send({
        ...createValidUserPayload('duplicate'),
        email: usersContext.credentials.email,
        userName: 'E2E_User_Duplicate',
      })
      .expect(409);
    const duplicateError = ErrorResponseSchema.parse(duplicate.body);
    expect(duplicateError).toEqual(expect.objectContaining({ statusCode: 409 }));
    expect(['USER_EMAIL_CONFLICT', 'USERNAME_CONFLICT']).toContain(duplicateError.code);
    expect(JSON.stringify(duplicate.body)).not.toMatch(/password|hash|secret|P2002/i);

    const emptyUpdate = await request(httpApp.getHttpServer())
      .patch(`/api/v1/users/${usersContext.userId}`)
      .send({})
      .expect(400);
    assertPublicError(emptyUpdate.body, 400, 'VALIDATION_FAILED');
  });

  it('updates the user while hashing only a supplied password', async () => {
    const httpApp = currentApp();
    const usersContext = (userContext = await createUsersE2EContext(httpApp, 'update'));
    const response = await request(httpApp.getHttpServer())
      .patch(`/api/v1/users/${usersContext.userId}`)
      .send({ userName: 'E2E_User_Updated', password: 'new-correct-password' })
      .expect(200);

    const updated = assertPublicUser(response.body);
    expect(updated.userName).toBe('E2E_User_Updated');
  });

  it('soft-deletes the user and excludes it from all public reads', async () => {
    const httpApp = currentApp();
    const usersContext = (userContext = await createUsersE2EContext(httpApp, 'delete'));
    const firstDelete = await request(httpApp.getHttpServer())
      .delete(`/api/v1/users/${usersContext.userId}`)
      .expect(204);
    assertNoContentResponse(firstDelete);

    const deletedGet = await request(httpApp.getHttpServer())
      .get(`/api/v1/users/${usersContext.userId}`)
      .expect(404);
    assertPublicError(deletedGet.body, 404, 'USER_NOT_FOUND');

    const deletedSearch = await request(httpApp.getHttpServer())
      .get(`/api/v1/users/search?email=${encodeURIComponent(usersContext.credentials.email)}`)
      .expect(404);
    assertPublicError(deletedSearch.body, 404, 'USER_NOT_FOUND');

    const repeatedDelete = await request(httpApp.getHttpServer())
      .delete(`/api/v1/users/${usersContext.userId}`)
      .expect(204);
    assertNoContentResponse(repeatedDelete);
  });

  it('rejects invalid request IDs and enforces the strict search budget', async () => {
    const httpApp = currentApp();
    const invalidRequestId = await request(httpApp.getHttpServer())
      .get('/api/v1/users')
      .set('x-request-id', 'bad request id')
      .expect(200);
    expect(invalidRequestId.headers['x-request-id']).not.toBe('bad request id');

    for (let index = 0; index < 10; index += 1) {
      await request(httpApp.getHttpServer())
        .get(`/api/v1/users/search?email=missing-${index}@example.test`)
        .expect(404);
    }

    const limited = await request(httpApp.getHttpServer())
      .get('/api/v1/users/search?email=missing-final@example.test')
      .expect(429);
    assertPublicError(limited.body, 429, 'RATE_LIMIT_EXCEEDED');
  });
});
