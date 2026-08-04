import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/client';
import pg from 'pg';

/** The generated Prisma client exposed through the compiled database boundary. */
export type DatabaseClient = PrismaClient;

/** A lifecycle-aware database connection that can be replaced by an API test double. */
export interface DatabaseConnection {
  readonly client: DatabaseClient;
  connect(): Promise<void>;
  close(): Promise<void>;
}

/** Creates a disconnected PostgreSQL-backed Prisma connection for the API lifecycle. */
export function createDatabaseConnection(databaseUrl: string): DatabaseConnection {
  if (databaseUrl.trim() === '') {
    throw new Error('@autanasoft/database requires a non-empty database URL.');
  }

  const pool = new pg.Pool({ connectionString: databaseUrl });
  const adapter = new PrismaPg(pool);
  const client = new PrismaClient({ adapter });

  return {
    client,
    async connect(): Promise<void> {
      await client.$connect();
    },
    async close(): Promise<void> {
      try {
        await client.$disconnect();
      } finally {
        await pool.end();
      }
    },
  };
}
