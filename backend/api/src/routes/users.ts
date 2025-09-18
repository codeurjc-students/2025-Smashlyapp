import { Router } from "express";
import { UserController } from "../controllers/userController";
import { authenticateUser, optionalAuth } from "../middleware/auth";
import {
  validateBody,
  schemas,
  validateIdParam,
} from "../middleware/validation";

const router = Router();

// GET /api/users/profile - Obtiene el perfil del usuario autenticado
router.get("/profile", authenticateUser, UserController.getUserProfile);

// POST /api/users/profile - Crea un nuevo perfil de usuario
router.post(
  "/profile",
  authenticateUser,
  validateBody(schemas.userProfile),
  UserController.createUserProfile
);

// PUT /api/users/profile - Actualiza el perfil del usuario autenticado
router.put(
  "/profile",
  authenticateUser,
  validateBody(schemas.updateProfile),
  UserController.updateUserProfile
);

// DELETE /api/users/profile - Elimina el perfil del usuario autenticado
router.delete("/profile", authenticateUser, UserController.deleteUserProfile);

// GET /api/users/nickname/:nickname/available - Verifica si un nickname está disponible
router.get(
  "/nickname/:nickname/available",
  UserController.checkNicknameAvailability
);

// GET /api/users/search?q=... - Busca usuarios por nickname
router.get("/search", UserController.searchUsers);

// GET /api/users/stats - Obtiene estadísticas de usuarios (admin)
router.get("/stats", authenticateUser, UserController.getUserStats);

export default router;
