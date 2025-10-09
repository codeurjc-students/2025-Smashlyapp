const { createDefaultPreset } = require("ts-jest");

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
module.exports = {
  testEnvironment: "node",
  transform: {
    ...tsJestTransformCfg,
  },
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
};