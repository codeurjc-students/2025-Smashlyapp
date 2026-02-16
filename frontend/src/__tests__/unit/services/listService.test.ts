import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ListService } from '../../../services/listService';
import * as authUtils from '../../../utils/authUtils';

// Mock fetch
global.fetch = vi.fn();

vi.mock('../../../utils/authUtils', () => ({
  getAuthToken: vi.fn(),
}));

describe('ListService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getUserLists', () => {
    it('should throw error if no auth token', async () => {
      vi.mocked(authUtils.getAuthToken).mockReturnValue(null);

      await expect(ListService.getUserLists()).rejects.toThrow(
        'No hay token de autenticación'
      );
    });

    it('should return user lists', async () => {
      vi.mocked(authUtils.getAuthToken).mockReturnValue('valid-token');

      const mockLists = [
        { id: '1', name: 'Mis Favoritas', is_public: false, racket_count: 5 },
        { id: '2', name: 'Para Comprar', is_public: true, racket_count: 3 },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockLists }),
      });

      const result = await ListService.getUserLists();

      expect(result).toEqual(mockLists);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/lists'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer valid-token',
          }),
        })
      );
    });

    it('should handle API error', async () => {
      vi.mocked(authUtils.getAuthToken).mockReturnValue('valid-token');

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Server error' }),
      });

      await expect(ListService.getUserLists()).rejects.toThrow('Server error');
    });
  });

  describe('getListById', () => {
    it('should return list with rackets', async () => {
      vi.mocked(authUtils.getAuthToken).mockReturnValue('valid-token');

      const mockList = {
        id: '1',
        name: 'Mis Favoritas',
        rackets: [
          { id: 1, nombre: 'Racket 1' },
          { id: 2, nombre: 'Racket 2' },
        ],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockList }),
      });

      const result = await ListService.getListById('1');

      expect(result).toEqual(mockList);
    });
  });

  describe('createList', () => {
    it('should create new list', async () => {
      vi.mocked(authUtils.getAuthToken).mockReturnValue('valid-token');

      const newList = { name: 'Nueva Lista', description: 'Test' };
      const createdList = { id: '3', ...newList };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: createdList }),
      });

      const result = await ListService.createList(newList);

      expect(result).toEqual(createdList);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/lists'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(newList),
        })
      );
    });
  });

  describe('updateList', () => {
    it('should update list', async () => {
      vi.mocked(authUtils.getAuthToken).mockReturnValue('valid-token');

      const updates = { name: 'Updated Name' };
      const updatedList = { id: '1', name: 'Updated Name' };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: updatedList }),
      });

      const result = await ListService.updateList('1', updates);

      expect(result).toEqual(updatedList);
    });
  });

  describe('deleteList', () => {
    it('should delete list', async () => {
      vi.mocked(authUtils.getAuthToken).mockReturnValue('valid-token');

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await ListService.deleteList('1');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/lists/1'),
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });
  });

  describe('addRacketToList', () => {
    it('should add racket to list', async () => {
      vi.mocked(authUtils.getAuthToken).mockReturnValue('valid-token');

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await ListService.addRacketToList('list-1', 1);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/lists/list-1/rackets'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ racketId: 1 }),
        })
      );
    });
  });

  describe('removeRacketFromList', () => {
    it('should remove racket from list', async () => {
      vi.mocked(authUtils.getAuthToken).mockReturnValue('valid-token');

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await ListService.removeRacketFromList('list-1', 1);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/lists/list-1/rackets/1'),
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });
  });
});
