/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@db/(.*)$': '<rootDir>/src/db/$1',
    '^@modules/(.*)$': '<rootDir>/src/modules/$1',
  },
  setupFiles: ['<rootDir>/src/tests/jest.env.ts'],
  globalTeardown: '<rootDir>/src/tests/jest.teardown.ts',
}