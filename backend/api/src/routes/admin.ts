import { Router } from "express";
import { AdminController } from "../controllers/adminController";
import { authenticateUser } from "../middleware/auth";
import { requireAdmin } from "../middleware/requireAdmin";

const router = Router();

// Todas las rutas de admin requieren autenticación y rol de admin
router.use(authenticateUser);
router.use(requireAdmin);

/**
 * GET /api/v1/admin/metrics
 * Obtiene las métricas del dashboard
 */
router.get("/metrics", AdminController.getMetrics);

/**
 * GET /api/v1/admin/users
 * Obtiene todos los usuarios
 */
router.get("/users", AdminController.getAllUsers);

/**
 * PATCH /api/v1/admin/users/:userId/role
 * Actualiza el rol de un usuario
 */
router.patch("/users/:userId/role", AdminController.updateUserRole);

/**
 * DELETE /api/v1/admin/users/:userId
 * Elimina un usuario
 */
router.delete("/users/:userId", AdminController.deleteUser);

/**
 * GET /api/v1/admin/racket-requests
 * Obtiene todas las solicitudes de palas
 */
router.get("/racket-requests", AdminController.getRacketRequests);

/**
 * GET /api/v1/admin/store-requests
 * Obtiene todas las solicitudes de tiendas
 */
router.get("/store-requests", AdminController.getStoreRequests);

/**
 * POST /api/v1/admin/stores/:id/verify
 * Aprobar/verificar una tienda
 */
router.post("/stores/:id/verify", AdminController.verifyStore);

/**
 * DELETE /api/v1/admin/stores/:id/reject
 * Rechazar una solicitud de tienda
 */
router.delete("/stores/:id/reject", AdminController.rejectStore);

export default router;
