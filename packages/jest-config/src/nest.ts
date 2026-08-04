import type { Config } from 'jest';

import { config } from './base';

export const nestConfig = {
  ...config,
  transform: {
    '^.+\\.(t|j)s$': ['@swc/jest', { configFile: '.swcrc' }],
  },
  testEnvironment: 'node',
  cacheDirectory: '.tmp/jestCache',
  coverageDirectory: '.tmp/coverage',
  moduleFileExtensions: ['js', 'json', 'ts'],
  collectCoverageFrom: [
    '<rootDir>/src/**/*.(t|j)s',
    '!<rootDir>/src/config/**/*.(t|j)s',
    '!<rootDir>/src/main.ts',
    '!<rootDir>/src/**/index.(t|j)s',
  ],
  restoreMocks: true,
  modulePaths: ['<rootDir>'],
  rootDir: './',
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
} as const satisfies Config;
