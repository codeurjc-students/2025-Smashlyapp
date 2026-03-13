import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { GeminiService } from '../../../src/services/geminiService';
import axios from 'axios';

vi.mock('axios');

describe('GeminiService', () => {
  let service: GeminiService;
  let originalEnv: string | undefined;

  const mockRackets = [
    { id: 1, nombre: 'Adidas Metalbone 3.1' },
    { id: 2, nombre: 'Bullpadel Vertex 04' },
  ] as any[];

  const mockComparisonResponse = {
    content: JSON.stringify({
      executiveSummary: 'Resumen ejecutivo de prueba.',
      metrics: [
        { racketId: 1, radarData: { potencia: 9, control: 6, manejabilidad: 7, puntoDulce: 7, salidaDeBola: 8 } },
        { racketId: 2, radarData: { potencia: 7, control: 9, manejabilidad: 9, puntoDulce: 9, salidaDeBola: 6 } },
      ],
    })
  };

  beforeEach(() => {
    originalEnv = process.env.FREE_AI_API_URL;
    process.env.FREE_AI_API_URL = 'http://test-api:3001';
    service = new GeminiService();
  });

  afterEach(() => {
    process.env.FREE_AI_API_URL = originalEnv;
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  describe('compareRackets', () => {
    it('should retry on 503 errors', async () => {
      vi.useFakeTimers();
      (axios.post as Mock)
        .mockRejectedValueOnce(new Error('503 Service Unavailable'))
        .mockResolvedValueOnce({ data: mockComparisonResponse });

      const promise = service.compareRackets(mockRackets);
      await vi.advanceTimersByTimeAsync(1000);
      const result = await promise;

      expect(result.executiveSummary).toBeDefined();
      expect(axios.post).toHaveBeenCalledTimes(2);
    });

    it('should return default metrics when JSON parsing fails', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      (axios.post as Mock).mockResolvedValueOnce({ data: { content: 'Invalid JSON' } });

      const result = await service.compareRackets(mockRackets);

      expect(result.metrics).toHaveLength(2);
      expect(result.metrics[0].radarData.potencia).toBe(5);
    });
  });
});
