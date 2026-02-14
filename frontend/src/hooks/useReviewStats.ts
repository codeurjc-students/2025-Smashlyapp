/**
 * Hook para obtener estadísticas de reviews de una pala
 */

import { useState, useEffect } from 'react';
import { reviewService } from '../services/reviewService';

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

interface UseReviewStatsResult {
  stats: ReviewStats | null;
  loading: boolean;
  error: string | null;
}

/**
 * Hook para obtener las estadísticas de reviews de una pala específica
 * @param racketId - ID de la pala
 * @returns Objeto con stats, loading y error
 */
export const useReviewStats = (racketId: number | undefined): UseReviewStatsResult => {
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Si no hay racketId, no hacemos nada
    if (!racketId) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);

        // Obtenemos solo la primera página con límite 1 para obtener las stats
        // El endpoint siempre devuelve las stats completas independientemente de la paginación
        const response = await reviewService.getReviewsByRacket(racketId, {
          page: 1,
          limit: 1,
        });

        if (isMounted) {
          // Map snake_case keys from API to camelCase expected by frontend
          const apiStats = response.stats as any;
          if (apiStats) {
            setStats({
              averageRating: apiStats.averageRating ?? apiStats.average_rating ?? 0,
              totalReviews: apiStats.totalReviews ?? apiStats.total_reviews ?? 0,
              ratingDistribution: apiStats.ratingDistribution ??
                apiStats.rating_distribution ?? { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
            });
          } else {
            setStats(null);
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Error cargando estadísticas');
          // Si hay error, establecemos stats por defecto
          setStats({
            averageRating: 0,
            totalReviews: 0,
            ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchStats();

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [racketId]);

  return { stats, loading, error };
};
