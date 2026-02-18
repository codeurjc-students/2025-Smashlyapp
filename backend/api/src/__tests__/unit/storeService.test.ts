import { describe, it, expect, beforeEach, vi } from 'vitest';
import { storeService } from "../../../src/services/storeService";
import { supabase } from "../../../src/config/supabase";

vi.mock("../../../src/config/supabase", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe("storeService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  describe("createStore", () => {
    it("creates a store with verified=false and returns data", async () => {
      const newStore = { id: "s1", store_name: "Shop", verified: false };
      (supabase.from as vi.Mock).mockImplementation(() => ({
        insert: () => ({
          select: () => ({
            single: vi.fn().mockResolvedValue({ data: newStore, error: null }),
          }),
        }),
      }));

      const payload = await storeService.createStore({
        store_name: "Shop",
        legal_name: "Shop SL",
        cif_nif: "B12345678",
        contact_email: "shop@test.com",
        phone_number: "+34123456789",
        location: "Madrid",
        admin_user_id: "admin-1",
      });

      expect(payload).toEqual(newStore);
    });

    it("throws on insert error", async () => {
      (supabase.from as vi.Mock).mockImplementation(() => ({
        insert: () => ({
          select: () => ({
            single: vi.fn().mockResolvedValue({ error: { message: "fail" } }),
          }),
        }),
      }));

      await expect(
        storeService.createStore({
          store_name: "Shop",
          legal_name: "Shop SL",
          cif_nif: "B12345678",
          contact_email: "shop@test.com",
          phone_number: "+34123456789",
          location: "Madrid",
          admin_user_id: "admin-1",
        })
      ).rejects.toThrow("fail");
    });
  });

  describe("getAllStores", () => {
    it("returns all stores without filter", async () => {
      const stores = [{ id: "s1" }, { id: "s2" }];
      (supabase.from as vi.Mock).mockImplementation(() => ({
        select: () => ({
          order: vi.fn().mockResolvedValue({ data: stores, error: null }),
        }),
      }));

      const result = await storeService.getAllStores();
      expect(result).toEqual(stores);
    });

    it("applies verified filter when provided", async () => {
      const stores = [{ id: "s1", verified: true }];
      const orderMock = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: stores, error: null }) });
      (supabase.from as vi.Mock).mockImplementation(() => ({
        select: () => ({ order: orderMock }),
      }));

      const result = await storeService.getAllStores(true);
      expect(orderMock).toHaveBeenCalledWith("created_at", { ascending: false });
      expect(result).toEqual(stores);
    });
  });

  describe("getStoreById", () => {
    it("returns store data when found", async () => {
      const store = { id: "s1" };
      (supabase.from as vi.Mock).mockImplementation(() => ({
        select: () => ({
          eq: () => ({
            single: vi.fn().mockResolvedValue({ data: store, error: null }),
          }),
        }),
      }));

      const result = await storeService.getStoreById("s1");
      expect(result).toEqual(store);
    });

    it("throws when supabase returns error", async () => {
      (supabase.from as vi.Mock).mockImplementation(() => ({
        select: () => ({
          eq: () => ({
            single: vi.fn().mockResolvedValue({ error: { message: "not found" } }),
          }),
        }),
      }));

      await expect(storeService.getStoreById("bad")).rejects.toThrow("not found");
    });
  });

  describe("getStoreByOwnerId", () => {
    it("returns store when found", async () => {
      const store = { id: "s1", admin_user_id: "owner-1" };
      (supabase.from as vi.Mock).mockImplementation(() => ({
        select: () => ({
          eq: () => ({
            single: vi.fn().mockResolvedValue({ data: store, error: null }),
          }),
        }),
      }));

      const result = await storeService.getStoreByOwnerId("owner-1");
      expect(result).toEqual(store);
    });

    it("returns null when no rows found (PGRST116)", async () => {
      (supabase.from as vi.Mock).mockImplementation(() => ({
        select: () => ({
          eq: () => ({
            single: vi.fn().mockResolvedValue({ error: { code: "PGRST116", message: "No rows" } }),
          }),
        }),
      }));

      const result = await storeService.getStoreByOwnerId("owner-2");
      expect(result).toBeNull();
    });
  });

  describe("updateStore", () => {
    it("updates and returns store", async () => {
      const updated = { id: "s1", verified: true };
      (supabase.from as vi.Mock).mockImplementation(() => ({
        update: () => ({
          eq: () => ({
            select: () => ({
              single: vi.fn().mockResolvedValue({ data: updated, error: null }),
            }),
          }),
        }),
      }));

      const result = await storeService.updateStore("s1", { verified: true });
      expect(result).toEqual(updated);
    });

    it("throws on update error", async () => {
      (supabase.from as vi.Mock).mockImplementation(() => ({
        update: () => ({
          eq: () => ({
            select: () => ({
              single: vi.fn().mockResolvedValue({ error: { message: "update failed" } }),
            }),
          }),
        }),
      }));

      await expect(storeService.updateStore("s1", { verified: true })).rejects.toThrow("update failed");
    });
  });

  describe("verifyStore & rejectStore", () => {
    it("verifyStore delegates to updateStore with verified=true", async () => {
      const spy = vi.spyOn(storeService, "updateStore").mockResolvedValue({ id: "s1", verified: true } as any);
      const result = await storeService.verifyStore("s1");
      expect(spy).toHaveBeenCalledWith("s1", { verified: true });
      expect((result as any).verified).toBe(true);
    });

    it("rejectStore delegates to deleteStore", async () => {
      const spy = vi.spyOn(storeService, "deleteStore").mockResolvedValue({ success: true } as any);
      const result = await storeService.rejectStore("s1");
      expect(spy).toHaveBeenCalledWith("s1");
      expect(result).toEqual({ success: true });
    });
  });

  describe("deleteStore", () => {
    it("deletes store successfully", async () => {
      (supabase.from as vi.Mock).mockImplementation(() => ({
        delete: () => ({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      }));

      const result = await storeService.deleteStore("s1");
      expect(result).toEqual({ success: true });
    });

    it("throws on delete error", async () => {
      (supabase.from as vi.Mock).mockImplementation(() => ({
        delete: () => ({
          eq: vi.fn().mockResolvedValue({ error: { message: "delete failed" } }),
        }),
      }));

      await expect(storeService.deleteStore("s1")).rejects.toThrow("delete failed");
    });
  });
});