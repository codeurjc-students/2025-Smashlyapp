import { supabase } from '../config/supabase';
import logger from '../config/logger';

export interface PricePoint {
  date: string;       // ISO string
  price: number;
  store: string;
}

export interface StorePriceHistory {
  store: string;
  history: PricePoint[];
  currentPrice: number | null;
  minPrice: number | null;
  maxPrice: number | null;
}

export interface PriceHistoryResult {
  racketId: number;
  days: number;
  stores: StorePriceHistory[];
  /** Historial combinado de todas las tiendas, ordenado por fecha */
  combined: PricePoint[];
}

/**
 * Obtiene el historial de precios de una pala.
 *
 * @param racketId  ID numérico de la pala en Supabase
 * @param days      Número de días hacia atrás a consultar (default: 90)
 * @param storeFilter  Si se especifica, filtra por tienda
 */
export async function getPriceHistory(
  racketId: number,
  days: number = 90,
  storeFilter?: string
): Promise<PriceHistoryResult | null> {
  try {
    const since = new Date();
    since.setDate(since.getDate() - days);

    let query = supabase
      .from('price_history')
      .select('store, price, original_price, discount_percentage, recorded_at')
      .eq('racket_id', racketId)
      .gte('recorded_at', since.toISOString())
      .order('recorded_at', { ascending: true });

    if (storeFilter) {
      query = query.eq('store', storeFilter);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Error fetching price history:', error);
      return null;
    }

    if (!data || data.length === 0) {
      return { racketId, days, stores: [], combined: [] };
    }

    // Agrupar por tienda
    const byStore: Record<string, PricePoint[]> = {};
    for (const row of data) {
      if (!byStore[row.store]) byStore[row.store] = [];
      byStore[row.store].push({
        date:  row.recorded_at,
        price: Number(row.price),
        store: row.store,
      });
    }

    const stores: StorePriceHistory[] = Object.entries(byStore).map(([store, points]) => {
      const prices = points.map(p => p.price);
      return {
        store,
        history:      points,
        currentPrice: prices[prices.length - 1] ?? null,
        minPrice:     Math.min(...prices),
        maxPrice:     Math.max(...prices),
      };
    });

    // Historial combinado (precio más bajo del día entre todas las tiendas)
    const combined: PricePoint[] = data.map(row => ({
      date:  row.recorded_at,
      price: Number(row.price),
      store: row.store,
    }));

    return { racketId, days, stores, combined };

  } catch (err) {
    logger.error('Unexpected error in getPriceHistory:', err);
    return null;
  }
}
