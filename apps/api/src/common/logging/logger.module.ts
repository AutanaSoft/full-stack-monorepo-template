import { Inject, Injectable, Module, OnApplicationShutdown } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import type { ConfigType } from '@nestjs/config';
import pino, { type Logger as PinoInstance } from 'pino';
import { LoggerModule as NestPinoModule, PinoLogger } from 'nestjs-pino';
import appConfig from '../../config/app.config';
import loggerConfig from '../../config/logger.config';
import { createLoggerParams } from './logger.options';

interface ThreadTransportLike {
  closed: boolean;
  end(): void;
  flushSync(): void;
  once(event: string, listener: (...args: unknown[]) => void): void;
  ref?(): void;
}

function toError(value: unknown, fallbackMessage: string): Error {
  return value instanceof Error ? value : new Error(fallbackMessage);
}

function getThreadTransport(logger: PinoInstance): ThreadTransportLike | undefined {
  const stream = (logger as unknown as Record<symbol, unknown>)[pino.symbols.streamSym];

  if (typeof stream !== 'object' || stream === null) {
    return undefined;
  }

  const candidate = stream as {
    closed?: unknown;
    end?: unknown;
    flushSync?: unknown;
    once?: unknown;
  };

  if (
    typeof candidate.closed !== 'boolean' ||
    typeof candidate.end !== 'function' ||
    typeof candidate.flushSync !== 'function' ||
    typeof candidate.once !== 'function'
  ) {
    return undefined;
  }

  return stream as ThreadTransportLike;
}

export async function flushAndCloseLogger(logger: PinoInstance): Promise<void> {
  const transport = getThreadTransport(logger);

  if (transport === undefined) {
    await new Promise<void>((resolve, reject) => {
      try {
        logger.flush((error) => {
          if (error !== undefined) {
            reject(error);
            return;
          }

          resolve();
        });
      } catch (error: unknown) {
        reject(toError(error, 'Logger transport flush failed.'));
      }
    });
    return;
  }

  if (transport.closed) {
    return;
  }

  transport.ref?.();

  try {
    transport.flushSync();
  } catch (error: unknown) {
    throw toError(error, 'Logger transport flush failed.');
  }

  await new Promise<void>((resolve, reject) => {
    transport.once('error', (error: unknown) => {
      reject(toError(error, 'Logger transport close failed.'));
    });
    transport.once('close', () => resolve());

    try {
      transport.end();
    } catch (error: unknown) {
      reject(toError(error, 'Logger transport close failed.'));
    }
  });
}

@Injectable()
export class LoggerLifecycle implements OnApplicationShutdown {
  constructor(
    @Inject(loggerConfig.KEY)
    private readonly config: ConfigType<typeof loggerConfig>,
    @Inject(appConfig.KEY)
    private readonly applicationConfig: ConfigType<typeof appConfig>,
    private readonly logger: PinoLogger
  ) {}

  async onApplicationShutdown(): Promise<void> {
    if (this.applicationConfig.NODE_ENV === 'test' && !this.config.LOG_FILES_ENABLED) {
      return;
    }

    await flushAndCloseLogger(this.logger.logger);
  }
}

@Module({
  imports: [
    ConfigModule,
    NestPinoModule.forRootAsync({
      imports: [ConfigModule],
      inject: [loggerConfig.KEY, appConfig.KEY],
      useFactory: (logger: ConfigType<typeof loggerConfig>, app: ConfigType<typeof appConfig>) =>
        createLoggerParams(logger, app),
    }),
  ],
  providers: [LoggerLifecycle],
})
export class LoggerModule {}
