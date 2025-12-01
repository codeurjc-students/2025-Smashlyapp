import { Request, Response } from 'express';
import { RecommendationService } from '../services/recommendationService';
import logger from '../config/logger';
import { AuthRequest } from '../types';

export class RecommendationController {
  static async generate(req: Request, res: Response) {
    try {
      const { type, data } = req.body;

      if (!type || !data) {
        return res.status(400).json({ error: 'Missing type or data' });
      }

      const result = await RecommendationService.generateRecommendation(type, data);
      return res.json(result);
    } catch (error: unknown) {
      logger.error('Error in generate recommendation controller:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async save(req: Request & AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { type, formData, result } = req.body;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!type || !formData || !result) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const saved = await RecommendationService.saveRecommendation(userId, type, formData, result);
      return res.status(201).json(saved);
    } catch (error: unknown) {
      logger.error('Error in save recommendation controller:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getLast(req: Request & AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const recommendation = await RecommendationService.getLastRecommendation(userId);
      return res.json(recommendation || { message: 'No recommendations found' });
    } catch (error: unknown) {
      logger.error('Error in get last recommendation controller:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}
