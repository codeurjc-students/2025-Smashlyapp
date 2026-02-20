import { Router } from "express";
import { UserController } from "../controllers/userController";
import { authenticateUser, authenticateUser as requireAuth } from "../middleware/auth";
import {
  validateBody,
  schemas,
  validatePagination,
  validateSearchQuery,
} from "../middleware/validation";
import { ListController } from "../controllers/listController";

const router = Router();

// GET /api/users/profile - Gets the authenticated user's profile
router.get("/profile", requireAuth, UserController.getUserProfile);

// POST /api/users/profile - Creates a new user profile
router.post(
  "/profile",
  authenticateUser,
  validateBody(schemas.userProfile),
  UserController.createUserProfile
);

// PUT /api/users/profile - Updates the authenticated user's profile
router.put(
  "/profile",
  authenticateUser,
  validateBody(schemas.updateProfile),
  UserController.updateUserProfile
);

// DELETE /api/users/profile - Deletes the authenticated user's profile
router.delete("/profile", authenticateUser, UserController.deleteUserProfile);

// GET /api/users/nickname/:nickname/available - Verifica si un nickname está disponible
router.get(
  "/nickname/:nickname/available",
  UserController.checkNicknameAvailability
);

// GET /api/users/search?q=... - Search users by nickname
router.get(
  "/search",
  validateSearchQuery,
  validatePagination,
  UserController.searchUsers
);

// GET /api/users/stats - Get user statistics (admin)
router.get("/stats", authenticateUser, UserController.getUserStats);

// GET /api/users/lists - Get all user lists
router.get("/lists", authenticateUser, ListController.getUserLists);

// POST /api/users/lists - Create new list
router.post("/lists", authenticateUser, ListController.createList);

// GET /api/users/lists/:id - Get specific list with its rackets
router.get("/lists/:id", authenticateUser, ListController.getListById);

// PUT /api/users/lists/:id - Update list
router.put("/lists/:id", authenticateUser, ListController.updateList);

// DELETE /api/users/lists/:id - Delete list
router.delete("/lists/:id", authenticateUser, ListController.deleteList);

// POST /api/users/lists/:id/rackets - Add racket to list
router.post(
  "/lists/:id/rackets",
  authenticateUser,
  ListController.addRacketToList
);

// DELETE /api/users/lists/:id/rackets/:racketId - Remove racket from list
router.delete(
  "/lists/:id/rackets/:racketId",
  authenticateUser,
  ListController.removeRacketFromList
);

// GET /api/users/me/activity - Get current user's activity stats
router.get("/me/activity", authenticateUser, UserController.getUserActivity);

export default router;
