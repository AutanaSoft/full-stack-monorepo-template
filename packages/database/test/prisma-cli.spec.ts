import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';

const packageRoot = resolve(__dirname, '..');

function runPnpm(args: string[], env: NodeJS.ProcessEnv) {
  return spawnSync('pnpm', args, {
    cwd: packageRoot,
    env,
    encoding: 'utf8',
  });
}

describe('Prisma CLI boundary', () => {
  it('reports a missing DATABASE_URL from the package config', () => {
    const env = { ...process.env };
    delete env.DATABASE_URL;
    env.DOTENV_CONFIG_PATH = join(tmpdir(), 'autanasoft-database-missing.env');

    const result = runPnpm(['run', 'db:validate'], env);
    const output = `${result.stdout}${result.stderr}`;

    expect(result.status).not.toBe(0);
    expect(output).toMatch(/DATABASE_URL/);
  });

  it('reports a missing seed entrypoint at the subprocess boundary', () => {
    const temporaryDirectory = mkdtempSync(join(tmpdir(), 'autanasoft-database-cli-'));
    const configPath = join(temporaryDirectory, 'prisma.config.ts');
    const schemaPath = join(packageRoot, 'prisma');
    const migrationsPath = join(packageRoot, 'prisma', 'migrations');

    writeFileSync(
      configPath,
      [
        "import 'dotenv/config';",
        "import { defineConfig, env } from 'prisma/config';",
        '',
        'export default defineConfig({',
        `  schema: ${JSON.stringify(schemaPath)},`,
        '  migrations: {',
        `    path: ${JSON.stringify(migrationsPath)},`,
        `    seed: ${JSON.stringify(`tsx ${join(packageRoot, 'prisma', 'seed', 'missing-entrypoint.ts')}`)},`,
        '  },',
        '  datasource: {',
        "    url: env('DATABASE_URL'),",
        '  },',
        '});',
        '',
      ].join('\n'),
    );

    try {
      const result = runPnpm(['exec', 'prisma', 'db', 'seed', '--config', configPath], {
        ...process.env,
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/test',
      });
      const output = `${result.stdout}${result.stderr}`;

      expect(result.status).not.toBe(0);
      expect(output).toMatch(/missing-entrypoint|Cannot find module|not found/i);
    } finally {
      rmSync(temporaryDirectory, { recursive: true, force: true });
    }
  });
});
