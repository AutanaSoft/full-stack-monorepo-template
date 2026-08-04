import { Injectable } from '@nestjs/common';
import { HealthIndicatorService } from '@nestjs/terminus';
import type { HealthIndicatorResult } from '@nestjs/terminus';

@Injectable()
export class ApplicationHealthIndicator {
  constructor(private readonly healthIndicator: HealthIndicatorService) {}

  check<Key extends 'liveness' | 'application'>(key: Key): HealthIndicatorResult<Key> {
    return this.healthIndicator.check(key).up();
  }
}
