import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

interface PackageManifest {
  scripts?: Record<string, string>;
}

const packageRoot = resolve(__dirname, '..');
const prismaRoot = join(packageRoot, 'prisma');

function readManifest(): PackageManifest {
  return JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf8')) as PackageManifest;
}

describe('Prisma package layout', () => {
  const config = readFileSync(join(packageRoot, 'prisma.config.ts'), 'utf8');
  const schema = readFileSync(join(prismaRoot, 'schema.prisma'), 'utf8');
  const scripts = readManifest().scripts ?? {};

  it('uses a root schema with only the generator and PostgreSQL datasource', () => {
    expect(schema).toMatch(/generator\s+client\s*\{[\s\S]*provider\s*=\s*"prisma-client"/);
    expect(schema).toMatch(/output\s*=\s*"\.\.\/src\/generated"/);
    expect(schema).toMatch(/moduleFormat\s*=\s*"cjs"/);
    expect(schema).toMatch(/importFileExtension\s*=\s*""/);
    expect(schema).toMatch(/binaryTargets\s*=\s*\["native",\s*"rhel-openssl-3\.0\.x"\]/);
    expect(schema).toMatch(/datasource\s+db\s*\{[\s\S]*provider\s*=\s*"postgresql"/);
    expect(schema).not.toMatch(/\bmodel\s+\w+/);
    expect(schema).not.toMatch(/\benum\s+\w+/);
  });

  it('keeps schema, models, and migrations at the configured package root', () => {
    expect(config).toContain("schema: 'prisma'");
    expect(config).toContain("path: 'prisma/migrations'");
    expect(readdirSync(prismaRoot)).toEqual(
      expect.arrayContaining(['schema.prisma', 'models', 'migrations', 'seed']),
    );
    expect(readdirSync(join(prismaRoot, 'models'))).toEqual(['.gitkeep', 'user.prisma']);
    expect(readdirSync(join(prismaRoot, 'migrations'))).toEqual([
      '.gitkeep',
      '20260803080000_create_users',
    ]);
  });

  it('defines package-relative lifecycle commands with explicit seeding', () => {
    expect(config).toContain("seed: 'tsx prisma/seed/index.ts'");
    expect(config).toContain("url: env('DATABASE_URL')");
    expect(scripts['db:generate']).toContain('--config prisma.config.ts');
    expect(scripts['db:validate']).toContain('--config prisma.config.ts');
    expect(scripts['db:migrate:dev']).toContain('--config prisma.config.ts');
    expect(scripts['db:migrate:deploy']).toContain('--config prisma.config.ts');
    expect(scripts['db:seed']).toContain('--config prisma.config.ts');
    expect(scripts['db:migrate:dev']).not.toContain('seed');
    expect(scripts['db:migrate:deploy']).not.toContain('seed');
  });

  it('keeps seed data unconfigured while tracking the user migration', () => {
    expect(readFileSync(join(prismaRoot, 'seed', 'index.ts'), 'utf8')).toMatch(
      /Seed orchestrator is not configured/,
    );
    expect(readFileSync(join(prismaRoot, 'models', 'user.prisma'), 'utf8')).toMatch(
      /model\s+User\s*\{/,
    );
    expect(
      readFileSync(
        join(prismaRoot, 'migrations', '20260803080000_create_users', 'migration.sql'),
        'utf8',
      ),
    ).toMatch(/CREATE TABLE "users"/);
  });
});
