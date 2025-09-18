// Interfaces para las características técnicas de las palas
export interface RacketCharacteristics {
  // Características desde la base de datos
  marca?: string;
  color?: string;
  color_2?: string;
  producto?: string;
  balance?: string;
  nucleo?: string;
  cara?: string;
  formato?: string;
  dureza?: string;
  nivel_de_juego?: string;
  acabado?: string;
  forma?: string;
  superficie?: string;
  tipo_de_juego?: string;
  coleccion_jugadores?: string;
  jugador?: string;
}

// Interfaz para especificaciones técnicas (JSONB)
export interface RacketSpecifications {
  [key: string]: any;
}

// Interfaz para la información de precios por tienda
export interface StorePrice {
  precio_actual?: number | null;
  precio_original?: number | null;
  descuento_porcentaje?: number | null;
  enlace?: string | null;
}

// Interfaz principal para las palas que coincide con la estructura de la base de datos
export interface Racket {
  id?: number;
  nombre: string;
  marca?: string | null;
  modelo?: string | null;
  imagen?: string | null;
  es_bestseller: boolean;
  en_oferta: boolean;
  scrapeado_en?: string;
  descripcion?: string | null;

  // Características individuales
  caracteristicas_marca?: string | null;
  caracteristicas_color?: string | null;
  caracteristicas_color_2?: string | null;
  caracteristicas_producto?: string;
  caracteristicas_balance?: string | null;
  caracteristicas_nucleo?: string | null;
  caracteristicas_cara?: string | null;
  caracteristicas_formato?: string;
  caracteristicas_dureza?: string | null;
  caracteristicas_nivel_de_juego?: string | null;
  caracteristicas_acabado?: string | null;
  caracteristicas_forma?: string | null;
  caracteristicas_superficie?: string | null;
  caracteristicas_tipo_de_juego?: string | null;
  caracteristicas_coleccion_jugadores?: string | null;
  caracteristicas_jugador?: string | null;

  // Especificaciones en formato JSONB
  especificaciones?: RacketSpecifications;

  // Precios por tienda
  padelnuestro_precio_actual?: number | null;
  padelnuestro_precio_original?: number | null;
  padelnuestro_descuento_porcentaje?: number | null;
  padelnuestro_enlace?: string | null;

  padelmarket_precio_actual?: number | null;
  padelmarket_precio_original?: number | null;
  padelmarket_descuento_porcentaje?: number | null;
  padelmarket_enlace?: string | null;

  padelpoint_precio_actual?: number | null;
  padelpoint_precio_original?: number | null;
  padelpoint_descuento_porcentaje?: number | null;
  padelpoint_enlace?: string | null;

  padelproshop_precio_actual?: number | null;
  padelproshop_precio_original?: number | null;
  padelproshop_descuento_porcentaje?: number | null;
  padelproshop_enlace?: string | null;

  created_at?: string;
  updated_at?: string;

  // Campos computados para compatibilidad con el código existente
  precio_actual?: number;
  precio_original?: number | null;
  descuento_porcentaje?: number;
  enlace?: string;
  fuente?: string;
}

// Tipos para formularios de usuario básicos
export interface UserFormData {
  // Información personal básica
  weight: string;
  height: string;
  age?: string;
  gameLevel?: string;
  playingStyle?: string;
  experience?: string;
  preferences?: string;
}

// Tipos específicos para filtros y búsqueda de palas

export interface SearchFilters {
  marca?: string;
  forma?: string;
  balance?: string;
  nivel_de_juego?: string;
  precio_min?: number;
  precio_max?: number;
  en_oferta?: boolean;
  es_bestseller?: boolean;
}

export interface SortOptions {
  field: string;
  order: "asc" | "desc";
}
