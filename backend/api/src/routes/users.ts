import { Router } from "express";
import { UserController } from "../controllers/userController";
import { authenticateUser, optionalAuth } from "../middleware/auth";
import {
  validateBody,
  schemas,
  validateIdParam,
} from "../middleware/validation";
import { ListController } from "../controllers/listController";

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

// GET /api/users/lists - Obtener todas las listas del usuario
router.get("/lists", authenticateUser, ListController.getUserLists);

// POST /api/users/lists - Crear nueva lista
router.post("/lists", authenticateUser, ListController.createList);

// GET /api/users/lists/:id - Obtener lista específica con sus palas
router.get("/lists/:id", authenticateUser, ListController.getListById);

// PUT /api/users/lists/:id - Actualizar lista
router.put("/lists/:id", authenticateUser, ListController.updateList);

// DELETE /api/users/lists/:id - Eliminar lista
router.delete("/lists/:id", authenticateUser, ListController.deleteList);

// POST /api/users/lists/:id/rackets - Añadir pala a lista
router.post(
  "/lists/:id/rackets",
  authenticateUser,
  ListController.addRacketToList
);

// DELETE /api/users/lists/:id/rackets/:racketId - Quitar pala de lista
router.delete(
  "/lists/:id/rackets/:racketId",
  authenticateUser,
  ListController.removeRacketFromList
);

export default router;
