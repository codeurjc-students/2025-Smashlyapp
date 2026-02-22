import { API_URL, getCommonHeaders } from '../config/api';
import { ComparisonResult, RacketComparisonData } from '../types/racket';

export interface ComparisonResponse {
  comparison: ComparisonResult;
}

export interface SavedComparison {
  id: string;
  user_id: string;
  racket_ids: number[];
  comparison_text: string; // Legacy format (markdown string) or JSON string of ComparisonResult
  metrics?: RacketComparisonData[];
  share_token?: string;
  is_public?: boolean;
  created_at: string;
  updated_at: string;
}

export interface SaveComparisonResponse {
  success: boolean;
  data: SavedComparison;
  message: string;
}

export interface GetComparisonsResponse {
  success: boolean;
  data: SavedComparison[];
}

export interface ComparisonCountResponse {
  success: boolean;
  data: {
    count: number;
  };
}

export const ComparisonService = {
  compareRackets: async (racketIds: number[], userProfile?: any): Promise<ComparisonResponse> => {
    // Construct URL: API_URL (base) + /api/v1/comparison
    // API_URL is usually http://localhost:3000 or similar
    const baseUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
    const url = `${baseUrl}/api/v1/comparison`;

    const response = await fetch(url, {
      method: 'POST',
      headers: getCommonHeaders(),
      body: JSON.stringify({
        racketIds,
        userProfile,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || 'Error al comparar palas');
    }

    return response.json();
  },

  saveComparison: async (
    racketIds: number[],
    comparison: ComparisonResult
  ): Promise<SavedComparison> => {
    const baseUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
    const url = `${baseUrl}/api/v1/comparison/save`;

    const response = await fetch(url, {
      method: 'POST',
      headers: getCommonHeaders(),
      body: JSON.stringify({
        racketIds,
        comparisonText: JSON.stringify(comparison),
        metrics: comparison.metrics,
      }),
    });

    const responseText = await response.text();
    const responseJson = JSON.parse(responseText);

    if (!response.ok) {
      throw new Error(responseJson.error || responseJson.message || 'Error al guardar la comparación');
    }

    return responseJson.data;
  },

  getUserComparisons: async (): Promise<SavedComparison[]> => {
    const baseUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
    const url = `${baseUrl}/api/v1/comparison/user`;

    const response = await fetch(url, {
      method: 'GET',
      headers: getCommonHeaders(),
    });

    const responseText = await response.text();
    const responseJson = JSON.parse(responseText);

    if (!response.ok) {
      const errorData = responseJson;
      throw new Error(errorData.error || errorData.message || 'Error al obtener las comparaciones');
    }

    return responseJson.data;
  },

  getComparisonById: async (id: string): Promise<SavedComparison> => {
    const baseUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
    const url = `${baseUrl}/api/v1/comparison/${id}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: getCommonHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || 'Error al obtener la comparación');
    }

    const result = await response.json();
    return result.data;
  },

  deleteComparison: async (id: string): Promise<void> => {
    const baseUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
    const url = `${baseUrl}/api/v1/comparison/${id}`;

    const response = await fetch(url, {
      method: 'DELETE',
      headers: getCommonHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || 'Error al eliminar la comparación');
    }
  },

  getComparisonCount: async (): Promise<number> => {
    const baseUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
    const url = `${baseUrl}/api/v1/comparison/user/count`;

    const response = await fetch(url, {
      method: 'GET',
      headers: getCommonHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || errorData.message || 'Error al obtener el contador de comparaciones'
      );
    }

    const result: ComparisonCountResponse = await response.json();
    return result.data.count;
  },

  shareComparison: async (id: string): Promise<string> => {
    const baseUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
    const url = `${baseUrl}/api/v1/comparison/${id}/share`;

    const response = await fetch(url, {
      method: 'POST',
      headers: getCommonHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || 'Error al compartir la comparación');
    }

    const result = await response.json();
    return result.data.shareToken;
  },

  unshareComparison: async (id: string): Promise<void> => {
    const baseUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
    const url = `${baseUrl}/api/v1/comparison/${id}/unshare`;

    const response = await fetch(url, {
      method: 'POST',
      headers: getCommonHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || errorData.message || 'Error al dejar de compartir la comparación'
      );
    }
  },

  getSharedComparison: async (token: string): Promise<SavedComparison> => {
    const baseUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
    const url = `${baseUrl}/api/v1/comparison/shared/${token}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || errorData.message || 'Error al obtener la comparación compartida'
      );
    }

    const result = await response.json();
    return result.data;
  },
};
