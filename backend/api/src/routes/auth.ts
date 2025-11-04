import { Router } from "express";
import { AuthController } from "../controllers/authController";
import { validateBody, schemas } from "../middleware/validation";
import { authenticateUser as requireAuth } from "../middleware/auth";

const router = Router();

// // POST /api/auth/login - Login
router.post("/login", AuthController.login);

// POST /api/auth/register - Register user
router.post(
  "/register",
  validateBody(schemas.register),
  AuthController.register
);

// POST /api/auth/logout - Logout
router.post("/logout", requireAuth, AuthController.logout);

// POST /api/auth/refresh - Refresh token
router.post(
  "/refresh",
  validateBody(schemas.refreshToken),
  AuthController.refreshToken
);

// GET /api/auth/me - Get current user
router.get("/me", AuthController.getCurrentUser);

export default router;
