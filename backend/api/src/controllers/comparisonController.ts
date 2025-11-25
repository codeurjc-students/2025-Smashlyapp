import { Request, Response } from 'express';
import { GeminiService } from '../services/geminiService';
import { RacketService } from '../services/racketService';
import logger from '../config/logger';

const geminiService = new GeminiService();

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

      const comparison = await geminiService.compareRackets(rackets, userProfile);

      return res.json({ comparison });
    } catch (error: any) {
      logger.error('Error in compareRackets controller:', error);
      return res.status(500).json({
        error: 'Error al generar la comparación',
        details: error.message,
      });
    }
  }
}
