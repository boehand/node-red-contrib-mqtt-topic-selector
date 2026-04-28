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
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  testMatch: ['**/test/**/*.test.js'],
  verbose: true,
  testTimeout: 10000,
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1'
  }
};
