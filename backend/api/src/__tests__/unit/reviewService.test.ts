import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ReviewService } from '../../../src/services/reviewService';
import { supabase } from '../../../src/config/supabase';
import { CreateReviewDTO, UpdateReviewDTO, CreateCommentDTO } from '../../../src/types/review';

vi.mock('../../../src/config/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          range: vi.fn(() => ({
            data: [],
            error: null,
          })),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({
            data: null,
            error: null,
          })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => ({
              data: null,
              error: null,
            })),
          })),
        })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => ({
              data: null,
              error: null,
            })),
          })),
        })),
      })),
    })),
  },
}));

describe('ReviewService', () => {
  const mockUserId = 'user-123';
  const mockRacketId = 1;
  const mockReviewId = 'review-abc';

  const mockReview = {
    id: mockReviewId,
    user_id: mockUserId,
    racket_id: mockRacketId,
    rating: 5,
    title: 'Excellent racket',
    content: 'Great control and power',
    created_at: '2025-01-15T00:00:00.000Z',
    likes_count: 3,
  };

  const mockUser = {
    id: mockUserId,
    nickname: 'testuser',
    avatar_url: 'https://example.com/avatar.jpg',
  };

  const mockRacket = {
    id: mockRacketId,
    name: 'Test Racket',
    brand: 'Test Brand',
    model: 'Test Model',
    image: 'https://example.com/racket.jpg',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('mapRacketFields', () => {
    it('should return review unchanged when no racket data', () => {
      const review = { id: '1', title: 'Test' };
      const result = ReviewService['mapRacketFields'](review);
      expect(result).toEqual(review);
    });

    it('should map racket fields from DB to frontend format', () => {
      const reviewWithRacket = {
        id: '1',
        title: 'Test',
        racket: mockRacket,
      };

      const result = ReviewService['mapRacketFields'](reviewWithRacket);

      expect(result.racket).toEqual({
        id: mockRacket.id,
        nombre: mockRacket.name,
        marca: mockRacket.brand,
        modelo: mockRacket.model,
        imagen: mockRacket.image,
      });
    });

    it('should return undefined when review is undefined', () => {
      const result = ReviewService['mapRacketFields'](undefined);
      expect(result).toBeUndefined();
    });

    it('should return null when review is null', () => {
      const result = ReviewService['mapRacketFields'](null);
      expect(result).toBeNull();
    });
  });

  describe('mapReviews', () => {
    it('should return empty array when reviews is null/undefined', () => {
      const result = ReviewService['mapReviews'](null as any);
      expect(result).toEqual([]);

      const result2 = ReviewService['mapReviews'](undefined as any);
      expect(result2).toEqual([]);
    });

    it('should map all reviews in array', () => {
      const reviews = [
        { id: '1', racket: mockRacket },
        { id: '2', racket: mockRacket },
      ];

      const result = ReviewService['mapReviews'](reviews);

      expect(result).toHaveLength(2);
      expect(result[0].racket.nombre).toBe(mockRacket.name);
      expect(result[1].racket.nombre).toBe(mockRacket.name);
    });
  });

  describe('buildReviewsQuery', () => {
    it('should build base query with racket_id filter', () => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockReturnThis();
      const mockRange = vi.fn().mockResolvedValue({ data: [], error: null });

      (supabase.from as vi.Mock).mockReturnValue({
        select: mockSelect,
      });

      mockSelect.mockReturnValue({
        eq: mockEq,
        order: mockOrder,
        range: mockRange,
      });

      const query = ReviewService['buildReviewsQuery'](mockRacketId);
      expect(query).toBeDefined();
    });
  });

  describe('applyReviewFilters', () => {
    it('should apply rating filter when provided', () => {
      const mockQuery = {
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
      };

      const result = ReviewService['applyReviewFilters'](mockQuery as any, { rating: 5 });

      expect(mockQuery.eq).toHaveBeenCalledWith('rating', 5);
    });

    it('should sort by recent by default', () => {
      const mockQuery = {
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
      };

      const result = ReviewService['applyReviewFilters'](mockQuery as any, {});

      expect(mockQuery.order).toHaveBeenCalledWith('created_at', { ascending: false });
    });

    it('should sort by rating high to low', () => {
      const mockQuery = {
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
      };

      const result = ReviewService['applyReviewFilters'](mockQuery as any, { sort: 'rating_high' });

      expect(mockQuery.order).toHaveBeenCalledWith('rating', { ascending: false });
    });

    it('should sort by rating low to high', () => {
      const mockQuery = {
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
      };

      const result = ReviewService['applyReviewFilters'](mockQuery as any, { sort: 'rating_low' });

      expect(mockQuery.order).toHaveBeenCalledWith('rating', { ascending: true });
    });

    it('should sort by most liked', () => {
      const mockQuery = {
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
      };

      const result = ReviewService['applyReviewFilters'](mockQuery as any, { sort: 'most_liked' });

      expect(mockQuery.order).toHaveBeenCalledWith('likes_count', { ascending: false });
    });
  });

  describe('calculateStats', () => {
    it('should return zero stats for empty array', () => {
      const result = ReviewService['calculateStats']([]);

      expect(result).toEqual({
        average_rating: 0,
        total_reviews: 0,
        rating_distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      });
    });

    it('should calculate average rating correctly', () => {
      const reviews = [
        { rating: 5 },
        { rating: 4 },
        { rating: 3 },
      ];

      const result = ReviewService['calculateStats'](reviews);

      expect(result.average_rating).toBe(4);
      expect(result.total_reviews).toBe(3);
    });

    it('should round average rating to 1 decimal', () => {
      const reviews = [
        { rating: 5 },
        { rating: 4 },
        { rating: 4 },
      ];

      const result = ReviewService['calculateStats'](reviews);

      expect(result.average_rating).toBe(4.3);
    });

    it('should calculate rating distribution correctly', () => {
      const reviews = [
        { rating: 5 },
        { rating: 5 },
        { rating: 4 },
        { rating: 3 },
        { rating: 2 },
        { rating: 1 },
      ];

      const result = ReviewService['calculateStats'](reviews);

      expect(result.rating_distribution).toEqual({
        1: 1,
        2: 1,
        3: 1,
        4: 1,
        5: 2,
      });
    });
  });

  describe('getReviewsByRacket', () => {
    it('should get reviews with pagination and filters', async () => {
      const mockReviews = [
        { ...mockReview, user: mockUser, racket: mockRacket },
      ];

      const mockQueryBuilder = {
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: mockReviews,
          error: null,
          count: 1,
        }),
      };

      const mockSelect = vi.fn().mockReturnValue(mockQueryBuilder);

      (supabase.from as vi.Mock).mockImplementation((table: string) => {
        if (table === 'reviews') {
          return {
            select: mockSelect,
          };
        }
        if (table === 'review_likes') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                in: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          };
        }
        return {};
      });

      const result = await ReviewService.getReviewsByRacket(mockRacketId, {});

      expect(result.reviews).toBeDefined();
      expect(result.pagination).toBeDefined();
      expect(result.pagination.total).toBe(1);
      expect(result.stats).toBeDefined();
    });

    it('should include user like information when userId is provided', async () => {
      const mockReviews = [
        { ...mockReview, user: mockUser, racket: mockRacket },
      ];

      const mockQuery = {
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: mockReviews,
          error: null,
          count: 1,
        }),
        select: vi.fn().mockReturnThis(),
      };

      (supabase.from as vi.Mock).mockImplementation((table: string) => {
        if (table === 'reviews') return mockQuery;
        if (table === 'review_likes') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                in: vi.fn().mockResolvedValue({
                  data: [{ review_id: mockReviewId }],
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      });

      const result = await ReviewService.getReviewsByRacket(mockRacketId, {}, mockUserId);

      expect(result.reviews[0].user_has_liked).toBe(true);
    });

    it('should set user_has_liked to false when userId not provided', async () => {
      const mockReviews = [
        { ...mockReview, user: mockUser, racket: mockRacket },
      ];

      const mockQuery = {
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: mockReviews,
          error: null,
          count: 1,
        }),
        select: vi.fn().mockReturnThis(),
      };

      (supabase.from as vi.Mock).mockReturnValue(mockQuery);

      const result = await ReviewService.getReviewsByRacket(mockRacketId, {});

      expect(result.reviews[0].user_has_liked).toBe(false);
    });
  });

  describe('getReviewsByUser', () => {
    it('should get reviews by user with pagination', async () => {
      const mockReviews = [
        { ...mockReview, user: mockUser, racket: mockRacket },
      ];

      const mockQuery = {
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: mockReviews,
          error: null,
          count: 1,
        }),
        select: vi.fn().mockReturnThis(),
      };

      (supabase.from as vi.Mock).mockReturnValue(mockQuery);

      const result = await ReviewService.getReviewsByUser(mockUserId, 1, 10);

      expect(result.reviews).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);
    });
  });

  describe('getReviewById', () => {
    it('should get review by ID with comments and like status', async () => {
      const mockReviewWithDetails = {
        ...mockReview,
        user: mockUser,
        racket: mockRacket,
      };

      const mockComments = [
        {
          id: 'comment-1',
          content: 'Great review!',
          user: mockUser,
        },
      ];

      const mockQuery = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockReviewWithDetails,
          error: null,
        }),
        select: vi.fn().mockReturnThis(),
      };

      let callCount = 0;
      (supabase.from as vi.Mock).mockImplementation((table: string) => {
        callCount++;
        if (table === 'reviews') return mockQuery;
        if (table === 'review_comments') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: mockComments, error: null }),
              }),
            }),
          };
        }
        if (table === 'review_likes') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: { id: 'like-1' }, error: null }),
                }),
              }),
            }),
          };
        }
        return {};
      });

      const result = await ReviewService.getReviewById(mockReviewId, mockUserId);

      expect(result).toBeDefined();
      expect(result?.comments).toBeDefined();
      expect(result?.user_has_liked).toBe(true);
    });

    it('should return null when review not found', async () => {
      const mockQuery = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' },
        }),
        select: vi.fn().mockReturnThis(),
      };

      (supabase.from as vi.Mock).mockReturnValue(mockQuery);

      const result = await ReviewService.getReviewById('non-existent-id');

      expect(result).toBeNull();
    });

    it('should return null when there is an error', async () => {
      const mockQuery = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Not found' },
        }),
        select: vi.fn().mockReturnThis(),
      };

      (supabase.from as vi.Mock).mockReturnValue(mockQuery);

      const result = await ReviewService.getReviewById('error-id');

      expect(result).toBeNull();
    });
  });

  describe('createReview', () => {
    const createReviewDTO: CreateReviewDTO = {
      racket_id: mockRacketId,
      rating: 5,
      title: 'Great racket',
      content: 'Excellent control and power',
    };

    it('should create a new review', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        }),
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockReview,
              error: null,
            }),
          }),
        }),
      };

      (supabase.from as vi.Mock).mockReturnValue(mockQuery);

      const result = await ReviewService.createReview(mockUserId, createReviewDTO);

      expect(result).toEqual(mockReview);
    });

    it('should throw error when user already has a review for this racket', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { id: 'existing' }, error: null }),
            }),
          }),
        }),
      };

      (supabase.from as vi.Mock).mockReturnValue(mockQuery);

      await expect(
        ReviewService.createReview(mockUserId, createReviewDTO)
      ).rejects.toThrow('Ya has publicado una review para esta pala');
    });
  });

  describe('updateReview', () => {
    const updateDTO: UpdateReviewDTO = {
      rating: 4,
      title: 'Updated title',
      content: 'Updated content',
    };

    it('should update review when user is owner', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { user_id: mockUserId },
              error: null,
            }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { ...mockReview, ...updateDTO },
                error: null,
              }),
            }),
          }),
        }),
      };

      (supabase.from as vi.Mock).mockReturnValue(mockQuery);

      const result = await ReviewService.updateReview(mockReviewId, mockUserId, updateDTO);

      expect(result.rating).toBe(4);
      expect(result.title).toBe('Updated title');
    });

    it('should throw error when user is not the owner', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { user_id: 'different-user' },
              error: null,
            }),
          }),
        }),
      };

      (supabase.from as vi.Mock).mockReturnValue(mockQuery);

      await expect(
        ReviewService.updateReview(mockReviewId, mockUserId, updateDTO)
      ).rejects.toThrow('No tienes permiso para editar esta review');
    });

    it('should throw error when review not found', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        }),
      };

      (supabase.from as vi.Mock).mockReturnValue(mockQuery);

      await expect(
        ReviewService.updateReview(mockReviewId, mockUserId, updateDTO)
      ).rejects.toThrow('No tienes permiso para editar esta review');
    });
  });

  describe('deleteReview', () => {
    it('should delete review when user is owner', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { user_id: mockUserId },
              error: null,
            }),
          }),
        }),
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      };

      (supabase.from as vi.Mock).mockReturnValue(mockQuery);

      await expect(ReviewService.deleteReview(mockReviewId, mockUserId)).resolves.not.toThrow();
    });

    it('should throw error when user is not the owner', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { user_id: 'different-user' },
              error: null,
            }),
          }),
        }),
      };

      (supabase.from as vi.Mock).mockReturnValue(mockQuery);

      await expect(
        ReviewService.deleteReview(mockReviewId, mockUserId)
      ).rejects.toThrow('No tienes permiso para eliminar esta review');
    });
  });

  describe('toggleLike', () => {
    it('should add like when it does not exist', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            }),
          }),
        }),
        insert: vi.fn().mockResolvedValue({ error: null }),
      };

      (supabase.from as vi.Mock).mockReturnValue(mockQuery);

      const result = await ReviewService.toggleLike(mockReviewId, mockUserId);

      expect(result).toBe(true);
    });

    it('should remove like when it exists', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: 'like-123' },
                error: null,
              }),
            }),
          }),
        }),
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      };

      (supabase.from as vi.Mock).mockReturnValue(mockQuery);

      const result = await ReviewService.toggleLike(mockReviewId, mockUserId);

      expect(result).toBe(false);
    });
  });

  describe('addComment', () => {
    const commentDTO: CreateCommentDTO = {
      content: 'Great review!',
    };

    it('should add comment to review', async () => {
      const mockComment = {
        id: 'comment-1',
        review_id: mockReviewId,
        user_id: mockUserId,
        content: commentDTO.content,
        user: mockUser,
      };

      const mockQuery = {
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockComment,
              error: null,
            }),
          }),
        }),
      };

      (supabase.from as vi.Mock).mockReturnValue(mockQuery);

      const result = await ReviewService.addComment(mockReviewId, mockUserId, commentDTO);

      expect(result.content).toBe(commentDTO.content);
    });
  });

  describe('getComments', () => {
    it('should get comments for a review', async () => {
      const mockComments = [
        { id: 'c1', content: 'Comment 1', user: mockUser },
        { id: 'c2', content: 'Comment 2', user: mockUser },
      ];

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockComments,
              error: null,
            }),
          }),
        }),
      };

      (supabase.from as vi.Mock).mockReturnValue(mockQuery);

      const result = await ReviewService.getComments(mockReviewId);

      expect(result).toHaveLength(2);
    });
  });

  describe('deleteComment', () => {
    it('should delete comment when user is owner', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { user_id: mockUserId },
              error: null,
            }),
          }),
        }),
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      };

      (supabase.from as vi.Mock).mockReturnValue(mockQuery);

      await expect(ReviewService.deleteComment('comment-1', mockUserId)).resolves.not.toThrow();
    });

    it('should throw error when user is not the owner', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { user_id: 'different-user' },
              error: null,
            }),
          }),
        }),
      };

      (supabase.from as vi.Mock).mockReturnValue(mockQuery);

      await expect(
        ReviewService.deleteComment('comment-1', mockUserId)
      ).rejects.toThrow('No tienes permiso para eliminar este comentario');
    });
  });
});
