import { Response } from "express";
import { RequestWithUser, ApiResponse } from "../types";
import logger from "../config/logger";
import { supabase } from "../config/supabase";
import { storeService } from "../services/storeService";

// Helper functions outside the class to avoid 'this' context issues
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

async function getTableCount(tableName: string): Promise<number> {
  const { count } = await supabase
    .from(tableName)
    .select("*", { count: "exact", head: true });
  return count || 0;
}

async function getActiveUsersCount(): Promise<number> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { count } = await supabase
    .from("user_profiles")
    .select("*", { count: "exact", head: true })
    .gte("updated_at", thirtyDaysAgo.toISOString());

  return count || 0;
}

async function getVerifiedStoresCount(): Promise<number> {
  const { count } = await supabase
    .from("stores")
    .select("*", { count: "exact", head: true })
    .eq("verified", true);

  return count || 0;
}

async function getPendingStoresCount(): Promise<number> {
  const { count } = await supabase
    .from("stores")
    .select("*", { count: "exact", head: true })
    .eq("verified", false);

  return count || 0;
}

async function collectMetricsData() {
  const [
    totalUsers,
    totalRackets,
    totalReviews,
    activeUsers,
    totalStores,
    pendingRequests
  ] = await Promise.all([
    getTableCount("user_profiles"),
    getTableCount("rackets"),
    getTableCount("reviews"),
    getActiveUsersCount(),
    getVerifiedStoresCount(),
    getPendingStoresCount()
  ]);

  return {
    totalUsers: totalUsers || 0,
    totalRackets: totalRackets || 0,
    totalStores: totalStores || 0,
    totalReviews: totalReviews || 0,
    pendingRequests: pendingRequests || 0,
    activeUsers: activeUsers || 0,
    usersChange: 12.5,
    racketsChange: 8.3,
  };
}

export class AdminController {
  /**
   * GET /api/v1/admin/metrics
   * Obtiene las métricas del dashboard de administración
   */
  static async getMetrics(req: RequestWithUser, res: Response): Promise<void> {
    try {
      const metrics = await collectMetricsData();
      res.json({
        success: true,
        data: metrics,
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    } catch (error: unknown) {
      logger.error("Error in getMetrics:", error);
      res.status(500).json({
        success: false,
        error: "Error del servidor",
        message: getErrorMessage(error),
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }
  }

  /**
   * GET /api/v1/admin/users
   * Obtiene todos los usuarios del sistema
   */
  static async getAllUsers(req: RequestWithUser, res: Response): Promise<void> {
    try {
      const { data: users, error } = await supabase
        .from("user_profiles")
        .select("id, email, nickname, full_name, role, created_at")
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      res.json({
        success: true,
        data: users || [],
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    } catch (error: unknown) {
      logger.error("Error in getAllUsers:", error);
      res.status(500).json({
        success: false,
        error: "Error del servidor",
        message: getErrorMessage(error),
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }
  }

  /**
   * PATCH /api/v1/admin/users/:userId/role
   * Actualiza el rol de un usuario
   */
  static async updateUserRole(
    req: RequestWithUser,
    res: Response
  ): Promise<void> {
    try {
      const { userId } = req.params;
      const { role } = req.body;

      if (!role || !["admin", "player"].includes(role.toLowerCase())) {
        res.status(400).json({
          success: false,
          error: "Rol inválido",
          message: "El rol debe ser 'admin' o 'player'",
          timestamp: new Date().toISOString(),
        } as ApiResponse);
        return;
      }

      const { data: updatedUser, error } = await supabase
        .from("user_profiles")
        .update({ role: role.toLowerCase() })
        .eq("id", userId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      res.json({
        success: true,
        data: updatedUser,
        message: "Rol actualizado correctamente",
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    } catch (error: unknown) {
      logger.error("Error in updateUserRole:", error);
      res.status(500).json({
        success: false,
        error: "Error del servidor",
        message: getErrorMessage(error),
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }
  }

  /**
   * DELETE /api/v1/admin/users/:userId
   * Elimina un usuario del sistema
   */
  static async deleteUser(req: RequestWithUser, res: Response): Promise<void> {
    try {
      const { userId } = req.params;

      // No permitir que un admin se elimine a sí mismo
      if (userId === req.user?.id) {
        res.status(400).json({
          success: false,
          error: "Operación no permitida",
          message: "No puedes eliminar tu propia cuenta",
          timestamp: new Date().toISOString(),
        } as ApiResponse);
        return;
      }

      const { error } = await supabase
        .from("user_profiles")
        .delete()
        .eq("id", userId);

      if (error) {
        throw error;
      }

      res.json({
        success: true,
        message: "Usuario eliminado correctamente",
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    } catch (error: unknown) {
      logger.error("Error in deleteUser:", error);
      res.status(500).json({
        success: false,
        error: "Error del servidor",
        message: getErrorMessage(error),
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }
  }

  /**
   * GET /api/v1/admin/racket-requests
   * Obtiene todas las solicitudes de palas (simulado por ahora)
   */
  static async getRacketRequests(
    req: RequestWithUser,
    res: Response
  ): Promise<void> {
    try {
      // TODO: Implementar cuando tengamos tabla de solicitudes
      res.json({
        success: true,
        data: [],
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    } catch (error: unknown) {
      logger.error("Error in getRacketRequests:", error);
      res.status(500).json({
        success: false,
        error: "Error del servidor",
        message: getErrorMessage(error),
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }
  }

  /**
   * GET /api/v1/admin/store-requests
   * Obtiene todas las solicitudes de tiendas pendientes de verificación
   */
  static async getStoreRequests(
    req: RequestWithUser,
    res: Response
  ): Promise<void> {
    try {
      // Obtener tiendas no verificadas
      const pendingStores = await storeService.getAllStores(false);
      
      res.json({
        success: true,
        data: pendingStores,
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    } catch (error: unknown) {
      logger.error("Error in getStoreRequests:", error);
      res.status(500).json({
        success: false,
        error: "Error del servidor",
        message: getErrorMessage(error),
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }
  }

  /**
   * POST /api/v1/admin/stores/:id/verify
   * Aprobar/verificar una tienda
   */
  static async verifyStore(
    req: RequestWithUser,
    res: Response
  ): Promise<void> {
    try {
      const { id } = req.params;
      
      const store = await storeService.verifyStore(id);
      
      res.json({
        success: true,
        data: store,
        message: "Tienda verificada exitosamente",
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    } catch (error: unknown) {
      logger.error("Error in verifyStore:", error);
      res.status(500).json({
        success: false,
        error: "Error del servidor",
        message: getErrorMessage(error),
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }
  }

  /**
   * DELETE /api/v1/admin/stores/:id/reject
   * Rechazar una solicitud de tienda
   */
  static async rejectStore(
    req: RequestWithUser,
    res: Response
  ): Promise<void> {
    try {
      const { id } = req.params;
      
      await storeService.rejectStore(id);
      
      res.json({
        success: true,
        message: "Solicitud de tienda rechazada",
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    } catch (error: unknown) {
      logger.error("Error in rejectStore:", error);
      res.status(500).json({
        success: false,
        error: "Error del servidor",
        message: getErrorMessage(error),
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }
  }
}
