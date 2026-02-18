import { UserController } from "../../../src/controllers/userController";
import { UserService } from "../../../src/services/userService";

vi.mock("../../../src/services/userService", () => ({
  UserService: {
    getUserProfile: vi.fn(),
    validateProfileData: vi.fn(),
    createUserProfile: vi.fn(),
    updateUserProfile: vi.fn(),
    deleteUserProfile: vi.fn(),
    isNicknameAvailable: vi.fn(),
    searchUsersByNickname: vi.fn(),
    getUserStats: vi.fn(),
  },
}));

describe("UserController", () => {
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

  describe("getUserProfile", () => {
    it("returns 401 when unauthenticated", async () => {
      const req = createMockReq({});
      const res = createMockRes();

      await UserController.getUserProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, error: "Unauthorized" })
      );
    });

    it("returns 404 when profile not found", async () => {
      (UserService.getUserProfile as vi.Mock).mockResolvedValue(null);
      const req = createMockReq({ user: { id: "u1" } });
      const res = createMockRes();

      await UserController.getUserProfile(req, res);

      expect(UserService.getUserProfile).toHaveBeenCalledWith("u1");
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, error: "Not Found" })
      );
    });

    it("returns profile when found", async () => {
      const profile = { id: "p1", user_id: "u1", nickname: "smash" };
      (UserService.getUserProfile as vi.Mock).mockResolvedValue(profile);
      const req = createMockReq({ user: { id: "u1" } });
      const res = createMockRes();

      await UserController.getUserProfile(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: profile })
      );
    });
  });

  describe("createUserProfile", () => {
    it("returns 401 when unauthenticated", async () => {
      const req = createMockReq({ body: { nickname: "smash" } });
      const res = createMockRes();

      await UserController.createUserProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, error: "Unauthorized" })
      );
    });

    it("returns 400 when validation fails", async () => {
      (UserService.validateProfileData as vi.Mock).mockReturnValue({ isValid: false, errors: ["Invalid"] });
      const req = createMockReq({ user: { id: "u1" }, body: { nickname: "sm" } });
      const res = createMockRes();

      await UserController.createUserProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, error: "Invalid data" })
      );
    });

    it("creates profile successfully", async () => {
      (UserService.validateProfileData as vi.Mock).mockReturnValue({ isValid: true, errors: [] });
      const created = { id: "p1", user_id: "u1", nickname: "smash" };
      (UserService.createUserProfile as vi.Mock).mockResolvedValue(created);
      const req = createMockReq({ user: { id: "u1" }, body: { nickname: "smash" } });
      const res = createMockRes();

      await UserController.createUserProfile(req, res);

      expect(UserService.createUserProfile).toHaveBeenCalledWith("u1", { nickname: "smash" });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: created, message: "Perfil creado exitosamente" })
      );
    });
  });

  describe("updateUserProfile", () => {
    it("returns 401 when unauthenticated", async () => {
      const req = createMockReq({ body: { nickname: "new" } });
      const res = createMockRes();

      await UserController.updateUserProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, error: "Usuario no autenticado" })
      );
    });

    it("returns 400 when validation fails", async () => {
      (UserService.validateProfileData as vi.Mock).mockReturnValue({ isValid: false, errors: ["Invalid"] });
      const req = createMockReq({ user: { id: "u1" }, body: { nickname: "no" } });
      const res = createMockRes();

      await UserController.updateUserProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, error: "Invalid data" })
      );
    });

    it("returns 409 when nickname conflict", async () => {
      (UserService.validateProfileData as vi.Mock).mockReturnValue({ isValid: true, errors: [] });
      (UserService.updateUserProfile as vi.Mock).mockRejectedValue(new Error("nickname already taken"));
      const req = createMockReq({ user: { id: "u1" }, body: { nickname: "newnick" } });
      const res = createMockRes();

      await UserController.updateUserProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, error: "Data conflict" })
      );
    });

    it("updates profile successfully", async () => {
      (UserService.validateProfileData as vi.Mock).mockReturnValue({ isValid: true, errors: [] });
      const updated = { id: "p1", user_id: "u1", nickname: "new" };
      (UserService.updateUserProfile as vi.Mock).mockResolvedValue(updated);
      const req = createMockReq({ user: { id: "u1" }, body: { nickname: "new" } });
      const res = createMockRes();

      await UserController.updateUserProfile(req, res);

      expect(UserService.updateUserProfile).toHaveBeenCalledWith("u1", { nickname: "new" });
      expect(res.statusCode).toBe(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: updated, message: "Profile updated successfully" })
      );
    });
  });

  describe("deleteUserProfile", () => {
    it("returns 401 when unauthenticated", async () => {
      const req = createMockReq({});
      const res = createMockRes();

      await UserController.deleteUserProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, error: "Unauthorized user" })
      );
    });

    it("deletes profile successfully", async () => {
      (UserService.deleteUserProfile as vi.Mock).mockResolvedValue(undefined);
      const req = createMockReq({ user: { id: "u1" } });
      const res = createMockRes();

      await UserController.deleteUserProfile(req, res);

      expect(UserService.deleteUserProfile).toHaveBeenCalledWith("u1");
      expect(res.statusCode).toBe(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, message: "Profile deleted successfully" })
      );
    });
  });

  describe("checkNicknameAvailability", () => {
    it("returns 400 for invalid nickname", async () => {
      const req = createMockReq({ params: { nickname: "ab" } });
      const res = createMockRes();

      await UserController.checkNicknameAvailability(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, error: "Invalid nickname" })
      );
    });

    it("returns available true", async () => {
      (UserService.isNicknameAvailable as vi.Mock).mockResolvedValue(true);
      const req = createMockReq({ params: { nickname: "smash" }, query: {} });
      const res = createMockRes();

      await UserController.checkNicknameAvailability(req, res);

      expect(UserService.isNicknameAvailable).toHaveBeenCalledWith("smash", undefined);
      expect(res.statusCode).toBe(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: { available: true, nickname: "smash" } })
      );
    });

    it("returns available false with excludeUserId", async () => {
      (UserService.isNicknameAvailable as vi.Mock).mockResolvedValue(false);
      const req = createMockReq({ params: { nickname: "smash" }, query: { excludeUserId: "u1" } });
      const res = createMockRes();

      await UserController.checkNicknameAvailability(req, res);

      expect(UserService.isNicknameAvailable).toHaveBeenCalledWith("smash", "u1");
      expect(res.statusCode).toBe(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: { available: false, nickname: "smash" } })
      );
    });
  });

  describe("searchUsers", () => {
    it("returns 400 for short query", async () => {
      const req = createMockReq({ query: { q: "a" } });
      const res = createMockRes();

      await UserController.searchUsers(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, error: "Invalid query" })
      );
    });

    it("returns users list", async () => {
      const users = [{ id: "u2", nickname: "ace" }];
      (UserService.searchUsersByNickname as vi.Mock).mockResolvedValue(users);
      const req = createMockReq({ query: { q: "ac", limit: "5" } });
      const res = createMockRes();

      await UserController.searchUsers(req, res);

      expect(UserService.searchUsersByNickname).toHaveBeenCalledWith("ac", 5);
      expect(res.statusCode).toBe(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: users })
      );
    });
  });

  describe("getUserStats", () => {
    it("returns stats successfully", async () => {
      const stats = { totalUsers: 10 };
      (UserService.getUserStats as vi.Mock).mockResolvedValue(stats);
      const req = createMockReq({});
      const res = createMockRes();

      await UserController.getUserStats(req, res);

      expect(UserService.getUserStats).toHaveBeenCalled();
      expect(res.statusCode).toBe(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: stats })
      );
    });
  });
});