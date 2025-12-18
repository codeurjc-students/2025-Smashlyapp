import { RecommendationService } from '../../services/recommendationService';
import { OpenRouterService } from '../../services/openRouterService';
import { RacketService } from '../../services/racketService';
import { RacketFilterService } from '../../services/racketFilterService';
import { supabase } from '../../config/supabase';

jest.mock('../../config/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

jest.mock('../../services/openRouterService');
jest.mock('../../services/racketService');
jest.mock('../../services/racketFilterService');

describe('RecommendationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateRecommendation', () => {
    const mockRackets = [
      {
        id: 1,
        name: 'Bullpadel Vertex 03',
        brand: 'Bullpadel',
        model: 'Vertex 03',
        image: 'vertex.jpg',
        current_price: 200,
      },
    ];

    const mockAIResponse = JSON.stringify({
      rackets: [
        {
          id: 1,
          match_score: 95,
          reason: 'Perfecta para jugadores avanzados',
        },
      ],
      analysis: 'Análisis general del perfil del jugador',
    });

    it('should generate recommendation successfully', async () => {
      const formData: any = {
        level: 'intermediate',
        frequency: 'weekly',
        injuries: 'none',
        budget: 200,
      };

      (OpenRouterService.generateContent as jest.Mock).mockResolvedValue(mockAIResponse);
      (RacketService.getAllRackets as jest.Mock).mockResolvedValue(mockRackets);
      (RacketFilterService.filterRackets as jest.Mock).mockReturnValue(mockRackets);

      const result = await RecommendationService.generateRecommendation('basic', formData);

      expect(OpenRouterService.generateContent).toHaveBeenCalled();
      expect(result.rackets).toBeDefined();
      expect(result.analysis).toBe('Análisis general del perfil del jugador');
    });

    it('should throw error when AI response cannot be parsed', async () => {
      (OpenRouterService.generateContent as jest.Mock).mockResolvedValue('Invalid response');
      (RacketService.getAllRackets as jest.Mock).mockResolvedValue(mockRackets);
      (RacketFilterService.filterRackets as jest.Mock).mockReturnValue(mockRackets);

      await expect(
        RecommendationService.generateRecommendation('basic', {} as any)
      ).rejects.toThrow();
    });
  });

  describe('saveRecommendation', () => {
    it('should save recommendation to database', async () => {
      const mockSavedRecommendation = {
        id: 'rec123',
        user_id: 'user123',
        form_type: 'basic',
        created_at: '2024-01-01T00:00:00Z',
      };

      (supabase.from as jest.Mock).mockImplementation(() => ({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockSavedRecommendation,
              error: null,
            }),
          }),
        }),
      }));

      const saved = await RecommendationService.saveRecommendation(
        'user123',
        'basic',
        {} as any,
        { rackets: [], analysis: '' }
      );

      expect(saved.id).toBe('rec123');
    });
  });

  describe('getLastRecommendation', () => {
    it('should return null when no recommendations exist', async () => {
      (supabase.from as jest.Mock).mockImplementation(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: { code: 'PGRST116', message: 'No rows found' },
                }),
              }),
            }),
          }),
        }),
      }));

      const result = await RecommendationService.getLastRecommendation('user123');

      expect(result).toBeNull();
    });
  });
});
