const { createDefaultPreset } = require("ts-jest");

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
module.exports = {
  testEnvironment: "node",
  transform: {
    ...tsJestTransformCfg,
  },

  // 1. Activa la recolección de cobertura.
  collectCoverage: true,

  // 2. Define el directorio donde se guardarán los informes.
  // Es mejor usar un nombre diferente al del frontend, ej: 'coverage-backend'.
  coverageDirectory: 'coverage-backend', 

  // 3. Define el formato de los informes. 'lcov' es crucial para SonarQube.
  coverageReporters: ['json', 'lcov', 'text'],

  // 4. Especifica los archivos de código fuente que deben analizarse (excluyendo tests y tipos).
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/__tests__/**/*.ts', // Excluye los directorios de tests
    '!src/**/*.d.ts',           // Excluye archivos de definición de tipos
  ],
  // Solo ejecutar archivos de test TypeScript en src
  testMatch: [
    "**/src/**/__tests__/**/*.test.ts",
    "**/src/**/?(*.)+(spec|test).ts",
  ],
  // Ignorar archivos de definición de tipos y el directorio dist
  testPathIgnorePatterns: [
    "/node_modules/",
    "/dist/",
    "\\.d\\.ts$",
  ],
  // Asegurar que se ejecuten desde el directorio correcto
  rootDir: ".",
  roots: ["<rootDir>/src"],
  moduleNameMapper: {
    // ... tus aliases existentes
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@types/(.*)$": "<rootDir>/src/types/$1",
    "^@config/(.*)$": "<rootDir>/src/config/$1",
    "^@services/(.*)$": "<rootDir>/src/services/$1",
    "^@controllers/(.*)$": "<rootDir>/src/controllers/$1",
    "^@middleware/(.*)$": "<rootDir>/src/middleware/$1",
    "^@routes/(.*)$": "<rootDir>/src/routes/$1"
  },
};