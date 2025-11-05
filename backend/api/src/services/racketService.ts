import { supabase } from "../config/supabase";
import {
  Racket,
  SearchFilters,
  SortOptions,
  PaginatedResponse,
} from "../types";
import logger from "../config/logger";

/**
 * Helper function to calculate the best price among available stores
 */
function createStoreData(racket: Racket) {
  return [
    {
      name: "padelnuestro",
      current_price: racket.padelnuestro_actual_price,
      original_price: racket.padelnuestro_original_price,
      discount_percentage: racket.padelnuestro_discount_percentage,
      link: racket.padelnuestro_link,
    },
    {
      name: "padelmarket",
      current_price: racket.padelmarket_actual_price,
      original_price: racket.padelmarket_original_price,
      discount_percentage: racket.padelmarket_discount_percentage,
      link: racket.padelmarket_link,
    },
    {
      name: "padelpoint",
      current_price: racket.padelpoint_actual_price,
      original_price: racket.padelpoint_original_price,
      discount_percentage: racket.padelpoint_discount_percentage,
      link: racket.padelpoint_link,
    },
    {
      name: "padelproshop",
      current_price: racket.padelproshop_actual_price,
      original_price: racket.padelproshop_original_price,
      discount_percentage: racket.padelproshop_discount_percentage,
      link: racket.padelproshop_link,
    },
  ];
}

function getDefaultPriceResult() {
  return {
    precio_actual: 0,
    precio_original: null,
    descuento_porcentaje: 0,
    enlace: "",
    fuente: "No price available",
  };
}

export function calculateBestPrice(racket: Racket): {
  precio_actual: number;
  precio_original: number | null;
  descuento_porcentaje: number;
  enlace: string;
  fuente: string;
} {
  const stores = createStoreData(racket);
  const validStores = stores.filter(
    (store) => store.current_price != null && store.current_price > 0
  );

  if (validStores.length === 0) {
    return {
      precio_actual: 0,
      precio_original: null,
      descuento_porcentaje: 0,
      enlace: "",
      fuente: "No price available",
    };
  }

  const bestStore = validStores.reduce((best, current) =>
    (current.current_price || 0) < (best.current_price || Infinity)
      ? current
      : best
  );

  return {
    precio_actual: bestStore.current_price || 0,
    precio_original: bestStore.original_price ?? null,
    descuento_porcentaje: bestStore.discount_percentage || 0,
    enlace: bestStore.link || "",
    fuente: bestStore.name,
  };
}

/**
 * Helper function to process database data and add computed fields
 */
export function processRacketData(rawData: any[]): Racket[] {
  return rawData.map((item: any) => {
    const bestPrice = calculateBestPrice(item);

    return {
      ...item,
      ...bestPrice,
      scrapeado_en: item.scraped_at || new Date().toISOString(),
    };
  });
}

/**
 * Maps database fields (English) to frontend expected fields (Spanish)
 */
export function mapToFrontendFormat(racket: any): any {
  return {
    id: racket.id,
    nombre: racket.name,
    marca: racket.brand,
    modelo: racket.model,
    imagen: racket.image,
    es_bestseller: false, // This field doesn't exist in current DB
    en_oferta: racket.on_offer,
    scrapeado_en: racket.created_at,
    descripcion: racket.description,
    
    // Características individuales
    caracteristicas_marca: racket.characteristics_brand,
    caracteristicas_color: racket.characteristics_color,
    caracteristicas_color_2: racket.characteristics_color_2,
    caracteristicas_producto: racket.characteristics_product,
    caracteristicas_balance: racket.characteristics_balance,
    caracteristicas_nucleo: racket.characteristics_core,
    caracteristicas_cara: racket.characteristics_face,
    caracteristicas_formato: racket.characteristics_format,
    caracteristicas_dureza: racket.characteristics_hardness,
    caracteristicas_nivel_de_juego: racket.characteristics_game_level,
    caracteristicas_acabado: racket.characteristics_finish,
    caracteristicas_forma: racket.characteristics_shape,
    caracteristicas_superficie: racket.characteristics_surface,
    caracteristicas_tipo_de_juego: racket.characteristics_game_type,
    caracteristicas_coleccion_jugadores: racket.characteristics_player_collection,
    caracteristicas_jugador: racket.characteristics_player,
    
    // Especificaciones
    especificaciones: racket.specs,
    
    // Precios por tienda
    padelnuestro_precio_actual: racket.padelnuestro_actual_price,
    padelnuestro_precio_original: racket.padelnuestro_original_price,
    padelnuestro_descuento_porcentaje: racket.padelnuestro_discount_percentage,
    padelnuestro_enlace: racket.padelnuestro_link,
    
    padelmarket_precio_actual: racket.padelmarket_actual_price,
    padelmarket_precio_original: racket.padelmarket_original_price,
    padelmarket_descuento_porcentaje: racket.padelmarket_discount_percentage,
    padelmarket_enlace: racket.padelmarket_link,
    
    padelpoint_precio_actual: racket.padelpoint_actual_price,
    padelpoint_precio_original: racket.padelpoint_original_price,
    padelpoint_descuento_porcentaje: racket.padelpoint_discount_percentage,
    padelpoint_enlace: racket.padelpoint_link,
    
    padelproshop_precio_actual: racket.padelproshop_actual_price,
    padelproshop_precio_original: racket.padelproshop_original_price,
    padelproshop_descuento_porcentaje: racket.padelproshop_discount_percentage,
    padelproshop_enlace: racket.padelproshop_link,
    
    created_at: racket.created_at,
    updated_at: racket.updated_at,
    
    // Campos computados (ya en español)
    precio_actual: racket.precio_actual,
    precio_original: racket.precio_original,
    descuento_porcentaje: racket.descuento_porcentaje,
    enlace: racket.enlace,
    fuente: racket.fuente,
  };
}

async function fetchRemainingRackets(initialData: any[], count: number): Promise<any[]> {
  const allData = [...initialData];
  let currentOffset = initialData.length;
  const pageSize = 1000;

  while (currentOffset < count) {
    const { data: moreData, error: moreError } = await supabase
      .from("rackets")
      .select("*")
      .range(currentOffset, currentOffset + pageSize - 1)
      .order("created_at", { ascending: false });

    if (moreError) {
      logger.error("Error fetching additional rackets:", moreError);
      break;
    }

    if (moreData && moreData.length > 0) {
      allData.push(...moreData);
      currentOffset += moreData.length;
    } else {
      break;
    }
  }

  return allData;
}

export class RacketService {
  /**
   * Obtiene todas las palas de la base de datos
   */
  static async getAllRackets(): Promise<Racket[]> {
    try {
      const { data, error, count } = await supabase
        .from("rackets")
        .select("*", { count: "exact" })
        .range(0, 9999)
        .order("created_at", { ascending: false });

      if (error) {
        logger.error("Error fetching rackets from Supabase:", error);
        throw new Error(
          `Error al cargar las palas desde Supabase: ${error.message}`
        );
      }

      logger.info(
        `Successfully loaded ${
          data?.length || 0
        } rackets from Supabase (total in DB: ${count || 0})`
      );

      // If there are more records than we got, use pagination
      if (count && data && count > data.length) {
        logger.info(`Fetching remaining ${count - data.length} rackets...`);
        const allData = await fetchRemainingRackets(data, count);
        logger.info(`Final count: ${allData.length} rackets loaded`);
        const processedData = processRacketData(allData);
        return processedData.map(mapToFrontendFormat);
      }

      const processedData = processRacketData(data || []);
      return processedData.map(mapToFrontendFormat);
    } catch (error: unknown) {
      logger.error("Failed to connect to Supabase:", error);
      throw error;
    }
  }

  /**
   * Gets rackets with pagination
   */
  static async getRacketsWithPagination(
    page: number = 0,
    limit: number = 50
  ): Promise<PaginatedResponse<Racket>> {
    const from = page * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabase
      .from("rackets")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      logger.error("Error fetching rackets with pagination:", error);
      throw new Error(`Error al cargar las palas: ${error.message}`);
    }

    const totalPages = Math.ceil((count || 0) / limit);
    const processedData = processRacketData(data || []);

    return {
      data: processedData.map(mapToFrontendFormat),
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
        hasNext: page < totalPages - 1,
        hasPrev: page > 0,
      },
    };
  }

  /**
   * Obtiene una pala por ID
   */
  static async getRacketById(id: number): Promise<Racket | null> {
    const { data, error } = await supabase
      .from("rackets")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null; // No encontrado
      }
      logger.error("Error fetching racket by ID:", error);
      throw new Error(`Error al cargar la pala: ${error.message}`);
    }

    const processedData = processRacketData([data]);
    return mapToFrontendFormat(processedData[0]);
  }

  /**
   * Busca palas por nombre
   */
  static async searchRackets(query: string): Promise<Racket[]> {
    const { data, error } = await supabase
      .from("rackets")
      .select("*")
      .or(
        `name.ilike.%${query}%, brand.ilike.%${query}%, model.ilike.%${query}%`
      )
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      logger.error("Error searching rackets:", error);
      throw new Error(`Error al buscar palas: ${error.message}`);
    }

    const processedData = processRacketData(data || []);
    return processedData.map(mapToFrontendFormat);
  }

  /**
   * Aplica filtros de base de datos a la consulta
   */
  private static applyDatabaseFilters(query: any, filters: SearchFilters): any {
    if (filters.brand) {
      query = query.eq("brand", filters.brand);
    }

    if (filters.shape) {
      query = query.eq("characteristics_shape", filters.shape);
    }

    if (filters.balance) {
      query = query.eq("characteristics_balance", filters.balance);
    }

    if (filters.game_level) {
      query = query.eq("characteristics_game_level", filters.game_level);
    }

    if (filters.on_offer !== undefined) {
      query = query.eq("on_offer", filters.on_offer);
    }

    if (filters.is_bestseller !== undefined) {
      // Note: is_bestseller field doesn't exist in current DB schema
      // This filter will be ignored for now
    }

    return query;
  }

  /**
   * Applies sorting to the query
   */
  private static applySorting(query: any, sort?: SortOptions): any {
    if (sort) {
      return query.order(sort.field, { ascending: sort.order === "asc" });
    }
    return query.order("created_at", { ascending: false });
  }

  /**
   * Applies price filters after processing
   */
  private static applyPriceFilters(data: Racket[], filters: SearchFilters): Racket[] {
    if (filters.min_price === undefined && filters.max_price === undefined) {
      return data;
    }

    return data.filter((racket) => {
      // Use computed Spanish field if present, fallback to English field
      const price = (racket as any).precio_actual ?? racket.current_price ?? 0;
      
      if (filters.min_price !== undefined && price < filters.min_price) {
        return false;
      }

      if (filters.max_price !== undefined && price > filters.max_price) {
        return false;
      }

      return true;
    });
  }

  /**
   * Applies pagination to the data
   */
  private static applyPagination(data: Racket[], page: number, limit: number): PaginatedResponse<Racket> {
    const totalFiltered = data.length;
    const from = page * limit;
    const to = from + limit;
    const paginatedData = data.slice(from, to);
    const totalPages = Math.ceil(totalFiltered / limit);

    return {
      data: paginatedData.map(mapToFrontendFormat),
      pagination: {
        page,
        limit,
        total: totalFiltered,
        totalPages,
        hasNext: page < totalPages - 1,
        hasPrev: page > 0,
      },
    };
  }

  /**
   * Obtiene palas con filtros avanzados
   */
  static async getFilteredRackets(
    filters: SearchFilters,
    sort?: SortOptions,
    page: number = 0,
    limit: number = 50
  ): Promise<PaginatedResponse<Racket>> {
    let query = supabase.from("rackets").select("*", { count: "exact" });

    // Aplicar filtros de base de datos
    query = this.applyDatabaseFilters(query, filters);

    // Debug: Log de filtros aplicados
    logger.info("Filtros aplicados en Supabase:", filters);

    // Aplicar ordenamiento
    query = this.applySorting(query, sort);

    const { data, error } = await query;

    if (error) {
      logger.error("Error fetching filtered rackets:", error);
      throw new Error(`Error al cargar palas filtradas: ${error.message}`);
    }

    // Procesar datos
    let processedData = processRacketData(data || []);

    // Apply price filters after processing
    processedData = this.applyPriceFilters(processedData, filters);

    // Apply pagination
    return this.applyPagination(processedData, page, limit);
  }

  /**
   * Gets rackets by brand
   */
  static async getRacketsByBrand(brand: string): Promise<Racket[]> {
    const { data, error } = await supabase
      .from("rackets")
      .select("*")
      .eq("brand", brand)
      .order("created_at", { ascending: false })
      .limit(1000);

    if (error) {
      logger.error("Error fetching rackets by brand:", error);
      throw new Error(`Error loading rackets by brand: ${error.message}`);
    }

    const processedData = processRacketData(data || []);
    return processedData.map(mapToFrontendFormat);
  }

  /**
   * Gets bestseller rackets
   */
  static async getBestsellerRackets(): Promise<Racket[]> {
    // Note: is_bestseller field doesn't exist in current DB schema
    // Returning empty array for now
    return [];
  }

  /**
   * Gets rackets on sale
   */
  static async getRacketsOnSale(): Promise<Racket[]> {
    const { data, error } = await supabase
      .from("rackets")
      .select("*")
      .eq("on_offer", true)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      logger.error("Error fetching rackets on sale:", error);
      throw new Error(`Error loading rackets on sale: ${error.message}`);
    }

    const processedData = processRacketData(data || []);
    return processedData.map(mapToFrontendFormat);
  }

  /**
   * Gets all available brands
   */
  static async getBrands(): Promise<string[]> {
    const { data, error } = await supabase
      .from("rackets")
      .select("brand")
      .not("brand", "is", null);

    if (error) {
      logger.error("Error fetching brands:", error);
      throw new Error(`Error loading brands: ${error.message}`);
    }

    const brands = Array.from(
      new Set(data?.map((item) => item.brand).filter(Boolean))
    ) as string[];
    return brands.sort();
  }

  /**
   * Gets basic statistics
   */
  static async getStats(): Promise<{
    total: number;
    bestsellers: number;
    onSale: number;
    brands: number;
  }> {
    const [totalResult, onSaleResult, brandsResult] =
      await Promise.all([
        supabase.from("rackets").select("id", { count: "exact", head: true }),
        supabase
          .from("rackets")
          .select("id", { count: "exact", head: true })
          .eq("on_offer", true),
        supabase.from("rackets").select("brand"),
      ]);

    const uniqueBrands = Array.from(
      new Set(
        brandsResult.data?.map((item) => item.brand).filter(Boolean) || []
      )
    );

    return {
      total: totalResult.count || 0,
      bestsellers: 0, // is_bestseller field doesn't exist in current DB schema
      onSale: onSaleResult.count || 0,
      brands: uniqueBrands.length,
    };
  }
}
