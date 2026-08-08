import { Inject, Injectable } from '@nestjs/common';
import { HealthIndicatorService } from '@nestjs/terminus';
import type { HealthIndicatorResult } from '@nestjs/terminus';
import { DATABASE_PING } from '../../database/database.tokens';
import type { DatabasePing } from '../../database/database.tokens';

export const DATABASE_HEALTH_TIMEOUT_MS = 250;

function pingWithTimeout(ping: () => Promise<void>, timeoutMs: number): Promise<void> {
  let timer: NodeJS.Timeout | undefined;

  return Promise.race([
    ping(),
    new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error('Database health check timed out.')), timeoutMs);
    }),
  ]).finally(() => {
    if (timer !== undefined) {
      clearTimeout(timer);
    }
  });
}

@Injectable()
export class DatabaseHealthIndicator {
  constructor(
    private readonly healthIndicator: HealthIndicatorService,
    @Inject(DATABASE_PING) private readonly database: DatabasePing
  ) {}

  async check(): Promise<HealthIndicatorResult<'database'>> {
    const indicator = this.healthIndicator.check('database');

    try {
      await pingWithTimeout(() => this.database.ping(), DATABASE_HEALTH_TIMEOUT_MS);
      return indicator.up();
    } catch {
      return indicator.down('Database unavailable');
    }
  }
}
