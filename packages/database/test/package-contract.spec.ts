import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

interface PackageManifest {
  name?: string;
  private?: boolean;
  main?: string;
  types?: string;
  exports?: {
    '.': {
      types?: string;
      import?: string;
      require?: string;
      default?: string;
    };
  };
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

const packageRoot = resolve(__dirname, '..');
const repositoryRoot = resolve(packageRoot, '..', '..');

function readManifest(path: string): PackageManifest {
  return JSON.parse(readFileSync(path, 'utf8')) as PackageManifest;
}

function workspaceManifests(): PackageManifest[] {
  return ['apps', 'packages'].flatMap((workspace) => {
    const workspaceRoot = join(repositoryRoot, workspace);

    return readdirSync(workspaceRoot, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => join(workspaceRoot, entry.name, 'package.json'))
      .filter((path) => {
        try {
          readFileSync(path);
          return true;
        } catch {
          return false;
        }
      })
      .map(readManifest);
  });
}

function dependencyVersion(manifest: PackageManifest, dependency: string): string | undefined {
  return manifest.dependencies?.[dependency] ?? manifest.devDependencies?.[dependency];
}

describe('@autanasoft/database package contract', () => {
  const databaseManifest = readManifest(join(packageRoot, 'package.json'));

  it('is private and exposes the compiled package entrypoint', () => {
    expect(databaseManifest).toMatchObject({
      name: '@autanasoft/database',
      private: true,
    });
    expect(databaseManifest.main).toBe('./dist/index.js');
    expect(databaseManifest.types).toBe('./dist/index.d.ts');
    expect(databaseManifest.exports?.['.']).toEqual({
      types: './dist/index.d.ts',
      import: './dist/index.js',
      require: './dist/index.js',
      default: './dist/index.js',
    });
  });

  it('is declared as a runtime dependency only by apps/api', () => {
    const manifests = workspaceManifests();
    const apiManifest = manifests.find((manifest) => manifest.name === 'api');

    expect(apiManifest?.dependencies?.['@autanasoft/database']).toBe('workspace:*');

    for (const manifest of manifests) {
      if (manifest.name === '@autanasoft/database' || manifest.name === 'api') {
        continue;
      }

      expect(dependencyVersion(manifest, '@autanasoft/database')).toBeUndefined();
    }
  });

  it('aligns all Prisma packages on 7.9.1', () => {
    const versions = [
      dependencyVersion(databaseManifest, 'prisma'),
      dependencyVersion(databaseManifest, '@prisma/client'),
      dependencyVersion(databaseManifest, '@prisma/adapter-pg'),
    ];

    expect(versions).toEqual(['7.9.1', '7.9.1', '7.9.1']);
  });

  it('does not expose generated source paths to consumers', () => {
    const apiSourceRoot = join(repositoryRoot, 'apps', 'api', 'src');
    const sourceFiles: string[] = [];

    function collectSourceFiles(directory: string): void {
      for (const entry of readdirSync(directory, { withFileTypes: true })) {
        const path = join(directory, entry.name);

        if (entry.isDirectory()) {
          collectSourceFiles(path);
        } else if (/\.(?:c|m)?tsx?$/.test(entry.name)) {
          sourceFiles.push(path);
        }
      }
    }

    collectSourceFiles(apiSourceRoot);

    for (const path of sourceFiles) {
      const source = readFileSync(path, 'utf8');

      expect(source).not.toMatch(/@autanasoft\/database\/(?:src|dist|prisma)/);
      expect(source).not.toMatch(/src\/generated\/prisma/);
    }
  });
});
