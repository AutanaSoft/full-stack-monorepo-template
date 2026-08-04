import { Test, TestingModule } from '@nestjs/testing';
import type { ConfigType } from '@nestjs/config';
import type { DatabaseConnection } from '@autanasoft/database';
import { createDatabaseConnection } from '@autanasoft/database';
import { AppModule } from '../app.module';
import databaseConfig from '../config/database.config';
import { DATABASE_CONNECTION, DATABASE_PING } from './database.tokens';
import {
  databaseConnectionProvider,
  databasePingProvider,
  DatabaseProvider,
} from './database.provider';

jest.mock('@autanasoft/database', () => ({
  createDatabaseConnection: jest.fn(),
}));

const testDatabaseUrl = 'postgresql://user:password@localhost:5432/test';
const originalEnvironment = { ...process.env };

function restoreEnvironment(): void {
  for (const key of Object.keys(process.env)) {
    delete process.env[key];
  }

  Object.assign(process.env, originalEnvironment);
}

function createMockDatabaseConnection(events: string[] = []): DatabaseConnection {
  return {
    client: {} as DatabaseConnection['client'],
    connect: jest.fn(() => {
      events.push('connect');
      return Promise.resolve();
    }),
    close: jest.fn(() => {
      events.push('close');
      return Promise.resolve();
    }),
  };
}

describe('DatabaseProvider', () => {
  beforeEach(() => {
    process.env.DATABASE_URL = testDatabaseUrl;
  });

  afterEach(() => {
    restoreEnvironment();
    jest.clearAllMocks();
  });

  it('can be imported without opening a database connection', () => {
    expect(() => {
      jest.requireActual('./database.module');
    }).not.toThrow();
  });

  it('connects and closes through the Nest lifecycle in order', async () => {
    const events: string[] = [];
    const connection = createMockDatabaseConnection(events);
    const provider = new DatabaseProvider(connection);

    expect((connection.connect as jest.Mock).mock.calls).toHaveLength(0);
    expect((connection.close as jest.Mock).mock.calls).toHaveLength(0);

    await provider.onModuleInit();
    await provider.onModuleDestroy();

    expect(events).toEqual(['connect', 'close']);
    expect((connection.connect as jest.Mock).mock.calls).toHaveLength(1);
    expect((connection.close as jest.Mock).mock.calls).toHaveLength(1);
  });

  it('replaces the runtime connection with a test double', async () => {
    const connection = createMockDatabaseConnection();
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(DATABASE_CONNECTION)
      .useValue(connection)
      .compile();

    try {
      expect(moduleRef.get<DatabaseConnection>(DATABASE_CONNECTION)).toBe(connection);
    } finally {
      await moduleRef.close();
    }
  });

  it('injects the validated database namespace into the connection factory', () => {
    const connection = createMockDatabaseConnection();
    jest.mocked(createDatabaseConnection).mockReturnValue(connection);

    const config: ConfigType<typeof databaseConfig> = { DATABASE_URL: testDatabaseUrl };
    const result = databaseConnectionProvider.useFactory(config);

    expect(databaseConnectionProvider.inject).toEqual([databaseConfig.KEY]);
    expect(result).toBe(connection);
    expect(createDatabaseConnection).toHaveBeenCalledWith(testDatabaseUrl);
  });

  it('keeps the database ping operation behind its boundary', async () => {
    const queryRaw = jest.fn().mockResolvedValue([{ '?column?': 1 }]);
    const connection = {
      ...createMockDatabaseConnection(),
      client: { $queryRaw: queryRaw } as unknown as DatabaseConnection['client'],
    };

    const ping = databasePingProvider.useFactory(connection);

    expect(databasePingProvider.provide).toBe(DATABASE_PING);
    await ping.ping();
    expect(queryRaw).toHaveBeenCalledTimes(1);
  });
});
