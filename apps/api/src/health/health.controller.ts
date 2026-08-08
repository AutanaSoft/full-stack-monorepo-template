import { Controller, Get, Inject, NotFoundException } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';
import { SkipRateLimit } from '../common/security/rate-limit.decorators';
import healthConfig from '../config/health.config';
import { ApplicationHealthIndicator } from './application.health';
import { DatabaseHealthIndicator } from './indicators/database.health';

@ApiTags('health')
@Controller('health')
@SkipRateLimit()
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly application: ApplicationHealthIndicator,
    private readonly database: DatabaseHealthIndicator,
    @Inject(healthConfig.KEY) private readonly config: ConfigType<typeof healthConfig>
  ) {}

  private ensureEnabled(): void {
    if (!this.config.HEALTH_ENABLED) {
      throw new NotFoundException();
    }
  }

  @Get('live')
  @HealthCheck()
  @ApiOperation({ summary: 'Check whether the API process is alive.' })
  @ApiResponse({ status: 200, description: 'The API process is alive.' })
  live() {
    this.ensureEnabled();
    return this.health.check([() => this.application.check('liveness')]);
  }

  @Get('ready')
  @HealthCheck()
  @ApiOperation({ summary: 'Check whether the API is ready to receive traffic.' })
  @ApiResponse({ status: 200, description: 'The API and required database are ready.' })
  @ApiResponse({ status: 503, description: 'The API dependency check failed.' })
  ready() {
    this.ensureEnabled();
    return this.health.check([
      () => this.application.check('application'),
      () => this.database.check(),
    ]);
  }
}
