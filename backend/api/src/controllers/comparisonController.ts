import { Request, Response } from 'express';
import { OpenRouterService } from '../services/openRouterService';
import { RacketService } from '../services/racketService';
import { ComparisonService } from '../services/comparisonService';
import { RequestWithUser } from '../types';
import logger from '../config/logger';

const openRouterService = new OpenRouterService();

export class ComparisonController {
  static async compareRackets(req: Request, res: Response) {
    try {
      const { racketIds, userProfile } = req.body;

      if (!racketIds || !Array.isArray(racketIds) || racketIds.length < 2) {
        return res.status(400).json({
          error: 'Se requieren al menos 2 IDs de palas para comparar',
        });
      }

      if (racketIds.length > 3) {
        return res.status(400).json({
          error: 'Solo se pueden comparar hasta 3 palas simultáneamente',
        });
      }

      // Fetch rackets from DB to ensure valid data
      const rackets = await RacketService.getRacketsByIds(racketIds);

      if (rackets.length !== racketIds.length) {
        return res.status(404).json({
          error: 'No se encontraron todas las palas solicitadas',
        });
      }

      const comparisonResult = await openRouterService.compareRackets(rackets, userProfile);

      return res.json({ 
        comparison: comparisonResult
      });
    } catch (error: any) {
      logger.error('Error in compareRackets controller:', error);
      return res.status(500).json({
        error: 'Error al generar la comparación',
        details: error.message,
      });
    }
  }

  static async saveComparison(req: RequestWithUser, res: Response) {
    try {
      const userId = req.user?.id;
      const { racketIds, comparisonText, metrics } = req.body;

      logger.info('🔍 saveComparison - userId:', userId);
      logger.info('🔍 saveComparison - racketIds:', racketIds);
      logger.info('🔍 saveComparison - comparisonText length:', comparisonText?.length);
      logger.info('🔍 saveComparison - metrics:', metrics ? 'provided' : 'not provided');

      if (!userId) {
        logger.error('❌ saveComparison - userId es undefined!');
        return res.status(401).json({
          error: 'Usuario no autenticado',
        });
      }

      if (!racketIds || !Array.isArray(racketIds) || racketIds.length < 2) {
        return res.status(400).json({
          error: 'Se requieren al menos 2 IDs de palas',
        });
      }

      if (!comparisonText || typeof comparisonText !== 'string') {
        return res.status(400).json({
          error: 'El texto de la comparación es requerido',
        });
      }

      logger.info('🔍 saveComparison - creando comparación...');
      const comparison = await ComparisonService.createComparison({
        user_id: userId,
        racket_ids: racketIds,
        comparison_text: comparisonText,
        metrics: metrics || undefined,
      });

      logger.info('✅ saveComparison - comparación creada:', comparison.id);

      return res.status(201).json({
        success: true,
        data: comparison,
        message: 'Comparación guardada correctamente',
      });
    } catch (error: any) {
      logger.error('Error in saveComparison controller:', error);
      return res.status(500).json({
        error: 'Error al guardar la comparación',
        details: error.message,
      });
    }
  }

  static async getUserComparisons(req: RequestWithUser, res: Response) {
    try {
      const userId = req.user?.id;

      logger.info('🔍 getUserComparisons - userId:', userId);

      if (!userId) {
        logger.error('❌ getUserComparisons - userId es undefined!');
        return res.status(401).json({
          error: 'Usuario no autenticado',
        });
      }

      logger.info('🔍 getUserComparisons - buscando comparaciones para usuario...');
      const comparisons = await ComparisonService.getUserComparisons(userId);

      logger.info('✅ getUserComparisons - encontradas:', comparisons.length);

      return res.json({
        success: true,
        data: comparisons,
      });
    } catch (error: any) {
      logger.error('Error in getUserComparisons controller:', error);
      return res.status(500).json({
        error: 'Error al obtener las comparaciones',
        details: error.message,
      });
    }
  }

  static async getComparisonById(req: RequestWithUser, res: Response) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      if (!userId) {
        return res.status(401).json({
          error: 'Usuario no autenticado',
        });
      }

      const comparison = await ComparisonService.getComparisonById(id, userId);

      if (!comparison) {
        return res.status(404).json({
          error: 'Comparación no encontrada',
        });
      }

      return res.json({
        success: true,
        data: comparison,
      });
    } catch (error: any) {
      logger.error('Error in getComparisonById controller:', error);
      return res.status(500).json({
        error: 'Error al obtener la comparación',
        details: error.message,
      });
    }
  }

  static async deleteComparison(req: RequestWithUser, res: Response) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      if (!userId) {
        return res.status(401).json({
          error: 'Usuario no autenticado',
        });
      }

      await ComparisonService.deleteComparison(id, userId);

      return res.json({
        success: true,
        message: 'Comparación eliminada correctamente',
      });
    } catch (error: any) {
      logger.error('Error in deleteComparison controller:', error);
      return res.status(500).json({
        error: 'Error al eliminar la comparación',
        details: error.message,
      });
    }
  }

  static async getComparisonCount(req: RequestWithUser, res: Response) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          error: 'Usuario no autenticado',
        });
      }

      const count = await ComparisonService.getUserComparisonCount(userId);

      return res.json({
        success: true,
        data: { count },
      });
    } catch (error: any) {
      logger.error('Error in getComparisonCount controller:', error);
      return res.status(500).json({
        error: 'Error al obtener el contador de comparaciones',
        details: error.message,
      });
    }
  }

  static async shareComparison(req: RequestWithUser, res: Response) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      if (!userId) {
        return res.status(401).json({
          error: 'Usuario no autenticado',
        });
      }

      const shareToken = await ComparisonService.shareComparison(id, userId);

      return res.json({
        success: true,
        data: { shareToken },
        message: 'Comparación compartida correctamente',
      });
    } catch (error: any) {
      logger.error('Error in shareComparison controller:', error);
      return res.status(500).json({
        error: 'Error al compartir la comparación',
        details: error.message,
      });
    }
  }

  static async getSharedComparison(req: Request, res: Response) {
    try {
      const { token } = req.params;

      const comparison = await ComparisonService.getSharedComparison(token);

      if (!comparison) {
        return res.status(404).json({
          error: 'Comparación no encontrada o no pública',
        });
      }

      return res.json({
        success: true,
        data: comparison,
      });
    } catch (error: any) {
      logger.error('Error in getSharedComparison controller:', error);
      return res.status(500).json({
        error: 'Error al obtener la comparación compartida',
        details: error.message,
      });
    }
  }

  static async unshareComparison(req: RequestWithUser, res: Response) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      if (!userId) {
        return res.status(401).json({
          error: 'Usuario no autenticado',
        });
      }

      await ComparisonService.unshareComparison(id, userId);

      return res.json({
        success: true,
        message: 'Comparación dejada de compartir',
      });
    } catch (error: any) {
      logger.error('Error in unshareComparison controller:', error);
      return res.status(500).json({
        error: 'Error al dejar de compartir la comparación',
        details: error.message,
      });
    }
  }
}
