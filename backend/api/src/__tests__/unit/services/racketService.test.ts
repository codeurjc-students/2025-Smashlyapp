import {
  RacketService,
  calculateBestPrice,
  processRacketData,
} from "@services/racketService";
import { supabase } from "@config/supabase";

// Mockear supabase para evitar llamadas reales a la base de datos
jest.mock("@config/supabase", () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      not: jest.fn().mockReturnThis(),
    })),
  },
}));

describe("RacketService Helper Functions", () => {
  describe("calculateBestPrice", () => {
    it("should return the best price from available stores", () => {
      const racket = {
        padelnuestro_precio_actual: 100,
        padelnuestro_precio_original: 120,
        padelnuestro_descuento_porcentaje: 16.67,
        padelnuestro_enlace: "url1",
        padelmarket_precio_actual: 90,
        padelmarket_precio_original: 110,
        padelmarket_descuento_porcentaje: 18.18,
        padelmarket_enlace: "url2",
        padelpoint_precio_actual: 110,
        padelpoint_precio_original: 130,
        padelpoint_descuento_porcentaje: 15.38,
        padelpoint_enlace: "url3",
        padelproshop_precio_actual: null,
        padelproshop_precio_original: null,
        padelproshop_descuento_porcentaje: null,
        padelproshop_enlace: null,
      };

      const result = calculateBestPrice(racket);

      expect(result).toEqual({
        precio_actual: 90,
        precio_original: 110,
        descuento_porcentaje: 18.18,
        enlace: "url2",
        fuente: "padelmarket",
      });
    });

    it("should handle cases where some prices are null or zero", () => {
      const racket = {
        padelnuestro_precio_actual: null,
        padelnuestro_precio_original: null,
        padelnuestro_descuento_porcentaje: null,
        padelnuestro_enlace: null,
        padelmarket_precio_actual: 0,
        padelmarket_precio_original: 100,
        padelmarket_descuento_porcentaje: 0,
        padelmarket_enlace: "url2",
        padelpoint_precio_actual: 150,
        padelpoint_precio_original: 200,
        padelpoint_descuento_porcentaje: 25,
        padelpoint_enlace: "url3",
      };

      const result = calculateBestPrice(racket);

      expect(result).toEqual({
        precio_actual: 150,
        precio_original: 200,
        descuento_porcentaje: 25,
        enlace: "url3",
        fuente: "padelpoint",
      });
    });

    it("should return default values if no valid prices are available", () => {
      const racket = {
        padelnuestro_precio_actual: null,
        padelnuestro_precio_original: null,
        padelnuestro_descuento_porcentaje: null,
        padelnuestro_enlace: null,
        padelmarket_precio_actual: null,
        padelmarket_precio_original: null,
        padelmarket_descuento_porcentaje: null,
        padelmarket_enlace: null,
        padelpoint_precio_actual: null,
        padelpoint_precio_original: null,
        padelpoint_descuento_porcentaje: null,
        padelpoint_enlace: null,
        padelproshop_precio_actual: null,
        padelproshop_precio_original: null,
        padelproshop_descuento_porcentaje: null,
        padelproshop_enlace: null,
      };

      const result = calculateBestPrice(racket);

      expect(result).toEqual({
        precio_actual: 0,
        precio_original: null,
        descuento_porcentaje: 0,
        enlace: "",
        fuente: "Sin precio disponible",
      });
    });
  });

  describe("processRacketData", () => {
    it("should process raw data and add computed fields", () => {
      const rawData = [
        {
          id: 1,
          nombre: "Racket 1",
          padelnuestro_precio_actual: 100,
          padelnuestro_precio_original: 120,
          padelnuestro_descuento_porcentaje: 16.67,
          padelnuestro_enlace: "url1",
          scrapeado_en: "2025-01-01T00:00:00.000Z",
        },
        {
          id: 2,
          nombre: "Racket 2",
          padelmarket_precio_actual: 90,
          padelmarket_precio_original: 110,
          padelmarket_descuento_porcentaje: 18.18,
          padelmarket_enlace: "url2",
          scrapeado_en: "2025-01-02T00:00:00.000Z",
        },
      ];

      const result = processRacketData(rawData);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(
        expect.objectContaining({
          id: 1,
          nombre: "Racket 1",
          precio_actual: 100,
          precio_original: 120,
          descuento_porcentaje: 16.67,
          enlace: "url1",
          fuente: "padelnuestro",
          scrapeado_en: "2025-01-01T00:00:00.000Z",
        })
      );
      expect(result[1]).toEqual(
        expect.objectContaining({
          id: 2,
          nombre: "Racket 2",
          precio_actual: 90,
          precio_original: 110,
          descuento_porcentaje: 18.18,
          enlace: "url2",
          fuente: "padelmarket",
          scrapeado_en: "2025-01-02T00:00:00.000Z",
        })
      );
    });

    it("should set scrapeado_en to current date if not provided", () => {
      const rawData = [
        {
          id: 1,
          nombre: "Racket 1",
          padelnuestro_precio_actual: 100,
          padelnuestro_enlace: "url1",
        },
      ];

      const result = processRacketData(rawData);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(
        expect.objectContaining({
          id: 1,
          nombre: "Racket 1",
          precio_actual: 100,
          enlace: "url1",
          fuente: "padelnuestro",
        })
      );
      expect(result[0].scrapeado_en).toBeDefined();
      expect(typeof result[0].scrapeado_en).toBe("string");
    });
  });
});
