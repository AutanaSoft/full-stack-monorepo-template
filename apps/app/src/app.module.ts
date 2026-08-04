import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AppService } from './app.service';
import { validate } from './config/env.schema';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true, validate }), EventEmitterModule.forRoot()],
  providers: [AppService],
})
export class AppModule {}
