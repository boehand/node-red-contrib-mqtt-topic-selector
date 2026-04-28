module.exports = {
  testEnvironment: 'node',
  collectCoverageFrom: [
    'node-mqtt-topic-selector.js',
    '!node-mqtt-topic-selector.html',
    '!test/**',
    '!node_modules/**'
  ],
  coverageThreshold: {
    global: {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0
    }
  },
  testMatch: ['**/test/**/*.test.js'],
  verbose: true,
  testTimeout: 10000,
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1'
  }
};
