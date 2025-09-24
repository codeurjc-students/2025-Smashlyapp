import { beforeAll, afterAll, beforeEach } from '@jest/globals';
import { setupTestDatabase } from '../../../setup/setupTestDatabase';

// Variables globales para testing
declare global {
  var testApiUrl: string;
  var testTimeout: number;
}

beforeAll(async () => {
  // Configurar variables globales
  global.testApiUrl = process.env.API_TEST_URL || 'http://localhost:3001';
  global.testTimeout = parseInt(process.env.SELENIUM_TIMEOUT || '10000');
  
  console.log('🧪 Setting up test environment...');
  
  // Setup de base de datos si es necesario
  // await setupTestDatabase();
  
  console.log('✅ Test environment ready');
}, 60000);

afterAll(async () => {
  console.log('🧹 Cleaning up test environment...');
  // Limpieza general si es necesaria
});

beforeEach(async () => {
  // Setup antes de cada test
});