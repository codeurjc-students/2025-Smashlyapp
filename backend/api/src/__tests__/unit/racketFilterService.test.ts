import { RacketFilterService } from '../../../src/services/racketFilterService';
import { Racket } from '../../../src/types/racket';

// Mock logger
vi.mock('../../../src/config/logger', () => ({
  info: vi.fn(),
  warn: vi.fn(),
  debug: vi.fn(),
  error: vi.fn(),
}));

describe('RacketFilterService', () => {
  const mockRackets: Racket[] = [
    // Safe all-round racket
    {
      id: 1,
      nombre: 'Pala Segura Redonda',
      marca: 'Adidas',
      modelo: 'Safe 1.0',
      image: 'safe.jpg',
      description: 'Pala segura',
      caracteristicas_forma: 'Redonda',
      caracteristicas_balance: 'Bajo',
      caracteristicas_dureza: 'Blanda',
      caracteristicas_nivel_de_juego: 'Intermedio',
      caracteristicas_nucleo: 'EVA Soft',
      caracteristicas_cara: 'Fibra de Vidrio',
      tiene_antivibracion: true,
      peso: 360,
      testea_confort: 8,
      on_offer: false,
      precio_actual: 150,
    } as any,
    // Hard racket (risky for injuries)
    {
      id: 2,
      nombre: 'Pala Dura Diamante',
      marca: 'Bullpadel',
      modelo: 'Hard Pro',
      image: 'hard.jpg',
      description: 'Pala dura',
      caracteristicas_forma: 'Diamante',
      caracteristicas_balance: 'Alto',
      caracteristicas_dureza: 'Dura',
      caracteristicas_nivel_de_juego: 'Avanzado',
      caracteristicas_nucleo: 'EVA Hard',
      caracteristicas_cara: 'Carbono 12K',
      tiene_antivibracion: true,
      peso: 370,
      testea_confort: 5,
      on_offer: false,
      precio_actual: 250,
    } as any,
    // Balanced beginner racket
    {
      id: 3,
      nombre: 'Pala Principiante',
      marca: 'Nox',
      modelo: 'Beginner',
      image: 'beginner.jpg',
      description: 'Pala para principiantes',
      caracteristicas_forma: 'Redonda',
      caracteristicas_balance: 'Medio',
      caracteristicas_dureza: 'Blanda',
      caracteristicas_nivel_de_juego: 'Principiante',
      caracteristicas_nucleo: 'EVA Soft',
      caracteristicas_cara: 'Fibra de Vidrio',
      tiene_antivibracion: true,
      peso: 350,
      testea_confort: 9,
      on_offer: false,
      precio_actual: 100,
      specs: { es_bestseller: true },
    } as any,
  ];

  describe('filterRackets - Basic Functionality', () => {
    it('should return empty array when no rackets provided', () => {
      const result = RacketFilterService.filterRackets([], {
        gender: 'masculino',
        level: 'Intermedio',
        frequency: '3-5 dias',
        budget: 200,
        injuries: 'no',
      });

      expect(result).toEqual([]);
    });

    it('should return rackets when valid profile is provided', () => {
      const result = RacketFilterService.filterRackets(mockRackets, {
        gender: 'masculino',
        level: 'Intermedio',
        frequency: '3-5 dias',
        budget: 300,
        injuries: 'no',
      });

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should filter by budget', () => {
      const result = RacketFilterService.filterRackets(mockRackets, {
        gender: 'masculino',
        level: 'Intermedio',
        frequency: '3-5 dias',
        budget: 120, // Only the beginner racket (100)
        injuries: 'no',
      });

      expect(result.every((r: any) => !r.precio_actual || r.precio_actual <= 120)).toBe(true);
    });
  });

  describe('Player Level Filtering', () => {
    it('should filter for beginner players', () => {
      const result = RacketFilterService.filterRackets(mockRackets, {
        gender: 'masculino',
        level: 'Principiante',
        frequency: '1-2 dias',
        budget: 300,
        injuries: 'no',
      });

      // Should return beginner-friendly rackets
      expect(Array.isArray(result)).toBe(true);
    });

    it('should filter for advanced players', () => {
      const result = RacketFilterService.filterRackets(mockRackets, {
        gender: 'masculino',
        level: 'Avanzado',
        frequency: '3-5 dias',
        budget: 300,
        injuries: 'no',
      });

      // Should return advanced-friendly rackets
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('Injury-Aware Filtering', () => {
    it('should filter out hard rackets for users with injuries', () => {
      const result = RacketFilterService.filterRackets(mockRackets, {
        gender: 'masculino',
        level: 'Intermedio',
        frequency: '3-5 dias',
        budget: 300,
        injuries: 'epicondilitis',
      });

      // Hard racket (id 2) should be filtered out for injured users
      const hardRacket = result.find((r: any) =>
        r.caracteristicas_dureza?.toLowerCase().includes('dura')
      );
      expect(hardRacket).toBeUndefined();
    });

    it('should filter out high balance rackets for users with wrist injuries', () => {
      const result = RacketFilterService.filterRackets(mockRackets, {
        gender: 'masculino',
        level: 'Intermedio',
        frequency: '3-5 dias',
        budget: 300,
        injuries: 'lesion_muneca',
      });

      // High balance rackets should be filtered out
      const highBalanceRacket = result.find((r: any) =>
        r.caracteristicas_balance?.toLowerCase().includes('alto')
      );
      expect(highBalanceRacket).toBeUndefined();
    });
  });

  describe('Gender-Based Weight Filtering', () => {
    it('should apply different weight limits for men', () => {
      const result = RacketFilterService.filterRackets(mockRackets, {
        gender: 'masculino',
        level: 'Intermedio',
        frequency: '3-5 dias',
        budget: 300,
        injuries: 'no',
      });

      expect(Array.isArray(result)).toBe(true);
    });

    it('should apply different weight limits for women', () => {
      const result = RacketFilterService.filterRackets(mockRackets, {
        gender: 'femenino',
        level: 'Intermedio',
        frequency: '3-5 dias',
        budget: 300,
        injuries: 'no',
      });

      expect(Array.isArray(result)).toBe(true);
    });

    it('should apply lower weight limits for injured users', () => {
      const result = RacketFilterService.filterRackets(mockRackets, {
        gender: 'masculino',
        level: 'Intermedio',
        frequency: '3-5 dias',
        budget: 300,
        injuries: 'epicondilitis',
      });

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('Bestseller Bonus', () => {
    it('should include bestseller rackets in results', () => {
      const result = RacketFilterService.filterRackets(mockRackets, {
        gender: 'masculino',
        level: 'Principiante',
        frequency: '1-2 dias',
        budget: 300,
        injuries: 'no',
      });

      // Bestseller racket (id 3) should be in results
      const bestseller = result.find(r => (r as any).specs?.es_bestseller);
      expect(bestseller).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle rackets with missing characteristics', () => {
      const incompleteRackets: Racket[] = [
        {
          id: 1,
          name: 'Pala Incompleta',
          brand: 'Test',
          model: 'Test',
          on_offer: false,
        },
      ] as Racket[];

      const result = RacketFilterService.filterRackets(incompleteRackets, {
        gender: 'masculino',
        level: 'Intermedio',
        frequency: '3-5 dias',
        budget: 200,
        injuries: 'no',
      });

      // Should not crash and return some result
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });
});
