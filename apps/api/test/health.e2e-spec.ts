import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { TestingModule } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import type { DatabaseConnection } from '@autanasoft/database';
import { applicationOptions, configureApplication } from '../src/app.bootstrap';
import { AppModule } from '../src/app.module';
import { DATABASE_CONNECTION, DATABASE_PING } from '../src/database/database.tokens';
import type { DatabasePing } from '../src/database/database.tokens';

function createMockDatabaseConnection(): DatabaseConnection {
  return {
    client: {} as DatabaseConnection['client'],
    connect: jest.fn().mockResolvedValue(undefined),
    close: jest.fn().mockResolvedValue(undefined),
  };
}

async function createHealthApplication(ping: DatabasePing): Promise<INestApplication<App>> {
  process.env.DATABASE_URL = 'postgresql://user:password@localhost:5432/test';
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(DATABASE_CONNECTION)
    .useValue(createMockDatabaseConnection())
    // The database adapter is the only substituted external boundary in these HTTP tests.
    .overrideProvider(DATABASE_PING)
    .useValue(ping)
    .compile();

  const app = configureApplication(
    moduleFixture.createNestApplication<INestApplication<App>>(applicationOptions)
  );
  await app.init();
  return app;
}

describe('Health HTTP endpoints (e2e)', () => {
  const originalEnvironment = { ...process.env };
  let app: INestApplication<App> | undefined;

  afterEach(async () => {
    await app?.close();
    app = undefined;

    for (const key of Object.keys(process.env)) {
      delete process.env[key];
    }

    Object.assign(process.env, originalEnvironment);
  });

  it('serves liveness without invoking the database boundary', async () => {
    const ping = jest.fn().mockRejectedValue(new Error('database unavailable'));
    app = await createHealthApplication({ ping });

    const response = await request(app.getHttpServer()).get('/api/v1/health/live').expect(200);

    expect(response.body).toEqual({
      status: 'ok',
      info: { liveness: { status: 'up' } },
      error: {},
      details: { liveness: { status: 'up' } },
    });
    expect(ping).not.toHaveBeenCalled();
  });

  it('reports readiness with the real HTTP pipeline and controlled database boundary', async () => {
    const ping = jest.fn().mockResolvedValue(undefined);
    app = await createHealthApplication({ ping });

    const response = await request(app.getHttpServer()).get('/api/v1/health/ready').expect(200);

    expect(response.body).toEqual({
      status: 'ok',
      info: {
        application: { status: 'up' },
        database: { status: 'up' },
      },
      error: {},
      details: {
        application: { status: 'up' },
        database: { status: 'up' },
      },
    });
    expect(ping).toHaveBeenCalledTimes(1);
  });

  it('fails readiness quickly and preserves the Terminus 503 response when the database is down', async () => {
    const ping = jest.fn().mockRejectedValue(new Error('connection refused'));
    app = await createHealthApplication({ ping });
    const startedAt = Date.now();

    const response = await request(app.getHttpServer()).get('/api/v1/health/ready').expect(503);

    expect(Date.now() - startedAt).toBeLessThan(1000);
    expect(response.body).toEqual({
      status: 'error',
      info: { application: { status: 'up' } },
      error: { database: { status: 'down', message: 'Database unavailable' } },
      details: {
        application: { status: 'up' },
        database: { status: 'down', message: 'Database unavailable' },
      },
    });
    expect(JSON.stringify(response.body)).not.toContain('connection refused');
  });
});
