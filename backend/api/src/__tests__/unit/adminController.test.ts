import { AdminController } from "../../../src/controllers/adminController";
import { storeService } from "../../../src/services/storeService";
import { supabase } from "../../../src/config/supabase";

jest.mock("../../../src/services/storeService", () => ({
  storeService: {
    getAllStores: jest.fn(),
    verifyStore: jest.fn(),
    rejectStore: jest.fn(),
  },
}));

jest.mock("../../../src/config/supabase", () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe("AdminController", () => {
  const createMockRes = () => {
    const res: any = {};
    res.statusCode = 200;
    res.json = jest.fn(() => res);
    res.status = jest.fn((code: number) => {
      res.statusCode = code;
      return res;
    });
    return res;
  };

  const createMockReq = (overrides: Partial<any> = {}) => ({
    params: {},
    query: {},
    body: {},
    user: undefined,
    ...overrides,
  }) as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getMetrics", () => {
    it("returns aggregated metrics successfully", async () => {
      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        return {
          select: (columns: string, options?: any) => {
            // Base counts for direct table count queries
            const counts: Record<string, number> = {
              user_profiles: 10,
              rackets: 50,
              reviews: 20,
              stores: 5,
            };

            // Object that supports both direct count destructuring and chained filters
            const response = {
              count: counts[table] ?? 0,
              gte: async (column: string, value: string) => {
                // Active users in last 30 days
                return { count: 7 };
              },
              eq: async (column: string, value: any) => {
                // Verified/pending stores
                if (table === "stores") {
                  return { count: value ? 3 : 2 };
                }
                return { count: 0 };
              },
            } as any;

            return response;
          },
        };
      });

      const req = createMockReq({ user: { id: "admin-1", role: "admin" } });
      const res = createMockRes();

      await AdminController.getMetrics(req, res);

      expect(res.statusCode).toBe(200);
      const payload = (res.json as jest.Mock).mock.calls[0][0];
      expect(payload.success).toBe(true);
      expect(payload.data).toMatchObject({
        totalUsers: 10,
        totalRackets: 50,
        totalReviews: 20,
        totalStores: 3,
        activeUsers: 7,
        pendingRequests: 2,
        usersChange: 12.5,
        racketsChange: 8.3,
      });
    });
  });

  describe("getAllUsers", () => {
    it("returns users list", async () => {
      const users = [
        { id: "u1", email: "u1@test.com", nickname: "u1", role: "player" },
      ];
      (supabase.from as jest.Mock).mockImplementation(() => ({
        select: () => ({
          order: jest.fn().mockResolvedValue({ data: users, error: null }),
        }),
      }));

      const req = createMockReq({ user: { id: "admin-1", role: "admin" } });
      const res = createMockRes();

      await AdminController.getAllUsers(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: users })
      );
    });
  });

  describe("updateUserRole", () => {
    it("returns 400 for invalid role", async () => {
      const req = createMockReq({ params: { userId: "u1" }, body: { role: "guest" } });
      const res = createMockRes();

      await AdminController.updateUserRole(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, error: "Rol inválido" })
      );
    });

    it("updates role successfully", async () => {
      const updatedUser = { id: "u1", role: "admin" };
      (supabase.from as jest.Mock).mockImplementation(() => ({
        update: () => ({
          eq: () => ({
            select: () => ({
              single: jest.fn().mockResolvedValue({ data: updatedUser, error: null }),
            }),
          }),
        }),
      }));

      const req = createMockReq({ params: { userId: "u1" }, body: { role: "admin" } });
      const res = createMockRes();

      await AdminController.updateUserRole(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: updatedUser, message: "Rol actualizado correctamente" })
      );
    });
  });

  describe("deleteUser", () => {
    it("prevents deleting self", async () => {
      const req = createMockReq({ params: { userId: "u1" }, user: { id: "u1", role: "admin" } });
      const res = createMockRes();

      await AdminController.deleteUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, error: "Operación no permitida" })
      );
    });

    it("deletes user successfully", async () => {
      (supabase.from as jest.Mock).mockImplementation(() => ({
        delete: () => ({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      }));

      const req = createMockReq({ params: { userId: "u2" }, user: { id: "u1", role: "admin" } });
      const res = createMockRes();

      await AdminController.deleteUser(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, message: "Usuario eliminado correctamente" })
      );
    });
  });

  describe("getRacketRequests", () => {
    it("returns empty list for now", async () => {
      const req = createMockReq({ user: { id: "admin-1", role: "admin" } });
      const res = createMockRes();

      await AdminController.getRacketRequests(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: [] })
      );
    });
  });

  describe("getStoreRequests", () => {
    it("returns pending stores", async () => {
      const stores = [{ id: "s1", verified: false }];
      (storeService.getAllStores as jest.Mock).mockResolvedValue(stores);
      const req = createMockReq({ user: { id: "admin-1", role: "admin" } });
      const res = createMockRes();

      await AdminController.getStoreRequests(req, res);

      expect(storeService.getAllStores).toHaveBeenCalledWith(false);
      expect(res.statusCode).toBe(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: stores })
      );
    });
  });

  describe("verifyStore", () => {
    it("verifies store successfully", async () => {
      const store = { id: "s1", verified: true };
      (storeService.verifyStore as jest.Mock).mockResolvedValue(store);
      const req = createMockReq({ params: { id: "s1" }, user: { id: "admin-1", role: "admin" } });
      const res = createMockRes();

      await AdminController.verifyStore(req, res);

      expect(storeService.verifyStore).toHaveBeenCalledWith("s1");
      expect(res.statusCode).toBe(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: store, message: "Tienda verificada exitosamente" })
      );
    });
  });

  describe("rejectStore", () => {
    it("rejects store successfully", async () => {
      (storeService.rejectStore as jest.Mock).mockResolvedValue(undefined);
      const req = createMockReq({ params: { id: "s1" }, user: { id: "admin-1", role: "admin" } });
      const res = createMockRes();

      await AdminController.rejectStore(req, res);

      expect(storeService.rejectStore).toHaveBeenCalledWith("s1");
      expect(res.statusCode).toBe(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, message: "Solicitud de tienda rechazada" })
      );
    });
  });
});