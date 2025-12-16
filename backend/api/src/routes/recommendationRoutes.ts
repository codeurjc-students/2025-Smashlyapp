import { Router } from 'express';
import { RecommendationController } from '../controllers/recommendationController';
import { authenticateUser as authenticate } from '../middleware/auth';

const router = Router();

// Public route (or semi-public, basic form doesn't require auth but saving does)
// Actually, generating recommendation might not require auth for basic form.
router.post('/generate', RecommendationController.generate);

// Protected routes
router.post('/save', authenticate, RecommendationController.save);
router.get('/last', authenticate, RecommendationController.getLast);

// Cache management routes
router.post('/cache/clear', RecommendationController.clearCache);
router.get('/cache/stats', RecommendationController.getCacheStats);

export default router;
