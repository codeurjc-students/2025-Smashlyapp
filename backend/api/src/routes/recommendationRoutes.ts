import { Router } from 'express';
import { RecommendationController } from '../controllers/recommendationController';
import { authenticate } from '../middleware/auth'; // Assuming auth middleware exists

const router = Router();

// Public route (or semi-public, basic form doesn't require auth but saving does)
// Actually, generating recommendation might not require auth for basic form.
router.post('/generate', RecommendationController.generate);

// Protected routes
router.post('/save', authenticate, RecommendationController.save);
router.get('/last', authenticate, RecommendationController.getLast);

export default router;
