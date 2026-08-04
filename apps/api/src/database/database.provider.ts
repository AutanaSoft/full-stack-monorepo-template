import { Inject, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { createDatabaseConnection } from '@autanasoft/database';
import type { DatabaseConnection } from '@autanasoft/database';
import databaseConfig from '../config/database.config';
import { DATABASE_CONNECTION, DATABASE_PING } from './database.tokens';

/** Factory provider that keeps construction separate from connection establishment. */
export const databaseConnectionProvider = {
  provide: DATABASE_CONNECTION,
  inject: [databaseConfig.KEY],
  useFactory: (config: ConfigType<typeof databaseConfig>): DatabaseConnection =>
    createDatabaseConnection(config.DATABASE_URL),
};

/** Keeps the health probe's database operation inside the database boundary. */
export const databasePingProvider = {
  provide: DATABASE_PING,
  inject: [DATABASE_CONNECTION],
  useFactory: (connection: DatabaseConnection) => ({
    async ping(): Promise<void> {
      await connection.client.$queryRaw`SELECT 1`;
    },
  }),
};

/** Coordinates database connection and cleanup with the Nest application lifecycle. */
@Injectable()
export class DatabaseProvider implements OnModuleInit, OnModuleDestroy {
  constructor(@Inject(DATABASE_CONNECTION) private readonly connection: DatabaseConnection) {}

  async onModuleInit(): Promise<void> {
    await this.connection.connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.connection.close();
  }
}
