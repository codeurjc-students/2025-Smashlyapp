import { RacketService } from '../../services/racketService';
import { Racket, PaginatedResponse, SearchFilters, SortOptions } from '../../types';

/**
 * PRUEBAS UNITARIAS - SERVIDOR
 * 
 * Requisitos a verificar:
 * ✅ Prueba de la funcionalidad de los servicios con un doble de la base de datos
 */

// Mock de Supabase
const mockSupabaseResponse = {
  data: [
    {
      id: 1,
      nombre: 'NOX AT10 GENIUS 18K AGUSTIN TAPIA 2024',
      marca: 'NOX',
      modelo: 'AT10 GENIUS 18K AGUSTIN TAPIA 2024',
      imagen: 'https://example.com/image1.jpg',
      es_bestseller: false,
      en_oferta: true,
      scrapeado_en: '2025-06-21 11:51:32',
      descripcion: null,
      precio_actual: 169.95,
      precio_original: 324.95,
      descuento_porcentaje: 48,
      enlace: 'https://example.com/racket1',
      fuente: 'test-data',
      caracteristicas_marca: 'NOX',
      caracteristicas_color: 'Negro',
      caracteristicas_producto: 'Pala',
      caracteristicas_balance: 'Alto',
      caracteristicas_nucleo: 'EVA',
      caracteristicas_cara: 'Rugosa',
      caracteristicas_formato: 'Diamante',
      caracteristicas_dureza: 'Dura',
      caracteristicas_nivel_de_juego: 'Avanzado',
      caracteristicas_acabado: 'Brillante',
      caracteristicas_peso: '365',
      caracteristicas_grosor: '38'
    },
    {
      id: 2,
      nombre: 'BULLPADEL HACK 03 24 - PAQUITO NAVARRO',
      marca: 'BULLPADEL',
      modelo: 'HACK 03 24 - PAQUITO NAVARRO',
      imagen: 'https://example.com/image2.jpg',
      es_bestseller: true,
      en_oferta: false,
      scrapeado_en: '2025-06-21 11:51:32',
      descripcion: 'Pala de alta gama',
      precio_actual: 299.95,
      precio_original: 299.95,
      descuento_porcentaje: 0,
      enlace: 'https://example.com/racket2',
      fuente: 'test-data',
      caracteristicas_marca: 'BULLPADEL',
      caracteristicas_color: 'Azul',
      caracteristicas_producto: 'Pala',
      caracteristicas_balance: 'Medio',
      caracteristicas_nucleo: 'EVA',
      caracteristicas_cara: 'Lisa',
      caracteristicas_formato: 'Redonda',
      caracteristicas_dureza: 'Media',
      caracteristicas_nivel_de_juego: 'Intermedio',
      caracteristicas_acabado: 'Mate',
      caracteristicas_peso: '360',
      caracteristicas_grosor: '38'
    }
  ],
  error: null,
  count: 2
};

// Mock del cliente Supabase
jest.mock('../../config/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    not: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis()
  }
}));

describe('RacketService - Unit Tests (with DB Mock)', () => {
  const { supabase } = require('../../config/supabase');

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock implementations
    supabase.from.mockReturnThis();
    supabase.select.mockReturnThis();
    supabase.eq.mockReturnThis();
    supabase.or.mockReturnThis();
    supabase.ilike.mockReturnThis();
    supabase.order.mockReturnThis();
    supabase.limit.mockReturnThis();
    supabase.range.mockReturnThis();
  });

  describe('getAllRackets', () => {
    test('should return all rackets with processed data', async () => {
      // Setup mock
      supabase.select.mockResolvedValue(mockSupabaseResponse);

      // Execute
      const result = await RacketService.getAllRackets();

      // Verify
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
      
      // Verify processed data
      expect(result[0]).toHaveProperty('id', 1);
      expect(result[0]).toHaveProperty('nombre', 'NOX AT10 GENIUS 18K AGUSTIN TAPIA 2024');
      expect(result[0]).toHaveProperty('marca', 'NOX');
      expect(result[0]).toHaveProperty('precio_actual', 169.95);

      // Verify Supabase calls
      expect(supabase.from).toHaveBeenCalledWith('rackets');
      expect(supabase.select).toHaveBeenCalledWith('*', { count: 'exact' });
    });

    test('should handle database errors gracefully', async () => {
      // Setup mock error
      const mockError = new Error('Database connection failed');
      supabase.select.mockResolvedValue({
        data: null,
        error: mockError,
        count: null
      });

      // Execute and verify
      await expect(RacketService.getAllRackets()).rejects.toThrow('Error al cargar las palas desde Supabase: Database connection failed');
    });
  });

  describe('getRacketsWithPagination', () => {
    test('should return paginated rackets', async () => {
      // Setup mock
      supabase.select.mockResolvedValue(mockSupabaseResponse);

      // Execute
      const result = await RacketService.getRacketsWithPagination(0, 1);

      // Verify
      expect(result).toBeDefined();
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('pagination');
      expect(Array.isArray(result.data)).toBe(true);
      
      // Verify pagination structure
      expect(result.pagination).toHaveProperty('page', 0);
      expect(result.pagination).toHaveProperty('limit', 1);
      expect(result.pagination).toHaveProperty('total');
      expect(result.pagination).toHaveProperty('totalPages');

      // Verify Supabase calls
      expect(supabase.range).toHaveBeenCalledWith(0, 0);
    });
  });

  describe('getRacketById', () => {
    test('should return specific racket by ID', async () => {
      // Setup mock for single racket
      const singleRacketResponse = {
        data: [mockSupabaseResponse.data[0]],
        error: null
      };
      supabase.select.mockResolvedValue(singleRacketResponse);

      // Execute
      const result = await RacketService.getRacketById(1);

      // Verify
      expect(result).toBeDefined();
      expect(result).toHaveProperty('id', 1);
      expect(result).toHaveProperty('nombre', 'NOX AT10 GENIUS 18K AGUSTIN TAPIA 2024');

      // Verify Supabase calls
      expect(supabase.eq).toHaveBeenCalledWith('id', 1);
    });

    test('should return null for non-existent racket', async () => {
      // Setup mock for empty result
      supabase.select.mockResolvedValue({
        data: [],
        error: null
      });

      // Execute
      const result = await RacketService.getRacketById(999);

      // Verify
      expect(result).toBeNull();
    });
  });

  describe('searchRackets', () => {
    test('should search rackets by query', async () => {
      // Setup mock
      supabase.select.mockResolvedValue({
        data: [mockSupabaseResponse.data[0]], // Only NOX racket
        error: null
      });

      // Execute
      const result = await RacketService.searchRackets('NOX');

      // Verify
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
      expect(result[0]).toHaveProperty('marca', 'NOX');

      // Verify Supabase calls
      expect(supabase.or).toHaveBeenCalledWith(
        'nombre.ilike.%NOX%, marca.ilike.%NOX%, modelo.ilike.%NOX%'
      );
    });

    test('should handle search errors', async () => {
      // Setup mock error
      supabase.select.mockResolvedValue({
        data: null,
        error: new Error('Search failed')
      });

      // Execute and verify
      await expect(RacketService.searchRackets('NOX')).rejects.toThrow('Error al buscar palas: Search failed');
    });
  });

  describe('getFilteredRackets', () => {
    test('should filter rackets by brand', async () => {
      // Setup mock
      supabase.select.mockResolvedValue({
        data: [mockSupabaseResponse.data[1]], // Only BULLPADEL racket
        error: null,
        count: 1
      });

      // Execute
      const filters: SearchFilters = { marca: 'BULLPADEL' };
      const result = await RacketService.getFilteredRackets(filters, undefined, 0, 10);

      // Verify
      expect(result).toBeDefined();
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('pagination');
      expect(result.data.length).toBe(1);
      expect(result.data[0]).toHaveProperty('marca', 'BULLPADEL');

      // Verify Supabase calls
      expect(supabase.eq).toHaveBeenCalledWith('marca', 'BULLPADEL');
    });

    test('should filter rackets by price range', async () => {
      // Setup mock with filtered results
      supabase.select.mockResolvedValue({
        data: mockSupabaseResponse.data, // Both rackets match price range in processing
        error: null,
        count: 2
      });

      // Execute
      const filters: SearchFilters = { precio_min: 100, precio_max: 300 };
      const result = await RacketService.getFilteredRackets(filters, undefined, 0, 10);

      // Verify
      expect(result).toBeDefined();
      expect(result.data.length).toBeGreaterThanOrEqual(0);
      
      // Verify all returned rackets match price filter
      result.data.forEach((racket: Racket) => {
        if (racket.precio_actual) {
          expect(racket.precio_actual).toBeGreaterThanOrEqual(100);
          expect(racket.precio_actual).toBeLessThanOrEqual(300);
        }
      });
    });

    test('should filter bestseller rackets', async () => {
      // Setup mock
      supabase.select.mockResolvedValue({
        data: [mockSupabaseResponse.data[1]], // Only bestseller racket
        error: null,
        count: 1
      });

      // Execute
      const filters: SearchFilters = { es_bestseller: true };
      const result = await RacketService.getFilteredRackets(filters, undefined, 0, 10);

      // Verify
      expect(result).toBeDefined();
      expect(result.data.length).toBe(1);
      expect(result.data[0]).toHaveProperty('es_bestseller', true);

      // Verify Supabase calls
      expect(supabase.eq).toHaveBeenCalledWith('es_bestseller', true);
    });
  });

  describe('getRacketsByBrand', () => {
    test('should return rackets by specific brand', async () => {
      // Setup mock
      supabase.select.mockResolvedValue({
        data: [mockSupabaseResponse.data[0]], // Only NOX racket
        error: null
      });

      // Execute
      const result = await RacketService.getRacketsByBrand('NOX');

      // Verify
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
      expect(result[0]).toHaveProperty('marca', 'NOX');

      // Verify Supabase calls
      expect(supabase.eq).toHaveBeenCalledWith('marca', 'NOX');
    });
  });

  describe('getBestsellerRackets', () => {
    test('should return only bestseller rackets', async () => {
      // Setup mock
      supabase.select.mockResolvedValue({
        data: [mockSupabaseResponse.data[1]], // Only bestseller racket
        error: null
      });

      // Execute
      const result = await RacketService.getBestsellerRackets();

      // Verify
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
      expect(result[0]).toHaveProperty('es_bestseller', true);

      // Verify Supabase calls
      expect(supabase.eq).toHaveBeenCalledWith('es_bestseller', true);
    });
  });

  describe('getRacketsOnSale', () => {
    test('should return only rackets on sale', async () => {
      // Setup mock
      supabase.select.mockResolvedValue({
        data: [mockSupabaseResponse.data[0]], // Only racket on sale
        error: null
      });

      // Execute
      const result = await RacketService.getRacketsOnSale();

      // Verify
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
      expect(result[0]).toHaveProperty('en_oferta', true);

      // Verify Supabase calls
      expect(supabase.eq).toHaveBeenCalledWith('en_oferta', true);
    });
  });

  describe('getBrands', () => {
    test('should return list of unique brands', async () => {
      // Setup mock
      supabase.select.mockResolvedValue({
        data: [
          { marca: 'NOX' },
          { marca: 'BULLPADEL' },
          { marca: 'NOX' }, // Duplicate
          { marca: 'BABOLAT' }
        ],
        error: null
      });

      // Execute
      const result = await RacketService.getBrands();

      // Verify
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(3); // Unique brands
      expect(result).toContain('NOX');
      expect(result).toContain('BULLPADEL');
      expect(result).toContain('BABOLAT');

      // Verify Supabase calls
      expect(supabase.select).toHaveBeenCalledWith('marca');
      expect(supabase.not).toHaveBeenCalledWith('marca', 'is', null);
    });
  });

  describe('getStats', () => {
    test('should return correct statistics', async () => {
      // Setup mocks for stats queries
      const mockStats = [
        { count: 100 }, // total
        { count: 25 },  // bestsellers
        { count: 15 },  // on sale
        { data: [{ marca: 'NOX' }, { marca: 'BULLPADEL' }, { marca: 'BABOLAT' }] } // brands
      ];

      supabase.select
        .mockResolvedValueOnce({ count: 100, error: null })
        .mockResolvedValueOnce({ count: 25, error: null })
        .mockResolvedValueOnce({ count: 15, error: null })
        .mockResolvedValueOnce({ 
          data: [{ marca: 'NOX' }, { marca: 'BULLPADEL' }, { marca: 'BABOLAT' }], 
          error: null 
        });

      // Execute
      const result = await RacketService.getStats();

      // Verify
      expect(result).toBeDefined();
      expect(result).toHaveProperty('total', 100);
      expect(result).toHaveProperty('bestsellers', 25);
      expect(result).toHaveProperty('onSale', 15);
      expect(result).toHaveProperty('brands', 3);
    });
  });
});