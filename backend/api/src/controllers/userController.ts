import { Request, Response } from "express";
import { UserService } from "../services/userService";
import {
  UserProfile,
  CreateUserProfileRequest,
  UpdateUserProfileRequest,
  ApiResponse,
  RequestWithUser,
} from "../types";

export class UserController {
  /**
   * GET /api/users/profile
   * Obtiene el perfil del usuario autenticado
   */
  static async getUserProfile(
    req: RequestWithUser,
    res: Response
  ): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: "Usuario no autenticado",
          message: "Se requiere autenticación para acceder al perfil",
          timestamp: new Date().toISOString(),
        } as ApiResponse);
        return;
      }

      const profile = await UserService.getUserProfile(userId);

      if (!profile) {
        res.status(404).json({
          success: false,
          error: "Perfil no encontrado",
          message: "No se encontró un perfil para este usuario",
          timestamp: new Date().toISOString(),
        } as ApiResponse);
        return;
      }

      res.json({
        success: true,
        data: profile,
        timestamp: new Date().toISOString(),
      } as ApiResponse<UserProfile>);
    } catch (error: any) {
      console.error("Error in getUserProfile:", error);
      res.status(500).json({
        success: false,
        error: "Error interno del servidor",
        message: error.message,
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }
  }

  /**
   * POST /api/users/profile
   * Crea un nuevo perfil de usuario
   */
  static async createUserProfile(
    req: RequestWithUser,
    res: Response
  ): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: "Usuario no autenticado",
          message: "Se requiere autenticación para crear un perfil",
          timestamp: new Date().toISOString(),
        } as ApiResponse);
        return;
      }

      const profileData: CreateUserProfileRequest = req.body as CreateUserProfileRequest;

      // Validar datos
      const validation = UserService.validateProfileData(profileData);
      if (!validation.isValid) {
        res.status(400).json({
          success: false,
          error: "Datos inválidos",
          message: validation.errors.join(", "),
          timestamp: new Date().toISOString(),
        } as ApiResponse);
        return;
      }

      const profile = await UserService.createUserProfile(userId, profileData);

      res.status(201).json({
        success: true,
        data: profile,
        message: "Perfil creado exitosamente",
        timestamp: new Date().toISOString(),
      } as ApiResponse<UserProfile>);
    } catch (error: any) {
      console.error("Error in createUserProfile:", error);

      // Manejar errores específicos
      if (error.message.includes("nickname")) {
        res.status(409).json({
          success: false,
          error: "Conflicto de datos",
          message: error.message,
          timestamp: new Date().toISOString(),
        } as ApiResponse);
        return;
      }

      res.status(500).json({
        success: false,
        error: "Error interno del servidor",
        message: error.message,
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }
  }

  /**
   * PUT /api/users/profile
   * Actualiza el perfil del usuario autenticado
   */
  static async updateUserProfile(
    req: RequestWithUser,
    res: Response
  ): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: "Usuario no autenticado",
          message: "Se requiere autenticación para actualizar el perfil",
          timestamp: new Date().toISOString(),
        } as ApiResponse);
        return;
      }

      const updates: UpdateUserProfileRequest = req.body as UpdateUserProfileRequest;

      // Validar datos
      const validation = UserService.validateProfileData(updates);
      if (!validation.isValid) {
        res.status(400).json({
          success: false,
          error: "Datos inválidos",
          message: validation.errors.join(", "),
          timestamp: new Date().toISOString(),
        } as ApiResponse);
        return;
      }

      const profile = await UserService.updateUserProfile(userId, updates);

      res.json({
        success: true,
        data: profile,
        message: "Perfil actualizado exitosamente",
        timestamp: new Date().toISOString(),
      } as ApiResponse<UserProfile>);
    } catch (error: any) {
      console.error("Error in updateUserProfile:", error);

      // Manejar errores específicos
      if (error.message.includes("nickname")) {
        res.status(409).json({
          success: false,
          error: "Conflicto de datos",
          message: error.message,
          timestamp: new Date().toISOString(),
        } as ApiResponse);
        return;
      }

      res.status(500).json({
        success: false,
        error: "Error interno del servidor",
        message: error.message,
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }
  }

  /**
   * DELETE /api/users/profile
   * Elimina el perfil del usuario autenticado
   */
  static async deleteUserProfile(
    req: RequestWithUser,
    res: Response
  ): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: "Usuario no autenticado",
          message: "Se requiere autenticación para eliminar el perfil",
          timestamp: new Date().toISOString(),
        } as ApiResponse);
        return;
      }

      await UserService.deleteUserProfile(userId);

      res.json({
        success: true,
        message: "Perfil eliminado exitosamente",
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    } catch (error: any) {
      console.error("Error in deleteUserProfile:", error);
      res.status(500).json({
        success: false,
        error: "Error interno del servidor",
        message: error.message,
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }
  }

  /**
   * GET /api/users/nickname/:nickname/available
   * Verifica si un nickname está disponible
   */
  static async checkNicknameAvailability(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const nickname = req.params.nickname;
      const excludeUserId = req.query.excludeUserId as string;

      if (!nickname || nickname.length < 3) {
        res.status(400).json({
          success: false,
          error: "Nickname inválido",
          message: "El nickname debe tener al menos 3 caracteres",
          timestamp: new Date().toISOString(),
        } as ApiResponse);
        return;
      }

      const isAvailable = await UserService.isNicknameAvailable(
        nickname,
        excludeUserId
      );

      res.json({
        success: true,
        data: { available: isAvailable, nickname },
        message: isAvailable ? "Nickname disponible" : "Nickname no disponible",
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    } catch (error: any) {
      console.error("Error in checkNicknameAvailability:", error);
      res.status(500).json({
        success: false,
        error: "Error interno del servidor",
        message: error.message,
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }
  }

  /**
   * GET /api/users/search?q=...
   * Busca usuarios por nickname
   */
  static async searchUsers(req: Request, res: Response): Promise<void> {
    try {
      const query = req.query.q as string;
      const limit = parseInt(req.query.limit as string) || 10;

      if (!query || query.trim().length < 2) {
        res.status(400).json({
          success: false,
          error: "Consulta inválida",
          message: "La búsqueda debe tener al menos 2 caracteres",
          timestamp: new Date().toISOString(),
        } as ApiResponse);
        return;
      }

      const users = await UserService.searchUsersByNickname(
        query.trim(),
        limit
      );

      res.json({
        success: true,
        data: users,
        message: `${users.length} usuarios encontrados`,
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    } catch (error: any) {
      console.error("Error in searchUsers:", error);
      res.status(500).json({
        success: false,
        error: "Error interno del servidor",
        message: error.message,
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }
  }

  /**
   * GET /api/users/stats
   * Obtiene estadísticas de usuarios (solo para administradores)
   */
  static async getUserStats(req: Request, res: Response): Promise<void> {
    try {
      // TODO: Agregar verificación de rol de administrador

      const stats = await UserService.getUserStats();

      res.json({
        success: true,
        data: stats,
        message: "Estadísticas obtenidas exitosamente",
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    } catch (error: any) {
      console.error("Error in getUserStats:", error);
      res.status(500).json({
        success: false,
        error: "Error interno del servidor",
        message: error.message,
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }
  }
}
