import { ConfigType } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import type { DatabaseConnection } from '@autanasoft/database';
import { AppModule } from './app.module';
import appConfig from './config/app.config';
import { DATABASE_CONNECTION } from './database/database.tokens';

const testDatabaseUrl = 'postgresql://user:password@localhost:5432/test';
const originalEnvironment = { ...process.env };

function restoreEnvironment(): void {
  for (const key of Object.keys(process.env)) {
    delete process.env[key];
  }

  Object.assign(process.env, originalEnvironment);
}

function createMockDatabaseConnection(): DatabaseConnection {
  return {
    client: {} as DatabaseConnection['client'],
    connect: jest.fn().mockResolvedValue(undefined),
    close: jest.fn().mockResolvedValue(undefined),
  };
}

describe('AppModule', () => {
  let moduleRef: TestingModule;

  beforeEach(async () => {
    process.env.DATABASE_URL = testDatabaseUrl;
    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(DATABASE_CONNECTION)
      .useValue(createMockDatabaseConnection())
      .compile();
  });

  afterEach(async () => {
    await moduleRef.close();
    restoreEnvironment();
  });

  it('exposes the appConfig namespace and EventEmitter2', () => {
    const config = moduleRef.get<ConfigType<typeof appConfig>>(appConfig.KEY);

    expect(config.PORT).toBe(4001);
    expect(moduleRef.get(EventEmitter2)).toBeInstanceOf(EventEmitter2);
  });
});
