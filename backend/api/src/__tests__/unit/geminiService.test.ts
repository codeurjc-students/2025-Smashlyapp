import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GeminiService } from '../../../src/services/geminiService';
import { Racket } from '../../../src/types/racket';

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
  let mockGenerateContent: vi.Mock;

  const mockRackets = [
    {
      id: 1,
      nombre: 'Adidas Metalbone 3.1',
      marca: 'Adidas',
      modelo: 'Metalbone 3.1',
      name: 'Adidas Metalbone 3.1',
      brand: 'Adidas',
      model: 'Metalbone 3.1',
      image: 'metalbone.jpg',
      description: 'Pala de potencia',
      caracteristicas_marca: 'Adidas',
      caracteristicas_forma: 'Diamante',
      caracteristicas_nucleo: 'EVA Soft',
      caracteristicas_cara: 'Carbono 2D',
      caracteristicas_balance: 'Alto',
      caracteristicas_dureza: 'Dura',
      caracteristicas_nivel_de_juego: 'Avanzado',
      characteristics_brand: 'Adidas',
      characteristics_shape: 'Diamante',
      characteristics_core: 'EVA Soft',
      characteristics_face: 'Carbono 2D',
      characteristics_balance: 'Alto',
      characteristics_hardness: 'Dura',
      characteristics_game_level: 'Avanzado',
      on_offer: true,
    },
    {
      id: 2,
      nombre: 'Bullpadel Vertex 04',
      marca: 'Bullpadel',
      modelo: 'Vertex 04',
      name: 'Bullpadel Vertex 04',
      brand: 'Bullpadel',
      model: 'Vertex 04',
      image: 'vertex.jpg',
      description: 'Pala de control',
      caracteristicas_marca: 'Bullpadel',
      caracteristicas_forma: 'Redonda',
      caracteristicas_nucleo: 'EVA Medium',
      caracteristicas_cara: 'Fibra de Vidrio',
      caracteristicas_balance: 'Bajo',
      caracteristicas_dureza: 'Blanda',
      caracteristicas_nivel_de_juego: 'Intermedio',
      characteristics_brand: 'Bullpadel',
      characteristics_shape: 'Redonda',
      characteristics_core: 'EVA Medium',
      characteristics_face: 'Fibra de Vidrio',
      characteristics_balance: 'Bajo',
      characteristics_hardness: 'Blanda',
      characteristics_game_level: 'Intermedio',
      on_offer: true,
    },
  ] as any[];

  const mockUserProfile = {
    gameLevel: 'Intermedio',
    playingStyle: 'Polivalente',
    weight: '75kg',
    height: '180cm',
    age: '30',
    experience: '2 años',
    preferences: 'Control y potencia equilibrados',
  };

  beforeEach(async () => {
    // Save original env
    const originalEnv = process.env.GEMINI_API_KEY;

    // Set up mock
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const mockModel = {
      generateContent: vi.fn(),
    };
    (GoogleGenerativeAI as vi.Mock).mockImplementation(() => ({
      getGenerativeModel: vi.fn().mockReturnValue(mockModel),
    }));

    mockGenerateContent = mockModel.generateContent;
    service = new GeminiService();

    // Restore env if needed
    if (originalEnv) {
      process.env.GEMINI_API_KEY = originalEnv;
    }
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const mockComparisonResponse = `
### 📊 RESUMEN EJECUTIVO
La Adidas Metalbone 3.1 es ideal para jugadores ofensivos que buscan máxima potencia, mientras que la Bullpadel Vertex 04 es mejor para jugadores que priorizan el control y la manejabilidad.

### 🔬 ANÁLISIS TÉCNICO DE MATERIALES

#### Adidas Metalbone 3.1
**Núcleo:** EVA Soft
**Caras:** Carbono 2D
**Geometría:** Diamante
**Comportamiento:** Tacto Duro, Punto Dulce Medio, Transmisión Alta

#### Bullpadel Vertex 04
**Núcleo:** EVA Medium
**Caras:** Fibra de Vidrio
**Geometría:** Redonda
**Comportamiento:** Tacto Blando, Punto Dulce Grande, Transmisión Baja

===METRICS===
[
  {"racketName": "Adidas Metalbone 3.1", "potencia": 9, "control": 6, "salidaDeBola": 8, "manejabilidad": 7, "puntoDulce": 7},
  {"racketName": "Bullpadel Vertex 04", "potencia": 7, "control": 9, "salidaDeBola": 6, "manejabilidad": 9, "puntoDulce": 9}
]
`;

  describe('constructor', () => {
    it('should initialize without error when GEMINI_API_KEY is set', () => {
      process.env.GEMINI_API_KEY = 'test-api-key';
      const newService = new GeminiService();
      expect(newService).toBeInstanceOf(GeminiService);
    });

    it('should warn but initialize when GEMINI_API_KEY is not set', () => {
      delete process.env.GEMINI_API_KEY;
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation();
      const newService = new GeminiService();
      expect(newService).toBeInstanceOf(GeminiService);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'GEMINI_API_KEY is not set in environment variables'
      );
      consoleWarnSpy.mockRestore();
    });
  });

  describe('compareRackets', () => {
    it('should throw error when GEMINI_API_KEY is not configured', async () => {
      delete process.env.GEMINI_API_KEY;
      const newService = new GeminiService();

      await expect(
        newService.compareRackets(mockRackets)
      ).rejects.toThrow('GEMINI_API_KEY no está configurada en el servidor');
    });

    it('should throw error when less than 2 rackets provided', async () => {
      process.env.GEMINI_API_KEY = 'test-api-key';
      const newService = new GeminiService();

      await expect(
        newService.compareRackets([mockRackets[0]])
      ).rejects.toThrow('Se necesitan al menos 2 palas para comparar');
    });

    it('should throw error when no rackets provided', async () => {
      process.env.GEMINI_API_KEY = 'test-api-key';
      const newService = new GeminiService();

      await expect(
        newService.compareRackets([])
      ).rejects.toThrow('Se necesitan al menos 2 palas para comparar');
    });

    it('should successfully compare rackets and return text and metrics', async () => {
      process.env.GEMINI_API_KEY = 'test-api-key';

      const mockResponse = {
        response: {
          text: vi.fn().mockReturnValue(mockComparisonResponse),
        },
      };
      mockGenerateContent.mockResolvedValue(mockResponse);

      const result = await service.compareRackets(mockRackets);

      expect(result).toHaveProperty('textComparison');
      expect(result).toHaveProperty('metrics');
      expect(result.metrics).toHaveLength(2);
      expect(result.metrics[0].racketName).toBe('Adidas Metalbone 3.1');
      expect(result.metrics[0].potencia).toBe(9);
      expect(result.metrics[1].racketName).toBe('Bullpadel Vertex 04');
      expect(result.metrics[1].control).toBe(9);
      expect(mockGenerateContent).toHaveBeenCalledTimes(1);
    });

    it('should include user context in comparison when profile is provided', async () => {
      process.env.GEMINI_API_KEY = 'test-api-key';

      const mockResponse = {
        response: {
          text: vi.fn().mockReturnValue(mockComparisonResponse),
        },
      };
      mockGenerateContent.mockResolvedValue(mockResponse);

      await service.compareRackets(mockRackets, mockUserProfile);

      const callArgs = mockGenerateContent.mock.calls[0][0];
      expect(callArgs).toContain('CONTEXTO DEL USUARIO');
      expect(callArgs).toContain('Nivel de juego: Intermedio');
      expect(callArgs).toContain('Estilo de juego: Polivalente');
    });

    it('should handle 3 rackets in comparison', async () => {
      process.env.GEMINI_API_KEY = 'test-api-key';

      const threeRackets = [
        ...mockRackets,
        {
          id: 3,
          nombre: 'Nox ML10',
          marca: 'Nox',
          modelo: 'ML10',
          name: 'Nox ML10',
          brand: 'Nox',
          model: 'ML10',
          imagen: 'nox.jpg',
          descripcion: 'Pala polivalente',
          caracteristicas_nivel_de_juego: 'Avanzado',
          precio_actual: 220,
          precio_original: 240,
          descuento_porcentaje: 8,
          en_oferta: true,
          enlace: 'https://example.com/pala3',
          fuente: 'padelproshop',
          scrapeado_en: '2025-01-01T00:00:00.000Z',
        },
      ];

      const mockResponse = {
        response: {
          text: vi.fn().mockReturnValue(mockComparisonResponse),
        },
      };
      mockGenerateContent.mockResolvedValue(mockResponse);

      await service.compareRackets(threeRackets);

      const callArgs = mockGenerateContent.mock.calls[0][0];
      // Check that all three racket names are in the prompt
      expect(callArgs).toContain('Adidas Metalbone 3.1');
      expect(callArgs).toContain('Bullpadel Vertex 04');
      expect(callArgs).toContain('Nox ML10');
    });

    it('should retry on 503 errors with exponential backoff', async () => {
      process.env.GEMINI_API_KEY = 'test-api-key';

      // Fail twice with 503, then succeed
      mockGenerateContent
        .mockRejectedValueOnce(new Error('503 Service Unavailable'))
        .mockRejectedValueOnce(new Error('overloaded'))
        .mockResolvedValueOnce({
          response: {
            text: vi.fn().mockReturnValue(mockComparisonResponse),
          },
        });

      const result = await service.compareRackets(mockRackets);

      expect(result.textComparison).toContain('RESUMEN EJECUTIVO');
      expect(mockGenerateContent).toHaveBeenCalledTimes(3);
    });

    it('should retry on 429 rate limit errors', async () => {
      process.env.GEMINI_API_KEY = 'test-api-key';

      mockGenerateContent
        .mockRejectedValueOnce(new Error('429 Too Many Requests'))
        .mockResolvedValueOnce({
          response: {
            text: vi.fn().mockReturnValue(mockComparisonResponse),
          },
        });

      const result = await service.compareRackets(mockRackets);

      expect(result.textComparison).toContain('RESUMEN EJECUTIVO');
      expect(mockGenerateContent).toHaveBeenCalledTimes(2);
    });

    it('should throw error after max retries exhausted', async () => {
      process.env.GEMINI_API_KEY = 'test-api-key';

      mockGenerateContent.mockRejectedValue(new Error('503 Service Unavailable'));

      await expect(service.compareRackets(mockRackets)).rejects.toThrow(
        'Error al generar la comparación con IA'
      );
      expect(mockGenerateContent).toHaveBeenCalledTimes(3);
    });

    it('should throw error immediately on non-retryable errors', async () => {
      process.env.GEMINI_API_KEY = 'test-api-key';

      mockGenerateContent.mockRejectedValue(new Error('Invalid API Key'));

      await expect(service.compareRackets(mockRackets)).rejects.toThrow(
        'Error al generar la comparación con IA'
      );
      expect(mockGenerateContent).toHaveBeenCalledTimes(1);
    });
  });

  describe('parseResponse (via compareRackets)', () => {
    it('should parse response with ===METRICS=== marker correctly', async () => {
      process.env.GEMINI_API_KEY = 'test-api-key';

      const mockResponse = {
        response: {
          text: vi.fn().mockReturnValue(mockComparisonResponse),
        },
      };
      mockGenerateContent.mockResolvedValue(mockResponse);

      const result = await service.compareRackets(mockRackets);

      expect(result.textComparison).toContain('RESUMEN EJECUTIVO');
      expect(result.textComparison).toContain('ANÁLISIS TÉCNICO DE MATERIALES');
      expect(result.textComparison).not.toContain('===METRICS===');
      expect(result.metrics).toHaveLength(2);
    });

    it('should parse response without ===METRICS=== marker (fallback to JSON)', async () => {
      process.env.GEMINI_API_KEY = 'test-api-key';

      const responseWithoutMarker = `
Some comparison text here.

More analysis.

[
  {"racketName": "Adidas Metalbone 3.1", "potencia": 9, "control": 6, "salidaDeBola": 8, "manejabilidad": 7, "puntoDulce": 7},
  {"racketName": "Bullpadel Vertex 04", "potencia": 7, "control": 9, "salidaDeBola": 6, "manejabilidad": 9, "puntoDulce": 9}
]
`;

      const mockResponse = {
        response: {
          text: vi.fn().mockReturnValue(responseWithoutMarker),
        },
      };
      mockGenerateContent.mockResolvedValue(mockResponse);

      const result = await service.compareRackets(mockRackets);

      expect(result.textComparison).toContain('Some comparison text here');
      expect(result.metrics).toHaveLength(2);
      expect(result.metrics[0].potencia).toBe(9);
    });

    it('should handle JSON wrapped in markdown code blocks', async () => {
      process.env.GEMINI_API_KEY = 'test-api-key';

      const responseWithMarkdown = `
Comparison text.

===METRICS===
\`\`\`json
[
  {"racketName": "Adidas Metalbone 3.1", "potencia": 9, "control": 6, "salidaDeBola": 8, "manejabilidad": 7, "puntoDulce": 7},
  {"racketName": "Bullpadel Vertex 04", "potencia": 7, "control": 9, "salidaDeBola": 6, "manejabilidad": 9, "puntoDulce": 9}
]
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
      expect(result.metrics[0].potencia).toBe(9);
    });

    it('should return default metrics when JSON parsing fails', async () => {
      process.env.GEMINI_API_KEY = 'test-api-key';

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation();

      const invalidJsonResponse = `
Comparison text.

===METRICS===
This is not valid JSON at all.
`;

      const mockResponse = {
        response: {
          text: vi.fn().mockReturnValue(invalidJsonResponse),
        },
      };
      mockGenerateContent.mockResolvedValue(mockResponse);

      const result = await service.compareRackets(mockRackets);

      expect(result.metrics).toHaveLength(2);
      expect(result.metrics[0]).toEqual({
        racketName: 'Adidas Metalbone 3.1',
        potencia: 5,
        control: 5,
        salidaDeBola: 5,
        manejabilidad: 5,
        puntoDulce: 5,
      });
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it('should handle response with no JSON at all', async () => {
      process.env.GEMINI_API_KEY = 'test-api-key';

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation();

      const textOnlyResponse = `
# Comparison Analysis

This is just text without any JSON metrics.
`;

      const mockResponse = {
        response: {
          text: vi.fn().mockReturnValue(textOnlyResponse),
        },
      };
      mockGenerateContent.mockResolvedValue(mockResponse);

      const result = await service.compareRackets(mockRackets);

      expect(result.textComparison).toContain('Comparison Analysis');
      expect(result.metrics).toHaveLength(2);
      expect(result.metrics[0].potencia).toBe(5);
      consoleErrorSpy.mockRestore();
    });
  });

  describe('buildRacketsInfo (via compareRackets)', () => {
    it('should build correct rackets info string', async () => {
      process.env.GEMINI_API_KEY = 'test-api-key';

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
      expect(callArgs).toContain('Marca: Adidas');
      expect(callArgs).toContain('Modelo: Metalbone 3.1');
      expect(callArgs).toContain('Forma: Diamante');
      expect(callArgs).toContain('Goma: EVA Soft');
      expect(callArgs).toContain('Cara/Fibra: Carbono 2D');

      expect(callArgs).toContain('PALA 2');
      expect(callArgs).toContain('Nombre: Bullpadel Vertex 04');
    });

    it('should handle missing characteristics gracefully', async () => {
      process.env.GEMINI_API_KEY = 'test-api-key';

      const racketsWithMissingData: Racket[] = [
        {
          ...mockRackets[0],
          caracteristicas_forma: undefined as any,
          caracteristicas_nucleo: undefined as any,
        },
        mockRackets[1],
      ];

      const mockResponse = {
        response: {
          text: vi.fn().mockReturnValue(mockComparisonResponse),
        },
      };
      mockGenerateContent.mockResolvedValue(mockResponse);

      await service.compareRackets(racketsWithMissingData);

      const callArgs = mockGenerateContent.mock.calls[0][0];
      expect(callArgs).toContain('Forma: N/A');
      expect(callArgs).toContain('Goma: N/A');
    });
  });

  describe('static generateContent', () => {
    it('should generate content from a simple prompt', async () => {
      process.env.GEMINI_API_KEY = 'test-api-key';

      const mockResponse = {
        response: {
          text: vi.fn().mockReturnValue('Generated content here'),
        },
      };
      mockGenerateContent.mockResolvedValue(mockResponse);

      const result = await GeminiService.generateContent('Test prompt');

      expect(result).toBe('Generated content here');
      expect(mockGenerateContent).toHaveBeenCalledWith('Test prompt');
    });

    it('should throw error when API call fails', async () => {
      process.env.GEMINI_API_KEY = 'test-api-key';

      mockGenerateContent.mockRejectedValue(new Error('API Error'));

      await expect(GeminiService.generateContent('Test prompt')).rejects.toThrow(
        'Error al generar contenido con IA'
      );
    });
  });
});
