module.exports = {
  testEnvironment: 'node',
  collectCoverageFrom: [
    '**/*.js',
    '!node-mqtt-topic-selector.html',
    '!test/**',
    '!node_modules/**',
    '!jest.config.js'
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
  testTimeout: 10000
};
