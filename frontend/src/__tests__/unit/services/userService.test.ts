import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserService } from '../../../services/userService';

// Mock fetch
global.fetch = vi.fn();

// Mock localStorage
Storage.prototype.getItem = vi.fn();

describe('UserService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getUserProfile', () => {
    it('should fetch user profile', async () => {
      vi.mocked(localStorage.getItem).mockReturnValue('test-token');

      const mockProfile = {
        id: 'user-1',
        email: 'test@test.com',
        nickname: 'testuser',
        full_name: 'Test User',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockProfile }),
      });

      const result = await UserService.getUserProfile();

      expect(result).toEqual(mockProfile);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/users/profile'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        })
      );
    });

    it('should handle error', async () => {
      vi.mocked(localStorage.getItem).mockReturnValue('test-token');

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({}),
      });

      await expect(UserService.getUserProfile()).rejects.toThrow();
    });
  });

  describe('createUserProfile', () => {
    it('should create user profile', async () => {
      vi.mocked(localStorage.getItem).mockReturnValue('test-token');

      const profileData = {
        nickname: 'newuser',
        full_name: 'New User',
        nivel_juego: 'Intermedio',
      };

      const createdProfile = { id: 'user-2', ...profileData };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: createdProfile }),
      });

      const result = await UserService.createUserProfile(profileData);

      expect(result).toEqual(createdProfile);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/users/profile'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(profileData),
        })
      );
    });
  });

  describe('updateUserProfile', () => {
    it('should update user profile', async () => {
      vi.mocked(localStorage.getItem).mockReturnValue('test-token');

      const updates = { full_name: 'Updated Name' };
      const updatedProfile = { id: 'user-1', ...updates };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: updatedProfile }),
      });

      const result = await UserService.updateUserProfile(updates);

      expect(result).toEqual(updatedProfile);
    });
  });

  describe('getFavorites', () => {
    it('should fetch user favorites', async () => {
      vi.mocked(localStorage.getItem).mockReturnValue('test-token');

      const mockFavorites = [1, 2, 3, 4, 5];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockFavorites }),
      });

      const result = await UserService.getFavorites();

      expect(result).toEqual(mockFavorites);
    });
  });

  describe('addFavorite', () => {
    it('should add racket to favorites', async () => {
      vi.mocked(localStorage.getItem).mockReturnValue('test-token');

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await UserService.addFavorite(1);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/users/favorites/1'),
        expect.objectContaining({
          method: 'POST',
        })
      );
    });
  });

  describe('removeFavorite', () => {
    it('should remove racket from favorites', async () => {
      vi.mocked(localStorage.getItem).mockReturnValue('test-token');

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await UserService.removeFavorite(1);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/users/favorites/1'),
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });
  });
});
