import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { createDatabaseConnection } from '../src/database-connection';

const connectionSource = readFileSync(
  resolve(__dirname, '..', 'src', 'database-connection.ts'),
  'utf8',
);

describe('database connection boundary', () => {
  it('requires a non-empty URL supplied by the caller', () => {
    expect(() => createDatabaseConnection('')).toThrow(
      '@autanasoft/database requires a non-empty database URL.',
    );
  });

  it('does not read DATABASE_URL from process.env', () => {
    expect(connectionSource).not.toContain('process.env.DATABASE_URL');
    expect(connectionSource).toContain('createDatabaseConnection(databaseUrl: string)');
  });
});
