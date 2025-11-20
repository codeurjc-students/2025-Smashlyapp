import { Request, Response } from "express";
import { RacketService } from "../services/racketService";
import logger from "../config/logger";
import {
  SearchFilters,
  SortOptions,
  ApiResponse,
  PaginatedResponse,
  Racket,
} from "../types";

// Helper function outside the class to avoid 'this' context issues
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

export class RacketController {

  /**
   * GET /api/rackets
   * Gets all rackets or with pagination
   */
  static async getAllRackets(req: Request, res: Response): Promise<void> {
    try {
      const rawPage = parseInt(req.query.page as string);
      const rawLimit = parseInt(req.query.limit as string);
      const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? rawLimit : undefined;
      const usePagination = req.query.paginated === "true";

      // Page 1-based por defecto, sin remapeo
      const page = isNaN(rawPage) ? 1 : rawPage > 0 ? rawPage : 1;

      if (usePagination) {
        const result = await RacketService.getRacketsWithPagination(
          page,
          limit ?? 10
        );
        res.json({
          success: true,
          data: result,
          timestamp: new Date().toISOString(),
        } as ApiResponse<PaginatedResponse<Racket>>);
      } else {
        const rackets = await RacketService.getAllRackets();
        res.json({
          success: true,
          data: rackets,
          message: `${rackets.length} rackets loaded successfully`,
          timestamp: new Date().toISOString(),
        } as ApiResponse<Racket[]>);
      }
    } catch (error: unknown) {
      logger.error("Error in getAllRackets:", error);
      res.status(500).json({
        success: false,
        error: "Error interno del servidor",
        message: getErrorMessage(error),
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }
  }

  /**
   * GET /api/rackets/:id
   * Obtiene una pala por ID
   */
  static async getRacketById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          error: "Invalid ID",
          message: "ID must be a number",
          timestamp: new Date().toISOString(),
        } as ApiResponse);
        return;
      }

      const racket = await RacketService.getRacketById(id);

      if (!racket) {
        res.status(404).json({
          success: false,
          error: "Pala no encontrada",
          message: `No se encontró una pala con ID ${id}`,
          timestamp: new Date().toISOString(),
        } as ApiResponse);
        return;
      }

      res.json({
        success: true,
        data: racket,
        timestamp: new Date().toISOString(),
      } as ApiResponse<Racket>);
    } catch (error: unknown) {
      logger.error("Error in getRacketById:", error);
      res.status(500).json({
        success: false,
        error: "Error interno del servidor",
        message: getErrorMessage(error),
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }
  }

  /**
   * GET /api/rackets/search?q=...
   * Busca palas por nombre, marca o modelo
   */
  static async searchRackets(req: Request, res: Response): Promise<void> {
    try {
      const query = req.query.q as string;

      if (!query || query.trim().length < 2) {
        res.status(400).json({
          success: false,
          error: "Invalid query",
          message: "Search must have at least 2 characters",
          timestamp: new Date().toISOString(),
        } as ApiResponse);
        return;
      }

      const rackets = await RacketService.searchRackets(query.trim());

      res.json({
        success: true,
        data: rackets,
        message: `${rackets.length} palas encontradas para "${query}"`,
        timestamp: new Date().toISOString(),
      } as ApiResponse<Racket[]>);
    } catch (error: unknown) {
      logger.error("Error in searchRackets:", error);
      res.status(500).json({
        success: false,
        error: "Error interno del servidor",
        message: getErrorMessage(error),
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }
  }

  /**
   * GET /api/rackets/filter
   * Obtiene palas con filtros avanzados
   */
  static async getFilteredRackets(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 0;
      const limit = parseInt(req.query.limit as string) || 50;

      const filters = this.buildSearchFilters(req.query);
      const sort = this.buildSortOptions(req.query);

      logger.info("Applied filters:", filters);
      const result = await RacketService.getFilteredRackets(
        filters,
        sort,
        page,
        limit
      );

      res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      } as ApiResponse<PaginatedResponse<Racket>>);
    } catch (error: unknown) {
      logger.error("Error in getFilteredRackets:", error);
      res.status(500).json({
        success: false,
        error: "Error interno del servidor",
        message: getErrorMessage(error),
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }
  }

  private static buildSearchFilters(query: Record<string, unknown>): SearchFilters {
    const filters: SearchFilters = {};

    if (query.brand) filters.brand = query.brand as string;
    if (query.shape) filters.shape = query.shape as string;
    if (query.balance) filters.balance = query.balance as string;
    if (query.level) filters.game_level = query.level as string;
    
    if (query.min_price) filters.min_price = parseFloat(query.min_price as string);
    if (query.max_price) filters.max_price = parseFloat(query.max_price as string);
    
    if (query.on_sale) filters.on_offer = query.on_sale === "true";
    if (query.bestseller) filters.is_bestseller = query.bestseller === "true";

    return filters;
  }

  private static buildSortOptions(query: Record<string, unknown>): SortOptions | undefined {
    if (!query.sortBy) return undefined;
    
    return {
      field: query.sortBy as string,
      order: (query.sortOrder as string) === "desc" ? "desc" : "asc",
    };
  }

  /**
   * GET /api/rackets/brands/:brand
   * Gets rackets by brand
   */
  static async getRacketsByBrand(req: Request, res: Response): Promise<void> {
    try {
      const brand = req.params.brand;

      if (!brand) {
        res.status(400).json({
          success: false,
          error: "Brand required",
          message: "You must specify a brand",
          timestamp: new Date().toISOString(),
        } as ApiResponse);
        return;
      }

      const rackets = await RacketService.getRacketsByBrand(brand);

      res.json({
        success: true,
        data: rackets,
        message: `${rackets.length} rackets found for brand ${brand}`,
        timestamp: new Date().toISOString(),
      } as ApiResponse<Racket[]>);
    } catch (error: unknown) {
      logger.error("Error in getRacketsByBrand:", error);
      res.status(500).json({
        success: false,
        error: "Error interno del servidor",
        message: getErrorMessage(error),
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }
  }

  /**
   * GET /api/rackets/bestsellers
   * Gets bestseller rackets
   */
  static async getBestsellerRackets(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const rackets = await RacketService.getBestsellerRackets();

      res.json({
        success: true,
        data: rackets,
        message: `${rackets.length} bestseller rackets found`,
        timestamp: new Date().toISOString(),
      } as ApiResponse<Racket[]>);
    } catch (error: unknown) {
      logger.error("Error in getBestsellerRackets:", error);
      res.status(500).json({
        success: false,
        error: "Error interno del servidor",
        message: getErrorMessage(error),
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }
  }

  /**
   * GET /api/rackets/offers
   * Gets rackets on sale
   */
  static async getRacketsOnSale(req: Request, res: Response): Promise<void> {
    try {
      const rackets = await RacketService.getRacketsOnSale();

      res.json({
        success: true,
        data: rackets,
        message: `${rackets.length} rackets on sale found`,
        timestamp: new Date().toISOString(),
      } as ApiResponse<Racket[]>);
    } catch (error: unknown) {
      logger.error("Error in getRacketsOnSale:", error);
      res.status(500).json({
        success: false,
        error: "Error interno del servidor",
        message: getErrorMessage(error),
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }
  }

  /**
   * GET /api/rackets/brands
   * Gets all available brands
   */
  static async getBrands(req: Request, res: Response): Promise<void> {
    try {
      const brands = await RacketService.getBrands();

      res.json({
        success: true,
        data: brands,
        message: `${brands.length} brands found`,
        timestamp: new Date().toISOString(),
      } as ApiResponse<string[]>);
    } catch (error: unknown) {
      logger.error("Error in getBrands:", error);
      res.status(500).json({
        success: false,
        error: "Error interno del servidor",
        message: getErrorMessage(error),
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }
  }

  /**
   * GET /api/rackets/stats
   * Gets racket statistics
   */
  static async getStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await RacketService.getStats();

      res.json({
        success: true,
        data: stats,
        message: "Statistics obtained successfully",
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    } catch (error: unknown) {
      logger.error("Error in getStats:", error);
      res.status(500).json({
        success: false,
        error: "Error interno del servidor",
        message: getErrorMessage(error),
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }
  }
}
