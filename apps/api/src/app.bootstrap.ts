import { VersioningType } from '@nestjs/common';
import type { INestApplication, NestApplicationOptions } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import { createCorsOptions } from './common/security/cors.options';
import { createHelmetOptions } from './common/security/helmet.options';
import appConfig from './config/app.config';
import corsConfig from './config/cors.config';
import helmetConfig from './config/helmet.config';
import { setupSwagger } from './swagger/swagger.setup';

export const applicationOptions = {
  bufferLogs: true,
} satisfies NestApplicationOptions;

interface ExpressApplicationLike {
  set(setting: string, value: unknown): void;
  use(...middleware: unknown[]): void;
}

function isExpressApplication(value: unknown): value is ExpressApplicationLike {
  return (
    (typeof value === 'object' || typeof value === 'function') &&
    value !== null &&
    'set' in value &&
    typeof value.set === 'function' &&
    'use' in value &&
    typeof value.use === 'function'
  );
}

export function configureApplication<TServer>(
  app: INestApplication<TServer>
): INestApplication<TServer> {
  const config = app.get<ConfigType<typeof appConfig>>(appConfig.KEY);
  const corsSettings = app.get<ConfigType<typeof corsConfig>>(corsConfig.KEY);
  const helmetSettings = app.get<ConfigType<typeof helmetConfig>>(helmetConfig.KEY);

  app.useLogger(app.get(Logger));

  const httpServer: unknown = app.getHttpAdapter().getInstance();

  if (isExpressApplication(httpServer)) {
    const helmetOptions = createHelmetOptions(helmetSettings);

    if (helmetOptions !== undefined) {
      httpServer.use(helmet(helmetOptions));
    }

    httpServer.set('trust proxy', config.TRUST_PROXY);
  }

  const corsOptions = createCorsOptions(corsSettings);

  if (corsOptions !== undefined) {
    app.enableCors(corsOptions);
  }

  app.setGlobalPrefix(config.API_PREFIX);
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: String(config.API_VERSION),
  });
  setupSwagger(app);

  return app;
}
