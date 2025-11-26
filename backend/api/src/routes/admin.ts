import { Router } from "express";
import { AdminController } from "../controllers/adminController";
import { authenticateUser } from "../middleware/auth";
import { requireAdmin } from "../middleware/requireAdmin";
import { validatePagination } from "../middleware/validation";

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticateUser);
router.use(requireAdmin);

/**
 * GET /api/v1/admin/metrics
 * Gets dashboard metrics
 */
router.get("/metrics", AdminController.getMetrics);

/**
 * GET /api/v1/admin/users
 * Gets all users
 */
router.get("/users", validatePagination, AdminController.getAllUsers);

/**
 * PATCH /api/v1/admin/users/:userId/role
 * Updates a user's role
 */
router.patch("/users/:userId/role", AdminController.updateUserRole);

/**
 * DELETE /api/v1/admin/users/:userId
 * Deletes a user
 */
router.delete("/users/:userId", AdminController.deleteUser);

/**
 * GET /api/v1/admin/racket-requests
 * Gets all racket requests
 */
router.get("/racket-requests", AdminController.getRacketRequests);

/**
 * GET /api/v1/admin/store-requests
 * Gets all store requests
 */
router.get("/store-requests", AdminController.getStoreRequests);

/**
 * POST /api/v1/admin/stores/:id/verify
 * Approve/verify a store
 */
router.post("/stores/:id/verify", AdminController.verifyStore);

/**
 * DELETE /api/v1/admin/stores/:id/reject
 * Reject a store request
 */
router.delete("/stores/:id/reject", AdminController.rejectStore);

/**
 * GET /api/v1/admin/recent-activity
 * Gets recent system activity
 */
router.get("/recent-activity", AdminController.getRecentActivity);

export default router;
