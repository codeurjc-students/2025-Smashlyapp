import { Router } from "express";
import { AuthController } from "../controllers/authController";
import { validateBody, schemas } from "../middleware/validation";

const router = Router();

// POST /api/auth/login - Iniciar sesión
router.post("/login", validateBody(schemas.login), AuthController.login);

// POST /api/auth/register - Registrar usuario
router.post(
  "/register",
  validateBody(schemas.register),
  AuthController.register
);

// POST /api/auth/logout - Cerrar sesión
router.post("/logout", AuthController.logout);

// POST /api/auth/refresh - Refrescar token
router.post(
  "/refresh",
  validateBody(schemas.refreshToken),
  AuthController.refreshToken
);

// GET /api/auth/me - Obtener usuario actual
router.get("/me", AuthController.getCurrentUser);

export default router;
