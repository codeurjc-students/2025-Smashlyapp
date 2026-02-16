import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdminService } from '../../../services/adminService';

// Mock fetch
global.fetch = vi.fn();

// Mock localStorage
Storage.prototype.getItem = vi.fn();

describe('AdminService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(localStorage.getItem).mockReturnValue('admin-token');
  });

  describe('getMetrics', () => {
    it('should fetch admin metrics', async () => {
      const mockMetrics = {
        totalUsers: 100,
        totalRackets: 500,
        totalStores: 10,
        totalReviews: 250,
        pendingRequests: 5,
        activeUsers: 80,
        totalFavorites: 300,
        usersChange: 10,
        racketsChange: 20,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockMetrics }),
      });

      const result = await AdminService.getMetrics();

      expect(result).toEqual(mockMetrics);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/admin/metrics'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer admin-token',
          }),
        })
      );
    });
  });

  describe('getUsers', () => {
    it('should fetch all users', async () => {
      const mockUsers = [
        { id: '1', email: 'user1@test.com', nickname: 'user1', role: 'player' },
        { id: '2', email: 'user2@test.com', nickname: 'user2', role: 'admin' },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockUsers }),
      });

      const result = await AdminService.getUsers();

      expect(result).toEqual(mockUsers);
    });
  });

  describe('getStoreRequests', () => {
    it('should fetch store requests', async () => {
      const mockRequests = [
        {
          id: '1',
          store_name: 'Store 1',
          legal_name: 'Store Legal 1',
          verified: false,
        },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockRequests }),
      });

      const result = await AdminService.getStoreRequests();

      expect(result).toEqual(mockRequests);
    });
  });

  describe('approveStoreRequest', () => {
    it('should approve a store request', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await AdminService.approveStoreRequest('store-1');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/admin/stores/store-1/approve'),
        expect.objectContaining({
          method: 'POST',
        })
      );
    });
  });

  describe('rejectStoreRequest', () => {
    it('should reject a store request', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await AdminService.rejectStoreRequest('store-1', 'Invalid data');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/admin/stores/store-1/reject'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ reason: 'Invalid data' }),
        })
      );
    });
  });

  describe('updateUserRole', () => {
    it('should update user role', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await AdminService.updateUserRole('user-1', 'admin');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/admin/users/user-1/role'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ role: 'admin' }),
        })
      );
    });
  });

  describe('deleteUser', () => {
    it('should delete user', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await AdminService.deleteUser('user-1');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/admin/users/user-1'),
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });
  });
});
