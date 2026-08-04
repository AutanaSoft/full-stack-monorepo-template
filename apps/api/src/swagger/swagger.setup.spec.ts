import type { INestApplication } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import type { TestingModule } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import type { DatabaseConnection } from '@autanasoft/database';
import appConfig from '../config/app.config';
import swaggerConfig from '../config/swagger.config';
import { AppModule } from '../app.module';
import { configureApplication } from '../app.bootstrap';
import { DATABASE_CONNECTION } from '../database/database.tokens';
import { SWAGGER_DESCRIPTION, SWAGGER_TITLE, SWAGGER_VERSION } from './swagger.setup';
import { ZodHttpFixtureModule } from '../../test/fixtures/zod-http.fixture';

function createMockDatabaseConnection(): DatabaseConnection {
  return {
    client: {} as DatabaseConnection['client'],
    connect: jest.fn().mockResolvedValue(undefined),
    close: jest.fn().mockResolvedValue(undefined),
  };
}

describe('Swagger setup', () => {
  let app: INestApplication<App>;
  const originalEnvironment = { ...process.env };

  function restoreEnvironment(): void {
    for (const key of Object.keys(process.env)) {
      delete process.env[key];
    }

    Object.assign(process.env, originalEnvironment);
  }

  async function createApplication(settings: ConfigType<typeof swaggerConfig>): Promise<void> {
    process.env.DATABASE_URL = 'postgresql://user:password@localhost:5432/test';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule, ZodHttpFixtureModule],
    })
      .overrideProvider(DATABASE_CONNECTION)
      .useValue(createMockDatabaseConnection())
      .overrideProvider(swaggerConfig.KEY)
      .useValue(settings)
      .compile();

    app = configureApplication(moduleFixture.createNestApplication<INestApplication<App>>());
    await app.init();
  }

  afterEach(async () => {
    await app.close();
    restoreEnvironment();
  });

  it('serves cleaned JSON at the configured path under the global prefix', async () => {
    await createApplication({ SWAGGER_ENABLED: true, SWAGGER_PATH: 'openapi' });

    const appSettings = app.get<ConfigType<typeof appConfig>>(appConfig.KEY);
    const docsSettings = app.get<ConfigType<typeof swaggerConfig>>(swaggerConfig.KEY);
    const swaggerUiPath = `/${appSettings.API_PREFIX}/${docsSettings.SWAGGER_PATH}`;
    const jsonPath = `${swaggerUiPath}-json`;
    const versionedFixturePath = `/${appSettings.API_PREFIX}/v${appSettings.API_VERSION}/zod-fixture`;

    const documentResponse = await request(app.getHttpServer()).get(jsonPath).expect(200);
    const serializedDocument = JSON.stringify(documentResponse.body);
    const document = JSON.parse(serializedDocument) as {
      components: { schemas: Record<string, unknown> };
      info: { description: string; title: string; version: string };
      openapi: string;
      paths: Record<string, unknown>;
    };

    expect(document).toEqual(documentResponse.body);
    expect(document).toMatchObject({
      info: {
        title: SWAGGER_TITLE,
        version: SWAGGER_VERSION,
        description: SWAGGER_DESCRIPTION,
      },
    });
    expect(document.openapi).toMatch(/^3\./);
    expect(document.paths[versionedFixturePath]).toBeDefined();
    expect(Object.keys(document.components.schemas)).toEqual(
      expect.arrayContaining(['CreateUserFixtureDto', 'UserResponseFixtureDto_Output']),
    );
    expect(serializedDocument).not.toContain('selfRequired');

    await request(app.getHttpServer()).get(swaggerUiPath).expect(200);
    await request(app.getHttpServer()).get(`/${appSettings.API_PREFIX}/v1`).expect(200);
  });

  it('does not register Swagger routes when disabled by configuration', async () => {
    await createApplication({ SWAGGER_ENABLED: false, SWAGGER_PATH: 'hidden-docs' });

    const appSettings = app.get<ConfigType<typeof appConfig>>(appConfig.KEY);
    const docsSettings = app.get<ConfigType<typeof swaggerConfig>>(swaggerConfig.KEY);
    const swaggerUiPath = `/${appSettings.API_PREFIX}/${docsSettings.SWAGGER_PATH}`;

    await request(app.getHttpServer()).get(swaggerUiPath).expect(404);
    await request(app.getHttpServer()).get(`${swaggerUiPath}-json`).expect(404);
    await request(app.getHttpServer()).get(`/${appSettings.API_PREFIX}/v1`).expect(200);
  });
});
