import type { INestApplication } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { applicationOptions, configureApplication } from './app.bootstrap';
import appConfig from './config/app.config';

async function closeApplicationSafely(app: INestApplication): Promise<void> {
  try {
    await app.close();
  } catch {
    // Preserve the original bootstrap failure if cleanup also fails.
  }
}

async function bootstrap(): Promise<void> {
  let app: INestApplication | undefined;

  try {
    app = await NestFactory.create(AppModule, applicationOptions);
    configureApplication(app);
    app.enableShutdownHooks();
    const config = app.get<ConfigType<typeof appConfig>>(appConfig.KEY);
    await app.listen(config.PORT);
  } catch (error: unknown) {
    if (app !== undefined) {
      await closeApplicationSafely(app);
    }

    throw error;
  }
}

function reportBootstrapFailure(error: unknown): void {
  const detail =
    error instanceof Error && error.message.startsWith('Unable to prepare logging destinations.')
      ? ` ${error.message}`
      : '';

  process.stderr.write(
    `API bootstrap failed.${detail} Check environment configuration, database connectivity, and port availability.\n`,
  );
  process.exitCode = 1;
}

bootstrap().catch(reportBootstrapFailure);
