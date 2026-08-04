import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

interface ExportTarget {
  types?: string;
  import?: string;
  require?: string;
  default?: string;
}

interface PackageManifest {
  name?: string;
  private?: boolean;
  type?: string;
  main?: string;
  types?: string;
  exports?: Record<string, ExportTarget>;
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

function collectSourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);

    if (entry.isDirectory()) {
      return collectSourceFiles(path);
    }

    return /\.(?:c|m)?tsx?$/.test(entry.name) ? [path] : [];
  });
}

describe('@autanasoft/contracts package contract', () => {
  const contractsManifest = readManifest(join(packageRoot, 'package.json'));

  it('is private and exposes only compiled public entrypoints', () => {
    expect(contractsManifest).toMatchObject({
      name: '@autanasoft/contracts',
      private: true,
      type: 'commonjs',
      main: './dist/index.js',
      types: './dist/index.d.ts',
    });
    expect(contractsManifest.exports).toEqual({
      '.': {
        types: './dist/index.d.ts',
        import: './dist/index.js',
        require: './dist/index.js',
        default: './dist/index.js',
      },
      './common': {
        types: './dist/common/index.d.ts',
        import: './dist/common/index.js',
        require: './dist/common/index.js',
        default: './dist/common/index.js',
      },
      './users': {
        types: './dist/users/index.d.ts',
        import: './dist/users/index.js',
        require: './dist/users/index.js',
        default: './dist/users/index.js',
      },
    });
    expect(contractsManifest.dependencies).toEqual({ zod: '^4.4.3' });
  });

  it('is a runtime workspace dependency of all three consumers', () => {
    const manifests = workspaceManifests();

    for (const name of ['api', 'web', 'app']) {
      const manifest = manifests.find((candidate) => candidate.name === name);

      expect(manifest?.dependencies?.['@autanasoft/contracts']).toBe('workspace:*');
      expect(manifest?.devDependencies?.['@autanasoft/contracts']).toBeUndefined();
    }
  });

  it('does not allow consumers to import source or compiled internals', () => {
    const consumerSourceRoots = {
      api: ['src'],
      web: ['app', 'components', 'hooks', 'lib'],
      app: ['src'],
    } as const;
    const consumerSourceFiles = Object.entries(consumerSourceRoots).flatMap(([consumer, roots]) =>
      roots.flatMap((root) => collectSourceFiles(join(repositoryRoot, 'apps', consumer, root))),
    );

    for (const path of consumerSourceFiles) {
      const source = readFileSync(path, 'utf8');

      expect(source).not.toMatch(/@autanasoft\/contracts\/(?:src|dist)(?:\/|['"])/);
    }
  });
});
