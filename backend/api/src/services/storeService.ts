import { supabase } from "../config/supabase";
import { PaginatedResponse } from "../types";
import type { Store } from "../types/store";

export interface CreateStoreRequest {
  store_name: string;
  legal_name: string;
  cif_nif: string;
  contact_email: string;
  phone_number: string;
  website_url?: string;
  logo_url?: string;
  short_description?: string;
  location: string;
  admin_user_id: string; // UUID del usuario propietario
}

export interface UpdateStoreRequest {
  store_name?: string;
  legal_name?: string;
  cif_nif?: string;
  contact_email?: string;
  phone_number?: string;
  website_url?: string;
  logo_url?: string;
  short_description?: string;
  location?: string;
  verified?: boolean;
}

export const storeService = {
  /**
   * Crear una nueva tienda (pending verification)
   */
  async createStore(storeData: CreateStoreRequest) {
    const { data, error } = await supabase
      .from("stores")
      .insert({
        ...storeData,
        verified: false, // Inicialmente no verificada
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  /**
   * Obtener todas las tiendas
   */
  async getAllStores(verified?: boolean) {
    let query = supabase.from("stores").select("*").order("created_at", { ascending: false });

    if (verified !== undefined) {
      query = query.eq("verified", verified);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  /**
   * Obtener tiendas con paginación
   */
  async getStoresWithPagination(
    verified: boolean | undefined,
    page: number = 0,
    limit: number = 20
  ): Promise<PaginatedResponse<Store>> {
    const from = page * limit;
    const to = from + limit - 1;

    let query = supabase
      .from("stores")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (verified !== undefined) {
      query = query.eq("verified", verified);
    }

    const { data, error, count } = await query;

    if (error) {
      throw new Error(error.message);
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    return {
      data: (data || []) as Store[],
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages - 1,
        hasPrev: page > 0,
      },
    };
  },

  /**
   * Obtener una tienda por ID
   */
  async getStoreById(storeId: string) {
    const { data, error } = await supabase
      .from("stores")
      .select("*")
      .eq("id", storeId)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  /**
   * Obtener tienda por admin_user_id
   */
  async getStoreByOwnerId(ownerId: string) {
    const { data, error } = await supabase
      .from("stores")
      .select("*")
      .eq("admin_user_id", ownerId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // No rows found
        return null;
      }
      throw new Error(error.message);
    }

    return data;
  },

  /**
   * Actualizar una tienda
   */
  async updateStore(storeId: string, updates: UpdateStoreRequest) {
    const { data, error } = await supabase
      .from("stores")
      .update(updates)
      .eq("id", storeId)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  /**
   * Verificar una tienda (solo admin)
   */
  async verifyStore(storeId: string) {
    return this.updateStore(storeId, { verified: true });
  },

  /**
   * Rechazar una tienda (solo admin)
   */
  async rejectStore(storeId: string) {
    return this.deleteStore(storeId);
  },

  /**
   * Eliminar una tienda
   */
  async deleteStore(storeId: string) {
    const { error } = await supabase.from("stores").delete().eq("id", storeId);

    if (error) {
      throw new Error(error.message);
    }

    return { success: true };
  },
};
