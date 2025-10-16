import { Response } from "express";
import { ListService } from "../services/listService";
import { RequestWithUser, ApiResponse } from "../types";
import {
  CreateListRequest,
  UpdateListRequest,
  AddRacketToListRequest,
} from "../types/list";

export class ListController {
  /**
   * GET /api/users/lists
   * Obtiene todas las listas del usuario autenticado
   */
  static async getUserLists(
    req: RequestWithUser,
    res: Response
  ): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: "Usuario no autenticado",
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const lists = await ListService.getUserLists(userId);

      res.json({
        success: true,
        data: lists,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error("Error in getUserLists:", error);
      res.status(500).json({
        success: false,
        error: "Error interno del servidor",
        message: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * GET /api/users/lists/:id
   * Obtiene una lista específica con sus palas
   */
  static async getListById(req: RequestWithUser, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const listId = req.params.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: "Usuario no autenticado",
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const list = await ListService.getListById(listId, userId);

      if (!list) {
        res.status(404).json({
          success: false,
          error: "Lista no encontrada",
          timestamp: new Date().toISOString(),
        });
        return;
      }

      res.json({
        success: true,
        data: list,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error("Error in getListById:", error);
      res.status(500).json({
        success: false,
        error: "Error interno del servidor",
        message: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * POST /api/users/lists
   * Crea una nueva lista
   */
  static async createList(req: RequestWithUser, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const listData: CreateListRequest = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: "Usuario no autenticado",
          timestamp: new Date().toISOString(),
        });
        return;
      }

      if (!listData.name || listData.name.trim() === "") {
        res.status(400).json({
          success: false,
          error: "El nombre de la lista es requerido",
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const list = await ListService.createList(userId, listData);

      res.status(201).json({
        success: true,
        data: list,
        message: "Lista creada exitosamente",
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error("Error in createList:", error);
      res.status(500).json({
        success: false,
        error: "Error interno del servidor",
        message: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * PUT /api/users/lists/:id
   * Actualiza una lista
   */
  static async updateList(req: RequestWithUser, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const listId = req.params.id;
      const updates: UpdateListRequest = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: "Usuario no autenticado",
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const list = await ListService.updateList(listId, userId, updates);

      res.json({
        success: true,
        data: list,
        message: "Lista actualizada exitosamente",
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error("Error in updateList:", error);
      res.status(500).json({
        success: false,
        error: "Error interno del servidor",
        message: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * DELETE /api/users/lists/:id
   * Elimina una lista
   */
  static async deleteList(req: RequestWithUser, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const listId = req.params.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: "Usuario no autenticado",
          timestamp: new Date().toISOString(),
        });
        return;
      }

      await ListService.deleteList(listId, userId);

      res.json({
        success: true,
        message: "Lista eliminada exitosamente",
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error("Error in deleteList:", error);
      res.status(500).json({
        success: false,
        error: "Error interno del servidor",
        message: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * POST /api/users/lists/:id/rackets
   * Añade una pala a la lista
   */
  static async addRacketToList(
    req: RequestWithUser,
    res: Response
  ): Promise<void> {
    try {
      const userId = req.user?.id;
      const listId = req.params.id;
      const { racket_id }: AddRacketToListRequest = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: "Usuario no autenticado",
          timestamp: new Date().toISOString(),
        });
        return;
      }

      if (!racket_id) {
        res.status(400).json({
          success: false,
          error: "El ID de la pala es requerido",
          timestamp: new Date().toISOString(),
        });
        return;
      }

      await ListService.addRacketToList(listId, userId, racket_id);

      res.status(201).json({
        success: true,
        message: "Pala añadida a la lista exitosamente",
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error("Error in addRacketToList:", error);

      if (error.message.includes("ya está en la lista")) {
        res.status(409).json({
          success: false,
          error: "Conflicto",
          message: error.message,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: "Error interno del servidor",
        message: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * DELETE /api/users/lists/:id/rackets/:racketId
   * Elimina una pala de la lista
   */
  static async removeRacketFromList(
    req: RequestWithUser,
    res: Response
  ): Promise<void> {
    try {
      const userId = req.user?.id;
      const listId = req.params.id;
      const racketId = parseInt(req.params.racketId);

      if (!userId) {
        res.status(401).json({
          success: false,
          error: "Usuario no autenticado",
          timestamp: new Date().toISOString(),
        });
        return;
      }

      if (isNaN(racketId)) {
        res.status(400).json({
          success: false,
          error: "ID de pala inválido",
          timestamp: new Date().toISOString(),
        });
        return;
      }

      await ListService.removeRacketFromList(listId, userId, racketId);

      res.json({
        success: true,
        message: "Pala eliminada de la lista exitosamente",
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error("Error in removeRacketFromList:", error);
      res.status(500).json({
        success: false,
        error: "Error interno del servidor",
        message: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }
}
