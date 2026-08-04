import { createWriteStream } from 'node:fs';
import { Writable } from 'node:stream';

export interface FileTransportOptions {
  destination: string;
  level: number;
}

interface LogRecord {
  level?: unknown;
}

function isLogRecord(value: unknown): value is LogRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasExactLevel(line: string, level: number): boolean {
  try {
    const parsed: unknown = JSON.parse(line);
    return isLogRecord(parsed) && parsed.level === level;
  } catch {
    return false;
  }
}

class ExactLevelFileTransport extends Writable {
  private pending = '';

  private readonly destinationStream: ReturnType<typeof createWriteStream>;

  constructor(private readonly options: FileTransportOptions) {
    super({ decodeStrings: false });
    this.destinationStream = createWriteStream(options.destination, {
      flags: 'a',
      encoding: 'utf8',
    });
    this.destinationStream.on('error', (error: Error) => this.destroy(error));
  }

  override _write(
    chunk: unknown,
    _encoding: BufferEncoding,
    callback: (error?: Error | null) => void,
  ): void {
    const text =
      typeof chunk === 'string'
        ? chunk
        : Buffer.isBuffer(chunk)
          ? chunk.toString('utf8')
          : undefined;

    if (text === undefined) {
      callback(new TypeError('File transport received a non-text log chunk.'));
      return;
    }

    this.pending += text;

    const lines = this.pending.split('\n');
    this.pending = lines.pop() ?? '';
    this.writeMatchingLines(lines, callback);
  }

  override _final(callback: (error?: Error | null) => void): void {
    const finalLine = this.pending;
    this.pending = '';

    this.writeMatchingLines(finalLine === '' ? [] : [finalLine], (error) => {
      if (error) {
        callback(error);
        return;
      }

      this.destinationStream.end(() => callback());
    });
  }

  private writeMatchingLines(
    lines: readonly string[],
    callback: (error?: Error | null) => void,
  ): void {
    let index = 0;

    const writeNext = (): void => {
      while (index < lines.length) {
        const line = lines[index].endsWith('\r') ? lines[index].slice(0, -1) : lines[index];
        index += 1;

        if (!hasExactLevel(line, this.options.level)) {
          continue;
        }

        if (!this.destinationStream.write(`${line}\n`)) {
          this.destinationStream.once('drain', writeNext);
          return;
        }
      }

      callback();
    };

    writeNext();
  }
}

/** Pino worker transport that writes only one numeric level as JSON Lines. */
export default function createFileTransport(options: FileTransportOptions): Writable {
  return new ExactLevelFileTransport(options);
}

export { ExactLevelFileTransport };
