import { Module } from '@nestjs/common';
import {
  DatabaseProvider,
  databaseConnectionProvider,
  databasePingProvider,
} from './database.provider';
import { DATABASE_CONNECTION, DATABASE_PING } from './database.tokens';

@Module({
  providers: [databaseConnectionProvider, databasePingProvider, DatabaseProvider],
  exports: [DATABASE_CONNECTION, DATABASE_PING],
})
export class DatabaseModule {}
