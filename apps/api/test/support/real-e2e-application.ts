import { execFile as execFileCallback } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { promisify } from 'node:util';
import { randomUUID } from 'node:crypto';
import { join, resolve } from 'node:path';
import type { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import type { DatabaseConnection } from '@autanasoft/database';
import type { App } from 'supertest/types';
import { applicationOptions, configureApplication } from '../../src/app.bootstrap';
import { AppModule } from '../../src/app.module';
import { DATABASE_CONNECTION } from '../../src/database/database.tokens';

const execFile = promisify(execFileCallback);
const repositoryRoot = resolve(__dirname, '../../../..');

export interface RealE2EApplication {
  readonly app: INestApplication<App>;
  readonly database: DatabaseConnection;
  readonly logFilesEnabled: boolean;
  close(): Promise<ClosedE2EApplication>;
}

export interface ClosedE2EApplication {
  readonly warnings: string;
  readonly errors: string;
  readonly logDirectoryRemoved: boolean;
}

async function loadDotEnv(): Promise<void> {
  const environmentModule = await Test.createTestingModule({
    imports: [ConfigModule.forRoot({ isGlobal: true })],
  }).compile();

  await environmentModule.close();
}

function createDatabaseName(): string {
  return `e2e_${process.pid}_${randomUUID().replaceAll('-', '')}`;
}

async function runPsql(databaseUrl: string, sql: string): Promise<void> {
  await execFile(
    'psql',
    [databaseUrl, '--no-psqlrc', '--quiet', '-v', 'ON_ERROR_STOP=1', '-c', sql],
    {
      cwd: repositoryRoot,
      env: process.env,
      timeout: 30_000,
      maxBuffer: 1_000_000,
    },
  );
}

function createAdminDatabaseUrl(databaseUrl: string): string {
  const url = new URL(databaseUrl);
  url.pathname = '/postgres';
  url.searchParams.delete('schema');
  return url.toString();
}

async function migrateSchema(databaseUrl: string): Promise<void> {
  await execFile('pnpm', ['--filter', '@autanasoft/database', 'db:migrate:deploy'], {
    cwd: repositoryRoot,
    env: { ...process.env, DATABASE_URL: databaseUrl },
    timeout: 120_000,
    maxBuffer: 2_000_000,
  });
}

export async function createRealE2EApplication(
  options: { logFilesEnabled?: boolean } = {},
): Promise<RealE2EApplication> {
  const logFilesEnabled = options.logFilesEnabled ?? true;
  const originalEnvironment = { ...process.env };
  let baseDatabaseUrl: string | undefined;
  let databaseName: string | undefined;
  let logDirectory: string | undefined;
  let app: INestApplication<App> | undefined;

  try {
    Object.assign(process.env, {
      NODE_ENV: 'test',
      LOG_LEVEL: logFilesEnabled ? 'warn' : 'silent',
      LOG_FILES_ENABLED: String(logFilesEnabled),
      LOG_WARN_FILE: 'warnings.log',
      LOG_ERROR_FILE: 'errors.log',
    });
    await loadDotEnv();

    if (logFilesEnabled) {
      logDirectory = await mkdtemp(join(repositoryRoot, 'apps/api/.tmp/e2e-logs-'));
      Object.assign(process.env, { LOG_DIRECTORY: logDirectory });
    }

    baseDatabaseUrl = process.env.DATABASE_URL;
    if (baseDatabaseUrl === undefined || baseDatabaseUrl.trim() === '') {
      throw new Error('Real API E2E tests require DATABASE_URL from the test environment.');
    }

    databaseName = createDatabaseName();
    await runPsql(createAdminDatabaseUrl(baseDatabaseUrl), `CREATE DATABASE "${databaseName}"`);

    const isolatedUrl = new URL(baseDatabaseUrl);
    isolatedUrl.pathname = `/${databaseName}`;
    isolatedUrl.searchParams.delete('schema');
    process.env.DATABASE_URL = isolatedUrl.toString();
    await migrateSchema(process.env.DATABASE_URL);

    const activeDatabaseUrl = baseDatabaseUrl;
    const activeDatabaseName = databaseName;
    const activeLogDirectory = logDirectory;

    const moduleFixture = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = configureApplication(
      moduleFixture.createNestApplication<INestApplication<App>>(applicationOptions),
    );
    await app.init();

    const database = app.get<DatabaseConnection>(DATABASE_CONNECTION);
    const close = async (): Promise<ClosedE2EApplication> => {
      let warnings = '';
      let errors = '';

      try {
        await app.close();
        if (activeLogDirectory !== undefined) {
          [warnings, errors] = await Promise.all([
            readFile(join(activeLogDirectory, 'warnings.log'), 'utf8'),
            readFile(join(activeLogDirectory, 'errors.log'), 'utf8'),
          ]);
        }
      } finally {
        try {
          await runPsql(
            createAdminDatabaseUrl(activeDatabaseUrl),
            `DROP DATABASE "${activeDatabaseName}"`,
          );
        } finally {
          if (activeLogDirectory !== undefined) {
            await rm(activeLogDirectory, { recursive: true, force: true });
          }
          for (const key of Object.keys(process.env)) {
            delete process.env[key];
          }
          Object.assign(process.env, originalEnvironment);
        }
      }

      return { warnings, errors, logDirectoryRemoved: true };
    };

    return { app, database, close, logFilesEnabled };
  } catch (error: unknown) {
    await app?.close().catch(() => undefined);

    if (baseDatabaseUrl !== undefined && databaseName !== undefined) {
      await runPsql(
        createAdminDatabaseUrl(baseDatabaseUrl),
        `DROP DATABASE "${databaseName}"`,
      ).catch(() => undefined);
    }

    if (logDirectory !== undefined) {
      await rm(logDirectory, { recursive: true, force: true });
    }

    for (const key of Object.keys(process.env)) {
      delete process.env[key];
    }
    Object.assign(process.env, originalEnvironment);
    throw error;
  }
}
