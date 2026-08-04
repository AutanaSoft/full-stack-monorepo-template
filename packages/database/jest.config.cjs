/** @type {import('jest').Config} */
module.exports = {
  displayName: 'database',
  roots: ['<rootDir>/test'],
  testMatch: ['<rootDir>/test/**/*.spec.ts'],
  testEnvironment: 'node',
  transform: {
    '^.+\\.(t|j)s$': [
      '@swc/jest',
      {
        jsc: {
          parser: {
            syntax: 'typescript',
          },
        },
      },
    ],
  },
  collectCoverage: false,
};
