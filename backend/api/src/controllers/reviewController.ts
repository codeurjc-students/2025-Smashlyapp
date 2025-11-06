/**
 * Review Controller
 * Maneja las peticiones HTTP relacionadas con reviews
 */

import { Request, Response } from "express";
import { ReviewService } from "../services/reviewService";
import logger from "../config/logger";
import {
  CreateReviewDTO,
  UpdateReviewDTO,
  ReviewFilters,
} from "../types/review";
import { RequestWithUser } from "../types";

// Helper function outside the class to avoid 'this' context issues
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

export class ReviewController {

  /**
   * GET /api/v1/rackets/:racketId/reviews
   * Obtener reviews de una raqueta específica
   */
  static async getReviewsByRacket(req: RequestWithUser, res: Response) {
    try {
      const racketId = parseInt(req.params.racketId);
      const userId = req.user?.id; // Usuario autenticado (opcional)

      const sortParam = req.query.sort as string;
      const validSorts = ["recent", "rating_high", "rating_low", "most_liked"];
      const sort = validSorts.includes(sortParam) ? sortParam as "recent" | "rating_high" | "rating_low" | "most_liked" : "recent";

      const filters: ReviewFilters = {
        rating: req.query.rating
          ? parseInt(req.query.rating as string)
          : undefined,
        sort,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 5,
      };

      const result = await ReviewService.getReviewsByRacket(
        racketId,
        filters,
        userId
      );

      res.json(result);
    } catch (error: unknown) {
      logger.error("Error getting reviews:", error);
      res.status(500).json({ error: getErrorMessage(error) });
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
    } catch (error: unknown) {
      logger.error("Error getting user reviews:", error);
      res.status(500).json({ error: getErrorMessage(error) });
    }
  }

  /**
   * GET /api/v1/reviews/:reviewId
   * Obtener una review específica con todos sus detalles
   */
  static async getReviewById(req: RequestWithUser, res: Response): Promise<void> {
    try {
      const reviewId = req.params.reviewId;
      const userId = req.user?.id;

      const review = await ReviewService.getReviewById(reviewId, userId);

      if (!review) {
        res.status(404).json({ error: "Review no encontrada" });
        return;
      }

      res.json(review);
    } catch (error: unknown) {
      logger.error("Error getting review:", error);
      res.status(500).json({ error: getErrorMessage(error) });
    }
  }

  /**
   * POST /api/v1/reviews
   * Crear una nueva review
   */
  static async createReview(req: RequestWithUser, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

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

      const validationError = ReviewController.validateCreateReviewData(reviewData);
      if (validationError) {
        res.status(400).json({ error: validationError });
        return;
      }

      const review = await ReviewService.createReview(userId, reviewData);
      res.status(201).json(review);
    } catch (error: unknown) {
      ReviewController.handleCreateReviewError(error, res);
    }
  }

  private static validateCreateReviewData(reviewData: CreateReviewDTO): string | null {
    return ReviewController.validateRequiredFields(reviewData) ||
           ReviewController.validateRating(reviewData.rating) ||
           ReviewController.validateTitle(reviewData.title) ||
           ReviewController.validateContent(reviewData.content);
  }

  private static validateRequiredFields(reviewData: CreateReviewDTO): string | null {
    if (!reviewData.racket_id || !reviewData.title || !reviewData.content || !reviewData.rating) {
      return "Faltan campos requeridos";
    }
    return null;
  }

  private static validateRating(rating: number): string | null {
    if (rating < 1 || rating > 5) {
      return "El rating debe estar entre 1 y 5";
    }
    return null;
  }

  private static validateTitle(title: string): string | null {
    if (title.length < 5 || title.length > 100) {
      return "Title must be between 5 and 100 characters";
    }
    return null;
  }

  private static validateContent(content: string): string | null {
    if (content.length < 20 || content.length > 2000) {
      return "El contenido debe tener entre 20 y 2000 caracteres";
    }
    return null;
  }

  private static handleCreateReviewError(error: unknown, res: Response): void {
    logger.error("Error creating review:", error);

    if (getErrorMessage(error).includes("Ya has publicado")) {
      res.status(409).json({ error: getErrorMessage(error) });
      return;
    }

    res.status(500).json({ error: getErrorMessage(error) });
  }

  /**
   * PUT /api/v1/reviews/:reviewId
   * Actualizar una review existente
   */
  static async updateReview(req: RequestWithUser, res: Response): Promise<void> {
    try {
      const reviewId = req.params.reviewId;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: "No autenticado" });
        return;
      }

      const { updates, validationError } = ReviewController.validateUpdateReviewData(req.body);
      if (validationError) {
        res.status(400).json({ error: validationError });
        return;
      }

      const review = await ReviewService.updateReview(reviewId, userId, updates);
      res.json(review);
    } catch (error: unknown) {
      ReviewController.handleUpdateReviewError(error, res);
    }
  }

  private static validateUpdateReviewData(body: Partial<UpdateReviewDTO>): { updates: UpdateReviewDTO; validationError: string | null } {
    const updates: UpdateReviewDTO = {};

    if (body.title !== undefined) {
      if (body.title.length < 5 || body.title.length > 100) {
        return { updates, validationError: "Title must be between 5 and 100 characters" };
      }
      updates.title = body.title;
    }

    if (body.content !== undefined) {
      if (body.content.length < 20 || body.content.length > 2000) {
        return { updates, validationError: "El contenido debe tener entre 20 y 2000 caracteres" };
      }
      updates.content = body.content;
    }

    if (body.rating !== undefined) {
      if (body.rating < 1 || body.rating > 5) {
        return { updates, validationError: "El rating debe estar entre 1 y 5" };
      }
      updates.rating = body.rating;
    }

    return { updates, validationError: null };
  }

  private static handleUpdateReviewError(error: unknown, res: Response): void {
    logger.error("Error updating review:", error);

    if (getErrorMessage(error).includes("permiso")) {
      res.status(403).json({ error: getErrorMessage(error) });
      return;
    }

    res.status(500).json({ error: getErrorMessage(error) });
  }

  /**
   * DELETE /api/v1/reviews/:reviewId
   * Eliminar una review
   */
  static async deleteReview(req: RequestWithUser, res: Response): Promise<void> {
    try {
      const reviewId = req.params.reviewId;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: "No autenticado" });
        return;
      }

      await ReviewService.deleteReview(reviewId, userId);

      res.status(204).send();
    } catch (error: unknown) {
      logger.error("Error deleting review:", error);

      if (getErrorMessage(error).includes("permiso")) {
        res.status(403).json({ error: getErrorMessage(error) });
        return;
      }

      res.status(500).json({ error: getErrorMessage(error) });
    }
  }

  /**
   * POST /api/v1/reviews/:reviewId/like
   * Dar/quitar like a una review
   */
  static async toggleLike(req: RequestWithUser, res: Response): Promise<void> {
    try {
      const reviewId = req.params.reviewId;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: "No autenticado" });
        return;
      }

      const liked = await ReviewService.toggleLike(reviewId, userId);

      res.json({ liked });
    } catch (error: unknown) {
      logger.error("Error toggling like:", error);
      res.status(500).json({ error: getErrorMessage(error) });
    }
  }

  /**
   * POST /api/v1/reviews/:reviewId/comments
   * Agregar un comentario a una review
   */
  static async addComment(req: RequestWithUser, res: Response): Promise<void> {
    try {
      const reviewId = req.params.reviewId;
      const userId = req.user?.id;

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
    } catch (error: unknown) {
      logger.error("Error adding comment:", error);
      res.status(500).json({ error: getErrorMessage(error) });
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
    } catch (error: unknown) {
      logger.error("Error getting comments:", error);
      res.status(500).json({ error: getErrorMessage(error) });
    }
  }

  /**
   * DELETE /api/v1/comments/:commentId
   * Eliminar un comentario
   */
  static async deleteComment(req: RequestWithUser, res: Response): Promise<void> {
    try {
      const commentId = req.params.commentId;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: "No autenticado" });
        return;
      }

      await ReviewService.deleteComment(commentId, userId);

      res.status(204).send();
    } catch (error: unknown) {
      logger.error("Error deleting comment:", error);

      if (getErrorMessage(error).includes("permiso")) {
        res.status(403).json({ error: getErrorMessage(error) });
        return;
      }

      res.status(500).json({ error: getErrorMessage(error) });
    }
  }
}
