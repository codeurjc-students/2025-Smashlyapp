// Test setup file for Jest
// This file runs before each test suite

import { jest } from '@jest/globals';

// Mock console methods to reduce noise in test output
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});

// Global test timeout
jest.setTimeout(10000);

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.SUPABASE_URL = 'test-url';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';