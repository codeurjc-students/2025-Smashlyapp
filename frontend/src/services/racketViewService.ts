import {
  API_ENDPOINTS,
  buildApiUrl,
  getCommonHeaders,
  ApiResponse,
} from "../config/api";

export interface RecentlyViewedRacket {
  id: number;
  nombre: string;
  marca: string;
  imagen?: string;
  precio_actual?: number;
  viewed_at: string;
}

/**
 * Helper para manejar respuestas de la API
 */
async function handleApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || `Error: ${response.status} ${response.statusText}`
    );
  }

  const data: ApiResponse<T> = await response.json();

  if (!data.success) {
    throw new Error(data.message || data.error || "Error desconocido");
  }

  return data.data as T;
}

export class RacketViewService {
  /**
   * Registra que el usuario ha visto una pala
   */
  static async recordView(racketId: number): Promise<void> {
    const response = await fetch(
      buildApiUrl(API_ENDPOINTS.RACKET_VIEWS.RECORD_VIEW(racketId)),
      {
        method: "POST",
        headers: getCommonHeaders(),
      }
    );

    await handleApiResponse<void>(response);
  }

  /**
   * Obtiene las palas vistas recientemente por el usuario
   */
  static async getRecentlyViewed(
    limit: number = 10
  ): Promise<RecentlyViewedRacket[]> {
    const response = await fetch(
      buildApiUrl(API_ENDPOINTS.RACKET_VIEWS.RECENTLY_VIEWED, { limit }),
      {
        method: "GET",
        headers: getCommonHeaders(),
      }
    );

    return handleApiResponse<RecentlyViewedRacket[]>(response);
  }

  /**
   * Elimina una visualización del historial
   */
  static async removeView(racketId: number): Promise<void> {
    const response = await fetch(
      buildApiUrl(API_ENDPOINTS.RACKET_VIEWS.REMOVE_VIEW(racketId)),
      {
        method: "DELETE",
        headers: getCommonHeaders(),
      }
    );

    await handleApiResponse<void>(response);
  }

  /**
   * Limpia todo el historial de visualizaciones
   */
  static async clearHistory(): Promise<void> {
    const response = await fetch(
      buildApiUrl(API_ENDPOINTS.RACKET_VIEWS.CLEAR_HISTORY),
      {
        method: "DELETE",
        headers: getCommonHeaders(),
      }
    );

    await handleApiResponse<void>(response);
  }
}
