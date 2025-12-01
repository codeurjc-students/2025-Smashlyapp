import { Response } from "express";
import { RequestWithUser, ApiResponse } from "../types";
import logger from "../config/logger";
import { RacketViewService } from "../services/racketViewService";

export class RacketViewController {
  /**
   * POST /api/v1/racket-views/:racketId
   * Registra que el usuario ha visto una pala
   */
  static async recordView(req: RequestWithUser, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const racketId = parseInt(req.params.racketId);

      if (!userId) {
        res.status(401).json({
          success: false,
          error: "No autenticado",
          message: "Debes iniciar sesión para registrar visualizaciones",
          timestamp: new Date().toISOString(),
        } as ApiResponse);
        return;
      }

      if (isNaN(racketId)) {
        res.status(400).json({
          success: false,
          error: "ID de pala inválido",
          message: "El ID de la pala debe ser un número",
          timestamp: new Date().toISOString(),
        } as ApiResponse);
        return;
      }

      await RacketViewService.recordView(userId, racketId);

      res.json({
        success: true,
        message: "Visualización registrada correctamente",
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    } catch (error: unknown) {
      logger.error("Error in recordView:", error);
      res.status(500).json({
        success: false,
        error: "Error del servidor",
        message: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }
  }

  /**
   * GET /api/v1/racket-views/recently-viewed
   * Obtiene las palas vistas recientemente por el usuario
   */
  static async getRecentlyViewed(
    req: RequestWithUser,
    res: Response
  ): Promise<void> {
    try {
      const userId = req.user?.id;
      const limit = parseInt(req.query.limit as string) || 10;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: "No autenticado",
          message: "Debes iniciar sesión para ver tu historial",
          timestamp: new Date().toISOString(),
        } as ApiResponse);
        return;
      }

      const recentlyViewed = await RacketViewService.getRecentlyViewed(
        userId,
        limit
      );

      res.json({
        success: true,
        data: recentlyViewed,
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    } catch (error: unknown) {
      logger.error("Error in getRecentlyViewed:", error);
      res.status(500).json({
        success: false,
        error: "Error del servidor",
        message: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }
  }

  /**
   * DELETE /api/v1/racket-views/:racketId
   * Elimina una visualización del historial
   */
  static async removeView(req: RequestWithUser, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const racketId = parseInt(req.params.racketId);

      if (!userId) {
        res.status(401).json({
          success: false,
          error: "No autenticado",
          message: "Debes iniciar sesión",
          timestamp: new Date().toISOString(),
        } as ApiResponse);
        return;
      }

      if (isNaN(racketId)) {
        res.status(400).json({
          success: false,
          error: "ID de pala inválido",
          message: "El ID de la pala debe ser un número",
          timestamp: new Date().toISOString(),
        } as ApiResponse);
        return;
      }

      await RacketViewService.removeView(userId, racketId);

      res.json({
        success: true,
        message: "Visualización eliminada correctamente",
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    } catch (error: unknown) {
      logger.error("Error in removeView:", error);
      res.status(500).json({
        success: false,
        error: "Error del servidor",
        message: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }
  }

  /**
   * DELETE /api/v1/racket-views/clear
   * Limpia todo el historial de visualizaciones del usuario
   */
  static async clearHistory(
    req: RequestWithUser,
    res: Response
  ): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: "No autenticado",
          message: "Debes iniciar sesión",
          timestamp: new Date().toISOString(),
        } as ApiResponse);
        return;
      }

      await RacketViewService.clearHistory(userId);

      res.json({
        success: true,
        message: "Historial limpiado correctamente",
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    } catch (error: unknown) {
      logger.error("Error in clearHistory:", error);
      res.status(500).json({
        success: false,
        error: "Error del servidor",
        message: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }
  }
}
