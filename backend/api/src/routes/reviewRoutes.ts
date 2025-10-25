/**
 * Review Routes
 * Rutas para el sistema de reviews
 */

import { Router } from "express";
import { ReviewController } from "../controllers/reviewController";
import { authenticateUser } from "../middleware/auth";

const router = Router();

// ==========================================
// RUTAS PÚBLICAS (sin autenticación)
// ==========================================

/**
 * GET /api/v1/reviews
 * Información sobre las rutas de reviews disponibles
 */
router.get("/", (req, res) => {
  res.json({
    message: "Reviews API",
    endpoints: {
      public: {
        "GET /api/v1/reviews/rackets/:racketId":
          "Get reviews for a racket (query: rating, sort, page, limit)",
        "GET /api/v1/reviews/users/:userId":
          "Get reviews by user (query: page, limit)",
        "GET /api/v1/reviews/:reviewId": "Get specific review details",
        "GET /api/v1/reviews/:reviewId/comments": "Get review comments",
      },
      protected: {
        "POST /api/v1/reviews":
          "Create new review (body: racket_id, title, content, rating)",
        "PUT /api/v1/reviews/:reviewId":
          "Update review (body: title?, content?, rating?)",
        "DELETE /api/v1/reviews/:reviewId": "Delete review",
        "POST /api/v1/reviews/:reviewId/like": "Toggle like on review",
        "POST /api/v1/reviews/:reviewId/comments":
          "Add comment to review (body: content)",
        "DELETE /api/v1/reviews/comments/:commentId": "Delete comment",
      },
    },
  });
});

/**
 * GET /api/v1/reviews/rackets/:racketId
 * Obtener reviews de una pala con filtros y paginación
 * Query params: rating, sort, page, limit
 */
router.get("/rackets/:racketId", ReviewController.getReviewsByRacket);

/**
 * GET /api/v1/reviews/users/:userId
 * Obtener reviews de un usuario
 * Query params: page, limit
 */
router.get("/users/:userId", ReviewController.getReviewsByUser);

/**
 * GET /api/v1/reviews/:reviewId
 * Obtener una review específica con todos sus detalles
 */
router.get("/:reviewId", ReviewController.getReviewById);

/**
 * GET /api/v1/reviews/:reviewId/comments
 * Obtener comentarios de una review
 */
router.get("/:reviewId/comments", ReviewController.getComments);

// ==========================================
// RUTAS PROTEGIDAS (requieren autenticación)
// ==========================================

/**
 * POST /api/v1/reviews
 * Crear una nueva review
 * Body: { racket_id, title, content, rating }
 */
router.post("/", authenticateUser, ReviewController.createReview);

/**
 * PUT /api/v1/reviews/:reviewId
 * Actualizar una review existente
 * Body: { title?, content?, rating? }
 */
router.put("/:reviewId", authenticateUser, ReviewController.updateReview);

/**
 * DELETE /api/v1/reviews/:reviewId
 * Eliminar una review
 */
router.delete("/:reviewId", authenticateUser, ReviewController.deleteReview);

/**
 * POST /api/v1/reviews/:reviewId/like
 * Dar/quitar like a una review (toggle)
 */
router.post("/:reviewId/like", authenticateUser, ReviewController.toggleLike);

/**
 * POST /api/v1/reviews/:reviewId/comments
 * Agregar un comentario a una review
 * Body: { content }
 */
router.post(
  "/:reviewId/comments",
  authenticateUser,
  ReviewController.addComment
);

/**
 * DELETE /api/v1/reviews/comments/:commentId
 * Eliminar un comentario
 */
router.delete(
  "/comments/:commentId",
  authenticateUser,
  ReviewController.deleteComment
);

export default router;
