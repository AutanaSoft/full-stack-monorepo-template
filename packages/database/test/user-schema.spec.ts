import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const packageRoot = resolve(__dirname, '..');
const model = readFileSync(join(packageRoot, 'prisma', 'models', 'user.prisma'), 'utf8');
const migration = readFileSync(
  join(packageRoot, 'prisma', 'migrations', '20260803080000_create_users', 'migration.sql'),
  'utf8',
);

describe('User PostgreSQL schema contract', () => {
  it('defines the approved Prisma model and mapped fields', () => {
    expect(model).toMatch(/model User\s*\{/);
    expect(model).toMatch(
      /id\s+String\s+@id\s+@default\(dbgenerated\("gen_random_uuid\(\)"\)\)\s+@db\.Uuid/,
    );
    expect(model).toMatch(/email\s+String\s+@unique/);
    expect(model).toMatch(/userName\s+String\s+@map\("user_name"\)/);
    expect(model).toMatch(/passwordHash\s+String\s+@map\("password_hash"\)/);
    expect(model).toMatch(
      /createdAt\s+DateTime\s+@default\(now\(\)\)\s+@map\("created_at"\)\s+@db\.Timestamptz\(6\)/,
    );
    expect(model).toMatch(
      /updatedAt\s+DateTime\s+@default\(now\(\)\)\s+@map\("updated_at"\)\s+@db\.Timestamptz\(6\)/,
    );
    expect(model).toMatch(/deletedAt\s+DateTime\?\s+@map\("deleted_at"\)\s+@db\.Timestamptz\(6\)/);
    expect(model).toMatch(
      /verifiedAt\s+DateTime\?\s+@map\("verified_at"\)\s+@db\.Timestamptz\(6\)/,
    );
    expect(model).toMatch(/status\s+UserStatus\s+@default\(ACTIVE\)/);
    expect(model).toMatch(/role\s+UserRole\s+@default\(USER\)/);
    expect(model).toMatch(/@@map\("users"\)/);
    expect(model).not.toMatch(/normalizedUserName/);
  });

  it('declares native PostgreSQL enum values with least-privileged defaults', () => {
    expect(model).toMatch(/enum UserStatus\s*\{\s*ACTIVE\s+SUSPENDED\s+DISABLED\s*\}/s);
    expect(model).toMatch(/enum UserRole\s*\{\s*USER\s+ADMIN\s*\}/s);
  });

  it('uses database constraints and indexes for integrity', () => {
    expect(migration).toMatch(/CREATE EXTENSION IF NOT EXISTS "pgcrypto";/);
    expect(migration).toMatch(/"id" UUID NOT NULL DEFAULT gen_random_uuid\(\)/);
    expect(migration).toMatch(/"password_hash" TEXT NOT NULL/);
    expect(migration).toMatch(/"status" "UserStatus" NOT NULL DEFAULT 'ACTIVE'/);
    expect(migration).toMatch(/"role" "UserRole" NOT NULL DEFAULT 'USER'/);
    expect(migration).toMatch(/CREATE UNIQUE INDEX "users_email_key" ON "users"\("email"\)/);
    expect(migration).toMatch(
      /CREATE UNIQUE INDEX "users_user_name_lower_key" ON "users"\(LOWER\("user_name"\)\)/,
    );
    expect(migration).toMatch(/CREATE INDEX "users_deleted_at_idx" ON "users"\("deleted_at"\)/);
    expect(migration).toMatch(/"deleted_at" TIMESTAMPTZ\(6\)/);
    expect(migration).not.toMatch(/normalized_user_name/);
    expect(migration).not.toMatch(/CREATE TRIGGER.*email|CREATE TRIGGER.*user_name/is);
  });

  it('updates timestamps in the database and preserves soft-delete semantics', () => {
    expect(migration).toMatch(/"created_at" TIMESTAMPTZ\(6\) NOT NULL DEFAULT CURRENT_TIMESTAMP/);
    expect(migration).toMatch(/"updated_at" TIMESTAMPTZ\(6\) NOT NULL DEFAULT CURRENT_TIMESTAMP/);
    expect(migration).toMatch(/CREATE OR REPLACE FUNCTION set_users_updated_at\(\)/);
    expect(migration).toMatch(/NEW\.updated_at = CURRENT_TIMESTAMP/);
    expect(migration).toMatch(/BEFORE UPDATE ON "users"/);
    expect(migration).toMatch(/EXECUTE FUNCTION set_users_updated_at\(\)/);
    expect(model).toMatch(/application boundary must store this value trimmed and lowercase/);
  });
});
