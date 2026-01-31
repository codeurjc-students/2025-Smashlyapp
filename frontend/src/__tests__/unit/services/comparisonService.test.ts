import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComparisonService, SavedComparison } from '@/services/comparisonService';
import { RacketComparisonData } from '@/types/racket';

// Mock fetch
global.fetch = vi.fn();

// Mock API config
vi.mock('@/config/api', () => ({
  API_URL: 'http://localhost:3000',
  getCommonHeaders: vi.fn(() => ({
    'Content-Type': 'application/json',
  })),
}));

const mockComparisonResult = {
  executiveSummary: 'Test summary',
  technicalAnalysis: [],
  comparisonTable: '| Test | Table |',
  recommendedProfiles: 'Test profiles',
  biomechanicalConsiderations: 'Test considerations',
  conclusion: 'Test conclusion',
  metrics: [
    {
      racketName: 'Racket 1',
      radarData: { potencia: 8, control: 7, salidaDeBola: 6, manejabilidad: 9, puntoDulce: 7 },
      isCertified: false,
    },
    {
      racketName: 'Racket 2',
      radarData: { potencia: 9, control: 6, salidaDeBola: 5, manejabilidad: 7, puntoDulce: 6 },
      isCertified: false,
    },
  ] as RacketComparisonData[],
};

const mockSavedComparison: SavedComparison = {
  id: 'comp-123',
  user_id: 'user-123',
  racket_ids: [1, 2],
  comparison_text: JSON.stringify(mockComparisonResult),
  metrics: mockComparisonResult.metrics,
  created_at: '2025-01-15T00:00:00.000Z',
  updated_at: '2025-01-15T00:00:00.000Z',
};

describe('ComparisonService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('compareRackets', () => {
    it('should compare rackets successfully', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          comparison: mockComparisonResult,
        }),
      });

      const result = await ComparisonService.compareRackets([1, 2]);

      expect(result.comparison).toEqual(mockComparisonResult);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/v1/comparison',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"racketIds":[1,2]'),
        })
      );
    });

    it('should include user profile in request when provided', async () => {
      const userProfile = {
        gameLevel: 'Intermedio',
        playingStyle: 'Polivalente',
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ comparison: mockComparisonResult }),
      });

      await ComparisonService.compareRackets([1, 2], userProfile);

      const callArgs = (global.fetch as any).mock.calls[0];
      const body = JSON.parse(callArgs[1].body);

      expect(body.userProfile).toEqual(userProfile);
    });

    it('should throw error when response is not ok', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Comparison failed' }),
      });

      await expect(ComparisonService.compareRackets([1, 2])).rejects.toThrow('Comparison failed');
    });

    it('should throw error when error parsing fails', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      await expect(ComparisonService.compareRackets([1, 2])).rejects.toThrow(
        'Error al comparar palas'
      );
    });

    it('should handle network errors', async () => {
      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      await expect(ComparisonService.compareRackets([1, 2])).rejects.toThrow('Network error');
    });
  });

  describe('saveComparison', () => {
    it('should save comparison successfully', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: mockSavedComparison,
          message: 'Comparison saved',
        }),
      });

      const result = await ComparisonService.saveComparison([1, 2], mockComparisonResult);

      expect(result).toEqual(mockSavedComparison);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/v1/comparison/save',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"racketIds":[1,2]'),
        })
      );
    });

    it('should serialize comparison text as JSON', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: mockSavedComparison,
        }),
      });

      await ComparisonService.saveComparison([1, 2], mockComparisonResult);

      const callArgs = (global.fetch as any).mock.calls[0];
      const body = JSON.parse(callArgs[1].body);

      expect(JSON.parse(body.comparisonText)).toEqual(mockComparisonResult);
    });

    it('should include metrics in request', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: mockSavedComparison,
        }),
      });

      await ComparisonService.saveComparison([1, 2], mockComparisonResult);

      const callArgs = (global.fetch as any).mock.calls[0];
      const body = JSON.parse(callArgs[1].body);

      expect(body.metrics).toEqual(mockComparisonResult.metrics);
    });

    it('should throw error when save fails', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Save failed' }),
      });

      await expect(ComparisonService.saveComparison([1, 2], mockComparisonResult)).rejects.toThrow(
        'Save failed'
      );
    });
  });

  describe('getUserComparisons', () => {
    it('should get user comparisons successfully', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: [mockSavedComparison],
        }),
      });

      const result = await ComparisonService.getUserComparisons();

      expect(result).toEqual([mockSavedComparison]);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/v1/comparison/user',
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    it('should return empty array when no comparisons exist', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: [],
        }),
      });

      const result = await ComparisonService.getUserComparisons();

      expect(result).toEqual([]);
    });

    it('should throw error when fetch fails', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Fetch failed' }),
      });

      await expect(ComparisonService.getUserComparisons()).rejects.toThrow('Fetch failed');
    });
  });

  describe('getComparisonById', () => {
    it('should get comparison by id successfully', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          data: mockSavedComparison,
        }),
      });

      const result = await ComparisonService.getComparisonById('comp-123');

      expect(result).toEqual(mockSavedComparison);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/v1/comparison/comp-123',
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    it('should throw error when comparison not found', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Not found' }),
      });

      await expect(ComparisonService.getComparisonById('nonexistent')).rejects.toThrow('Not found');
    });
  });

  describe('deleteComparison', () => {
    it('should delete comparison successfully', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
      });

      await expect(ComparisonService.deleteComparison('comp-123')).resolves.not.toThrow();

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/v1/comparison/comp-123',
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });

    it('should throw error when delete fails', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Delete failed' }),
      });

      await expect(ComparisonService.deleteComparison('comp-123')).rejects.toThrow('Delete failed');
    });
  });

  describe('getComparisonCount', () => {
    it('should get comparison count successfully', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: { count: 5 },
        }),
      });

      const result = await ComparisonService.getComparisonCount();

      expect(result).toBe(5);
    });

    it('should throw error when count fetch fails', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Fetch failed' }),
      });

      await expect(ComparisonService.getComparisonCount()).rejects.toThrow();
    });
  });

  describe('shareComparison', () => {
    it('should share comparison and return token', async () => {
      const mockToken = 'share-token-abc';

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          data: { shareToken: mockToken },
        }),
      });

      const result = await ComparisonService.shareComparison('comp-123');

      expect(result).toBe(mockToken);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/v1/comparison/comp-123/share',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    it('should throw error when share fails', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Share failed' }),
      });

      await expect(ComparisonService.shareComparison('comp-123')).rejects.toThrow('Share failed');
    });
  });

  describe('unshareComparison', () => {
    it('should unshare comparison successfully', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
      });

      await expect(ComparisonService.unshareComparison('comp-123')).resolves.not.toThrow();

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/v1/comparison/comp-123/unshare',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    it('should throw error when unshare fails', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Unshare failed' }),
      });

      await expect(ComparisonService.unshareComparison('comp-123')).rejects.toThrow(
        'Unshare failed'
      );
    });
  });

  describe('getSharedComparison', () => {
    it('should get shared comparison by token', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          data: mockSavedComparison,
        }),
      });

      const result = await ComparisonService.getSharedComparison('share-token-abc');

      expect(result).toEqual(mockSavedComparison);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/v1/comparison/shared/share-token-abc',
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    it('should not require auth for shared comparisons', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockSavedComparison }),
      });

      await ComparisonService.getSharedComparison('token-123');

      const callArgs = (global.fetch as any).mock.calls[0];
      expect(callArgs[1].headers).toEqual({
        'Content-Type': 'application/json',
      });
    });

    it('should throw error when shared comparison not found', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Not found' }),
      });

      await expect(ComparisonService.getSharedComparison('invalid-token')).rejects.toThrow(
        'Not found'
      );
    });
  });

  describe('API URL handling', () => {
    it('should handle API URL with trailing slash', async () => {
      vi.doMock('@/config/api', () => ({
        API_URL: 'http://localhost:3000/',
        getCommonHeaders: vi.fn(() => ({ 'Content-Type': 'application/json' })),
      }));

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ comparison: mockComparisonResult }),
      });

      await ComparisonService.compareRackets([1, 2]);

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/v1/comparison',
        expect.any(Object)
      );
    });
  });
});
