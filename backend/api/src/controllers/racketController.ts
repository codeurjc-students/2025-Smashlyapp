import { Request, Response } from "express";
import { RacketService } from "../services/racketService";
import {
  SearchFilters,
  SortOptions,
  ApiResponse,
  PaginatedResponse,
  Racket,
} from "../types";

export class RacketController {
  /**
   * GET /api/rackets
   * Obtiene todas las palas o con paginación
   */
  static async getAllRackets(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 0;
      const limit = parseInt(req.query.limit as string) || 50;
      const usePagination = req.query.paginated === "true";

      if (usePagination) {
        const result = await RacketService.getRacketsWithPagination(
          page,
          limit
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
          message: `${rackets.length} palas cargadas exitosamente`,
          timestamp: new Date().toISOString(),
        } as ApiResponse<Racket[]>);
      }
    } catch (error: any) {
      console.error("Error in getAllRackets:", error);
      res.status(500).json({
        success: false,
        error: "Error interno del servidor",
        message: error.message,
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
          error: "ID inválido",
          message: "El ID debe ser un número",
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
    } catch (error: any) {
      console.error("Error in getRacketById:", error);
      res.status(500).json({
        success: false,
        error: "Error interno del servidor",
        message: error.message,
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
          error: "Consulta inválida",
          message: "La búsqueda debe tener al menos 2 caracteres",
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
    } catch (error: any) {
      console.error("Error in searchRackets:", error);
      res.status(500).json({
        success: false,
        error: "Error interno del servidor",
        message: error.message,
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

      // Construir filtros (soportando múltiples formatos de parámetros)
      const filters: SearchFilters = {};

      // Marca/Brand
      if (req.query.marca) filters.marca = req.query.marca as string;
      if (req.query.brand) filters.marca = req.query.brand as string;

      // Forma/Shape
      if (req.query.forma) filters.forma = req.query.forma as string;
      if (req.query.shape) filters.forma = req.query.shape as string;

      // Balance
      if (req.query.balance) filters.balance = req.query.balance as string;

      // Nivel de juego/Level
      if (req.query.nivel_de_juego)
        filters.nivel_de_juego = req.query.nivel_de_juego as string;
      if (req.query.level) filters.nivel_de_juego = req.query.level as string;

      // Precios
      if (req.query.precio_min)
        filters.precio_min = parseFloat(req.query.precio_min as string);
      if (req.query.min_price)
        filters.precio_min = parseFloat(req.query.min_price as string);

      if (req.query.precio_max)
        filters.precio_max = parseFloat(req.query.precio_max as string);
      if (req.query.max_price)
        filters.precio_max = parseFloat(req.query.max_price as string);

      // Ofertas y bestsellers
      if (req.query.en_oferta)
        filters.en_oferta = req.query.en_oferta === "true";
      if (req.query.on_sale) filters.en_oferta = req.query.on_sale === "true";

      if (req.query.es_bestseller)
        filters.es_bestseller = req.query.es_bestseller === "true";
      if (req.query.bestseller)
        filters.es_bestseller = req.query.bestseller === "true";

      // Construir opciones de ordenamiento
      let sort: SortOptions | undefined;
      if (req.query.sortBy) {
        sort = {
          field: req.query.sortBy as string,
          order: (req.query.sortOrder as string) === "desc" ? "desc" : "asc",
        };
      }

      console.log("Applied filters:", filters); // Debug log
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
    } catch (error: any) {
      console.error("Error in getFilteredRackets:", error);
      res.status(500).json({
        success: false,
        error: "Error interno del servidor",
        message: error.message,
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }
  }

  /**
   * GET /api/rackets/brands/:brand
   * Obtiene palas por marca
   */
  static async getRacketsByBrand(req: Request, res: Response): Promise<void> {
    try {
      const brand = req.params.brand;

      if (!brand) {
        res.status(400).json({
          success: false,
          error: "Marca requerida",
          message: "Debe especificar una marca",
          timestamp: new Date().toISOString(),
        } as ApiResponse);
        return;
      }

      const rackets = await RacketService.getRacketsByBrand(brand);

      res.json({
        success: true,
        data: rackets,
        message: `${rackets.length} palas encontradas de la marca ${brand}`,
        timestamp: new Date().toISOString(),
      } as ApiResponse<Racket[]>);
    } catch (error: any) {
      console.error("Error in getRacketsByBrand:", error);
      res.status(500).json({
        success: false,
        error: "Error interno del servidor",
        message: error.message,
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }
  }

  /**
   * GET /api/rackets/bestsellers
   * Obtiene palas bestsellers
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
        message: `${rackets.length} palas bestsellers encontradas`,
        timestamp: new Date().toISOString(),
      } as ApiResponse<Racket[]>);
    } catch (error: any) {
      console.error("Error in getBestsellerRackets:", error);
      res.status(500).json({
        success: false,
        error: "Error interno del servidor",
        message: error.message,
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }
  }

  /**
   * GET /api/rackets/offers
   * Obtiene palas en oferta
   */
  static async getRacketsOnSale(req: Request, res: Response): Promise<void> {
    try {
      const rackets = await RacketService.getRacketsOnSale();

      res.json({
        success: true,
        data: rackets,
        message: `${rackets.length} palas en oferta encontradas`,
        timestamp: new Date().toISOString(),
      } as ApiResponse<Racket[]>);
    } catch (error: any) {
      console.error("Error in getRacketsOnSale:", error);
      res.status(500).json({
        success: false,
        error: "Error interno del servidor",
        message: error.message,
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }
  }

  /**
   * GET /api/rackets/brands
   * Obtiene todas las marcas disponibles
   */
  static async getBrands(req: Request, res: Response): Promise<void> {
    try {
      const brands = await RacketService.getBrands();

      res.json({
        success: true,
        data: brands,
        message: `${brands.length} marcas encontradas`,
        timestamp: new Date().toISOString(),
      } as ApiResponse<string[]>);
    } catch (error: any) {
      console.error("Error in getBrands:", error);
      res.status(500).json({
        success: false,
        error: "Error interno del servidor",
        message: error.message,
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }
  }

  /**
   * GET /api/rackets/stats
   * Obtiene estadísticas de palas
   */
  static async getStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await RacketService.getStats();

      res.json({
        success: true,
        data: stats,
        message: "Estadísticas obtenidas exitosamente",
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    } catch (error: any) {
      console.error("Error in getStats:", error);
      res.status(500).json({
        success: false,
        error: "Error interno del servidor",
        message: error.message,
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }
  }
}
