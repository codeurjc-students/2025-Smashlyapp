import { Router } from 'express';
import { ComparisonController } from '../controllers/comparisonController';
import { authenticateUser } from '../middleware/auth';

const router = Router();

// Public route: compare rackets (can be used without auth)
router.post('/', ComparisonController.compareRackets);

// Protected routes: require authentication
router.post('/save', authenticateUser, ComparisonController.saveComparison);
router.get('/user', authenticateUser, ComparisonController.getUserComparisons);
router.get('/user/count', authenticateUser, ComparisonController.getComparisonCount);
router.get('/:id', authenticateUser, ComparisonController.getComparisonById);
router.delete('/:id', authenticateUser, ComparisonController.deleteComparison);

// Share routes
router.post('/:id/share', authenticateUser, ComparisonController.shareComparison);
router.post('/:id/unshare', authenticateUser, ComparisonController.unshareComparison);
router.get('/shared/:token', ComparisonController.getSharedComparison);

export default router;
