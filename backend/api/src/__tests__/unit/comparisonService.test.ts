import { ComparisonService } from '../../services/comparisonService';
import { supabase } from '../../config/supabase';

jest.mock('../../config/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('ComparisonService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createComparison', () => {
    it('should create comparison with required fields', async () => {
      const comparisonData = {
        user_id: 'user123',
        racket_ids: [1, 2, 3],
        comparison_text: 'Test comparison',
      };

      const mockCreated = {
        id: 'comp123',
        ...comparisonData,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      (supabase.from as jest.Mock).mockImplementation(() => ({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockCreated,
              error: null,
            }),
          }),
        }),
      }));

      const result = await ComparisonService.createComparison(comparisonData);

      expect(result.id).toBe('comp123');
      expect(result.racket_ids).toEqual([1, 2, 3]);
    });

    it('should create comparison with optional metrics', async () => {
      const comparisonData = {
        user_id: 'user123',
        racket_ids: [1, 2],
        comparison_text: 'Test comparison',
        metrics: [
          { 
            racketId: 1,
            racketName: 'Racket 1', 
            radarData: { potencia: 8, control: 7, salidaDeBola: 6, manejabilidad: 9, puntoDulce: 8 },
            isCertified: false
          },
          { 
            racketId: 2,
            racketName: 'Racket 2', 
            radarData: { potencia: 7, control: 8, salidaDeBola: 7, manejabilidad: 7, puntoDulce: 9 },
            isCertified: false
          },
        ],
      };

      const mockCreated = {
        id: 'comp123',
        ...comparisonData,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      (supabase.from as jest.Mock).mockImplementation(() => ({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockCreated,
              error: null,
            }),
          }),
        }),
      }));

      const result = await ComparisonService.createComparison(comparisonData);

      expect(result.metrics).toBeDefined();
      expect(result.metrics).toHaveLength(2);
    });

    it('should throw error on database error', async () => {
      (supabase.from as jest.Mock).mockImplementation(() => ({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' },
            }),
          }),
        }),
      }));

      await expect(
        ComparisonService.createComparison({
          user_id: 'user123',
          racket_ids: [1, 2],
          comparison_text: 'Test',
        })
      ).rejects.toThrow('Database error');
    });
  });

  describe('getUserComparisons', () => {
    it('should fetch all comparisons for a user', async () => {
      const mockComparisons = [
        {
          id: 'comp1',
          user_id: 'user123',
          racket_ids: [1, 2],
          comparison_text: 'Comparison 1',
          created_at: '2024-01-02T00:00:00Z',
        },
        {
          id: 'comp2',
          user_id: 'user123',
          racket_ids: [3, 4],
          comparison_text: 'Comparison 2',
          created_at: '2024-01-01T00:00:00Z',
        },
      ];

      (supabase.from as jest.Mock).mockImplementation(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: mockComparisons,
              error: null,
            }),
          }),
        }),
      }));

      const result = await ComparisonService.getUserComparisons('user123');

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('comp1');
    });

    it('should return empty array when no comparisons exist', async () => {
      (supabase.from as jest.Mock).mockImplementation(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      }));

      const result = await ComparisonService.getUserComparisons('user123');

      expect(result).toEqual([]);
    });
  });

  describe('getComparisonById', () => {
    it('should fetch comparison by ID and user ID', async () => {
      const mockComparison = {
        id: 'comp123',
        user_id: 'user123',
        racket_ids: [1, 2],
        comparison_text: 'Test',
      };

      (supabase.from as jest.Mock).mockImplementation(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: mockComparison,
            error: null,
          }),
        }),
      }));

      const result = await ComparisonService.getComparisonById('comp123', 'user123');

      expect(result?.id).toBe('comp123');
    });

    it('should return null when not found', async () => {
      (supabase.from as jest.Mock).mockImplementation(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116', message: 'Not found' },
          }),
        }),
      }));

      const result = await ComparisonService.getComparisonById('comp123', 'user123');

      expect(result).toBeNull();
    });
  });

  describe('deleteComparison', () => {
    it('should delete comparison successfully', async () => {
      (supabase.from as jest.Mock).mockImplementation(() => ({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnThis(),
        }),
      }));

      const result = await ComparisonService.deleteComparison('comp123', 'user123');

      expect(result).toBe(true);
    });

    it('should throw error on database error', async () => {
      (supabase.from as jest.Mock).mockImplementation(() => ({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            error: { message: 'Delete failed' },
          }),
        }),
      }));

      // Mock the error to be thrown
      (supabase.from as jest.Mock).mockImplementation(() => ({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: { message: 'Delete failed' },
          }),
        }),
      }));

      await expect(
        ComparisonService.deleteComparison('comp123', 'user123')
      ).rejects.toThrow();
    });
  });

  describe('getUserComparisonCount', () => {
    it('should return correct count', async () => {
      (supabase.from as jest.Mock).mockImplementation(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            count: 5,
            error: null,
          }),
        }),
      }));

      const count = await ComparisonService.getUserComparisonCount('user123');

      expect(count).toBe(5);
    });

    it('should return 0 when no comparisons exist', async () => {
      (supabase.from as jest.Mock).mockImplementation(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            count: null,
            error: null,
          }),
        }),
      }));

      const count = await ComparisonService.getUserComparisonCount('user123');

      expect(count).toBe(0);
    });
  });

  describe('shareComparison', () => {
    it('should generate share token and make comparison public', async () => {
      const mockUpdated = {
        id: 'comp123',
        share_token: expect.any(String),
        is_public: true,
      };

      (supabase.from as jest.Mock).mockImplementation(() => ({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockUpdated,
              error: null,
            }),
          }),
        }),
      }));

      const shareToken = await ComparisonService.shareComparison('comp123', 'user123');

      expect(shareToken).toBeDefined();
      expect(typeof shareToken).toBe('string');
      expect(shareToken.length).toBe(32);
    });

    it('should throw error when comparison not found', async () => {
      (supabase.from as jest.Mock).mockImplementation(() => ({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        }),
      }));

      await expect(
        ComparisonService.shareComparison('comp123', 'user123')
      ).rejects.toThrow('Comparison not found or unauthorized');
    });
  });

  describe('getSharedComparison', () => {
    it('should fetch public comparison by share token', async () => {
      const mockComparison = {
        id: 'comp123',
        share_token: 'abc123',
        is_public: true,
        comparison_text: 'Test',
      };

      (supabase.from as jest.Mock).mockImplementation(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: mockComparison,
            error: null,
          }),
        }),
      }));

      const result = await ComparisonService.getSharedComparison('abc123');

      expect(result?.id).toBe('comp123');
      expect(result?.is_public).toBe(true);
    });

    it('should return null when token not found', async () => {
      (supabase.from as jest.Mock).mockImplementation(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116', message: 'Not found' },
          }),
        }),
      }));

      const result = await ComparisonService.getSharedComparison('invalid');

      expect(result).toBeNull();
    });
  });

  describe('unshareComparison', () => {
    it('should set is_public to false', async () => {
      (supabase.from as jest.Mock).mockImplementation(() => ({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              error: null,
            }),
          }),
        }),
      }));

      const result = await ComparisonService.unshareComparison('comp123', 'user123');

      expect(result).toBe(true);
    });

    it('should throw error on database error', async () => {
      (supabase.from as jest.Mock).mockImplementation(() => ({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: { message: 'Update failed' },
          }),
        }),
      }));

      await expect(
        ComparisonService.unshareComparison('comp123', 'user123')
      ).rejects.toThrow();
    });
  });
});
