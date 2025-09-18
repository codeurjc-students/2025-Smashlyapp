import { apiRequest } from "../config/api";
import { Racket } from "../types/racket";

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class RacketService {
  static async getAllRackets(): Promise<Racket[]> {
    try {
      const response = await apiRequest('/rackets');
      return response.data || response || [];
    } catch (error) {
      console.error("Error fetching rackets from API:", error);
      throw new Error(`Error al cargar las palas: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  static async getRackets(page: number = 1, limit: number = 20): Promise<PaginatedResponse<Racket>> {
    try {
      const response = await apiRequest(`/rackets?page=${page}&limit=${limit}`);
      return response;
    } catch (error) {
      console.error("Error fetching paginated rackets:", error);
      throw new Error(`Error al cargar las palas: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  static async searchRackets(searchTerm: string): Promise<Racket[]> {
    try {
      const response = await apiRequest(`/rackets/search?q=${encodeURIComponent(searchTerm)}`);
      return response.data || response || [];
    } catch (error) {
      console.error("Error searching rackets:", error);
      throw new Error(`Error al buscar palas: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  static async getRacketById(id: string): Promise<Racket | null> {
    try {
      const response = await apiRequest(`/rackets/${id}`);
      return response.data || response || null;
    } catch (error) {
      console.error("Error fetching racket by ID:", error);
      return null;
    }
  }

  static async getBestsellerRackets(): Promise<Racket[]> {
    try {
      const response = await apiRequest('/rackets/bestsellers');
      return response.data || response || [];
    } catch (error) {
      console.error("Error fetching bestseller rackets:", error);
      throw new Error(`Error al cargar palas bestsellers: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  static async getRacketsOnSale(): Promise<Racket[]> {
    try {
      const response = await apiRequest('/rackets/offers');
      return response.data || response || [];
    } catch (error) {
      console.error("Error fetching rackets on sale:", error);
      throw new Error(`Error al cargar palas en oferta: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  static async getBrands(): Promise<string[]> {
    try {
      const response = await apiRequest('/rackets/brands');
      return response.data || response || [];
    } catch (error) {
      console.error("Error fetching brands:", error);
      throw new Error(`Error al cargar marcas: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  static async getStats() {
    try {
      const response = await apiRequest('/rackets/stats');
      return response;
    } catch (error) {
      console.error("Error fetching stats:", error);
      throw new Error(`Error al cargar estadísticas: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }
}
