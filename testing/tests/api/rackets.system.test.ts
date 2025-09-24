import request from 'supertest';
import { describe, test, expect, beforeAll } from '@jest/globals';

/**
 * PRUEBAS DE SISTEMA DEL SERVIDOR - API REST
 * 
 * Requisitos a verificar:
 * ✅ Se probará la API REST
 * ✅ Se implementará una prueba que verifique que los datos de ejemplo 
 *    de la entidad principal (palas) se recuperan en la API REST
 */

describe('API REST System Tests - Rackets Endpoint', () => {
  const API_BASE_URL = global.testApiUrl || 'http://localhost:3001';
  let server: any;

  beforeAll(() => {
    console.log(`🔗 Testing API at: ${API_BASE_URL}`);
  });

  describe('GET /api/rackets - List Rackets', () => {
    test('should return list of rackets with correct structure', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/rackets?limit=20')
        .expect(200);

      // Verificar estructura de respuesta
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('timestamp');
      expect(Array.isArray(response.body.data)).toBe(true);
      
      // Verificar que hay datos
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data.length).toBeLessThanOrEqual(20);
    });

    test('should return rackets with required fields', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/rackets?limit=5')
        .expect(200);

      const rackets = response.body.data;
      expect(rackets.length).toBeGreaterThan(0);

      // Verificar estructura de cada pala
      rackets.forEach((racket: any) => {
        expect(racket).toHaveProperty('id');
        expect(racket).toHaveProperty('nombre');
        expect(typeof racket.nombre).toBe('string');
        expect(racket.nombre.length).toBeGreaterThan(0);
        
        // Campos opcionales pero que deberían estar presentes
        expect(racket).toHaveProperty('marca');
        expect(racket).toHaveProperty('precio_actual');
        expect(racket).toHaveProperty('es_bestseller');
        expect(racket).toHaveProperty('en_oferta');
      });
    });

    test('should handle pagination correctly', async () => {
      // Test con paginación
      const response = await request(API_BASE_URL)
        .get('/api/rackets?paginated=true&page=0&limit=10')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('pagination');
      
      const pagination = response.body.data.pagination;
      expect(pagination).toHaveProperty('page');
      expect(pagination).toHaveProperty('limit');
      expect(pagination).toHaveProperty('total');
      expect(pagination).toHaveProperty('totalPages');
      
      expect(pagination.page).toBe(0);
      expect(pagination.limit).toBe(10);
      expect(pagination.total).toBeGreaterThan(0);
    });
  });

  describe('GET /api/rackets/search - Search Rackets', () => {
    test('should search rackets by name', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/rackets/search?q=NOX')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      
      // Si hay resultados, verificar que contienen el término de búsqueda
      if (response.body.data.length > 0) {
        response.body.data.forEach((racket: any) => {
          const searchTerm = 'NOX';
          const found = racket.nombre.toUpperCase().includes(searchTerm) ||
                       (racket.marca && racket.marca.toUpperCase().includes(searchTerm)) ||
                       (racket.modelo && racket.modelo.toUpperCase().includes(searchTerm));
          expect(found).toBe(true);
        });
      }
    });

    test('should return empty array for non-existent search term', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/rackets/search?q=MARCA_INEXISTENTE_12345')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(0);
    });

    test('should return 400 for invalid search query', async () => {
      await request(API_BASE_URL)
        .get('/api/rackets/search?q=a')
        .expect(400);
    });
  });

  describe('GET /api/rackets/filter - Filter Rackets', () => {
    test('should filter rackets by brand', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/rackets/filter?marca=BULLPADEL')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('data');
      
      const rackets = response.body.data.data;
      if (rackets.length > 0) {
        rackets.forEach((racket: any) => {
          expect(racket.marca).toBe('BULLPADEL');
        });
      }
    });

    test('should filter rackets by price range', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/rackets/filter?precio_min=100&precio_max=200')
        .expect(200);

      expect(response.body.success).toBe(true);
      const rackets = response.body.data.data;
      
      if (rackets.length > 0) {
        rackets.forEach((racket: any) => {
          expect(racket.precio_actual).toBeGreaterThanOrEqual(100);
          expect(racket.precio_actual).toBeLessThanOrEqual(200);
        });
      }
    });

    test('should filter bestseller rackets', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/rackets/filter?es_bestseller=true')
        .expect(200);

      expect(response.body.success).toBe(true);
      const rackets = response.body.data.data;
      
      if (rackets.length > 0) {
        rackets.forEach((racket: any) => {
          expect(racket.es_bestseller).toBe(true);
        });
      }
    });

    test('should filter rackets on sale', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/rackets/filter?en_oferta=true')
        .expect(200);

      expect(response.body.success).toBe(true);
      const rackets = response.body.data.data;
      
      if (rackets.length > 0) {
        rackets.forEach((racket: any) => {
          expect(racket.en_oferta).toBe(true);
        });
      }
    });
  });

  describe('GET /api/rackets/:id - Get Racket by ID', () => {
    test('should return specific racket by ID', async () => {
      // Primero obtener un ID válido
      const listResponse = await request(API_BASE_URL)
        .get('/api/rackets?limit=1')
        .expect(200);

      expect(listResponse.body.data.length).toBeGreaterThan(0);
      const firstRacket = listResponse.body.data[0];
      
      // Luego obtener esa pala específica
      const response = await request(API_BASE_URL)
        .get(`/api/rackets/${firstRacket.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id', firstRacket.id);
      expect(response.body.data).toHaveProperty('nombre');
    });

    test('should return 404 for non-existent racket ID', async () => {
      await request(API_BASE_URL)
        .get('/api/rackets/999999')
        .expect(404);
    });

    test('should return 400 for invalid racket ID', async () => {
      await request(API_BASE_URL)
        .get('/api/rackets/invalid-id')
        .expect(400);
    });
  });

  describe('GET /api/rackets/stats - Get Statistics', () => {
    test('should return rackets statistics', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/rackets/stats')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('total');
      expect(response.body.data).toHaveProperty('bestsellers');
      expect(response.body.data).toHaveProperty('onSale');
      expect(response.body.data).toHaveProperty('brands');
      
      expect(typeof response.body.data.total).toBe('number');
      expect(response.body.data.total).toBeGreaterThan(0);
      expect(response.body.data.total).toBeLessThanOrEqual(1400);
    });
  });

  describe('GET /api/health - Health Check', () => {
    test('should return API health status', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
    });
  });
});