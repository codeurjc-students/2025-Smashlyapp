import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RecommendationService } from '../../../services/recommendationService';
import * as authUtils from '../../../utils/authUtils';

// Mock fetch
global.fetch = vi.fn();

vi.mock('../../../utils/authUtils', () => ({
  getAuthToken: vi.fn(),
}));

describe('RecommendationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generate', () => {
    it('should generate basic recommendation', async () => {
      const formData = {
        weight: 70,
        height: 175,
        playLevel: 'Intermedio',
        playStyle: 'Ofensivo',
      };

      const mockResult = {
        recommendations: [
          { id: 1, name: 'Racket 1', score: 9.5 },
          { id: 2, name: 'Racket 2', score: 9.0 },
        ],
        explanation: 'Based on your profile...',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResult,
      });

      const result = await RecommendationService.generate('basic', formData);

      expect(result).toEqual(mockResult);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/recommendations/generate'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ type: 'basic', data: formData }),
        })
      );
    });

    it('should generate advanced recommendation', async () => {
      const formData = {
        weight: 70,
        height: 175,
        playLevel: 'Avanzado',
        playStyle: 'Defensivo',
        injuries: 'Ninguna',
        budget: 200,
      };

      const mockResult = {
        recommendations: [{ id: 1, name: 'Racket 1', score: 9.8 }],
        explanation: 'Advanced analysis...',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResult,
      });

      const result = await RecommendationService.generate('advanced', formData);

      expect(result).toEqual(mockResult);
    });

    it('should handle error', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
      });

      await expect(
        RecommendationService.generate('basic', {} as any)
      ).rejects.toThrow('Error generating recommendation');
    });
  });

  describe('save', () => {
    it('should save recommendation', async () => {
      vi.mocked(authUtils.getAuthToken).mockReturnValue('test-token');

      const formData = { weight: 70, height: 175 };
      const result = { recommendations: [], explanation: 'Test' };
      const savedRecommendation = { id: 'rec-1', ...result };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => savedRecommendation,
      });

      const saved = await RecommendationService.save('basic', formData, result);

      expect(saved).toEqual(savedRecommendation);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/recommendations/save'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        })
      );
    });
  });

  describe('getLast', () => {
    it('should get last recommendation', async () => {
      vi.mocked(authUtils.getAuthToken).mockReturnValue('test-token');

      const mockRecommendation = {
        id: 'rec-1',
        type: 'basic',
        created_at: '2024-01-01',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockRecommendation,
      });

      const result = await RecommendationService.getLast();

      expect(result).toEqual(mockRecommendation);
    });

    it('should return null if no recommendation', async () => {
      vi.mocked(authUtils.getAuthToken).mockReturnValue('test-token');

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const result = await RecommendationService.getLast();

      expect(result).toBeNull();
    });
  });
});
