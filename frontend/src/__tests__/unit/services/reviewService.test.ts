import { describe, it, expect, vi, beforeEach } from 'vitest';
import { reviewService } from '../../../services/reviewService';

// Mock fetch
global.fetch = vi.fn();

// Mock localStorage
Storage.prototype.getItem = vi.fn();
Storage.prototype.setItem = vi.fn();

describe('reviewService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getReviewsByRacket', () => {
    it('should fetch reviews for a racket', async () => {
      const mockReviews = {
        reviews: [
          { id: 1, rating: 5, comment: 'Great racket' },
          { id: 2, rating: 4, comment: 'Good' },
        ],
        total: 2,
        page: 1,
        pages: 1,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockReviews,
      });

      const result = await reviewService.getReviewsByRacket(1);

      expect(result).toEqual(mockReviews);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/reviews/racket/1'),
        expect.any(Object)
      );
    });

    it('should handle errors', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ message: 'Not found' }),
      });

      await expect(reviewService.getReviewsByRacket(999)).rejects.toThrow();
    });
  });

  describe('createReview', () => {
    it('should create a new review', async () => {
      vi.mocked(localStorage.getItem).mockReturnValue('test-token');

      const newReview = {
        racket_id: 1,
        rating: 5,
        comment: 'Excellent!',
        power: 9,
        control: 8,
      };

      const createdReview = { id: 1, ...newReview };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => createdReview,
      });

      const result = await reviewService.createReview(newReview);

      expect(result).toEqual(createdReview);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/reviews'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(newReview),
        })
      );
    });
  });

  describe('updateReview', () => {
    it('should update a review', async () => {
      vi.mocked(localStorage.getItem).mockReturnValue('test-token');

      const updates = { rating: 4, comment: 'Updated comment' };
      const updatedReview = { id: 1, ...updates };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => updatedReview,
      });

      const result = await reviewService.updateReview(1, updates);

      expect(result).toEqual(updatedReview);
    });
  });

  describe('deleteReview', () => {
    it('should delete a review', async () => {
      vi.mocked(localStorage.getItem).mockReturnValue('test-token');

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await reviewService.deleteReview(1);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/reviews/1'),
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });
  });

  describe('toggleLike', () => {
    it('should toggle like on a review', async () => {
      vi.mocked(localStorage.getItem).mockReturnValue('test-token');

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ likes: 5 }),
      });

      const result = await reviewService.toggleLike(1);

      expect(result).toEqual({ likes: 5 });
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/reviews/1/like'),
        expect.objectContaining({
          method: 'POST',
        })
      );
    });
  });

  describe('getComments', () => {
    it('should fetch comments for a review', async () => {
      const mockComments = [
        { id: 1, content: 'Great review!' },
        { id: 2, content: 'Thanks' },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockComments,
      });

      const result = await reviewService.getComments(1);

      expect(result).toEqual(mockComments);
    });
  });

  describe('addComment', () => {
    it('should add a comment to a review', async () => {
      vi.mocked(localStorage.getItem).mockReturnValue('test-token');

      const comment = { content: 'Nice review!' };
      const createdComment = { id: 1, ...comment };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => createdComment,
      });

      const result = await reviewService.addComment(1, comment);

      expect(result).toEqual(createdComment);
    });
  });
});
