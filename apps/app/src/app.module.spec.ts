import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from './app.module';

describe('AppModule', () => {
  let moduleRef: TestingModule;

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
  });

  afterEach(async () => {
    await moduleRef.close();
  });

  it('provides ConfigService and EventEmitter2', () => {
    expect(moduleRef.get(ConfigService)).toBeInstanceOf(ConfigService);
    expect(moduleRef.get(EventEmitter2)).toBeInstanceOf(EventEmitter2);
  });
});
