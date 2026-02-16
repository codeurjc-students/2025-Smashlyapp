import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RacketViewService } from '../../../services/racketViewService';
import * as authUtils from '../../../utils/authUtils';

// Mock fetch
global.fetch = vi.fn();

vi.mock('../../../utils/authUtils', () => ({
  getAuthToken: vi.fn(),
}));

describe('RacketViewService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('recordView', () => {
    it('should record racket view', async () => {
      vi.mocked(authUtils.getAuthToken).mockReturnValue('test-token');

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await RacketViewService.recordView(1);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/racket-views/1'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        })
      );
    });
  });

  describe('getRecentlyViewed', () => {
    it('should get recently viewed rackets', async () => {
      vi.mocked(authUtils.getAuthToken).mockReturnValue('test-token');

      const mockViews = [
        { id: 1, nombre: 'Racket 1', viewed_at: '2024-01-01' },
        { id: 2, nombre: 'Racket 2', viewed_at: '2024-01-02' },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockViews }),
      });

      const result = await RacketViewService.getRecentlyViewed(10);

      expect(result).toEqual(mockViews);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/racket-views/recently-viewed?limit=10'),
        expect.any(Object)
      );
    });
  });

  describe('clearHistory', () => {
    it('should clear view history', async () => {
      vi.mocked(authUtils.getAuthToken).mockReturnValue('test-token');

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await RacketViewService.clearHistory();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/racket-views/clear'),
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });
  });
});
