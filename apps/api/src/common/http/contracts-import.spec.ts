import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

function collectTypeScriptFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);

    if (entry.isDirectory()) {
      return collectTypeScriptFiles(path);
    }

    return entry.isFile() && path.endsWith('.ts') ? [path] : [];
  });
}

describe('contracts import boundary', () => {
  it('uses the compiled public contracts entrypoint without deep imports', () => {
    const apiRoot = resolve(__dirname, '../../../');
    const repositoryRoot = resolve(apiRoot, '../..');
    const contractPackage = ['@autanasoft', 'contracts'].join('/');
    const sourceFiles = [
      ...collectTypeScriptFiles(join(apiRoot, 'src')),
      ...collectTypeScriptFiles(join(apiRoot, 'test')),
    ];

    for (const sourceFile of sourceFiles) {
      const source = readFileSync(sourceFile, 'utf8');

      expect(source).not.toContain(`${contractPackage}/src`);
      expect(source).not.toContain(`${contractPackage}/dist`);
    }

    const fixtureSource = readFileSync(
      join(apiRoot, 'test', 'fixtures', 'zod-http.fixture.ts'),
      'utf8'
    );
    expect(fixtureSource).toContain(`from '${contractPackage}'`);

    const contractsManifest = readFileSync(
      join(repositoryRoot, 'packages', 'contracts', 'package.json'),
      'utf8'
    );
    expect(contractsManifest).toMatch(/"main":\s*"\.\/dist\/index\.js"/);
    expect(contractsManifest).toMatch(/"types":\s*"\.\/dist\/index\.d\.ts"/);
  });
});
