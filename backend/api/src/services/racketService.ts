import { supabase } from '../config/supabase';
import { Racket, SearchFilters, SortOptions, PaginatedResponse } from '../types';
import logger from '../config/logger';

function normalizeSpecKey(key: string): string {
  return key
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function mapSpecsForFrontend(rawSpecs: any): Record<string, any> {
  if (typeof rawSpecs === 'string') {
    try {
      rawSpecs = JSON.parse(rawSpecs);
    } catch {
      return {};
    }
  }

  if (!rawSpecs || typeof rawSpecs !== 'object' || Array.isArray(rawSpecs)) {
    return {};
  }

  const mapped: Record<string, any> = {};
  const source = rawSpecs as Record<string, any>;

  for (const [rawKey, value] of Object.entries(source)) {
    const key = normalizeSpecKey(rawKey);
    if (value == null || value === '') continue;

    if (key === 'forma' || key === 'shape' || key === 'formato' || key === 'format') {
      mapped.forma = value;
      continue;
    }
    if (key === 'balance' || key === 'balanceo') {
      mapped.balance = value;
      continue;
    }
    if (key === 'peso' || key === 'weight') {
      mapped.peso = value;
      continue;
    }
    if (key === 'nucleo' || key === 'core' || key === 'goma') {
      mapped.nucleo = value;
      continue;
    }
    if (key === 'cara' || key === 'face') {
      mapped.cara = value;
      continue;
    }
    if (key === 'nivel' || key === 'nivel de juego' || key === 'game level') {
      mapped.nivel_de_juego = value;
      continue;
    }

    // Preserve extra specs, normalized, for secondary UIs.
    mapped[key.replace(/\s+/g, '_')] = value;
  }

  return mapped;
}

/**
 * Helper function to calculate the best price among available stores
 */
function createStoreData(racket: Racket) {
  return [
    {
      name: 'padelnuestro',
      current_price: racket.padelnuestro_actual_price,
      original_price: racket.padelnuestro_original_price,
      discount_percentage: racket.padelnuestro_discount_percentage,
      link: racket.padelnuestro_link,
    },
    {
      name: 'padelmarket',
      current_price: racket.padelmarket_actual_price,
      original_price: racket.padelmarket_original_price,
      discount_percentage: racket.padelmarket_discount_percentage,
      link: racket.padelmarket_link,
    },
    {
      name: 'padelproshop',
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
    enlace: '',
    fuente: 'No price available',
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
    store => store.current_price != null && store.current_price > 0
  );

  if (validStores.length === 0) {
    return {
      precio_actual: 0,
      precio_original: null,
      descuento_porcentaje: 0,
      enlace: '',
      fuente: (racket as any).comparison_only ? 'Solo comparación' : 'No disponible',
    };
  }

  const bestStore = validStores.reduce((best, current) =>
    (current.current_price || 0) < (best.current_price || Infinity) ? current : best
  );

  return {
    precio_actual: bestStore.current_price || 0,
    precio_original: bestStore.original_price ?? null,
    descuento_porcentaje: bestStore.discount_percentage || 0,
    enlace: bestStore.link || '',
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
  const normalizedSpecs = mapSpecsForFrontend(racket.specs);

  // Función robusta para procesar imágenes que pueden estar mal formadas o anidadas
  const parseImages = (imgs: any): string[] => {
    if (!imgs) return [];
    
    // Si es un string, intentamos parsear como JSON
    if (typeof imgs === 'string') {
      try {
        const parsed = JSON.parse(imgs);
        return parseImages(parsed);
      } catch {
        // Si no es JSON válido pero empieza por http, es una URL directa
        return imgs.startsWith('http') ? [imgs.trim()] : [];
      }
    }
    
    // Si es un array, procesamos cada elemento recursivamente
    if (Array.isArray(imgs)) {
      return imgs.flatMap(img => parseImages(img));
    }
    
    return [];
  };

  // Procesar imágenes de la columna principal
  let finalImages = parseImages(racket.images);
  
  // Si no hay imágenes en la columna principal, buscar en specs
  if (finalImages.length === 0 && normalizedSpecs) {
    const specImages = Object.entries(normalizedSpecs)
      .filter(([key]) => key.toLowerCase().includes('image') || key.toLowerCase().includes('foto'))
      .map(([_, value]) => value)
      .filter(v => typeof v === 'string' && v.startsWith('http'));
    
    finalImages = [...specImages];
  }

  // Limpiar y deduplicar
  finalImages = [...new Set(finalImages)]
    .map(img => typeof img === 'string' ? img.trim() : '')
    .filter(img => img.startsWith('http'))
    .filter(img => !img.includes('placeholder'));

  return {
    id: racket.id,
    nombre: racket.name,
    marca: racket.brand,
    modelo: racket.model,
    imagenes: finalImages,
    es_bestseller: false, // This field doesn't exist in current DB
    en_oferta: racket.on_offer,
    scrapeado_en: racket.created_at,
    descripcion: racket.description,

    // Características individuales con fallback a specs
    caracteristicas_marca: racket.characteristics_brand || normalizedSpecs.marca || racket.brand,
    caracteristicas_color: racket.characteristics_color || normalizedSpecs.color,
    caracteristicas_color_2: racket.characteristics_color_2,
    caracteristicas_producto: racket.characteristics_product || normalizedSpecs.producto || 'Palas',
    caracteristicas_balance: racket.characteristics_balance || normalizedSpecs.balance,
    caracteristicas_nucleo: racket.characteristics_core || normalizedSpecs.nucleo,
    caracteristicas_cara: racket.characteristics_face || normalizedSpecs.cara,
    caracteristicas_formato: racket.characteristics_format || normalizedSpecs.formato || normalizedSpecs.forma,
    caracteristicas_dureza: racket.characteristics_hardness || normalizedSpecs.dureza,
    caracteristicas_nivel_de_juego: racket.characteristics_game_level || normalizedSpecs.nivel_de_juego,
    caracteristicas_acabado: racket.characteristics_finish || normalizedSpecs.acabado || normalizedSpecs.rugosidad,
    caracteristicas_forma: racket.characteristics_shape || normalizedSpecs.forma || normalizedSpecs.formato,
    caracteristicas_superficie: racket.characteristics_surface || normalizedSpecs.superficie,
    caracteristicas_tipo_de_juego: racket.characteristics_game_type || normalizedSpecs.tipo_de_juego,
    caracteristicas_coleccion_jugadores: racket.characteristics_player_collection,
    caracteristicas_jugador: racket.characteristics_player || normalizedSpecs.jugador,

    // Especificaciones
    especificaciones: normalizedSpecs,

    // Precios por tienda (asegurar mapeo correcto de nombres de columna)
    padelnuestro_precio_actual: racket.padelnuestro_actual_price ?? racket.padelnuestro_precio_actual,
    padelnuestro_precio_original: racket.padelnuestro_original_price ?? racket.padelnuestro_precio_original,
    padelnuestro_descuento_porcentaje: racket.padelnuestro_discount_percentage ?? racket.padelnuestro_descuento_porcentaje,
    padelnuestro_enlace: racket.padelnuestro_link ?? racket.padelnuestro_enlace,

    padelmarket_precio_actual: racket.padelmarket_actual_price ?? racket.padelmarket_precio_actual,
    padelmarket_precio_original: racket.padelmarket_original_price ?? racket.padelmarket_precio_original,
    padelmarket_descuento_porcentaje: racket.padelmarket_discount_percentage ?? racket.padelmarket_descuento_porcentaje,
    padelmarket_enlace: racket.padelmarket_link ?? racket.padelmarket_enlace,

    padelproshop_precio_actual: racket.padelproshop_actual_price ?? racket.padelproshop_actual_price,
    padelproshop_precio_original: racket.padelproshop_original_price ?? racket.padelproshop_original_price,
    padelproshop_descuento_porcentaje: racket.padelproshop_discount_percentage ?? racket.padelproshop_discount_percentage,
    padelproshop_enlace: racket.padelproshop_link ?? racket.padelproshop_link,

    created_at: racket.created_at,
    updated_at: racket.updated_at,

    // View count
    view_count: racket.view_count || 0,

    // Campos computados (ya en español)
    precio_actual: racket.precio_actual,
    precio_original: racket.precio_original,
    descuento_porcentaje: racket.descuento_porcentaje,
    enlace: racket.enlace,
    fuente: racket.fuente,

    // Radar Metrics
    radar_potencia: racket.radar_potencia,
    radar_control: racket.radar_control,
    radar_manejabilidad: racket.radar_manejabilidad,
    radar_punto_dulce: racket.radar_punto_dulce,
    radar_salida_bola: racket.radar_salida_bola,

    // Availability status mapping
    solo_comparacion: racket.comparison_only ?? false,
    comparison_only: racket.comparison_only ?? false,
  };
}

/**
 * Maps frontend fields (Spanish) back to database fields (English)
 */
export function mapToBackendFormat(frontendRacket: any): any {
  const backendData: any = {};

  // Basic fields
  if (frontendRacket.nombre !== undefined) backendData.name = frontendRacket.nombre;
  if (frontendRacket.marca !== undefined) backendData.brand = frontendRacket.marca;
  if (frontendRacket.modelo !== undefined) backendData.model = frontendRacket.modelo;
  if (frontendRacket.imagenes !== undefined)
    backendData.images = JSON.stringify(frontendRacket.imagenes);
  if (frontendRacket.en_oferta !== undefined) backendData.on_offer = frontendRacket.en_oferta;
  if (frontendRacket.descripcion !== undefined)
    backendData.description = frontendRacket.descripcion;

  // Characteristics
  if (frontendRacket.caracteristicas_marca !== undefined)
    backendData.characteristics_brand = frontendRacket.caracteristicas_marca;
  if (frontendRacket.caracteristicas_color !== undefined)
    backendData.characteristics_color = frontendRacket.caracteristicas_color;
  if (frontendRacket.caracteristicas_color_2 !== undefined)
    backendData.characteristics_color_2 = frontendRacket.caracteristicas_color_2;
  if (frontendRacket.caracteristicas_producto !== undefined)
    backendData.characteristics_product = frontendRacket.caracteristicas_producto;
  if (frontendRacket.caracteristicas_balance !== undefined)
    backendData.characteristics_balance = frontendRacket.caracteristicas_balance;
  if (frontendRacket.caracteristicas_nucleo !== undefined)
    backendData.characteristics_core = frontendRacket.caracteristicas_nucleo;
  if (frontendRacket.caracteristicas_cara !== undefined)
    backendData.characteristics_face = frontendRacket.caracteristicas_face;
  if (frontendRacket.caracteristicas_formato !== undefined)
    backendData.characteristics_format = frontendRacket.caracteristicas_formato;
  if (frontendRacket.caracteristicas_dureza !== undefined)
    backendData.characteristics_hardness = frontendRacket.caracteristicas_dureza;
  if (frontendRacket.caracteristicas_nivel_de_juego !== undefined)
    backendData.characteristics_game_level = frontendRacket.caracteristicas_nivel_de_juego;
  if (frontendRacket.caracteristicas_acabado !== undefined)
    backendData.characteristics_finish = frontendRacket.caracteristicas_acabado;
  if (frontendRacket.caracteristicas_forma !== undefined)
    backendData.characteristics_shape = frontendRacket.caracteristicas_forma;
  if (frontendRacket.caracteristicas_superficie !== undefined)
    backendData.characteristics_surface = frontendRacket.caracteristicas_superficie;
  if (frontendRacket.caracteristicas_tipo_de_juego !== undefined)
    backendData.characteristics_game_type = frontendRacket.caracteristicas_tipo_de_juego;
  if (frontendRacket.caracteristicas_coleccion_jugadores !== undefined)
    backendData.characteristics_player_collection =
      frontendRacket.caracteristicas_coleccion_jugadores;
  if (frontendRacket.caracteristicas_jugador !== undefined)
    backendData.characteristics_player = frontendRacket.caracteristicas_jugador;

  // Specs JSONB
  if (frontendRacket.especificaciones !== undefined)
    backendData.specs = frontendRacket.especificaciones;

  // Store Prices - PadelNuestro
  if (frontendRacket.padelnuestro_precio_actual !== undefined)
    backendData.padelnuestro_actual_price = frontendRacket.padelnuestro_precio_actual;
  if (frontendRacket.padelnuestro_precio_original !== undefined)
    backendData.padelnuestro_original_price = frontendRacket.padelnuestro_precio_original;
  if (frontendRacket.padelnuestro_descuento_porcentaje !== undefined)
    backendData.padelnuestro_discount_percentage = frontendRacket.padelnuestro_descuento_porcentaje;
  if (frontendRacket.padelnuestro_enlace !== undefined)
    backendData.padelnuestro_link = frontendRacket.padelnuestro_enlace;

  // Store Prices - PadelMarket
  if (frontendRacket.padelmarket_precio_actual !== undefined)
    backendData.padelmarket_actual_price = frontendRacket.padelmarket_precio_actual;
  if (frontendRacket.padelmarket_precio_original !== undefined)
    backendData.padelmarket_original_price = frontendRacket.padelmarket_precio_original;
  if (frontendRacket.padelmarket_descuento_porcentaje !== undefined)
    backendData.padelmarket_discount_percentage = frontendRacket.padelmarket_descuento_porcentaje;
  if (frontendRacket.padelmarket_enlace !== undefined)
    backendData.padelmarket_link = frontendRacket.padelmarket_enlace;

  // Store Prices - PadelProShop
  if (frontendRacket.padelproshop_precio_actual !== undefined)
    backendData.padelproshop_actual_price = frontendRacket.padelproshop_precio_actual;
  if (frontendRacket.padelproshop_precio_original !== undefined)
    backendData.padelproshop_original_price = frontendRacket.padelproshop_precio_original;
  if (frontendRacket.padelproshop_descuento_porcentaje !== undefined)
    backendData.padelproshop_discount_percentage = frontendRacket.padelproshop_descuento_porcentaje;
  if (frontendRacket.padelproshop_enlace !== undefined)
    backendData.padelproshop_link = frontendRacket.padelproshop_enlace;

  // Radar Metrics
  if (frontendRacket.radar_potencia !== undefined)
    backendData.radar_potencia = frontendRacket.radar_potencia;
  if (frontendRacket.radar_control !== undefined)
    backendData.radar_control = frontendRacket.radar_control;
  if (frontendRacket.radar_manejabilidad !== undefined)
    backendData.radar_manejabilidad = frontendRacket.radar_manejabilidad;
  if (frontendRacket.radar_punto_dulce !== undefined)
    backendData.radar_punto_dulce = frontendRacket.radar_punto_dulce;
  if (frontendRacket.radar_salida_bola !== undefined)
    backendData.radar_salida_bola = frontendRacket.radar_salida_bola;

  // Availability status mapping
  if (frontendRacket.solo_comparacion !== undefined)
    backendData.comparison_only = frontendRacket.solo_comparacion;
  if (frontendRacket.comparison_only !== undefined)
    backendData.comparison_only = frontendRacket.comparison_only;

  return backendData;
}

async function fetchRemainingRackets(initialData: any[], count: number): Promise<any[]> {
  const allData = [...initialData];
  let currentOffset = initialData.length;
  const pageSize = 1000;

  while (currentOffset < count) {
    const { data: moreData, error: moreError } = await supabase
      .from('rackets')
      .select('*')
      .range(currentOffset, currentOffset + pageSize - 1)
      .order('created_at', { ascending: false });

    if (moreError) {
      logger.error('Error fetching additional rackets:', moreError);
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
   * Obtiene todas las palas de la base de datos ordenadas por popularidad (vistas)
   */
  static async getAllRackets(): Promise<Racket[]> {
    try {
      // First, get view counts for all rackets
      const { data: viewCounts, error: viewError } = await supabase
        .from('racket_views')
        .select('racket_id')
        .order('racket_id');

      if (viewError) {
        logger.warn('Error fetching view counts, continuing without them:', viewError);
      }

      // Count views per racket
      const viewCountMap = new Map<number, number>();
      if (viewCounts) {
        viewCounts.forEach((view: any) => {
          const count = viewCountMap.get(view.racket_id) || 0;
          viewCountMap.set(view.racket_id, count + 1);
        });
      }

      const { data, error, count } = await supabase
        .from('rackets')
        .select('*', { count: 'exact' })
        .range(0, 9999)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching rackets from Supabase:', error);
        throw new Error(`Error al cargar las palas desde Supabase: ${error.message}`);
      }

      logger.info(
        `Successfully loaded ${
          data?.length || 0
        } rackets from Supabase (total in DB: ${count || 0})`
      );

      // If there are more records than we got, use pagination
      let allData = data || [];
      if (count && data && count > data.length) {
        logger.info(`Fetching remaining ${count - data.length} rackets...`);
        allData = await fetchRemainingRackets(data, count);
        logger.info(`Final count: ${allData.length} rackets loaded`);
      }

      // Add view counts to each racket
      const dataWithViews = allData.map((racket: any) => ({
        ...racket,
        view_count: viewCountMap.get(racket.id) || 0,
      }));

      // Sort by view count (most viewed first)
      dataWithViews.sort((a, b) => (b.view_count || 0) - (a.view_count || 0));

      const processedData = processRacketData(dataWithViews);
      return processedData.map(mapToFrontendFormat);
    } catch (error: unknown) {
      logger.error('Failed to connect to Supabase:', error);
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
      .from('rackets')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      logger.error('Error fetching rackets with pagination:', error);
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
    const { data, error } = await supabase.from('rackets').select('*').eq('id', id).single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No encontrado
      }
      logger.error('Error fetching racket by ID:', error);
      throw new Error(`Error al cargar la pala: ${error.message}`);
    }

    const processedData = processRacketData([data]);
    return mapToFrontendFormat(processedData[0]);
  }

  /**
   * Actualiza una pala existente
   */
  static async updateRacket(id: number, updates: Partial<Racket>): Promise<Racket> {
    const backendUpdates = mapToBackendFormat(updates);

    // Add updated_at timestamp
    backendUpdates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('rackets')
      .update(backendUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error(`Error updating racket ${id}:`, error);
      throw new Error(`Error al actualizar la pala: ${error.message}`);
    }

    const processedData = processRacketData([data]);
    return mapToFrontendFormat(processedData[0]);
  }

  /**
   * Elimina una pala por su ID
   */
  static async deleteRacket(id: number): Promise<void> {
    const { error } = await supabase.from('rackets').delete().eq('id', id);

    if (error) {
      logger.error(`Error deleting racket ${id}:`, error);
      throw new Error(`Error al eliminar la pala: ${error.message}`);
    }
  }

  /**
   * Obtiene varias palas por sus IDs
   */
  static async getRacketsByIds(ids: number[]): Promise<Racket[]> {
    const { data, error } = await supabase.from('rackets').select('*').in('id', ids);

    if (error) {
      logger.error('Error fetching rackets by IDs:', error);
      throw new Error(`Error al cargar las palas: ${error.message}`);
    }

    const processedData = processRacketData(data || []);
    return processedData.map(mapToFrontendFormat);
  }

  /**
   * Busca palas por nombre
   */
  static async searchRackets(query: string): Promise<Racket[]> {
    const { data, error } = await supabase
      .from('rackets')
      .select('*')
      .or(`name.ilike.%${query}%, brand.ilike.%${query}%, model.ilike.%${query}%`)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      logger.error('Error searching rackets:', error);
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
      query = query.eq('brand', filters.brand);
    }

    if (filters.shape) {
      query = query.eq('characteristics_shape', filters.shape);
    }

    if (filters.balance) {
      query = query.eq('characteristics_balance', filters.balance);
    }

    if (filters.game_level) {
      query = query.eq('characteristics_game_level', filters.game_level);
    }

    if (filters.on_offer !== undefined) {
      query = query.eq('on_offer', filters.on_offer);
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
      return query.order(sort.field, { ascending: sort.order === 'asc' });
    }
    return query.order('created_at', { ascending: false });
  }

  /**
   * Applies price filters after processing
   */
  private static applyPriceFilters(data: Racket[], filters: SearchFilters): Racket[] {
    if (filters.min_price === undefined && filters.max_price === undefined) {
      return data;
    }

    return data.filter(racket => {
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
  private static applyPagination(
    data: Racket[],
    page: number,
    limit: number
  ): PaginatedResponse<Racket> {
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
    let query = supabase.from('rackets').select('*', { count: 'exact' });

    // Aplicar filtros de base de datos
    query = this.applyDatabaseFilters(query, filters);

    // Debug: Log de filtros aplicados
    logger.info('Filtros aplicados en Supabase:', filters);

    // Aplicar ordenamiento
    query = this.applySorting(query, sort);

    const { data, error } = await query;

    if (error) {
      logger.error('Error fetching filtered rackets:', error);
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
      .from('rackets')
      .select('*')
      .eq('brand', brand)
      .order('created_at', { ascending: false })
      .limit(1000);

    if (error) {
      logger.error('Error fetching rackets by brand:', error);
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
      .from('rackets')
      .select('*')
      .eq('on_offer', true)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      logger.error('Error fetching rackets on sale:', error);
      throw new Error(`Error loading rackets on sale: ${error.message}`);
    }

    const processedData = processRacketData(data || []);
    return processedData.map(mapToFrontendFormat);
  }

  /**
   * Gets all available brands
   */
  static async getBrands(): Promise<string[]> {
    const { data, error } = await supabase.from('rackets').select('brand').not('brand', 'is', null);

    if (error) {
      logger.error('Error fetching brands:', error);
      throw new Error(`Error loading brands: ${error.message}`);
    }

    const brands = Array.from(new Set(data?.map(item => item.brand).filter(Boolean))) as string[];
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
    const [totalResult, onSaleResult, brandsResult] = await Promise.all([
      supabase.from('rackets').select('id', { count: 'exact', head: true }),
      supabase.from('rackets').select('id', { count: 'exact', head: true }).eq('on_offer', true),
      supabase.from('rackets').select('brand'),
    ]);

    const uniqueBrands = Array.from(
      new Set(brandsResult.data?.map(item => item.brand).filter(Boolean) || [])
    );

    return {
      total: totalResult.count || 0,
      bestsellers: 0, // is_bestseller field doesn't exist in current DB schema
      onSale: onSaleResult.count || 0,
      brands: uniqueBrands.length,
    };
  }

  /**
   * Realiza una actualización masiva de un campo para todas las palas que coincidan con un valor.
   * Maneja tanto columnas planas como el campo JSONB 'specs' para asegurar consistencia.
   */
  static async bulkUpdateRackets(field: string, oldValue: any, newValue: any): Promise<number> {
    try {
      // 1. Obtener todas las palas
      const { data: allRackets, error: fetchError } = await supabase
        .from('rackets')
        .select('id, name, brand, characteristics_shape, characteristics_game_level, specs');

      if (fetchError) {
        throw new Error(`Error al obtener palas para actualización: ${fetchError.message}`);
      }

      if (!allRackets || allRackets.length === 0) return 0;

      // 2. Identificar qué palas coinciden con el filtro
      const matchingRackets = allRackets.filter((racket: any) => {
        const normalized = mapToFrontendFormat(racket);
        // El campo 'field' que llega ya está en formato backend para el frontend (ej: 'caracteristicas_forma')
        return normalized[field] === oldValue;
      });

      if (matchingRackets.length === 0) {
        logger.info(`No se encontraron palas con ${field} = "${oldValue}" para actualizar.`);
        return 0;
      }

      logger.info(`Iniciando actualización masiva de ${matchingRackets.length} palas...`);

      // 3. Determinar qué campo plano y qué claves de specs actualizar
      const backendUpdatesForNewValue = mapToBackendFormat({ [field]: newValue });
      const flatFieldName = Object.keys(backendUpdatesForNewValue)[0];
      
      const specKeysToUpdate: string[] = [];
      if (field === 'caracteristicas_forma') {
        specKeysToUpdate.push('forma', 'shape', 'formato', 'format');
      } else if (field === 'caracteristicas_nivel_de_juego') {
        specKeysToUpdate.push('nivel', 'nivel de juego', 'game level');
      } else if (field === 'marca') {
        specKeysToUpdate.push('marca', 'brand');
      }

      // 4. Actualizar cada pala (en lotes pequeños para no saturar Supabase)
      let updatedCount = 0;
      const batchSize = 25;

      for (let i = 0; i < matchingRackets.length; i += batchSize) {
        const batch = matchingRackets.slice(i, i + batchSize);
        
        await Promise.all(batch.map(async (racket) => {
          const currentSpecs = typeof racket.specs === 'string' ? JSON.parse(racket.specs) : (racket.specs || {});
          const updatedSpecs = { ...currentSpecs };
          
          // Actualizar todas las posibles claves en specs que coincidan con oldValue
          Object.keys(updatedSpecs).forEach(key => {
            const normalizedKey = normalizeSpecKey(key);
            if (specKeysToUpdate.includes(normalizedKey)) {
              if (updatedSpecs[key] === oldValue) {
                updatedSpecs[key] = newValue;
              }
            }
          });

          const updatePayload: any = {
            [flatFieldName]: newValue,
            specs: updatedSpecs,
            updated_at: new Date().toISOString()
          };

          const { error: updateError } = await supabase
            .from('rackets')
            .update(updatePayload)
            .eq('id', racket.id);

          if (updateError) {
            logger.error(`Error actualizando pala ${racket.id}:`, updateError);
          } else {
            updatedCount++;
          }
        }));
      }

      logger.info(`Actualización masiva completada: ${updatedCount} palas actualizadas.`);
      return updatedCount;
    } catch (error: unknown) {
      logger.error('Error in bulkUpdateRackets:', error);
      throw error;
    }
  }
}
