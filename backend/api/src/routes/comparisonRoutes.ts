import { Router } from 'express';
import { ComparisonController } from '../controllers/comparisonController';

const router = Router();

router.post('/', ComparisonController.compareRackets);

export default router;
