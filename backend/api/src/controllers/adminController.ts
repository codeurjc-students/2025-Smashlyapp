import { Response } from "express";
import { RequestWithUser, ApiResponse } from "../types";
import { supabase } from "../config/supabase";

export class AdminController {
  /**
   * GET /api/v1/admin/metrics
   * Obtiene las métricas del dashboard de administración
   */
  static async getMetrics(req: RequestWithUser, res: Response): Promise<void> {
    try {
      // Obtener total de usuarios
      const { count: totalUsers } = await supabase
        .from("user_profiles")
        .select("*", { count: "exact", head: true });

      // Obtener total de palas
      const { count: totalRackets } = await supabase
        .from("palas")
        .select("*", { count: "exact", head: true });

      // Obtener total de reviews
      const { count: totalReviews } = await supabase
        .from("reviews")
        .select("*", { count: "exact", head: true });

      // Obtener usuarios activos (últimos 30 días)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { count: activeUsers } = await supabase
        .from("user_profiles")
        .select("*", { count: "exact", head: true })
        .gte("updated_at", thirtyDaysAgo.toISOString());

      // Calcular cambios (simulado por ahora)
      const usersChange = 12.5;
      const racketsChange = 8.3;

      const metrics = {
        totalUsers: totalUsers || 0,
        totalRackets: totalRackets || 0,
        totalStores: 0, // TODO: Implementar cuando tengamos tabla de tiendas
        totalReviews: totalReviews || 0,
        pendingRequests: 0, // TODO: Implementar cuando tengamos tabla de solicitudes
        activeUsers: activeUsers || 0,
        usersChange,
        racketsChange,
      };

      res.json({
        success: true,
        data: metrics,
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    } catch (error: any) {
      console.error("Error in getMetrics:", error);
      res.status(500).json({
        success: false,
        error: "Error del servidor",
        message: error.message,
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
    } catch (error: any) {
      console.error("Error in getAllUsers:", error);
      res.status(500).json({
        success: false,
        error: "Error del servidor",
        message: error.message,
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
    } catch (error: any) {
      console.error("Error in updateUserRole:", error);
      res.status(500).json({
        success: false,
        error: "Error del servidor",
        message: error.message,
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
    } catch (error: any) {
      console.error("Error in deleteUser:", error);
      res.status(500).json({
        success: false,
        error: "Error del servidor",
        message: error.message,
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
    } catch (error: any) {
      console.error("Error in getRacketRequests:", error);
      res.status(500).json({
        success: false,
        error: "Error del servidor",
        message: error.message,
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }
  }

  /**
   * GET /api/v1/admin/store-requests
   * Obtiene todas las solicitudes de tiendas (simulado por ahora)
   */
  static async getStoreRequests(
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
    } catch (error: any) {
      console.error("Error in getStoreRequests:", error);
      res.status(500).json({
        success: false,
        error: "Error del servidor",
        message: error.message,
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }
  }
}
