import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { TestingModule } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import type { DatabaseConnection } from '@autanasoft/database';
import { AppModule } from '../../app.module';
import swaggerConfig from '../../config/swagger.config';
import { DATABASE_CONNECTION } from '../../database/database.tokens';
import { ZodHttpFixtureModule } from '../../../test/fixtures/zod-http.fixture';

function createMockDatabaseConnection(): DatabaseConnection {
  return {
    client: {} as DatabaseConnection['client'],
    connect: jest.fn().mockResolvedValue(undefined),
    close: jest.fn().mockResolvedValue(undefined),
  };
}

describe('global Zod HTTP integration', () => {
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
      imports: [AppModule, ZodHttpFixtureModule],
    })
      .overrideProvider(DATABASE_CONNECTION)
      .useValue(createMockDatabaseConnection())
      .overrideProvider(swaggerConfig.KEY)
      .useValue({ SWAGGER_ENABLED: false, SWAGGER_PATH: 'docs' })
      .compile();

    app = moduleFixture.createNestApplication<INestApplication<App>>();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
    restoreEnvironment();
  });

  it('rejects invalid payloads and accepts valid canonical DTO input', async () => {
    await request(app.getHttpServer())
      .post('/zod-fixture')
      .send({ email: 'not-an-email', userName: 'ab', password: 'short' })
      .expect(400);

    await request(app.getHttpServer())
      .post('/zod-fixture')
      .send({ email: 'user@example.com', userName: 'valid_user', password: 'long-enough-password' })
      .expect(201);
  });

  it('serializes declared responses and leaves routes without response metadata untouched', async () => {
    const response = await request(app.getHttpServer())
      .post('/zod-fixture')
      .send({ email: 'user@example.com', userName: 'valid_user', password: 'long-enough-password' })
      .expect(201);

    expect(response.body).toEqual({
      id: '123e4567-e89b-42d3-a456-426614174000',
      email: 'user@example.com',
      userName: 'valid_user',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });
    expect(response.body).not.toHaveProperty('password');
    expect(response.body).not.toHaveProperty('passwordHash');

    await request(app.getHttpServer())
      .get('/zod-fixture/raw')
      .expect(200)
      .expect({ internal: 'untouched', value: 'raw-response' });
  });
});
