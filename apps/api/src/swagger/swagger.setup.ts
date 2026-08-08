import type { INestApplication } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { OpenAPIObject } from '@nestjs/swagger';
import { cleanupOpenApiDoc } from 'nestjs-zod';
import swaggerConfig from '../config/swagger.config';

export const SWAGGER_TITLE = 'AutanaSoft API';
export const SWAGGER_VERSION = '1.0.0';
export const SWAGGER_DESCRIPTION = 'HTTP API for the AutanaSoft platform.';

export function setupSwagger(app: INestApplication): OpenAPIObject | undefined {
  const config = app.get<ConfigType<typeof swaggerConfig>>(swaggerConfig.KEY);

  if (!config.SWAGGER_ENABLED) {
    return undefined;
  }

  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle(SWAGGER_TITLE)
      .setVersion(SWAGGER_VERSION)
      .setDescription(SWAGGER_DESCRIPTION)
      .build()
  );
  const cleanedDocument = cleanupOpenApiDoc(document);

  SwaggerModule.setup(config.SWAGGER_PATH, app, cleanedDocument, {
    raw: ['json'],
    useGlobalPrefix: true,
  });

  return cleanedDocument;
}
