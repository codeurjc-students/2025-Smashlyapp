/**
 * Review Controller
 * Maneja las peticiones HTTP relacionadas con reviews
 */

import { Request, Response } from "express";
import { ReviewService } from "../services/reviewService";
import {
  CreateReviewDTO,
  UpdateReviewDTO,
  ReviewFilters,
} from "../types/review";

export class ReviewController {
  /**
   * GET /api/v1/rackets/:racketId/reviews
   * Obtener todas las reviews de una pala
   */
  static async getReviewsByRacket(req: Request, res: Response) {
    try {
      const racketId = parseInt(req.params.racketId);
      const userId = (req as any).user?.id; // Usuario autenticado (opcional)

      const filters: ReviewFilters = {
        rating: req.query.rating
          ? parseInt(req.query.rating as string)
          : undefined,
        sort: (req.query.sort as any) || "recent",
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 5,
      };

      const result = await ReviewService.getReviewsByRacket(
        racketId,
        filters,
        userId
      );

      res.json(result);
    } catch (error: any) {
      console.error("Error getting reviews:", error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /api/v1/users/:userId/reviews
   * Obtener todas las reviews de un usuario
   */
  static async getReviewsByUser(req: Request, res: Response) {
    try {
      const userId = req.params.userId;
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

      const result = await ReviewService.getReviewsByUser(userId, page, limit);

      res.json(result);
    } catch (error: any) {
      console.error("Error getting user reviews:", error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /api/v1/reviews/:reviewId
   * Obtener una review específica con todos sus detalles
   */
  static async getReviewById(req: Request, res: Response): Promise<void> {
    try {
      const reviewId = req.params.reviewId;
      const userId = (req as any).user?.id;

      const review = await ReviewService.getReviewById(reviewId, userId);

      if (!review) {
        res.status(404).json({ error: "Review no encontrada" });
        return;
      }

      res.json(review);
    } catch (error: any) {
      console.error("Error getting review:", error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * POST /api/v1/reviews
   * Crear una nueva review
   */
  static async createReview(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({ error: "No autenticado" });
        return;
      }

      const reviewData: CreateReviewDTO = {
        racket_id: req.body.racket_id,
        title: req.body.title,
        content: req.body.content,
        rating: req.body.rating,
      };

      // Validaciones
      if (
        !reviewData.racket_id ||
        !reviewData.title ||
        !reviewData.content ||
        !reviewData.rating
      ) {
        res.status(400).json({ error: "Faltan campos requeridos" });
        return;
      }

      if (reviewData.rating < 1 || reviewData.rating > 5) {
        res.status(400).json({ error: "El rating debe estar entre 1 y 5" });
        return;
      }

      if (reviewData.title.length < 5 || reviewData.title.length > 100) {
        res
          .status(400)
          .json({ error: "El título debe tener entre 5 y 100 caracteres" });
        return;
      }

      if (reviewData.content.length < 20 || reviewData.content.length > 2000) {
        res
          .status(400)
          .json({
            error: "El contenido debe tener entre 20 y 2000 caracteres",
          });
        return;
      }

      const review = await ReviewService.createReview(userId, reviewData);

      res.status(201).json(review);
    } catch (error: any) {
      console.error("Error creating review:", error);

      if (error.message.includes("Ya has publicado")) {
        res.status(409).json({ error: error.message });
        return;
      }

      res.status(500).json({ error: error.message });
    }
  }

  /**
   * PUT /api/v1/reviews/:reviewId
   * Actualizar una review existente
   */
  static async updateReview(req: Request, res: Response): Promise<void> {
    try {
      const reviewId = req.params.reviewId;
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({ error: "No autenticado" });
        return;
      }

      const updates: UpdateReviewDTO = {};

      if (req.body.title !== undefined) {
        if (req.body.title.length < 5 || req.body.title.length > 100) {
          res
            .status(400)
            .json({ error: "El título debe tener entre 5 y 100 caracteres" });
          return;
        }
        updates.title = req.body.title;
      }

      if (req.body.content !== undefined) {
        if (req.body.content.length < 20 || req.body.content.length > 2000) {
          res
            .status(400)
            .json({
              error: "El contenido debe tener entre 20 y 2000 caracteres",
            });
          return;
        }
        updates.content = req.body.content;
      }

      if (req.body.rating !== undefined) {
        if (req.body.rating < 1 || req.body.rating > 5) {
          res.status(400).json({ error: "El rating debe estar entre 1 y 5" });
          return;
        }
        updates.rating = req.body.rating;
      }

      const review = await ReviewService.updateReview(
        reviewId,
        userId,
        updates
      );

      res.json(review);
    } catch (error: any) {
      console.error("Error updating review:", error);

      if (error.message.includes("permiso")) {
        res.status(403).json({ error: error.message });
        return;
      }

      res.status(500).json({ error: error.message });
    }
  }

  /**
   * DELETE /api/v1/reviews/:reviewId
   * Eliminar una review
   */
  static async deleteReview(req: Request, res: Response): Promise<void> {
    try {
      const reviewId = req.params.reviewId;
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({ error: "No autenticado" });
        return;
      }

      await ReviewService.deleteReview(reviewId, userId);

      res.status(204).send();
    } catch (error: any) {
      console.error("Error deleting review:", error);

      if (error.message.includes("permiso")) {
        res.status(403).json({ error: error.message });
        return;
      }

      res.status(500).json({ error: error.message });
    }
  }

  /**
   * POST /api/v1/reviews/:reviewId/like
   * Dar/quitar like a una review
   */
  static async toggleLike(req: Request, res: Response): Promise<void> {
    try {
      const reviewId = req.params.reviewId;
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({ error: "No autenticado" });
        return;
      }

      const liked = await ReviewService.toggleLike(reviewId, userId);

      res.json({ liked });
    } catch (error: any) {
      console.error("Error toggling like:", error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * POST /api/v1/reviews/:reviewId/comments
   * Agregar un comentario a una review
   */
  static async addComment(req: Request, res: Response): Promise<void> {
    try {
      const reviewId = req.params.reviewId;
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({ error: "No autenticado" });
        return;
      }

      const { content } = req.body;

      if (!content || content.length < 1 || content.length > 500) {
        res
          .status(400)
          .json({ error: "El comentario debe tener entre 1 y 500 caracteres" });
        return;
      }

      const comment = await ReviewService.addComment(reviewId, userId, {
        content,
      });

      res.status(201).json(comment);
    } catch (error: any) {
      console.error("Error adding comment:", error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /api/v1/reviews/:reviewId/comments
   * Obtener comentarios de una review
   */
  static async getComments(req: Request, res: Response) {
    try {
      const reviewId = req.params.reviewId;

      const comments = await ReviewService.getComments(reviewId);

      res.json(comments);
    } catch (error: any) {
      console.error("Error getting comments:", error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * DELETE /api/v1/comments/:commentId
   * Eliminar un comentario
   */
  static async deleteComment(req: Request, res: Response): Promise<void> {
    try {
      const commentId = req.params.commentId;
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({ error: "No autenticado" });
        return;
      }

      await ReviewService.deleteComment(commentId, userId);

      res.status(204).send();
    } catch (error: any) {
      console.error("Error deleting comment:", error);

      if (error.message.includes("permiso")) {
        res.status(403).json({ error: error.message });
        return;
      }

      res.status(500).json({ error: error.message });
    }
  }
}
