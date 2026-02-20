import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ListController } from "../../../src/controllers/listController";
import { ListService } from "../../../src/services/listService";

// Mock the ListService methods used by the controller
vi.mock("../../../src/services/listService", () => ({
  ListService: {
    getUserLists: vi.fn(),
    getListById: vi.fn(),
    createList: vi.fn(),
    updateList: vi.fn(),
    deleteList: vi.fn(),
    addRacketToList: vi.fn(),
    removeRacketFromList: vi.fn(),
  },
}));

describe("ListController", () => {
  const createMockRes = () => {
    const res: any = {};
    res.statusCode = 200;
    res.json = vi.fn(() => res);
    res.status = vi.fn((code: number) => {
      res.statusCode = code;
      return res;
    });
    return res;
  };

  const createMockReq = (overrides: Partial<any> = {}) => {
    return {
      params: {},
      query: {},
      body: {},
      user: undefined,
      ...overrides,
    } as any;
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getUserLists", () => {
    it("returns 401 if user not authenticated", async () => {
      const req = createMockReq({});
      const res = createMockRes();

      await ListController.getUserLists(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, error: "Usuario no autenticado" })
      );
    });

    it("returns lists for authenticated user", async () => {
      const lists = [{ id: "l1", name: "Favoritas" }];
      (ListService.getUserLists as vi.Mock).mockResolvedValue(lists);
      const req = createMockReq({ user: { id: "user-1" } });
      const res = createMockRes();

      await ListController.getUserLists(req, res);

      expect(ListService.getUserLists).toHaveBeenCalledWith("user-1");
      expect(res.statusCode).toBe(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: lists })
      );
    });
  });

  describe("getListById", () => {
    it("returns 401 if user not authenticated", async () => {
      const req = createMockReq({ params: { id: "list-1" } });
      const res = createMockRes();

      await ListController.getListById(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, error: "Usuario no autenticado" })
      );
    });

    it("returns 404 if list not found", async () => {
      (ListService.getListById as vi.Mock).mockResolvedValue(null);
      const req = createMockReq({ user: { id: "user-1" }, params: { id: "list-1" } });
      const res = createMockRes();

      await ListController.getListById(req, res);

      expect(ListService.getListById).toHaveBeenCalledWith("list-1", "user-1");
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, error: "Lista no encontrada" })
      );
    });

    it("returns list if found", async () => {
      const list = { id: "list-1", name: "Compras" };
      (ListService.getListById as vi.Mock).mockResolvedValue(list);
      const req = createMockReq({ user: { id: "user-1" }, params: { id: "list-1" } });
      const res = createMockRes();

      await ListController.getListById(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: list })
      );
    });
  });

  describe("createList", () => {
    it("returns 401 if user not authenticated", async () => {
      const req = createMockReq({ body: { name: "Nueva" } });
      const res = createMockRes();

      await ListController.createList(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, error: "Usuario no autenticado" })
      );
    });

    it("returns 400 if name missing", async () => {
      const req = createMockReq({ user: { id: "user-1" }, body: { name: "   " } });
      const res = createMockRes();

      await ListController.createList(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, error: "El nombre de la lista es requerido" })
      );
    });

    it("creates list successfully", async () => {
      const created = { id: "list-2", name: "Nueva" };
      (ListService.createList as vi.Mock).mockResolvedValue(created);
      const req = createMockReq({ user: { id: "user-1" }, body: { name: "Nueva" } });
      const res = createMockRes();

      await ListController.createList(req, res);

      expect(ListService.createList).toHaveBeenCalledWith("user-1", { name: "Nueva" });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: created, message: "Lista creada exitosamente" })
      );
    });
  });

  describe("updateList", () => {
    it("returns 401 if user not authenticated", async () => {
      const req = createMockReq({ params: { id: "list-1" }, body: { name: "Editada" } });
      const res = createMockRes();

      await ListController.updateList(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, error: "Usuario no autenticado" })
      );
    });

    it("updates list successfully", async () => {
      const updated = { id: "list-1", name: "Editada" };
      (ListService.updateList as vi.Mock).mockResolvedValue(updated);
      const req = createMockReq({ user: { id: "user-1" }, params: { id: "list-1" }, body: { name: "Editada" } });
      const res = createMockRes();

      await ListController.updateList(req, res);

      expect(ListService.updateList).toHaveBeenCalledWith("list-1", "user-1", { name: "Editada" });
      expect(res.statusCode).toBe(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: updated, message: "Lista actualizada exitosamente" })
      );
    });
  });

  describe("deleteList", () => {
    it("returns 401 if user not authenticated", async () => {
      const req = createMockReq({ params: { id: "list-1" } });
      const res = createMockRes();

      await ListController.deleteList(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, error: "Usuario no autenticado" })
      );
    });

    it("deletes list successfully", async () => {
      (ListService.deleteList as vi.Mock).mockResolvedValue(undefined);
      const req = createMockReq({ user: { id: "user-1" }, params: { id: "list-1" } });
      const res = createMockRes();

      await ListController.deleteList(req, res);

      expect(ListService.deleteList).toHaveBeenCalledWith("list-1", "user-1");
      expect(res.statusCode).toBe(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, message: "Lista eliminada exitosamente" })
      );
    });
  });

  describe("addRacketToList", () => {
    it("returns 401 if user not authenticated", async () => {
      const req = createMockReq({ params: { id: "list-1" }, body: { racket_id: 10 } });
      const res = createMockRes();

      await ListController.addRacketToList(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, error: "Usuario no autenticado" })
      );
    });

    it("returns 400 if racket_id missing", async () => {
      const req = createMockReq({ user: { id: "user-1" }, params: { id: "list-1" }, body: {} });
      const res = createMockRes();

      await ListController.addRacketToList(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, error: "El ID de la pala es requerido" })
      );
    });

    it("adds racket successfully", async () => {
      (ListService.addRacketToList as vi.Mock).mockResolvedValue(undefined);
      const req = createMockReq({ user: { id: "user-1" }, params: { id: "list-1" }, body: { racket_id: 10 } });
      const res = createMockRes();

      await ListController.addRacketToList(req, res);

      expect(ListService.addRacketToList).toHaveBeenCalledWith("list-1", "user-1", 10);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, message: "Racket added to list successfully" })
      );
    });

    it("returns 400 if duplicate racket error", async () => {
      (ListService.addRacketToList as vi.Mock).mockRejectedValue(new Error("La raqueta ya está en la lista"));
      const req = createMockReq({ user: { id: "user-1" }, params: { id: "list-1" }, body: { racket_id: 10 } });
      const res = createMockRes();

      await ListController.addRacketToList(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, error: "Raqueta ya existe en la lista" })
      );
    });
  });

  describe("removeRacketFromList", () => {
    it("returns 401 if user not authenticated", async () => {
      const req = createMockReq({ params: { id: "list-1", racketId: "12" } });
      const res = createMockRes();

      await ListController.removeRacketFromList(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, error: "Unauthorized user" })
      );
    });

    it("returns 400 for invalid racket ID", async () => {
      const req = createMockReq({ user: { id: "user-1" }, params: { id: "list-1", racketId: "abc" } });
      const res = createMockRes();

      await ListController.removeRacketFromList(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, error: "Invalid racket ID" })
      );
    });

    it("removes racket successfully", async () => {
      (ListService.removeRacketFromList as vi.Mock).mockResolvedValue(undefined);
      const req = createMockReq({ user: { id: "user-1" }, params: { id: "list-1", racketId: "12" } });
      const res = createMockRes();

      await ListController.removeRacketFromList(req, res);

      expect(ListService.removeRacketFromList).toHaveBeenCalledWith("list-1", "user-1", 12);
      expect(res.statusCode).toBe(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, message: "Racket removed from list successfully" })
      );
    });
  });
});