import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./src/__tests__/setup.ts'],
    include: [
      'src/**/__tests__/**/*.test.ts',
      'src/**/?(*.)+(spec|test).ts',
    ],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['json', 'lcov', 'text', 'html'],
      reportsDirectory: './coverage',
      include: [
        'src/**/*.ts',
      ],
      exclude: [
        'src/**/__tests__/**/*.ts',
        'src/**/*.d.ts',
        'src/types/**',
        'src/scripts/**',
      ],
    },
    testTimeout: 10000,
    hookTimeout: 10000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@types': path.resolve(__dirname, './src/types'),
      '@config': path.resolve(__dirname, './src/config'),
      '@services': path.resolve(__dirname, './src/services'),
      '@controllers': path.resolve(__dirname, './src/controllers'),
      '@middleware': path.resolve(__dirname, './src/middleware'),
      '@routes': path.resolve(__dirname, './src/routes'),
    },
  },
});
