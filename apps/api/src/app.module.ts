import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ErrorsModule } from './common/errors/errors.module';
import appConfig from './config/app.config';
import corsConfig from './config/cors.config';
import databaseConfig from './config/database.config';
import { validate } from './config/env.validation';
import healthConfig from './config/health.config';
import helmetConfig from './config/helmet.config';
import loggerConfig from './config/logger.config';
import passwordConfig from './config/password.config';
import rateLimitConfig from './config/rate-limit.config';
import swaggerConfig from './config/swagger.config';
import { ZodValidationModule } from './common/http/zod-validation.module';
import { LoggerModule } from './common/logging/logger.module';
import { RateLimitModule } from './common/security/rate-limit.module';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { PasswordModule } from './password/password.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        appConfig,
        corsConfig,
        databaseConfig,
        healthConfig,
        helmetConfig,
        loggerConfig,
        passwordConfig,
        rateLimitConfig,
        swaggerConfig,
      ],
      validate,
    }),
    EventEmitterModule.forRoot(),
    LoggerModule,
    ErrorsModule,
    ZodValidationModule,
    RateLimitModule,
    DatabaseModule,
    HealthModule,
    PasswordModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
