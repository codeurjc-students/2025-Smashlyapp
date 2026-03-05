import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { GeminiService } from '../../../src/services/geminiService';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Mock the GoogleGenerativeAI
vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
    getGenerativeModel: vi.fn().mockReturnValue({
      generateContent: vi.fn(),
    }),
  })),
}));

describe('GeminiService', () => {
  let service: GeminiService;
  let mockGenerateContent: Mock;
  let originalEnv: string | undefined;

  const mockRackets = [
    {
      id: 1,
      nombre: 'Adidas Metalbone 3.1',
      marca: 'Adidas',
      modelo: 'Metalbone 3.1',
      caracteristicas_forma: 'Diamante',
      caracteristicas_nucleo: 'EVA Soft',
      caracteristicas_cara: 'Carbono 2D',
      caracteristicas_balance: 'Alto',
      caracteristicas_dureza: 'Dura',
      caracteristicas_nivel_de_juego: 'Avanzado',
    },
    {
      id: 2,
      nombre: 'Bullpadel Vertex 04',
      marca: 'Bullpadel',
      modelo: 'Vertex 04',
      caracteristicas_forma: 'Redonda',
      caracteristicas_nucleo: 'EVA Medium',
      caracteristicas_cara: 'Fibra de Vidrio',
      caracteristicas_balance: 'Bajo',
      caracteristicas_dureza: 'Blanda',
      caracteristicas_nivel_de_juego: 'Intermedio',
    },
  ] as any[];

  const mockComparisonResponse = JSON.stringify({
    executiveSummary: 'Resumen ejecutivo de prueba.',
    technicalAnalysis: [
      { title: 'Potencia', content: 'Análisis de potencia.' },
      { title: 'Control', content: 'Análisis de control.' },
    ],
    comparisonTable: [
      { feature: 'Forma', 'Adidas Metalbone 3.1': 'Diamante', 'Bullpadel Vertex 04': 'Redonda' },
    ],
    metrics: [
      {
        racketId: 1,
        racketName: 'Adidas Metalbone 3.1',
        isCertified: true,
        radarData: { potencia: 9, control: 6, manejabilidad: 7, puntoDulce: 7, salidaDeBola: 8 },
      },
      {
        racketId: 2,
        racketName: 'Bullpadel Vertex 04',
        isCertified: true,
        radarData: { potencia: 7, control: 9, manejabilidad: 9, puntoDulce: 9, salidaDeBola: 6 },
      },
    ],
    recommendedProfiles: 'Perfiles recomendados.',
    biomechanicalConsiderations: 'Consideraciones biomecánicas.',
    conclusion: 'Conclusión de prueba.',
    _reasoning: 'Razonamiento de prueba.',
  });

  beforeEach(() => {
    originalEnv = process.env.GEMINI_API_KEY;
    process.env.GEMINI_API_KEY = 'test-api-key';

    // Mock model instance
    const mockModelInstance = {
      generateContent: vi.fn(),
    };

    // @ts-ignore
    (GoogleGenerativeAI as any).mockImplementation(() => ({
      getGenerativeModel: vi.fn().mockReturnValue(mockModelInstance),
    }));

    mockGenerateContent = mockModelInstance.generateContent as Mock;
    service = new GeminiService();
  });

  afterEach(() => {
    process.env.GEMINI_API_KEY = originalEnv;
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  describe('constructor', () => {
    it('should initialize without error when GEMINI_API_KEY is set', () => {
      process.env.GEMINI_API_KEY = 'test-api-key';
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const newService = new GeminiService();
      expect(newService).toBeDefined();
      expect(consoleWarnSpy).not.toHaveBeenCalled();
      consoleWarnSpy.mockRestore();
    });

    it('should warn when GEMINI_API_KEY is not set', () => {
      delete process.env.GEMINI_API_KEY;
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const newService = new GeminiService();
      expect(newService).toBeDefined();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('GEMINI_API_KEY is not set')
      );
      consoleWarnSpy.mockRestore();
    });
  });

  describe('compareRackets', () => {
    it('should throw error when GEMINI_API_KEY is not configured', async () => {
      delete process.env.GEMINI_API_KEY;
      const newService = new GeminiService();
      await expect(newService.compareRackets(mockRackets)).rejects.toThrow(
        'GEMINI_API_KEY no está configurada en el servidor'
      );
    });

    it('should throw error when less than 2 rackets provided', async () => {
      await expect(service.compareRackets([mockRackets[0]])).rejects.toThrow(
        'Se necesitan al menos 2 palas para comparar'
      );
    });

    it('should retry on 503 errors with exponential backoff', async () => {
      vi.useFakeTimers();

      mockGenerateContent
        .mockRejectedValueOnce(new Error('503 Service Unavailable'))
        .mockRejectedValueOnce(new Error('overloaded'))
        .mockResolvedValueOnce({
          response: {
            text: vi.fn().mockReturnValue(mockComparisonResponse),
          },
        });

      const promise = service.compareRackets(mockRackets);

      await vi.advanceTimersByTimeAsync(1000);
      await vi.advanceTimersByTimeAsync(2000);

      const result = await promise;

      expect(result.executiveSummary).toBeDefined();
      expect(mockGenerateContent).toHaveBeenCalledTimes(3);
    });

    it('should retry on 429 rate limit errors', async () => {
      vi.useFakeTimers();

      mockGenerateContent
        .mockRejectedValueOnce(new Error('429 Too Many Requests'))
        .mockResolvedValueOnce({
          response: {
            text: vi.fn().mockReturnValue(mockComparisonResponse),
          },
        });

      const promise = service.compareRackets(mockRackets);

      await vi.advanceTimersByTimeAsync(2000);

      const result = await promise;

      expect(result.executiveSummary).toBeDefined();
      expect(mockGenerateContent).toHaveBeenCalledTimes(2);
    });

    it('should throw error after max retries exhausted', async () => {
      vi.useFakeTimers();

      mockGenerateContent.mockRejectedValue(new Error('503 Service Unavailable'));

      const promise = service.compareRackets(mockRackets);

      await vi.advanceTimersByTimeAsync(1000);
      await vi.advanceTimersByTimeAsync(2000);

      await expect(promise).rejects.toThrow('Error al generar la comparación con IA');
      expect(mockGenerateContent).toHaveBeenCalledTimes(3);
    });
  });

  describe('parseResponse', () => {
    it('should parse JSON response correctly', async () => {
      const mockResponse = {
        response: {
          text: vi.fn().mockReturnValue(mockComparisonResponse),
        },
      };
      mockGenerateContent.mockResolvedValue(mockResponse);

      const result = await service.compareRackets(mockRackets);

      expect(result.executiveSummary).toContain('Resumen ejecutivo');
      expect(result.metrics).toHaveLength(2);
      expect(result.metrics[0].radarData.potencia).toBe(9);
    });

    it('should handle JSON wrapped in markdown code blocks', async () => {
      const responseWithMarkdown = `
\`\`\`json
${mockComparisonResponse}
\`\`\`
`;
      const mockResponse = {
        response: {
          text: vi.fn().mockReturnValue(responseWithMarkdown),
        },
      };
      mockGenerateContent.mockResolvedValue(mockResponse);

      const result = await service.compareRackets(mockRackets);

      expect(result.metrics).toHaveLength(2);
      expect(result.metrics[0].radarData.potencia).toBe(9);
    });

    it('should return default metrics when JSON parsing fails', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const mockResponse = {
        response: {
          text: vi.fn().mockReturnValue('Invalid JSON content'),
        },
      };
      mockGenerateContent.mockResolvedValue(mockResponse);

      const result = await service.compareRackets(mockRackets);

      expect(result.metrics).toHaveLength(2);
      expect(result.metrics[0].radarData.potencia).toBe(5);
      consoleErrorSpy.mockRestore();
    });
  });

  describe('buildRacketsInfo', () => {
    it('should build correct rackets info string', async () => {
      const mockResponse = {
        response: {
          text: vi.fn().mockReturnValue(mockComparisonResponse),
        },
      };
      mockGenerateContent.mockResolvedValue(mockResponse);

      await service.compareRackets(mockRackets);

      const callArgs = mockGenerateContent.mock.calls[0][0];

      expect(callArgs).toContain('PALA 1');
      expect(callArgs).toContain('Nombre: Adidas Metalbone 3.1');
      expect(callArgs).toContain('Forma: Diamante');
    });
  });
});
