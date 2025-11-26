import { Router } from "express";
import { RacketViewController } from "../controllers/racketViewController";
import { authenticateUser } from "../middleware/auth";

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateUser);

/**
 * GET /api/v1/racket-views/recently-viewed
 * Obtiene las palas vistas recientemente por el usuario
 */
router.get("/recently-viewed", RacketViewController.getRecentlyViewed);

/**
 * POST /api/v1/racket-views/:racketId
 * Registra que el usuario ha visto una pala
 */
router.post("/:racketId", RacketViewController.recordView);

/**
 * DELETE /api/v1/racket-views/clear
 * Limpia todo el historial de visualizaciones
 */
router.delete("/clear", RacketViewController.clearHistory);

/**
 * DELETE /api/v1/racket-views/:racketId
 * Elimina una visualización específica del historial
 */
router.delete("/:racketId", RacketViewController.removeView);

export default router;
