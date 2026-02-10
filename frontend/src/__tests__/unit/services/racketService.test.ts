import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { RacketService } from '@/services/racketService';
import { API_ENDPOINTS, buildApiUrl, getCommonHeaders } from '@/config/api';

// Mock fetch
global.fetch = vi.fn();

// Mock config
vi.mock('@/config/api', async () => {
  const actual = await vi.importActual('@/config/api');
  return {
    ...actual,
    buildApiUrl: vi.fn((endpoint: string, params?: Record<string, any>) => {
      const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
      return `http://localhost:3000${endpoint}${queryString}`;
    }),
    getCommonHeaders: vi.fn(() => ({
      'Content-Type': 'application/json',
    })),
  };
});

const mockRackets = [
  {
    id: 1,
    nombre: 'Adidas Metalbone 3.1',
    marca: 'Adidas',
    modelo: 'Metalbone 3.1',
    imagenes: ['metalbone.jpg'],
    descripcion: 'Pala de potencia',
    precio_actual: 250,
    precio_original: 280,
    descuento_porcentaje: 11,
    en_oferta: true,
    enlace: 'https://padelmarket.com/pala1',
    fuente: 'padelmarket',
  },
  {
    id: 2,
    nombre: 'Bullpadel Vertex 04',
    marca: 'Bullpadel',
    modelo: 'Vertex 04',
    imagenes: ['vertex.jpg'],
    descripcion: 'Pala de control',
    precio_actual: 180,
    precio_original: 200,
    descuento_porcentaje: 10,
    en_oferta: true,
    enlace: 'https://padelnuestro.com/pala2',
    fuente: 'padelnuestro',
  },
];

describe('RacketService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getAllRackets', () => {
    it('should fetch all rackets successfully', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: mockRackets,
        }),
      });

      const result = await RacketService.getAllRackets();

      expect(result).toEqual(mockRackets);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/rackets'),
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    it('should throw error when response is not ok', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ message: 'Server error' }),
      });

      await expect(RacketService.getAllRackets()).rejects.toThrow('Server error');
    });

    it('should throw error when success is false', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: false,
          message: 'Invalid request',
        }),
      });

      await expect(RacketService.getAllRackets()).rejects.toThrow('Invalid request');
    });

    it('should handle network errors', async () => {
      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      await expect(RacketService.getAllRackets()).rejects.toThrow('Network error');
    });
  });

  describe('getRacketsWithPagination', () => {
    it('should fetch paginated rackets with default params', async () => {
      const mockResponse = {
        items: [mockRackets[0]],
        pagination: { total: 1, page: 0, limit: 50 },
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: mockResponse,
        }),
      });

      const result = await RacketService.getRacketsWithPagination();

      expect(result).toEqual([mockRackets[0]]);
    });

    it('should fetch paginated rackets with custom params', async () => {
      const mockResponse = {
        items: mockRackets,
        pagination: { total: 2, page: 0, limit: 10 },
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: mockResponse,
        }),
      });

      const result = await RacketService.getRacketsWithPagination(0, 10);

      expect(result).toEqual(mockRackets);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('page=0&limit=10&paginated=true'),
        expect.any(Object)
      );
    });

    it('should handle response without items property', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: mockRackets,
        }),
      });

      const result = await RacketService.getRacketsWithPagination();

      expect(result).toEqual(mockRackets);
    });
  });

  describe('getRacketById', () => {
    it('should fetch racket by id successfully', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: mockRackets[0],
        }),
      });

      const result = await RacketService.getRacketById(1);

      expect(result).toEqual(mockRackets[0]);
    });

    it('should return null when racket is not found (404)', async () => {
      (global.fetch as any).mockResolvedValue({
        status: 404,
        ok: false,
      });

      const result = await RacketService.getRacketById(999);

      expect(result).toBeNull();
    });

    it('should return null when error message contains 404', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ message: 'Error 404 - Not Found' }),
      });

      const result = await RacketService.getRacketById(999);

      expect(result).toBeNull();
    });

    it('should throw error for non-404 errors', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ message: 'Server error' }),
      });

      await expect(RacketService.getRacketById(1)).rejects.toThrow('Server error');
    });
  });

  describe('getRacketByName', () => {
    it('should find racket by exact name match', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: mockRackets,
        }),
      });

      const result = await RacketService.getRacketByName('Adidas Metalbone 3.1');

      expect(result).toEqual(mockRackets[0]);
    });

    it('should return null when no match found', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: mockRackets,
        }),
      });

      const result = await RacketService.getRacketByName('Non-existent Racket');

      expect(result).toBeNull();
    });

    it('should return null on error', async () => {
      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      const result = await RacketService.getRacketByName('Test Racket');

      expect(result).toBeNull();
    });
  });

  describe('searchRackets', () => {
    it('should search rackets by query', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: [mockRackets[0]],
        }),
      });

      const result = await RacketService.searchRackets('Adidas');

      expect(result).toEqual([mockRackets[0]]);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('q=Adidas'),
        expect.any(Object)
      );
    });

    it('should throw error on search failure', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ message: 'Search failed' }),
      });

      await expect(RacketService.searchRackets('test')).rejects.toThrow('Search failed');
    });
  });

  describe('getRacketsByBrand', () => {
    it('should fetch rackets by brand', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: [mockRackets[0]],
        }),
      });

      const result = await RacketService.getRacketsByBrand('Adidas');

      expect(result).toEqual([mockRackets[0]]);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/brands/Adidas'),
        expect.any(Object)
      );
    });
  });

  describe('getBestsellerRackets', () => {
    it('should fetch bestseller rackets', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: [mockRackets[0]],
        }),
      });

      const result = await RacketService.getBestsellerRackets();

      expect(result).toEqual([mockRackets[0]]);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/bestsellers'),
        expect.any(Object)
      );
    });
  });

  describe('getRacketsOnSale', () => {
    it('should fetch rackets on sale', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: mockRackets,
        }),
      });

      const result = await RacketService.getRacketsOnSale();

      expect(result).toEqual(mockRackets);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/offers'),
        expect.any(Object)
      );
    });
  });

  describe('getUniqueBrands', () => {
    it('should fetch unique brands', async () => {
      const brands = ['Adidas', 'Bullpadel', 'Nox'];

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: brands,
        }),
      });

      const result = await RacketService.getUniqueBrands();

      expect(result).toEqual(brands);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/brands'),
        expect.any(Object)
      );
    });
  });

  describe('getStats', () => {
    it('should fetch racket statistics', async () => {
      const stats = {
        total: 1000,
        bestsellers: 50,
        onSale: 200,
        brands: 15,
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: stats,
        }),
      });

      const result = await RacketService.getStats();

      expect(result).toEqual(stats);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/stats'),
        expect.any(Object)
      );
    });
  });
});
