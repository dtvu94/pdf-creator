/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
    "\\.(css)$": "<rootDir>/__mocks__/styleMock.js",
  },
  collectCoverage: true,
  collectCoverageFrom: [
    "lib/**/*.{ts,tsx}",
    "app/**/*.{ts,tsx}",
    "components/**/*.{ts,tsx}",
    "types/**/*.{ts,tsx}",
    "!**/__tests__/**",
    "!**/*.test.{ts,tsx}",
    "!**/*.spec.{ts,tsx}",
  ],
};
