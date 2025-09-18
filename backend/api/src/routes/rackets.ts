import { Router } from "express";
import { RacketController } from "../controllers/racketController";
import { optionalAuth } from "../middleware/auth";
import {
  validatePagination,
  validateIdParam,
  validateSearchQuery,
  validateSearchFilters,
} from "../middleware/validation";

const router = Router();

// GET /api/rackets - Obtiene todas las palas o con paginación
router.get(
  "/",
  optionalAuth,
  validatePagination,
  RacketController.getAllRackets
);

// GET /api/rackets/search?q=... - Busca palas por nombre, marca o modelo
router.get(
  "/search",
  optionalAuth,
  validateSearchQuery,
  RacketController.searchRackets
);

// GET /api/rackets/filter - Obtiene palas con filtros avanzados
router.get(
  "/filter",
  optionalAuth,
  validatePagination,
  validateSearchFilters,
  RacketController.getFilteredRackets
);

// GET /api/rackets/bestsellers - Obtiene palas bestsellers
router.get("/bestsellers", optionalAuth, RacketController.getBestsellerRackets);

// GET /api/rackets/offers - Obtiene palas en oferta
router.get("/offers", optionalAuth, RacketController.getRacketsOnSale);

// GET /api/rackets/brands - Obtiene todas las marcas disponibles
router.get("/brands", optionalAuth, RacketController.getBrands);

// GET /api/rackets/stats - Obtiene estadísticas de palas
router.get("/stats", optionalAuth, RacketController.getStats);

// GET /api/rackets/brands/:brand - Obtiene palas por marca específica
router.get("/brands/:brand", optionalAuth, RacketController.getRacketsByBrand);

// GET /api/rackets/:id - Obtiene una pala por ID (debe ir al final)
router.get(
  "/:id",
  optionalAuth,
  validateIdParam(),
  RacketController.getRacketById
);

export default router;
