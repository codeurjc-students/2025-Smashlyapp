import { Router } from 'express';
import { RacketController } from '../controllers/racketController';
import { optionalAuth } from '../middleware/auth';
import {
  validatePagination,
  validateIdParam,
  validateSearchQuery,
  validateSearchFilters,
} from '../middleware/validation';

const router = Router();

// GET /api/rackets - Gets all rackets or with pagination
router.get('/', optionalAuth, validatePagination, RacketController.getAllRackets);

// GET /api/rackets/search?q=... - Searches rackets by name, brand or model
router.get('/search', optionalAuth, validateSearchQuery, RacketController.searchRackets);

// GET /api/rackets/filter - Gets rackets with advanced filters
router.get(
  '/filter',
  optionalAuth,
  validatePagination,
  validateSearchFilters,
  RacketController.getFilteredRackets
);

// GET /api/rackets/bestsellers - Gets bestseller rackets
router.get('/bestsellers', optionalAuth, RacketController.getBestsellerRackets);

// GET /api/rackets/offers - Gets rackets on sale
router.get('/offers', optionalAuth, RacketController.getRacketsOnSale);

// GET /api/rackets/brands - Gets all available brands
router.get('/brands', optionalAuth, RacketController.getBrands);

// GET /api/rackets/stats - Gets racket statistics
router.get('/stats', optionalAuth, RacketController.getStats);

// GET /api/rackets/brands/:brand - Gets rackets by specific brand
router.get('/brands/:brand', optionalAuth, RacketController.getRacketsByBrand);

// GET /api/rackets/:id - Gets a racket by ID (must go at the end)
router.get('/:id', optionalAuth, validateIdParam(), RacketController.getRacketById);

// PUT /api/rackets/:id - Updates a racket by ID
// TODO: Add stricter auth middleware (requireAuth + admin check)
router.put('/:id', optionalAuth, validateIdParam(), RacketController.updateRacket);

// DELETE /api/rackets/:id - Deletes a racket by ID
router.delete('/:id', optionalAuth, validateIdParam(), RacketController.deleteRacket);

export default router;
