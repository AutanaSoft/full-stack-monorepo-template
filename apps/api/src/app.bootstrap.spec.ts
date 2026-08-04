import type { INestApplication } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import type { TestingModule } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import type { DatabaseConnection } from '@autanasoft/database';
import { applicationOptions, configureApplication } from './app.bootstrap';
import { AppModule } from './app.module';
import appConfig from './config/app.config';
import { DATABASE_CONNECTION } from './database/database.tokens';

function createMockDatabaseConnection(): DatabaseConnection {
  return {
    client: {} as DatabaseConnection['client'],
    connect: jest.fn().mockResolvedValue(undefined),
    close: jest.fn().mockResolvedValue(undefined),
  };
}

describe('configureApplication', () => {
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
      imports: [AppModule],
    })
      .overrideProvider(DATABASE_CONNECTION)
      .useValue(createMockDatabaseConnection())
      .overrideProvider(appConfig.KEY)
      .useValue({
        NODE_ENV: 'test',
        PORT: 4001,
        API_PREFIX: 'internal',
        API_VERSION: 2,
        TRUST_PROXY: false,
      } satisfies ConfigType<typeof appConfig>)
      .compile();

    app = configureApplication(
      moduleFixture.createNestApplication<INestApplication<App>>(applicationOptions),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
    restoreEnvironment();
  });

  it('serves routes under the configured prefix and URI version', async () => {
    await request(app.getHttpServer()).get('/internal/v2').expect(200).expect('Hello World!');
    await request(app.getHttpServer()).get('/').expect(404);
  });
});
