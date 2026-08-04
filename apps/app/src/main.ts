import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AppService } from './app.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
  const greeting = app.get(AppService).getHello();

  process.stdout.write(`${greeting}\n`);
  await app.close();
}
void bootstrap();
