import { DatabaseConfigSchema, databaseConfigFactory } from './database.config';

describe('API database configuration', () => {
  it('accepts and trims a PostgreSQL URL', () => {
    expect(
      databaseConfigFactory({ DATABASE_URL: ' postgresql://user:password@localhost:5432/test ' })
    ).toEqual({ DATABASE_URL: 'postgresql://user:password@localhost:5432/test' });
  });

  it.each([undefined, '', '   ', 'mysql://user:password@localhost:3306/test'])(
    'rejects invalid DATABASE_URL input "%s"',
    (DATABASE_URL) => {
      expect(() => DatabaseConfigSchema.parse({ DATABASE_URL })).toThrow();
    }
  );

  it('does not expose credentials when the factory rejects a URL', () => {
    const secretUrl = 'mysql://user:super-secret@localhost:3306/test';

    expect(() => databaseConfigFactory({ DATABASE_URL: secretUrl })).toThrow(
      'Invalid database configuration: DATABASE_URL must be a PostgreSQL URL.'
    );
    expect(() => databaseConfigFactory({ DATABASE_URL: secretUrl })).not.toThrow(secretUrl);
  });
});
