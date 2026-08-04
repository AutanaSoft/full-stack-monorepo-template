import { HealthIndicatorService } from '@nestjs/terminus';
import { DATABASE_HEALTH_TIMEOUT_MS, DatabaseHealthIndicator } from './database.health';

describe('DatabaseHealthIndicator', () => {
  function createIndicator(ping: () => Promise<void>): DatabaseHealthIndicator {
    return new DatabaseHealthIndicator(new HealthIndicatorService(), { ping });
  }

  it('reports an available database as up', async () => {
    const result = await createIndicator(() => Promise.resolve()).check();

    expect(result).toEqual({ database: { status: 'up' } });
  });

  it('reports database failures without exposing the underlying error', async () => {
    const result = await createIndicator(() => {
      throw new Error('postgres connection refused at secret-host');
    }).check();

    expect(result).toEqual({ database: { status: 'down', message: 'Database unavailable' } });
    expect(JSON.stringify(result)).not.toContain('secret-host');
  });

  it(`fails a hung database ping within ${DATABASE_HEALTH_TIMEOUT_MS}ms`, async () => {
    const startedAt = Date.now();
    const result = await createIndicator(() => new Promise<void>(() => undefined)).check();

    expect(result).toEqual({ database: { status: 'down', message: 'Database unavailable' } });
    expect(Date.now() - startedAt).toBeLessThan(1000);
  });
});
