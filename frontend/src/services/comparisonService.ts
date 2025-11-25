import { API_URL, getCommonHeaders } from '../config/api';

export interface ComparisonResponse {
  comparison: string;
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

  saveComparison: async (racketIds: number[], comparisonText: string) => {
    console.log('Saving comparison...', { racketIds, comparisonText });
  },
};
