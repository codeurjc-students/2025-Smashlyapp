import { supabase } from "../config/supabase";
import logger from "../config/logger";

export interface RacketView {
  id: string;
  user_id: string;
  racket_id: number;
  viewed_at: string;
}

export interface RecentlyViewedRacket {
  id: number;
  nombre: string;
  marca: string;
  imagen?: string;
  precio_actual?: number;
  viewed_at: string;
}

export class RacketViewService {
  /**
   * Registra que un usuario ha visto una pala
   * Si ya existe un registro, actualiza la fecha de visualización
   */
  static async recordView(userId: string, racketId: number): Promise<void> {
    try {
      // Primero verificar si ya existe un registro
      const { data: existing } = await supabase
        .from("racket_views")
        .select("id")
        .eq("user_id", userId)
        .eq("racket_id", racketId)
        .single();

      if (existing) {
        // Actualizar la fecha de visualización
        const { error: updateError } = await supabase
          .from("racket_views")
          .update({ viewed_at: new Date().toISOString() })
          .eq("id", existing.id);

        if (updateError) {
          throw updateError;
        }
      } else {
        // Crear un nuevo registro
        const { error: insertError } = await supabase
          .from("racket_views")
          .insert({
            user_id: userId,
            racket_id: racketId,
            viewed_at: new Date().toISOString(),
          });

        if (insertError) {
          throw insertError;
        }
      }

      logger.info(`Recorded view for user ${userId} on racket ${racketId}`);
    } catch (error) {
      logger.error("Error recording racket view:", error);
      throw error;
    }
  }

  /**
   * Obtiene las palas vistas recientemente por un usuario
   */
  static async getRecentlyViewed(
    userId: string,
    limit: number = 10
  ): Promise<RecentlyViewedRacket[]> {
    try {
      const { data, error } = await supabase
        .from("racket_views")
        .select(
          `
          racket_id,
          viewed_at,
          rackets (
            id,
            name,
            brand,
            images,
            padelmarket_actual_price,
            padelnuestro_actual_price,
            padelproshop_actual_price
          )
        `
        )
        .eq("user_id", userId)
        .order("viewed_at", { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      // Transformar los datos al formato esperado
      const recentlyViewed: RecentlyViewedRacket[] = (data || [])
        .filter((item: any) => item.rackets) // Filtrar items sin pala (por si fue eliminada)
        .map((item: any) => {
          // Obtener el precio más bajo disponible
          const prices = [
            item.rackets.padelmarket_actual_price,
            item.rackets.padelnuestro_actual_price,
            item.rackets.padelproshop_actual_price,
          ].filter((p) => p !== null && p !== undefined);
          
          const precio_actual = prices.length > 0 ? Math.min(...prices) : undefined;

          return {
            id: item.rackets.id,
            nombre: item.rackets.name,
            marca: item.rackets.brand,
            imagenes: typeof item.rackets.images === 'string' ? JSON.parse(item.rackets.images) : (item.rackets.images || []),
            precio_actual,
            viewed_at: item.viewed_at,
          };
        });

      return recentlyViewed;
    } catch (error) {
      logger.error("Error fetching recently viewed rackets:", error);
      throw error;
    }
  }

  /**
   * Elimina un registro de visualización
   */
  static async removeView(userId: string, racketId: number): Promise<void> {
    try {
      const { error } = await supabase
        .from("racket_views")
        .delete()
        .eq("user_id", userId)
        .eq("racket_id", racketId);

      if (error) {
        throw error;
      }

      logger.info(`Removed view for user ${userId} on racket ${racketId}`);
    } catch (error) {
      logger.error("Error removing racket view:", error);
      throw error;
    }
  }

  /**
   * Limpia el historial de visualizaciones de un usuario
   */
  static async clearHistory(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from("racket_views")
        .delete()
        .eq("user_id", userId);

      if (error) {
        throw error;
      }

      logger.info(`Cleared view history for user ${userId}`);
    } catch (error) {
      logger.error("Error clearing view history:", error);
      throw error;
    }
  }

  /**
   * Obtiene el conteo de visualizaciones de una pala
   */
  static async getViewCount(racketId: number): Promise<number> {
    try {
      const { count, error } = await supabase
        .from("racket_views")
        .select("*", { count: "exact", head: true })
        .eq("racket_id", racketId);

      if (error) {
        throw error;
      }

      return count || 0;
    } catch (error) {
      logger.error("Error getting view count:", error);
      throw error;
    }
  }
}
