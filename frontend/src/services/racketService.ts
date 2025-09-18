import { supabase } from "../config/supabase";
import { Racket } from "../types/racket";

/**
 * Función auxiliar para calcular el mejor precio entre las tiendas disponibles
 */
function calculateBestPrice(racket: any): {
  precio_actual: number;
  precio_original: number | null;
  descuento_porcentaje: number;
  enlace: string;
  fuente: string;
} {
  const stores = [
    {
      name: "padelnuestro",
      precio_actual: racket.padelnuestro_precio_actual,
      precio_original: racket.padelnuestro_precio_original,
      descuento_porcentaje: racket.padelnuestro_descuento_porcentaje,
      enlace: racket.padelnuestro_enlace,
    },
    {
      name: "padelmarket",
      precio_actual: racket.padelmarket_precio_actual,
      precio_original: racket.padelmarket_precio_original,
      descuento_porcentaje: racket.padelmarket_descuento_porcentaje,
      enlace: racket.padelmarket_enlace,
    },
    {
      name: "padelpoint",
      precio_actual: racket.padelpoint_precio_actual,
      precio_original: racket.padelpoint_precio_original,
      descuento_porcentaje: racket.padelpoint_descuento_porcentaje,
      enlace: racket.padelpoint_enlace,
    },
    {
      name: "padelproshop",
      precio_actual: racket.padelproshop_precio_actual,
      precio_original: racket.padelproshop_precio_original,
      descuento_porcentaje: racket.padelproshop_descuento_porcentaje,
      enlace: racket.padelproshop_enlace,
    },
  ];

  // Filtrar tiendas con precios válidos
  const validStores = stores.filter(store => 
    store.precio_actual != null && store.precio_actual > 0
  );

  if (validStores.length === 0) {
    return {
      precio_actual: 0,
      precio_original: null,
      descuento_porcentaje: 0,
      enlace: "",
      fuente: "Sin precio disponible",
    };
  }

  // Encontrar la tienda con el mejor precio
  const bestStore = validStores.reduce((best, current) => 
    (current.precio_actual || 0) < (best.precio_actual || Infinity) ? current : best
  );

  return {
    precio_actual: bestStore.precio_actual || 0,
    precio_original: bestStore.precio_original,
    descuento_porcentaje: bestStore.descuento_porcentaje || 0,
    enlace: bestStore.enlace || "",
    fuente: bestStore.name,
  };
}

/**
 * Función auxiliar para procesar los datos de la base de datos y agregar campos computados
 */
function processRacketData(rawData: any[]): Racket[] {
  return rawData.map(item => {
    const bestPrice = calculateBestPrice(item);
    
    return {
      ...item,
      ...bestPrice,
      scrapeado_en: item.scrapeado_en || new Date().toISOString(),
    };
  });
}

export class RacketService {
  /**
   * Obtiene todas las palas de la base de datos
   */
  static async getAllRackets(): Promise<Racket[]> {
    try {
      // Primero, intentar obtener todos los registros con un rango amplio
      let { data, error, count } = await supabase
        .from("rackets")
        .select("*", { count: "exact" })
        .range(0, 9999)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching rackets from Supabase:", error);
        throw new Error(
          `Error al cargar las palas desde Supabase: ${error.message}`
        );
      }

      console.log(
        `Successfully loaded ${data?.length || 0} rackets from Supabase (total in DB: ${count || 0})`
      );

      // Si hay más registros de los que obtuvimos, usar paginación
      if (count && data && count > data.length) {
        console.log(`Fetching remaining ${count - data.length} rackets...`);
        
        const allData = [...data];
        let currentOffset = data.length;
        const pageSize = 1000;
        
        while (currentOffset < count) {
          const { data: moreData, error: moreError } = await supabase
            .from("rackets")
            .select("*")
            .range(currentOffset, currentOffset + pageSize - 1)
            .order("created_at", { ascending: false });
            
          if (moreError) {
            console.error("Error fetching additional rackets:", moreError);
            break;
          }
          
          if (moreData && moreData.length > 0) {
            allData.push(...moreData);
            currentOffset += moreData.length;
          } else {
            break;
          }
        }
        
        console.log(`Final count: ${allData.length} rackets loaded`);
        return processRacketData(allData);
      }

      return processRacketData(data || []);
    } catch (error: any) {
      console.error("Failed to connect to Supabase:", error);
      throw error;
    }
  }

  /**
   * Obtiene palas con paginación
   */
  static async getRacketsWithPagination(
    page: number = 0,
    limit: number = 50
  ): Promise<Racket[]> {
    const from = page * limit;
    const to = from + limit - 1;

    const { data, error } = await supabase
      .from("rackets")
      .select("*")
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("Error fetching rackets with pagination:", error);
      throw new Error(`Error al cargar las palas: ${error.message}`);
    }

    return processRacketData(data || []);
  }

  /**
   * Obtiene una pala por su ID
   */
  static async getRacketById(id: number): Promise<Racket | null> {
    const { data, error } = await supabase
      .from("rackets")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching racket by ID:", error);
      throw new Error(`Error al cargar la pala: ${error.message}`);
    }

    if (!data) return null;
    
    const processed = processRacketData([data]);
    return processed[0] || null;
  }

  /**
   * Obtiene una pala por su nombre (para compatibilidad con URLs existentes)
   */
  static async getRacketByName(nombre: string): Promise<Racket | null> {
    const { data, error } = await supabase
      .from("rackets")
      .select("*")
      .eq("nombre", nombre)
      .single();

    if (error) {
      console.error("Error fetching racket by name:", error);
      // No lanzamos error aquí porque podría ser que simplemente no existe
      return null;
    }

    if (!data) return null;
    
    const processed = processRacketData([data]);
    return processed[0] || null;
  }

  /**
   * Busca palas por texto en nombre, marca o modelo
   */
  static async searchRackets(query: string): Promise<Racket[]> {
    const { data, error } = await supabase
      .from("rackets")
      .select("*")
      .or(
        `nombre.ilike.%${query}%,marca.ilike.%${query}%,modelo.ilike.%${query}%`
      )
      .range(0, 9999) // Asegurar que obtenemos todos los resultados
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error searching rackets:", error);
      throw new Error(`Error al buscar palas: ${error.message}`);
    }

    return processRacketData(data || []);
  }

  /**
   * Obtiene palas por marca
   */
  static async getRacketsByBrand(marca: string): Promise<Racket[]> {
    const { data, error } = await supabase
      .from("rackets")
      .select("*")
      .eq("marca", marca)
      .range(0, 9999) // Asegurar que obtenemos todos los resultados
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching rackets by brand:", error);
      throw new Error(`Error al cargar palas por marca: ${error.message}`);
    }

    return processRacketData(data || []);
  }

  /**
   * Obtiene palas bestseller
   */
  static async getBestsellerRackets(): Promise<Racket[]> {
    const { data, error } = await supabase
      .from("rackets")
      .select("*")
      .eq("es_bestseller", true)
      .range(0, 9999) // Asegurar que obtenemos todos los resultados
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching bestseller rackets:", error);
      throw new Error(`Error al cargar palas bestseller: ${error.message}`);
    }

    return processRacketData(data || []);
  }

  /**
   * Obtiene palas en oferta
   */
  static async getRacketsOnSale(): Promise<Racket[]> {
    const { data, error } = await supabase
      .from("rackets")
      .select("*")
      .eq("en_oferta", true)
      .range(0, 9999) // Asegurar que obtenemos todos los resultados
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching rackets on sale:", error);
      throw new Error(`Error al cargar palas en oferta: ${error.message}`);
    }

    return processRacketData(data || []);
  }

  /**
   * Obtiene todas las marcas únicas
   */
  static async getUniqueBrands(): Promise<string[]> {
    const { data, error } = await supabase
      .from("rackets")
      .select("marca")
      .range(0, 9999) // Asegurar que obtenemos todas las marcas
      .order("marca");

    if (error) {
      console.error("Error fetching brands:", error);
      throw new Error(`Error al cargar marcas: ${error.message}`);
    }

    // Extraer marcas únicas y filtrar valores null
    const uniqueBrands = [...new Set(
      data?.map((item) => item.marca)
        .filter((marca): marca is string => marca != null) || []
    )];
    return uniqueBrands;
  }

  /**
   * Obtiene estadísticas básicas
   */
  static async getStats(): Promise<{
    total: number;
    bestsellers: number;
    onSale: number;
    brands: number;
  }> {
    const [totalResult, bestsellersResult, onSaleResult, brandsResult] =
      await Promise.all([
        supabase
          .from("rackets")
          .select("id", { count: "exact", head: true }),
        supabase
          .from("rackets")
          .select("id", { count: "exact", head: true })
          .eq("es_bestseller", true),
        supabase
          .from("rackets")
          .select("id", { count: "exact", head: true })
          .eq("en_oferta", true),
        supabase.from("rackets").select("marca"),
      ]);

    const uniqueBrands = [
      ...new Set(
        brandsResult.data?.map((item) => item.marca)
          .filter((marca): marca is string => marca != null) || []
      ),
    ];

    return {
      total: totalResult.count || 0,
      bestsellers: bestsellersResult.count || 0,
      onSale: onSaleResult.count || 0,
      brands: uniqueBrands.length,
    };
  }
}
