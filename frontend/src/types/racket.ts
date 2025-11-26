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

// Interfaz para specs adicionales
export interface RacketSpecs {
  tecnologias?: string[];
  peso?: string;
  marco?: string;
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
  marca: string;
  modelo: string;
  imagen: string;
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

  // Specs adicionales (tecnologías, etc.)
  specs?: RacketSpecs;

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
  
  // View count (popularidad)
  view_count?: number;
  
  // Campos computados para compatibilidad con el código existente
  precio_actual: number;
  precio_original: number;
  descuento_porcentaje: number;
  enlace: string;
  fuente?: string;
}

// Tipos para formularios y recomendaciones AI
export interface FormData {
  // Formulario básico
  gameLevel: string;
  playingStyle: string;
  weight: string;
  height: string;
  budget: string;
  preferredShape?: string;
  experience?: string;
  frequency?: string;
  goals?: string;

  // Formulario avanzado
  age?: string;
  gender?: string;
  physicalCondition?: string;
  injuries?: string;
  position?: string;
  mostUsedShot?: string;
  playingSurface?: string;
  preferredWeight?: string;
  preferredBalance?: string;
  frameMaterial?: string;
  faceMaterial?: string;
  rubberType?: string;
  durabilityVsPerformance?: string;
  favoriteBrand?: string;
  availability?: string;
  colorPreference?: string;
}

export interface RacketRecommendation {
  racketName: string;
  brand: string;
  model: string;
  price: string;
  imageUrl?: string;
  whyThisRacket: string;
  technicalSpecs: {
    weight?: string;
    balance?: string;
    shape?: string;
    material?: string;
    level?: string;
  };
  pros: string[];
  cons: string[];
  matchPercentage: number;
}

export interface MultipleRacketRecommendations {
  recommendations: RacketRecommendation[];
  summary?: string;
}

export interface RacketComparison {
  generalAnalysis: string;
  racketAnalysis: {
    name: string;
    keyAttributes: string;
    recommendedFor: string;
    whyThisRacket: string;
    pros: string[];
    cons: string[];
    verdict: string;
  }[];
  finalRecommendation: {
    bestOverall: string;
    bestValue: string;
    bestForBeginners?: string;
    bestForAdvanced?: string;
    reasoning: string;
  };
}
