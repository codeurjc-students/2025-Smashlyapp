import { Router } from "express";
import { AuthController } from "../controllers/authController";
import { validateBody, schemas } from "../middleware/validation";

const router = Router();

// POST /api/auth/login - Iniciar sesión
router.post("/auth/login", validateBody(schemas.login), AuthController.login);

// POST /api/auth/register - Registrar usuario
router.post(
  "/auth/register",
  validateBody(schemas.register),
  AuthController.register
);

// POST /api/auth/logout - Cerrar sesión
router.post("/auth/logout", AuthController.logout);

// POST /api/auth/refresh - Refrescar token
router.post(
  "/auth/refresh",
  validateBody(schemas.refreshToken),
  AuthController.refreshToken
);

// GET /api/auth/me - Obtener usuario actual
router.get("/auth/me", AuthController.getCurrentUser);

export default router;
