import { describe, it, expect, vi } from 'vitest';
import { RacketService, calculateBestPrice, processRacketData } from '@services/racketService';
import { supabase } from '@config/supabase';

vi.mock('@config/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
    })),
  },
}));

describe('RacketService Helper Functions', () => {
  describe('calculateBestPrice', () => {
    it('should return the best price from available stores', () => {
      const racket = {
        padelnuestro_actual_price: 100,
        padelnuestro_original_price: 120,
        padelnuestro_discount_percentage: 16.67,
        padelnuestro_link: 'url1',
        padelmarket_actual_price: 90,
        padelmarket_original_price: 110,
        padelmarket_discount_percentage: 18.18,
        padelmarket_link: 'url2',
        padelproshop_actual_price: null,
        padelproshop_original_price: null,
        padelproshop_discount_percentage: null,
        padelproshop_link: null,
      } as any;

      const result = calculateBestPrice(racket);

      expect(result).toEqual({
        precio_actual: 90,
        precio_original: 110,
        descuento_porcentaje: 18.18,
        enlace: 'url2',
        fuente: 'padelmarket',
      });
    });

    it('should handle cases where some prices are null or zero', () => {
      const racket = {
        padelnuestro_actual_price: null,
        padelnuestro_original_price: null,
        padelnuestro_discount_percentage: null,
        padelnuestro_link: null,
        padelmarket_actual_price: 0,
        padelmarket_original_price: 100,
        padelmarket_discount_percentage: 0,
        padelmarket_link: 'url2',
        padelproshop_actual_price: 150,
        padelproshop_original_price: 200,
        padelproshop_discount_percentage: 25,
        padelproshop_link: 'url3',
      } as any;

      const result = calculateBestPrice(racket);

      expect(result).toEqual({
        precio_actual: 150,
        precio_original: 200,
        descuento_porcentaje: 25,
        enlace: 'url3',
        fuente: 'padelproshop',
      });
    });

    it('should return default values if no valid prices are available', () => {
      const racket = {
        padelnuestro_actual_price: null,
        padelnuestro_original_price: null,
        padelnuestro_discount_percentage: null,
        padelnuestro_link: null,
        padelmarket_actual_price: null,
        padelmarket_original_price: null,
        padelmarket_discount_percentage: null,
        padelmarket_link: null,
        padelproshop_actual_price: null,
        padelproshop_original_price: null,
        padelproshop_discount_percentage: null,
        padelproshop_link: null,
      } as any;

      const result = calculateBestPrice(racket);

      expect(result).toEqual({
        precio_actual: 0,
        precio_original: null,
        descuento_porcentaje: 0,
        enlace: '',
        fuente: 'No price available',
      });
    });
  });

  describe('processRacketData', () => {
    it('should process raw data and add computed fields', () => {
      const rawData = [
        {
          id: 1,
          name: 'Racket 1',
          on_offer: false,
          padelnuestro_actual_price: 100,
          padelnuestro_original_price: 120,
          padelnuestro_discount_percentage: 16.67,
          padelnuestro_link: 'url1',
          padelmarket_actual_price: null,
          padelmarket_original_price: null,
          padelmarket_discount_percentage: null,
          padelmarket_link: null,
          padelproshop_actual_price: null,
          padelproshop_original_price: null,
          padelproshop_discount_percentage: null,
          padelproshop_link: null,
          scraped_at: '2025-01-01T00:00:00.000Z',
        },
        {
          id: 2,
          name: 'Racket 2',
          on_offer: false,
          padelnuestro_actual_price: null,
          padelnuestro_original_price: null,
          padelnuestro_discount_percentage: null,
          padelnuestro_link: null,
          padelmarket_actual_price: 90,
          padelmarket_original_price: 110,
          padelmarket_discount_percentage: 18.18,
          padelmarket_link: 'url2',
          padelproshop_actual_price: null,
          padelproshop_original_price: null,
          padelproshop_discount_percentage: null,
          padelproshop_link: null,
          scraped_at: '2025-01-02T00:00:00.000Z',
        },
      ];

      const result = processRacketData(rawData);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(
        expect.objectContaining({
          id: 1,
          name: 'Racket 1',
          precio_actual: 100,
          precio_original: 120,
          descuento_porcentaje: 16.67,
          enlace: 'url1',
          fuente: 'padelnuestro',
          scrapeado_en: '2025-01-01T00:00:00.000Z',
        })
      );
      expect(result[1]).toEqual(
        expect.objectContaining({
          id: 2,
          name: 'Racket 2',
          precio_actual: 90,
          precio_original: 110,
          descuento_porcentaje: 18.18,
          enlace: 'url2',
          fuente: 'padelmarket',
          scrapeado_en: '2025-01-02T00:00:00.000Z',
        })
      );
    });

    it('should set scrapeado_en to current date if not provided', () => {
      const rawData = [
        {
          id: 1,
          name: 'Racket 1',
          on_offer: false,
          padelnuestro_actual_price: 100,
          padelnuestro_original_price: null,
          padelnuestro_discount_percentage: null,
          padelnuestro_link: 'url1',
          padelmarket_actual_price: null,
          padelmarket_original_price: null,
          padelmarket_discount_percentage: null,
          padelmarket_link: null,
          padelproshop_actual_price: null,
          padelproshop_original_price: null,
          padelproshop_discount_percentage: null,
          padelproshop_link: null,
        },
      ];

      const result = processRacketData(rawData);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(
        expect.objectContaining({
          id: 1,
          name: 'Racket 1',
          precio_actual: 100,
          enlace: 'url1',
          fuente: 'padelnuestro',
        })
      );
      expect((result[0] as any).scrapeado_en).toBeDefined();
      expect(typeof (result[0] as any).scrapeado_en).toBe('string');
    });
  });
});
