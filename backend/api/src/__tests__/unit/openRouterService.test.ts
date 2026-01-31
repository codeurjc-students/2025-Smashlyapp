import axios from 'axios';
import { OpenRouterService } from '../../../src/services/openRouterService';
import { freeAiService } from '../../../src/services/freeAiService';
import { Racket } from '../../../src/types/racket';

// Mock axios
jest.mock('axios');

// Mock freeAiService
jest.mock('../../../src/services/freeAiService', () => ({
  freeAiService: {
    generateContent: jest.fn(),
  },
}));

describe('OpenRouterService', () => {
  let service: OpenRouterService;
  const mockAxiosInstance = {
    post: jest.fn(),
  };

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
      enlace: 'https://padelmarket.com/pala1',
      caracteristicas_marca: 'Adidas',
      caracteristicas_forma: 'Diamante',
      caracteristicas_nucleo: 'EVA Soft',
      caracteristicas_cara: 'Carbono 2D',
      caracteristicas_balance: 'Alto',
      caracteristicas_dureza: 'Dura',
      caracteristicas_nivel_de_juego: 'Avanzado',
      peso: 365,
      precio_actual: 250,
      testea_potencia: 9,
      testea_control: 6,
      testea_manejabilidad: 7,
      testea_confort: 7,
      characteristics_brand: 'Adidas',
      characteristics_shape: 'Diamante',
      characteristics_core: 'EVA Soft',
      characteristics_face: 'Carbono 2D',
      characteristics_balance: 'Alto',
      characteristics_hardness: 'Dura',
      characteristics_game_level: 'Avanzado',
      on_offer: true,
      specs: {
        weight: 365,
      },
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
      specs: { weight: 355 },
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

  const mockStructuredResponse = {
    executiveSummary:
      'La Adidas Metalbone 3.1 es ideal para jugadores ofensivos que buscan máxima potencia, mientras que la Bullpadel Vertex 04 es mejor para jugadores que priorizan el control y la manejabilidad.',
    technicalAnalysis: [
      {
        title: 'Potencia y Salida de Bola',
        content:
          'La Adidas Metalbone 3.1 ofrece una salida de bola superior gracias a su forma de diamante y balance alto.',
      },
      {
        title: 'Control y Precisión',
        content:
          'La Bullpadel Vertex 04 destaca en control debido a su forma redonda y balance bajo.',
      },
      {
        title: 'Manejabilidad y Peso',
        content: 'Ambas palas tienen pesos similares, pero la Vertex 04 es más manejable.',
      },
      {
        title: 'Confort y Prevención de Lesiones',
        content: 'La Vertex 04 es más suave y adecuada para jugadores con lesiones.',
      },
    ],
    comparisonTable:
      '| Característica | Adidas Metalbone 3.1 | Bullpadel Vertex 04 |\n|---|---|---|\n| Potencia | 9/10 | 7/10 |\n| Control | 6/10 | 9/10 |',
    recommendedProfiles:
      '**Adidas Metalbone 3.1**: Jugadores ofensivos avanzados.\n\n**Bullpadel Vertex 04**: Jugadores intermedios que buscan control.',
    biomechanicalConsiderations:
      '**Advertencia**: La Metalbone 3.1 es dura y con balance alto, lo que puede aumentar el riesgo de epicondilitis en jugadores con lesiones previas.',
    conclusion:
      'Para tu perfil de jugador intermedio con estilo polivalente, la **Bullpadel Vertex 04** es la recomendación ideal.',
    metrics: [
      {
        racketName: 'Adidas Metalbone 3.1',
        potencia: 9,
        control: 6,
        salidaDeBola: 8,
        manejabilidad: 7,
        puntoDulce: 7,
      },
      {
        racketName: 'Bullpadel Vertex 04',
        potencia: 7,
        control: 9,
        salidaDeBola: 6,
        manejabilidad: 9,
        puntoDulce: 9,
      },
    ],
  };

  beforeEach(() => {
    // Save original env
    const originalEnv = process.env.OPENROUTER_API_KEY;

    // Mock axios.create
    (axios.create as jest.Mock).mockReturnValue(mockAxiosInstance);
    // Mock freeAiService fail by default to test fallback flow
    (freeAiService.generateContent as jest.Mock).mockRejectedValue(
      new Error('Free AI API unavailable')
    );

    mockAxiosInstance.post.mockClear();

    service = new OpenRouterService();

    // Restore env if needed
    if (originalEnv) {
      process.env.OPENROUTER_API_KEY = originalEnv;
    }
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize axios client with correct config', () => {
      process.env.OPENROUTER_API_KEY = 'test-api-key';
      process.env.OPENROUTER_APP_NAME = 'TestApp';
      process.env.OPENROUTER_APP_URL = 'https://test.app';

      const newService = new OpenRouterService();

      expect(axios.create).toHaveBeenCalledWith({
        baseURL: 'https://openrouter.ai/api/v1',
        headers: {
          Authorization: 'Bearer test-api-key',
          'HTTP-Referer': 'https://test.app',
          'X-Title': 'TestApp',
          'Content-Type': 'application/json',
        },
      });
    });

    it('should use default values when env vars are not set', () => {
      delete process.env.OPENROUTER_API_KEY;
      delete process.env.OPENROUTER_APP_NAME;
      delete process.env.OPENROUTER_APP_URL;

      const newService = new OpenRouterService();

      expect(axios.create).toHaveBeenCalledWith({
        baseURL: 'https://openrouter.ai/api/v1',
        headers: {
          Authorization: 'Bearer ',
          'HTTP-Referer': 'https://smashly.app',
          'X-Title': 'Smashly',
          'Content-Type': 'application/json',
        },
      });
    });
  });

  describe('static generateContent', () => {
    it('should prioritize Free AI API if available', async () => {
      (freeAiService.generateContent as jest.Mock).mockResolvedValue('Content from Free API');

      const result = await OpenRouterService.generateContent('Test prompt');
      expect(result).toBe('Content from Free API');
      expect(freeAiService.generateContent).toHaveBeenCalledWith('Test prompt');
      expect(mockAxiosInstance.post).not.toHaveBeenCalled();
    });

    it('should generate content using OpenRouter fallback when Free API fails', async () => {
      process.env.OPENROUTER_API_KEY = 'test-api-key';

      mockAxiosInstance.post.mockResolvedValue({
        data: {
          choices: [{ message: { content: 'Generated content here' } }],
          usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
        },
      });

      const result = await OpenRouterService.generateContent('Test prompt');

      expect(result).toBe('Generated content here');
      expect(freeAiService.generateContent).toHaveBeenCalled();
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/chat/completions',
        expect.objectContaining({
          model: 'google/gemini-2.0-flash-exp:free',
          messages: [{ role: 'user', content: 'Test prompt' }],
        })
      );
    });

    it('should fallback to next model when first fails', async () => {
      process.env.OPENROUTER_API_KEY = 'test-api-key';

      mockAxiosInstance.post
        .mockRejectedValueOnce(new Error('First model failed'))
        .mockResolvedValue({
          data: {
            choices: [{ message: { content: 'Content from second model' } }],
            usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
          },
        });

      const result = await OpenRouterService.generateContent('Test prompt');

      expect(result).toBe('Content from second model');
      expect(mockAxiosInstance.post).toHaveBeenCalledTimes(2);
    });

    it('should throw error when API key is not configured and Free API fails', async () => {
      delete process.env.OPENROUTER_API_KEY;
      const newService = new OpenRouterService();

      await expect(newService['generateContentOpenRouterFallback']('test')).rejects.toThrow(
        'OPENROUTER_API_KEY no está configurada en el servidor'
      );
    });

    it('should throw error when all models fail', async () => {
      process.env.OPENROUTER_API_KEY = 'test-api-key';

      mockAxiosInstance.post.mockRejectedValue(new Error('All models failed'));

      await expect(OpenRouterService.generateContent('Test prompt')).rejects.toThrow(
        'Error al generar contenido con IA'
      );
    });

    it('should throw error when response is empty', async () => {
      process.env.OPENROUTER_API_KEY = 'test-api-key';

      mockAxiosInstance.post.mockResolvedValue({
        data: { choices: [{ message: { content: null } }] },
      });

      await expect(OpenRouterService.generateContent('Test prompt')).rejects.toThrow(
        'Error al generar contenido con IA'
      );
    });
  });

  describe('compareRackets', () => {
    it('should prioritize Free AI API if available', async () => {
      (freeAiService.generateContent as jest.Mock).mockResolvedValue(
        JSON.stringify(mockStructuredResponse)
      );

      const result = await service.compareRackets(mockRackets);
      expect(result.executiveSummary).toContain('Adidas Metalbone 3.1');
      expect(freeAiService.generateContent).toHaveBeenCalled();
      expect(mockAxiosInstance.post).not.toHaveBeenCalled();
    });

    it('should throw error when API key is not configured and Free API fails', async () => {
      delete process.env.OPENROUTER_API_KEY;
      const newService = new OpenRouterService();

      await expect(
        newService['compareRacketsOpenRouterFallback']('prompt', mockRackets)
      ).rejects.toThrow('OPENROUTER_API_KEY no está configurada en el servidor');
    });

    it('should throw error when less than 2 rackets provided', async () => {
      process.env.OPENROUTER_API_KEY = 'test-api-key';
      const newService = new OpenRouterService();

      await expect(newService.compareRackets([mockRackets[0]])).rejects.toThrow(
        'Se necesitan al menos 2 palas para comparar'
      );

      await expect(newService.compareRackets([])).rejects.toThrow(
        'Se necesitan al menos 2 palas para comparar'
      );
    });

    it('should successfully compare rackets with first model', async () => {
      process.env.OPENROUTER_API_KEY = 'test-api-key';

      mockAxiosInstance.post.mockResolvedValue({
        data: {
          choices: [{ message: { content: JSON.stringify(mockStructuredResponse) } }],
          usage: { prompt_tokens: 100, completion_tokens: 200, total_tokens: 300 },
        },
      });

      const result = await service.compareRackets(mockRackets);

      expect(result.executiveSummary).toContain('Adidas Metalbone 3.1');
      expect(result.technicalAnalysis).toHaveLength(4);
      expect(result.metrics).toHaveLength(2);
      expect(result.metrics[0].potencia).toBe(9);
      expect(mockAxiosInstance.post).toHaveBeenCalledTimes(1);
    });

    it('should include user context in comparison when profile is provided', async () => {
      process.env.OPENROUTER_API_KEY = 'test-api-key';

      mockAxiosInstance.post.mockResolvedValue({
        data: {
          choices: [{ message: { content: JSON.stringify(mockStructuredResponse) } }],
        },
      });

      await service.compareRackets(mockRackets, mockUserProfile);

      const callArgs = mockAxiosInstance.post.mock.calls[0][1];
      const prompt = callArgs.messages[0].content;

      expect(prompt).toContain('CONTEXTO DEL USUARIO');
      expect(prompt).toContain('Nivel de juego: Intermedio');
      expect(prompt).toContain('Estilo de juego: Polivalente');
    });

    it('should include Testea metrics when available', async () => {
      process.env.OPENROUTER_API_KEY = 'test-api-key';

      mockAxiosInstance.post.mockResolvedValue({
        data: {
          choices: [{ message: { content: JSON.stringify(mockStructuredResponse) } }],
        },
      });

      await service.compareRackets(mockRackets);

      const callArgs = mockAxiosInstance.post.mock.calls[0][1];
      const prompt = callArgs.messages[0].content;

      expect(prompt).toContain('MÉTRICAS CERTIFICADAS TESTEA PÁDEL');
      expect(prompt).toContain('Potencia: 9/10');
      expect(prompt).toContain('Control: 6/10');
    });

    it('should indicate when Testea metrics are not available', async () => {
      process.env.OPENROUTER_API_KEY = 'test-api-key';

      const racketsWithoutTestea = [
        { ...mockRackets[0], testea_potencia: undefined },
        { ...mockRackets[1], testea_potencia: null },
      ];

      mockAxiosInstance.post.mockResolvedValue({
        data: {
          choices: [{ message: { content: JSON.stringify(mockStructuredResponse) } }],
        },
      });

      await service.compareRackets(racketsWithoutTestea as any);

      const callArgs = mockAxiosInstance.post.mock.calls[0][1];
      const prompt = callArgs.messages[0].content;

      expect(prompt).toContain('SIN CERTIFICACIÓN TESTEA');
    });

    it('should fallback to second model when first fails', async () => {
      process.env.OPENROUTER_API_KEY = 'test-api-key';

      mockAxiosInstance.post
        .mockRejectedValueOnce(new Error('First model failed'))
        .mockResolvedValue({
          data: {
            choices: [{ message: { content: JSON.stringify(mockStructuredResponse) } }],
          },
        });

      const result = await service.compareRackets(mockRackets);

      expect(result.executiveSummary).toContain('Adidas Metalbone 3.1');
      expect(mockAxiosInstance.post).toHaveBeenCalledTimes(2);

      // Verify second model was used
      const secondCall = mockAxiosInstance.post.mock.calls[1][1];
      expect(secondCall.model).toBe('deepseek/deepseek-r1:free');
    });

    it('should handle JSON response wrapped in markdown code blocks', async () => {
      process.env.OPENROUTER_API_KEY = 'test-api-key';

      const markdownWrappedResponse = `
\`\`\`json
${JSON.stringify(mockStructuredResponse)}
\`\`\`
`;

      mockAxiosInstance.post.mockResolvedValue({
        data: {
          choices: [{ message: { content: markdownWrappedResponse } }],
        },
      });

      const result = await service.compareRackets(mockRackets);

      expect(result.executiveSummary).toContain('Adidas Metalbone 3.1');
      expect(result.technicalAnalysis).toHaveLength(4);
      expect(result.metrics).toHaveLength(2);
    });

    it('should throw error when all models fail', async () => {
      process.env.OPENROUTER_API_KEY = 'test-api-key';

      mockAxiosInstance.post.mockRejectedValue(new Error('All models failed'));

      await expect(service.compareRackets(mockRackets)).rejects.toThrow(
        'Error al generar la comparación con IA'
      );
    });

    it('should use default metrics when JSON parsing fails for metrics', async () => {
      process.env.OPENROUTER_API_KEY = 'test-api-key';

      const invalidMetricsResponse = {
        ...mockStructuredResponse,
        metrics: 'invalid',
      };

      mockAxiosInstance.post.mockResolvedValue({
        data: {
          choices: [{ message: { content: JSON.stringify(invalidMetricsResponse) } }],
        },
      });

      const result = await service.compareRackets(mockRackets);

      // Should still return result with default metrics
      expect(result.metrics).toHaveLength(2);
      expect(result.metrics[0]).toEqual({
        racketName: 'Adidas Metalbone 3.1',
        potencia: 5,
        control: 5,
        salidaDeBola: 5,
        manejabilidad: 5,
        puntoDulce: 5,
      });
    });

    it('should throw error when response has no JSON', async () => {
      process.env.OPENROUTER_API_KEY = 'test-api-key';

      mockAxiosInstance.post.mockResolvedValue({
        data: {
          choices: [{ message: { content: 'This is not JSON at all' } }],
        },
      });

      await expect(service.compareRackets(mockRackets)).rejects.toThrow(
        'Error al generar la comparación con IA'
      );
    });

    it('should return fallback when response has missing required properties', async () => {
      process.env.OPENROUTER_API_KEY = 'test-api-key';

      // Recreate service after setting env var
      service = new OpenRouterService();

      const incompleteResponse = {
        executiveSummary: 'Summary',
        // Missing technicalAnalysis and metrics
      };

      mockAxiosInstance.post.mockResolvedValue({
        data: {
          choices: [{ message: { content: JSON.stringify(incompleteResponse) } }],
        },
      });

      // Service returns fallback object when validation fails (caught by parse error handler)
      const result = await service.compareRackets(mockRackets);

      expect(result.executiveSummary).toContain('Error al generar la comparación');
      expect(result.technicalAnalysis).toEqual([]);
      expect(result.metrics).toHaveLength(2);
    });

    describe('model fallback behavior', () => {
      const freeModels = [
        'google/gemini-2.0-flash-exp:free',
        'deepseek/deepseek-r1:free',
        'meta-llama/llama-3.3-70b-instruct:free',
        'mistralai/mistral-nemo:free',
        'qwen/qwen-2.5-7b-instruct:free',
      ];

      it('should try all 5 free models in sequence', async () => {
        process.env.OPENROUTER_API_KEY = 'test-api-key';

        // First 4 fail, last succeeds
        mockAxiosInstance.post
          .mockRejectedValueOnce(new Error('Model 1 failed'))
          .mockRejectedValueOnce(new Error('Model 2 failed'))
          .mockRejectedValueOnce(new Error('Model 3 failed'))
          .mockRejectedValueOnce(new Error('Model 4 failed'))
          .mockResolvedValueOnce({
            data: {
              choices: [{ message: { content: JSON.stringify(mockStructuredResponse) } }],
            },
          });

        const result = await service.compareRackets(mockRackets);

        expect(result.executiveSummary).toBeTruthy();
        expect(mockAxiosInstance.post).toHaveBeenCalledTimes(5);

        // Verify models were tried in correct order
        for (let i = 0; i < 5; i++) {
          const modelUsed = mockAxiosInstance.post.mock.calls[i][1].model;
          expect(modelUsed).toBe(freeModels[i]);
        }
      });

      it('should wait 500ms between model attempts', async () => {
        process.env.OPENROUTER_API_KEY = 'test-api-key';

        const startTime = Date.now();

        mockAxiosInstance.post
          .mockRejectedValueOnce(new Error('Model 1 failed'))
          .mockRejectedValueOnce(new Error('Model 2 failed'))
          .mockResolvedValueOnce({
            data: {
              choices: [{ message: { content: JSON.stringify(mockStructuredResponse) } }],
            },
          });

        await service.compareRackets(mockRackets);

        const elapsedTime = Date.now() - startTime;

        // Should have at least 2 delays of 500ms each = 1000ms
        expect(elapsedTime).toBeGreaterThanOrEqual(1000);
      });
    });
  });
});
