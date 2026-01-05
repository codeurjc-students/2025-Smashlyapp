import { Racket } from '../types/racket';
import { API_ENDPOINTS, buildApiUrl, getCommonHeaders, ApiResponse } from '../config/api';

/**
 * Helper para manejar respuestas de la API
 */
async function handleApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Error: ${response.status} ${response.statusText}`);
  }

  const data: ApiResponse<T> = await response.json();

  if (!data.success) {
    throw new Error(data.message || data.error || 'Error desconocido');
  }

  return data.data as T;
}

export class RacketService {
  /**
   * Obtiene todas las palas desde la API REST
   */
  static async getAllRackets(): Promise<Racket[]> {
    try {
      const url = buildApiUrl(API_ENDPOINTS.RACKETS);
      const response = await fetch(url, {
        method: 'GET',
        headers: getCommonHeaders(),
      });

      return await handleApiResponse<Racket[]>(response);
    } catch (error: any) {
      console.error('Error fetching rackets from API:', error);
      throw error;
    }
  }

  /**
   * Obtiene palas con paginación desde la API REST
   */
  static async getRacketsWithPagination(page: number = 0, limit: number = 50): Promise<Racket[]> {
    try {
      const url = buildApiUrl(API_ENDPOINTS.RACKETS, {
        page,
        limit,
        paginated: 'true',
      });
      const response = await fetch(url, {
        method: 'GET',
        headers: getCommonHeaders(),
      });

      const data = await handleApiResponse<any>(response);
      return data.items || data;
    } catch (error: any) {
      console.error('Error fetching rackets with pagination:', error);
      throw error;
    }
  }

  /**
   * Obtiene una pala por su ID desde la API REST
   */
  static async getRacketById(id: number): Promise<Racket | null> {
    try {
      const url = buildApiUrl(API_ENDPOINTS.RACKETS_BY_ID(id));
      const response = await fetch(url, {
        method: 'GET',
        headers: getCommonHeaders(),
      });

      if (response.status === 404) {
        return null;
      }

      return await handleApiResponse<Racket>(response);
    } catch (error: any) {
      console.error('Error fetching racket by ID:', error);
      if (error.message?.includes('404')) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Obtiene una pala por su nombre (busca y filtra el resultado)
   */
  static async getRacketByName(nombre: string): Promise<Racket | null> {
    try {
      const results = await this.searchRackets(nombre);
      return results.find(r => r.nombre === nombre) || null;
    } catch (error: any) {
      console.error('Error fetching racket by name:', error);
      return null;
    }
  }

  /**
   * Busca palas por texto desde la API REST
   */
  static async searchRackets(query: string): Promise<Racket[]> {
    try {
      const url = buildApiUrl(API_ENDPOINTS.RACKETS_SEARCH, { q: query });
      const response = await fetch(url, {
        method: 'GET',
        headers: getCommonHeaders(),
      });

      return await handleApiResponse<Racket[]>(response);
    } catch (error: any) {
      console.error('Error searching rackets:', error);
      throw error;
    }
  }

  /**
   * Obtiene palas por marca desde la API REST
   */
  static async getRacketsByBrand(marca: string): Promise<Racket[]> {
    try {
      const url = buildApiUrl(API_ENDPOINTS.RACKETS_BY_BRAND(marca));
      const response = await fetch(url, {
        method: 'GET',
        headers: getCommonHeaders(),
      });

      return await handleApiResponse<Racket[]>(response);
    } catch (error: any) {
      console.error('Error fetching rackets by brand:', error);
      throw error;
    }
  }

  /**
   * Obtiene palas bestseller desde la API REST
   */
  static async getBestsellerRackets(): Promise<Racket[]> {
    try {
      const url = buildApiUrl(API_ENDPOINTS.RACKETS_BESTSELLERS);
      const response = await fetch(url, {
        method: 'GET',
        headers: getCommonHeaders(),
      });

      return await handleApiResponse<Racket[]>(response);
    } catch (error: any) {
      console.error('Error fetching bestseller rackets:', error);
      throw error;
    }
  }

  /**
   * Obtiene palas en oferta desde la API REST
   */
  static async getRacketsOnSale(): Promise<Racket[]> {
    try {
      const url = buildApiUrl(API_ENDPOINTS.RACKETS_OFFERS);
      const response = await fetch(url, {
        method: 'GET',
        headers: getCommonHeaders(),
      });

      return await handleApiResponse<Racket[]>(response);
    } catch (error: any) {
      console.error('Error fetching rackets on sale:', error);
      throw error;
    }
  }

  /**
   * Obtiene todas las marcas únicas desde la API REST
   */
  static async getUniqueBrands(): Promise<string[]> {
    try {
      const url = buildApiUrl(API_ENDPOINTS.RACKETS_BRANDS);
      const response = await fetch(url, {
        method: 'GET',
        headers: getCommonHeaders(),
      });

      return await handleApiResponse<string[]>(response);
    } catch (error: any) {
      console.error('Error fetching brands:', error);
      throw error;
    }
  }

  /**
   * Obtiene estadísticas básicas desde la API REST
   */
  static async getStats(): Promise<{
    total: number;
    bestsellers: number;
    onSale: number;
    brands: number;
  }> {
    try {
      const url = buildApiUrl(API_ENDPOINTS.RACKETS_STATS);
      const response = await fetch(url, {
        method: 'GET',
        headers: getCommonHeaders(),
      });

      return await handleApiResponse<{
        total: number;
        bestsellers: number;
        onSale: number;
        brands: number;
      }>(response);
    } catch (error: any) {
      console.error('Error fetching stats:', error);
      throw error;
    }
  }

  /**
   * Actualiza una pala existente
   */
  static async updateRacket(id: number, updates: Partial<Racket>): Promise<Racket> {
    try {
      const url = buildApiUrl(API_ENDPOINTS.RACKETS_BY_ID(id));
      const response = await fetch(url, {
        method: 'PUT',
        headers: getCommonHeaders(),
        body: JSON.stringify(updates),
      });

      return await handleApiResponse<Racket>(response);
    } catch (error: any) {
      console.error('Error updating racket:', error);
      throw error;
    }
  }
}
