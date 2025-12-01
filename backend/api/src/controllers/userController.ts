import { Request, Response } from 'express';
import { UserService } from '../services/userService';
import logger from '../config/logger';
import {
  UserProfile,
  CreateUserProfileRequest,
  UpdateUserProfileRequest,
  ApiResponse,
  RequestWithUser,
} from '../types';

// Helper function outside the class to avoid 'this' context issues
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

export class UserController {
  /**
   * GET /api/users/profile
   * Obtiene el perfil del usuario autenticado
   */
  static async getUserProfile(req: RequestWithUser, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Authentication required to access profile',
          timestamp: new Date().toISOString(),
        } as ApiResponse);
        return;
      }

      const profile = await UserService.getUserProfile(userId);

      if (!profile) {
        res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'No profile found for this user',
          timestamp: new Date().toISOString(),
        } as ApiResponse);
        return;
      }

      res.json({
        success: true,
        data: profile,
        timestamp: new Date().toISOString(),
      } as ApiResponse<UserProfile>);
    } catch (error: unknown) {
      logger.error('Error in getUserProfile:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        message: getErrorMessage(error),
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }
  }

  /**
   * POST /api/users/profile
   * Crea un nuevo perfil de usuario
   */
  static async createUserProfile(req: RequestWithUser, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Authentication required to create profile',
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
          error: 'Invalid data',
          message: validation.errors.join(', '),
          timestamp: new Date().toISOString(),
        } as ApiResponse);
        return;
      }

      const profile = await UserService.createUserProfile(userId, profileData);

      res.status(201).json({
        success: true,
        data: profile,
        message: 'Perfil creado exitosamente',
        timestamp: new Date().toISOString(),
      } as ApiResponse<UserProfile>);
    } catch (error: unknown) {
      logger.error('Error in createUserProfile:', error);

      // Handle specific errors
      if (getErrorMessage(error).includes('duplicate')) {
        res.status(409).json({
          error: 'Conflict',
          message: 'A profile already exists for this user',
        });
      }

      logger.error('Error creating profile:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Internal server error',
      });
    }
  }

  /**
   * PUT /api/users/profile
   * Actualiza el perfil del usuario autenticado
   */
  private static validateUserAuthentication(userId: string | undefined, res: Response): boolean {
    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Usuario no autenticado',
        message: 'Se requiere autenticación para actualizar el perfil',
        timestamp: new Date().toISOString(),
      } as ApiResponse);
      return false;
    }
    return true;
  }

  private static validateUpdateData(updates: UpdateUserProfileRequest, res: Response): boolean {
    const validation = UserService.validateProfileData(updates);
    if (!validation.isValid) {
      res.status(400).json({
        success: false,
        error: 'Invalid data',
        message: validation.errors.join(', '),
        timestamp: new Date().toISOString(),
      } as ApiResponse);
      return false;
    }
    return true;
  }

  private static handleUpdateError(error: unknown, res: Response): void {
    logger.error('Error in updateUserProfile:', error);

    if ((error as Error).message.includes('nickname')) {
      res.status(409).json({
        success: false,
        error: 'Data conflict',
        message: (error as Error).message,
        timestamp: new Date().toISOString(),
      } as ApiResponse);
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: (error as Error).message,
      timestamp: new Date().toISOString(),
    } as ApiResponse);
  }

  static async updateUserProfile(req: RequestWithUser, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!UserController.validateUserAuthentication(userId, res)) return;

      const updates: UpdateUserProfileRequest = req.body as UpdateUserProfileRequest;
      if (!UserController.validateUpdateData(updates, res)) return;

      const profile = await UserService.updateUserProfile(userId!, updates);

      res.json({
        success: true,
        data: profile,
        message: 'Profile updated successfully',
        timestamp: new Date().toISOString(),
      } as ApiResponse<UserProfile>);
    } catch (error: unknown) {
      UserController.handleUpdateError(error, res);
    }
  }

  /**
   * DELETE /api/users/profile
   * Elimina el perfil del usuario autenticado
   */
  static async deleteUserProfile(req: RequestWithUser, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized user',
          message: 'Authentication required to delete profile',
          timestamp: new Date().toISOString(),
        } as ApiResponse);
        return;
      }

      await UserService.deleteUserProfile(userId);

      res.json({
        success: true,
        message: 'Profile deleted successfully',
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    } catch (error: unknown) {
      logger.error('Error in deleteUserProfile:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: getErrorMessage(error),
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }
  }

  /**
   * GET /api/users/nickname/:nickname/available
   * Checks if a nickname is available
   */
  static async checkNicknameAvailability(req: Request, res: Response): Promise<void> {
    try {
      const nickname = req.params.nickname;
      const excludeUserId = req.query.excludeUserId as string;

      if (!nickname || nickname.length < 3) {
        res.status(400).json({
          success: false,
          error: 'Invalid nickname',
          message: 'Nickname must have at least 3 characters',
          timestamp: new Date().toISOString(),
        } as ApiResponse);
        return;
      }

      const isAvailable = await UserService.isNicknameAvailable(nickname, excludeUserId);

      res.json({
        success: true,
        data: { available: isAvailable, nickname },
        message: isAvailable ? 'Nickname disponible' : 'Nickname no disponible',
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    } catch (error: unknown) {
      logger.error('Error in checkNicknameAvailability:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        message: getErrorMessage(error),
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
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      if (!query || query.trim().length < 2) {
        res.status(400).json({
          success: false,
          error: 'Invalid query',
          message: 'Search must have at least 2 characters',
          timestamp: new Date().toISOString(),
        } as ApiResponse);
        return;
      }

      const users = await (UserService.searchUsersByNickname as any)(query.trim(), limit);

      res.json({
        success: true,
        data: users,
        message: `${Array.isArray(users) ? users.length : 0} users found`,
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    } catch (error: unknown) {
      logger.error('Error in searchUsers:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        message: getErrorMessage(error),
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
      // TODO: Add administrator role verification

      const stats = await UserService.getUserStats();

      res.json({
        success: true,
        data: stats,
        message: 'Statistics obtained successfully',
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    } catch (error: unknown) {
      logger.error('Error in getUserStats:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: getErrorMessage(error),
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }
  }
}
