import { Response } from "express";
import { RequestWithUser, ApiResponse } from "../types";
import logger from "../config/logger";
import { supabase } from "../config/supabase";
import { storeService } from "../services/storeService";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

async function getTableCount(tableName: string): Promise<number> {
  const { count } = await supabase
    .from(tableName)
    .select("*", { count: "exact", head: true });
  return count || 0;
}

async function getActiveUsersCount(): Promise<number> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { count } = await supabase
    .from("user_profiles")
    .select("*", { count: "exact", head: true })
    .gte("updated_at", thirtyDaysAgo.toISOString());

  return count || 0;
}

async function getVerifiedStoresCount(): Promise<number> {
  const { count } = await supabase
    .from("stores")
    .select("*", { count: "exact", head: true })
    .eq("verified", true);

  return count || 0;
}

async function getPendingStoresCount(): Promise<number> {
  const { count } = await supabase
    .from("stores")
    .select("*", { count: "exact", head: true })
    .eq("verified", false);

  return count || 0;
}

async function getFavoritesCount(): Promise<number> {
  const { data: favoritesLists } = await supabase
    .from("lists")
    .select("id")
    .eq("name", "Favoritas");

  if (!favoritesLists || favoritesLists.length === 0) {
    return 0;
  }

  const listIds = favoritesLists.map(list => list.id);
  
  const { count } = await supabase
    .from("list_rackets")
    .select("*", { count: "exact", head: true })
    .in("list_id", listIds);

  return count || 0;
}

async function collectMetricsData() {
  const [
    totalUsers,
    totalRackets,
    totalReviews,
    activeUsers,
    totalStores,
    pendingRequests,
    totalFavorites
  ] = await Promise.all([
    getTableCount("user_profiles"),
    getTableCount("rackets"),
    getTableCount("reviews"),
    getActiveUsersCount(),
    getVerifiedStoresCount(),
    getPendingStoresCount(),
    getFavoritesCount()
  ]);

  return {
    totalUsers: totalUsers || 0,
    totalRackets: totalRackets || 0,
    totalStores: totalStores || 0,
    totalReviews: totalReviews || 0,
    pendingRequests: pendingRequests || 0,
    activeUsers: activeUsers || 0,
    totalFavorites: totalFavorites || 0,
    usersChange: 12.5,
    racketsChange: 8.3,
  };
}

export class AdminController {
  static async getMetrics(req: RequestWithUser, res: Response): Promise<void> {
    try {
      const metrics = await collectMetricsData();
      res.json({
        success: true,
        data: metrics,
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    } catch (error: unknown) {
      logger.error("Error in getMetrics:", error);
      res.status(500).json({
        success: false,
        error: "Error del servidor",
        message: getErrorMessage(error),
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }
  }

  static async getAllUsers(req: RequestWithUser, res: Response): Promise<void> {
    try {
      const { data: users, error } = await supabase
        .from("user_profiles")
        .select("id, email, nickname, full_name, role, created_at")
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      res.json({
        success: true,
        data: users || [],
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    } catch (error: unknown) {
      logger.error("Error in getAllUsers:", error);
      res.status(500).json({
        success: false,
        error: "Error del servidor",
        message: getErrorMessage(error),
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }
  }

  static async updateUserRole(
    req: RequestWithUser,
    res: Response
  ): Promise<void> {
    try {
      const { userId } = req.params;
      const { role } = req.body;

      if (!role || !["admin", "player"].includes(role.toLowerCase())) {
        res.status(400).json({
          success: false,
          error: "Rol inválido",
          message: "El rol debe ser 'admin' o 'player'",
          timestamp: new Date().toISOString(),
        } as ApiResponse);
        return;
      }

      const { data: updatedUser, error } = await supabase
        .from("user_profiles")
        .update({ role: role.toLowerCase() })
        .eq("id", userId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      res.json({
        success: true,
        data: updatedUser,
        message: "Rol actualizado correctamente",
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    } catch (error: unknown) {
      logger.error("Error in updateUserRole:", error);
      res.status(500).json({
        success: false,
        error: "Error del servidor",
        message: getErrorMessage(error),
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }
  }

  static async deleteUser(req: RequestWithUser, res: Response): Promise<void> {
    try {
      const { userId } = req.params;

      if (userId === req.user?.id) {
        res.status(400).json({
          success: false,
          error: "Operación no permitida",
          message: "No puedes eliminar tu propia cuenta",
          timestamp: new Date().toISOString(),
        } as ApiResponse);
        return;
      }

      const { error } = await supabase
        .from("user_profiles")
        .delete()
        .eq("id", userId);

      if (error) {
        throw error;
      }

      res.json({
        success: true,
        message: "Usuario eliminado correctamente",
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    } catch (error: unknown) {
      logger.error("Error in deleteUser:", error);
      res.status(500).json({
        success: false,
        error: "Error del servidor",
        message: getErrorMessage(error),
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }
  }

  static async getRacketRequests(
    req: RequestWithUser,
    res: Response
  ): Promise<void> {
    try {
      res.json({
        success: true,
        data: [],
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    } catch (error: unknown) {
      logger.error("Error in getRacketRequests:", error);
      res.status(500).json({
        success: false,
        error: "Error del servidor",
        message: getErrorMessage(error),
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }
  }

  static async getStoreRequests(
    req: RequestWithUser,
    res: Response
  ): Promise<void> {
    try {
      const pendingStores = await storeService.getAllStores(false);
      
      res.json({
        success: true,
        data: pendingStores,
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    } catch (error: unknown) {
      logger.error("Error in getStoreRequests:", error);
      res.status(500).json({
        success: false,
        error: "Error del servidor",
        message: getErrorMessage(error),
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }
  }

  static async verifyStore(
    req: RequestWithUser,
    res: Response
  ): Promise<void> {
    try {
      const { id } = req.params;
      
      const store = await storeService.verifyStore(id);
      
      res.json({
        success: true,
        data: store,
        message: "Tienda verificada exitosamente",
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    } catch (error: unknown) {
      logger.error("Error in verifyStore:", error);
      res.status(500).json({
        success: false,
        error: "Error del servidor",
        message: getErrorMessage(error),
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }
  }

  static async rejectStore(
    req: RequestWithUser,
    res: Response
  ): Promise<void> {
    try {
      const { id } = req.params;
      
      await storeService.rejectStore(id);
      
      res.json({
        success: true,
        message: "Solicitud de tienda rechazada",
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    } catch (error: unknown) {
      logger.error("Error in rejectStore:", error);
      res.status(500).json({
        success: false,
        error: "Error del servidor",
        message: getErrorMessage(error),
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }
  }

  static async getRecentActivity(
    req: RequestWithUser,
    res: Response
  ): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 10;

      const { data: recentUsers } = await supabase
        .from("user_profiles")
        .select("id, full_name, nickname, email, created_at")
        .order("created_at", { ascending: false })
        .limit(5);

      const { data: recentRackets } = await supabase
        .from("rackets")
        .select("id, nombre, marca, created_at")
        .order("created_at", { ascending: false })
        .limit(5);

      const { data: recentReviews } = await supabase
        .from("reviews")
        .select(`
          id, 
          rating, 
          created_at,
          user_profiles!inner(full_name, nickname),
          rackets!inner(nombre)
        `)
        .order("created_at", { ascending: false })
        .limit(5);

      const { data: recentStores } = await supabase
        .from("stores")
        .select("id, store_name, verified, created_at")
        .order("created_at", { ascending: false })
        .limit(5);

      const activities: any[] = [];

      recentUsers?.forEach((user) => {
        activities.push({
          id: `user-${user.id}`,
          type: "user",
          title: `Nuevo usuario: ${user.full_name || user.nickname || user.email}`,
          time: user.created_at,
          icon: "user",
        });
      });

      recentRackets?.forEach((racket) => {
        activities.push({
          id: `racket-${racket.id}`,
          type: "racket",
          title: `Nueva pala: ${racket.marca} ${racket.nombre}`,
          time: racket.created_at,
          icon: "package",
        });
      });

      recentReviews?.forEach((review: any) => {
        const userName = review.user_profiles?.full_name || review.user_profiles?.nickname || "Usuario";
        const racketName = review.rackets?.nombre || "Pala";
        activities.push({
          id: `review-${review.id}`,
          type: "review",
          title: `${userName} valoró ${racketName} con ${review.rating} estrellas`,
          time: review.created_at,
          icon: "star",
        });
      });

      recentStores?.forEach((store) => {
        const status = store.verified ? "verificada" : "pendiente de verificación";
        activities.push({
          id: `store-${store.id}`,
          type: "store",
          title: `Tienda ${store.store_name} - ${status}`,
          time: store.created_at,
          icon: "shopping-bag",
        });
      });

      activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      const limitedActivities = activities.slice(0, limit);

      res.json({
        success: true,
        data: limitedActivities,
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    } catch (error: unknown) {
      logger.error("Error in getRecentActivity:", error);
      res.status(500).json({
        success: false,
        error: "Error del servidor",
        message: getErrorMessage(error),
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }
  }

  static async getBrands(
    req: RequestWithUser,
    res: Response
  ): Promise<void> {
    try {
      logger.info("Fetching brands from database...");
      const { data: rackets, error } = await supabase
        .from("rackets")
        .select("brand, characteristics_brand");

      if (error) {
        logger.error("Error fetching rackets for brands:", error);
        throw error;
      }

      logger.info(`Found ${rackets?.length || 0} rackets`);

      const brandMap = new Map<string, number>();
      rackets?.forEach(racket => {
        const brand = racket.brand || racket.characteristics_brand;
        if (brand) {
          brandMap.set(brand, (brandMap.get(brand) || 0) + 1);
        }
      });

      const brands = Array.from(brandMap.entries())
        .map(([name, racketCount]) => ({
          name,
          racketCount,
          country: "España"
        }))
        .sort((a, b) => b.racketCount - a.racketCount);

      res.json({
        success: true,
        data: brands,
        message: `${brands.length} marcas encontradas`,
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    } catch (error: unknown) {
      logger.error("Error in getBrands:", error);
      res.status(500).json({
        success: false,
        error: "Error del servidor",
        message: getErrorMessage(error),
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }
  }

  static async getCategories(
    req: RequestWithUser,
    res: Response
  ): Promise<void> {
    try {
      logger.info("Fetching categories from database...");
      const { data: rackets, error } = await supabase
        .from("rackets")
        .select("characteristics_shape");

      if (error) {
        logger.error("Error fetching rackets for categories:", error);
        throw error;
      }

      logger.info(`Found ${rackets?.length || 0} rackets`);

      const formaMap = new Map<string, number>();
      rackets?.forEach(racket => {
        const forma = racket.characteristics_shape;
        if (forma) {
          formaMap.set(forma, (formaMap.get(forma) || 0) + 1);
        }
      });

      const formaDescriptions: Record<string, string> = {
        "Redonda": "Forma clásica, mayor control",
        "Diamante": "Forma de diamante, mayor potencia y balance alto",
        "Lágrima": "Forma de gota, balance entre potencia y control",
        "Ovalada": "Forma ovalada, control optimizado",
        "Híbrida": "Forma híbrida, combinación de características",
      };

      const categories = Array.from(formaMap.entries())
        .map(([name, racketCount]) => ({
          name,
          description: formaDescriptions[name] || "Forma de pala de pádel",
          racketCount,
        }))
        .sort((a, b) => b.racketCount - a.racketCount);

      res.json({
        success: true,
        data: categories,
        message: `${categories.length} categorías encontradas`,
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    } catch (error: unknown) {
      logger.error("Error in getCategories:", error);
      res.status(500).json({
        success: false,
        error: "Error del servidor",
        message: getErrorMessage(error),
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }
  }
}
