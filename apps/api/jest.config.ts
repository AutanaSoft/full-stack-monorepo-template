import { nestConfig } from '@autanasoft/jest-config';
import type { Config } from 'jest';
import { pathsToModuleNameMapper } from 'ts-jest';
import * as ts from 'typescript';

const tsconfigPath = ts.findConfigFile(process.cwd(), ts.sys.fileExists, 'tsconfig.json');

if (!tsconfigPath) {
  throw new Error('Could not find tsconfig.json');
}

const parsedTsconfig = ts.getParsedCommandLineOfConfigFile(
  tsconfigPath,
  {},
  {
    ...ts.sys,
    onUnRecoverableConfigFileDiagnostic: (diagnostic) => {
      throw new Error(ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'));
    },
  },
);

if (!parsedTsconfig) {
  throw new Error(`Could not parse ${tsconfigPath}`);
}

const compilerOptions = parsedTsconfig.options;

const baseProject: Config = {
  ...nestConfig,
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths ?? {}, {
    prefix: '<rootDir>/',
  }),
};

export default {
  projects: [
    {
      ...baseProject,
      displayName: 'unit',
      roots: ['<rootDir>/src'],
      testMatch: ['<rootDir>/src/**/*.spec.ts'],
    },
    {
      ...baseProject,
      displayName: 'e2e',
      roots: ['<rootDir>/src', '<rootDir>/test'],
      testMatch: ['<rootDir>/test/**/*.e2e-spec.ts'],
      testTimeout: 30000,
    },
  ],
};
