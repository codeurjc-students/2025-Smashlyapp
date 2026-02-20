import { describe, it, expect, vi, beforeEach } from 'vitest';
import storeService from '../../../services/storeService';

// Mock fetch
global.fetch = vi.fn();

describe('storeService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createStoreRequest', () => {
    it('should create store request', async () => {
      const storeData = {
        store_name: 'Test Store',
        legal_name: 'Test Store Legal',
        cif_nif: '12345678A',
        contact_email: 'store@test.com',
        phone_number: '123456789',
        location: 'Madrid',
      };

      const mockStore = { id: 'store-1', ...storeData };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ store: mockStore }),
      });

      const result = await storeService.createStoreRequest(storeData, 'token');

      expect(result).toEqual(mockStore);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/stores'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(storeData),
        })
      );
    });

    it('should handle error', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Invalid data' }),
      });

      await expect(
        storeService.createStoreRequest({} as any, 'token')
      ).rejects.toThrow('Invalid data');
    });
  });

  describe('getAllStores', () => {
    it('should fetch all stores', async () => {
      const mockStores = [
        { id: '1', store_name: 'Store 1', verified: true },
        { id: '2', store_name: 'Store 2', verified: false },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockStores,
      });

      const result = await storeService.getAllStores();

      expect(result).toEqual(mockStores);
    });
  });

  describe('getStoreById', () => {
    it('should fetch store by id', async () => {
      const mockStore = { id: '1', store_name: 'Store 1', verified: true };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockStore,
      });

      const result = await storeService.getStoreById('1', 'token');

      expect(result).toEqual(mockStore);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/stores/1'),
        expect.any(Object)
      );
    });
  });
});
