import { spawnSync } from 'node:child_process';
import { createServer } from 'node:net';
import { join } from 'node:path';

describe('Standalone application lifecycle', () => {
  it('emits the greeting before closing the context exactly once', async () => {
    const events: string[] = [];
    const close = jest.fn(() => {
      events.push('close');
    });
    const get = jest.fn(() => ({
      getHello: () => {
        events.push('getHello');
        return 'Hello World!';
      },
    }));

    jest.resetModules();
    jest.doMock('@nestjs/core', () => ({
      NestFactory: {
        createApplicationContext: jest.fn(() => Promise.resolve({ get, close })),
      },
    }));
    jest.spyOn(process.stdout, 'write').mockImplementation((chunk: string | Uint8Array) => {
      events.push(`stdout:${chunk.toString()}`);
      return true;
    });

    jest.requireActual('../src/main');
    await new Promise((resolve) => setImmediate(resolve));

    expect(events).toEqual(['getHello', 'stdout:Hello World!\n', 'close']);
    expect(close).toHaveBeenCalledTimes(1);
  });

  it('starts, prints exactly one greeting, and terminates without an HTTP listener', async () => {
    const server = createServer();
    await new Promise<void>((resolve, reject) => {
      server.once('error', reject);
      server.listen(0, resolve);
    });
    const address = server.address();

    if (!address || typeof address === 'string') {
      server.close();
      throw new Error('Could not reserve a local port for the no-listener check');
    }

    const entrypoint = join(process.cwd(), 'dist', 'main.js');
    const result = spawnSync(process.execPath, [entrypoint], {
      env: { ...process.env, PORT: String(address.port) },
      encoding: 'utf8',
      timeout: 5000,
    });

    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });

    expect(result.error).toBeUndefined();
    expect(result.status).toBe(0);
    expect(result.stdout).toBe('Hello World!\n');
    expect(result.stderr).toBe('');
  });
});
