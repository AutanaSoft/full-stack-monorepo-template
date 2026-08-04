import { EventEmitter } from 'node:events';
import pino from 'pino';
import { flushAndCloseLogger } from './logger.module';

describe('logger lifecycle', () => {
  it('flushes and closes a worker transport without leaving it open', async () => {
    const transport = new EventEmitter() as EventEmitter & {
      closed: boolean;
      end: jest.Mock;
      flushSync: jest.Mock;
      ref: jest.Mock;
    };
    transport.closed = false;
    transport.flushSync = jest.fn<void, []>();
    transport.ref = jest.fn<void, []>();
    transport.end = jest.fn<void, []>(() => {
      transport.closed = true;
      queueMicrotask(() => transport.emit('close'));
    });

    const logger = {
      flush: jest.fn(),
      [pino.symbols.streamSym]: transport,
    } as unknown as pino.Logger;

    await flushAndCloseLogger(logger);

    expect(transport.flushSync).toHaveBeenCalledTimes(1);
    expect(transport.ref).toHaveBeenCalledTimes(1);
    expect(transport.end).toHaveBeenCalledTimes(1);
    expect(transport.closed).toBe(true);
  });
});
