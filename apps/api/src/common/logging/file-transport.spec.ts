import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { once } from 'node:events';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Writable } from 'node:stream';
import createFileTransport from './file-transport';

async function closeTransport(transport: Writable): Promise<void> {
  const closed = once(transport, 'close');
  transport.end();
  await closed;
}

function parseJsonLine(line: string): unknown {
  return JSON.parse(line) as unknown;
}

describe('exact-level JSONL file transport', () => {
  let directory: string;

  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), 'monorepo-logging-'));
  });

  afterEach(async () => {
    await rm(directory, { recursive: true, force: true });
  });

  it('routes only numeric warn and error levels to their matching files', async () => {
    const warningsPath = join(directory, 'warnings.log');
    const errorsPath = join(directory, 'errors.log');
    const warnings = createFileTransport({ destination: warningsPath, level: 40 });
    const errors = createFileTransport({ destination: errorsPath, level: 50 });
    const records = [
      { level: 20, msg: 'debug' },
      { level: 30, msg: 'info' },
      { level: 40, msg: 'warn' },
      { level: 50, msg: 'error' },
      { level: 60, msg: 'fatal' },
    ]
      .map((record) => JSON.stringify(record))
      .join('\n');

    warnings.write(`${records}\n`);
    errors.write(`${records}\n`);
    await Promise.all([closeTransport(warnings), closeTransport(errors)]);

    const warningLines = (await readFile(warningsPath, 'utf8')).trim().split('\n');
    const errorLines = (await readFile(errorsPath, 'utf8')).trim().split('\n');

    expect(warningLines.map(parseJsonLine)).toEqual([{ level: 40, msg: 'warn' }]);
    expect(errorLines.map(parseJsonLine)).toEqual([{ level: 50, msg: 'error' }]);
  });

  it('keeps matching records as parseable JSON Lines', async () => {
    const destination = join(directory, 'warnings.log');
    const transport = createFileTransport({ destination, level: 40 });

    transport.write(`${JSON.stringify({ level: 40, requestId: 'fake-request-id' })}\n`);
    await closeTransport(transport);

    const content = await readFile(destination, 'utf8');
    expect(content.endsWith('\n')).toBe(true);
    expect(parseJsonLine(content)).toEqual({ level: 40, requestId: 'fake-request-id' });
  });
});
