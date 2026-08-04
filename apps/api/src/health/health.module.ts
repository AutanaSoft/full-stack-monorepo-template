import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { DatabaseModule } from '../database/database.module';
import { ApplicationHealthIndicator } from './application.health';
import { DatabaseHealthIndicator } from './indicators/database.health';
import { HealthController } from './health.controller';

@Module({
  imports: [TerminusModule.forRoot(), DatabaseModule],
  controllers: [HealthController],
  providers: [ApplicationHealthIndicator, DatabaseHealthIndicator],
})
export class HealthModule {}
