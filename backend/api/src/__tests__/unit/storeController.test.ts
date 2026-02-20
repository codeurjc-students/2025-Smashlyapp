import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Response } from 'express';
import { RequestWithUser } from '../../../src/types';
import { storeController } from '../../../src/controllers/storeController';
import { storeService } from '../../../src/services/storeService';

vi.mock('../../../src/services/storeService');
vi.mock('../../../src/config/logger', () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('storeController', () => {
  let mockReq: Partial<RequestWithUser>;
  let mockRes: Partial<Response>;
  let statusMock: vi.Mock;
  let jsonMock: vi.Mock;

  beforeEach(() => {
    vi.clearAllMocks();

    statusMock = vi.fn().mockReturnThis();
    jsonMock = vi.fn().mockReturnThis();

    mockRes = {
      status: statusMock,
      json: jsonMock,
    };

    mockReq = {
      user: { id: 'user-123', email: 'user@test.com', role: 'user' },
      query: {},
      params: {},
      body: {},
    };
  });

  describe('createStoreRequest', () => {
    const validStoreData = {
      store_name: 'Test Store',
      legal_name: 'Test Legal SL',
      cif_nif: 'B12345678',
      contact_email: 'test@example.com',
      phone_number: '123456789',
      location: 'Madrid',
    };

    it('should create a store request successfully', async () => {
      mockReq.body = validStoreData;
      (storeService.getStoreByOwnerId as vi.Mock).mockResolvedValue(null);
      (storeService.createStore as vi.Mock).mockResolvedValue({
        id: 'store-1',
        ...validStoreData,
      });

      await storeController.createStoreRequest(mockReq as RequestWithUser, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('Pending verification'),
        })
      );
    });

    it('should return 401 when user is not authenticated', async () => {
      mockReq.user = undefined;

      await storeController.createStoreRequest(mockReq as RequestWithUser, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Usuario no autenticado',
        })
      );
    });

    it('should return 400 when user already has a store', async () => {
      (storeService.getStoreByOwnerId as vi.Mock).mockResolvedValue({
        id: 'existing-store',
      });

      await storeController.createStoreRequest(mockReq as RequestWithUser, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Ya tienes una tienda registrada',
        })
      );
    });

    it('should return 400 when required fields are missing', async () => {
      mockReq.body = {
        store_name: 'Test Store',
        // Missing other required fields
      };
      (storeService.getStoreByOwnerId as vi.Mock).mockResolvedValue(null);

      await storeController.createStoreRequest(mockReq as RequestWithUser, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Faltan campos requeridos',
        })
      );
    });

    it('should handle errors gracefully', async () => {
      mockReq.body = validStoreData;
      (storeService.getStoreByOwnerId as vi.Mock).mockRejectedValue(
        new Error('Database error')
      );

      await storeController.createStoreRequest(mockReq as RequestWithUser, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Error al crear la tienda',
        })
      );
    });
  });

  describe('getAllStores', () => {
    it('should get all stores without pagination', async () => {
      const mockStores = [
        { id: '1', store_name: 'Store 1' },
        { id: '2', store_name: 'Store 2' },
      ];
      (storeService.getAllStores as vi.Mock).mockResolvedValue(mockStores);

      await storeController.getAllStores(mockReq as RequestWithUser, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(mockStores);
    });

    it('should get stores with pagination', async () => {
      mockReq.query = { paginated: 'true', page: '0', limit: '10' };
      const mockPaginatedResult = {
        data: [{ id: '1', store_name: 'Store 1' }],
        pagination: { total: 1, page: 0, limit: 10 },
      };
      (storeService.getStoresWithPagination as vi.Mock).mockResolvedValue(
        mockPaginatedResult
      );

      await storeController.getAllStores(mockReq as RequestWithUser, mockRes as Response);

      expect(storeService.getStoresWithPagination).toHaveBeenCalledWith(
        undefined,
        0,
        10
      );
      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it('should filter by verified=true', async () => {
      mockReq.query = { verified: 'true' };
      const mockStores = [{ id: '1', verified: true }];
      (storeService.getAllStores as vi.Mock).mockResolvedValue(mockStores);

      await storeController.getAllStores(mockReq as RequestWithUser, mockRes as Response);

      expect(storeService.getAllStores).toHaveBeenCalledWith(true);
    });

    it('should filter by verified=false', async () => {
      mockReq.query = { verified: 'false' };
      const mockStores = [{ id: '1', verified: false }];
      (storeService.getAllStores as vi.Mock).mockResolvedValue(mockStores);

      await storeController.getAllStores(mockReq as RequestWithUser, mockRes as Response);

      expect(storeService.getAllStores).toHaveBeenCalledWith(false);
    });

    it('should handle errors', async () => {
      (storeService.getAllStores as vi.Mock).mockRejectedValue(
        new Error('Database error')
      );

      await storeController.getAllStores(mockReq as RequestWithUser, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Error al obtener las tiendas',
        })
      );
    });
  });

  describe('getStoreById', () => {
    it('should get store by id', async () => {
      const mockStore = { id: '1', store_name: 'Test Store' };
      mockReq.params = { id: '1' };
      (storeService.getStoreById as vi.Mock).mockResolvedValue(mockStore);

      await storeController.getStoreById(mockReq as RequestWithUser, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(mockStore);
    });

    it('should return 404 when store not found', async () => {
      mockReq.params = { id: 'nonexistent' };
      (storeService.getStoreById as vi.Mock).mockResolvedValue(null);

      await storeController.getStoreById(mockReq as RequestWithUser, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Tienda no encontrada',
        })
      );
    });

    it('should handle errors', async () => {
      mockReq.params = { id: '1' };
      (storeService.getStoreById as vi.Mock).mockRejectedValue(
        new Error('Database error')
      );

      await storeController.getStoreById(mockReq as RequestWithUser, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
    });
  });

  describe('getMyStore', () => {
    it('should get user store', async () => {
      const mockStore = { id: '1', admin_user_id: 'user-123' };
      (storeService.getStoreByOwnerId as vi.Mock).mockResolvedValue(mockStore);

      await storeController.getMyStore(mockReq as RequestWithUser, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(mockStore);
    });

    it('should return 401 when user not authenticated', async () => {
      mockReq.user = undefined;

      await storeController.getMyStore(mockReq as RequestWithUser, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Usuario no autenticado',
        })
      );
    });

    it('should return 404 when user has no store', async () => {
      (storeService.getStoreByOwnerId as vi.Mock).mockResolvedValue(null);

      await storeController.getMyStore(mockReq as RequestWithUser, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'No tienes una tienda registrada',
        })
      );
    });
  });

  describe('updateStore', () => {
    const updates = { store_name: 'Updated Store Name' };

    it('should update store when user is owner', async () => {
      const mockStore = { id: '1', admin_user_id: 'user-123' };
      mockReq.params = { id: '1' };
      mockReq.body = updates;
      (storeService.getStoreById as vi.Mock).mockResolvedValue(mockStore);
      (storeService.updateStore as vi.Mock).mockResolvedValue({
        ...mockStore,
        ...updates,
      });

      await storeController.updateStore(mockReq as RequestWithUser, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it('should update store when user is admin', async () => {
      const mockStore = { id: '1', admin_user_id: 'different-user' };
      mockReq.params = { id: '1' };
      mockReq.body = updates;
      mockReq.user = { id: 'admin-123', email: 'admin@test.com', role: 'admin' };
      (storeService.getStoreById as vi.Mock).mockResolvedValue(mockStore);
      (storeService.updateStore as vi.Mock).mockResolvedValue({
        ...mockStore,
        ...updates,
      });

      await storeController.updateStore(mockReq as RequestWithUser, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it('should return 401 when user not authenticated', async () => {
      mockReq.user = undefined;

      await storeController.updateStore(mockReq as RequestWithUser, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(401);
    });

    it('should return 403 when user is not owner or admin', async () => {
      const mockStore = { id: '1', admin_user_id: 'different-user' };
      mockReq.params = { id: '1' };
      mockReq.body = updates;
      (storeService.getStoreById as vi.Mock).mockResolvedValue(mockStore);

      await storeController.updateStore(mockReq as RequestWithUser, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'No tienes permiso para actualizar esta tienda',
        })
      );
    });

    it('should return 404 when store not found', async () => {
      mockReq.params = { id: 'nonexistent' };
      mockReq.body = updates;
      (storeService.getStoreById as vi.Mock).mockResolvedValue(null);

      await storeController.updateStore(mockReq as RequestWithUser, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
    });
  });

  describe('deleteStore', () => {
    it('should delete store when user is owner', async () => {
      const mockStore = { id: '1', admin_user_id: 'user-123' };
      mockReq.params = { id: '1' };
      (storeService.getStoreById as vi.Mock).mockResolvedValue(mockStore);
      (storeService.deleteStore as vi.Mock).mockResolvedValue(undefined);

      await storeController.deleteStore(mockReq as RequestWithUser, mockRes as Response);

      expect(storeService.deleteStore).toHaveBeenCalledWith('1');
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Tienda eliminada exitosamente',
        })
      );
    });

    it('should delete store when user is admin', async () => {
      const mockStore = { id: '1', admin_user_id: 'different-user' };
      mockReq.params = { id: '1' };
      mockReq.user = { id: 'admin-123', email: 'admin@test.com', role: 'admin' };
      (storeService.getStoreById as vi.Mock).mockResolvedValue(mockStore);
      (storeService.deleteStore as vi.Mock).mockResolvedValue(undefined);

      await storeController.deleteStore(mockReq as RequestWithUser, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it('should return 403 when user is not owner or admin', async () => {
      const mockStore = { id: '1', admin_user_id: 'different-user' };
      mockReq.params = { id: '1' };
      (storeService.getStoreById as vi.Mock).mockResolvedValue(mockStore);

      await storeController.deleteStore(mockReq as RequestWithUser, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'No tienes permiso para eliminar esta tienda',
        })
      );
    });

    it('should return 404 when store not found', async () => {
      mockReq.params = { id: 'nonexistent' };
      (storeService.getStoreById as vi.Mock).mockResolvedValue(null);

      await storeController.deleteStore(mockReq as RequestWithUser, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
    });
  });
});
