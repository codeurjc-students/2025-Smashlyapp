// Interfaces for racket technical characteristics
export interface RacketCharacteristics {
  // Characteristics from database
  brand?: string;
  color?: string;
  color_2?: string;
  product?: string;
  balance?: string;
  core?: string;
  face?: string;
  format?: string;
  hardness?: string;
  game_level?: string;
  finish?: string;
  shape?: string;
  surface?: string;
  game_type?: string;
  player_collection?: string;
  player?: string;
}

// Interface for technical specifications (JSONB)
export interface RacketSpecifications {
  [key: string]: string | number | boolean | null | undefined;
}

// Interface for store price information
export interface StorePrice {
  current_price?: number | null;
  original_price?: number | null;
  discount_percentage?: number | null;
  link?: string | null;
}

// Main interface for rackets that matches the database structure
export interface Racket {
  id?: number;
  name: string;
  brand?: string | null;
  model?: string | null;
  image?: string | null;
  on_offer: boolean;
  description?: string | null;

  // Individual characteristics (matching current DB schema)
  characteristics_brand?: string | null;
  characteristics_color?: string | null;
  characteristics_color_2?: string | null;
  characteristics_product?: string;
  characteristics_balance?: string | null;
  characteristics_core?: string | null;
  characteristics_face?: string | null;
  characteristics_format?: string;
  characteristics_hardness?: string | null;
  characteristics_game_level?: string | null;
  characteristics_finish?: string | null;
  characteristics_shape?: string | null;
  characteristics_surface?: string | null;
  characteristics_game_type?: string | null;
  characteristics_player_collection?: string | null;
  characteristics_player?: string | null;

  // Specifications in JSONB format (matching current DB schema)
  specs?: RacketSpecifications;

  // Prices by store (matching current DB schema with actual_price, original_price, etc.)
  padelnuestro_actual_price?: number | null;
  padelnuestro_original_price?: number | null;
  padelnuestro_discount_percentage?: number | null;
  padelnuestro_link?: string | null;

  padelmarket_actual_price?: number | null;
  padelmarket_original_price?: number | null;
  padelmarket_discount_percentage?: number | null;
  padelmarket_link?: string | null;

  padelpoint_actual_price?: number | null;
  padelpoint_original_price?: number | null;
  padelpoint_discount_percentage?: number | null;
  padelpoint_link?: string | null;

  padelproshop_actual_price?: number | null;
  padelproshop_original_price?: number | null;
  padelproshop_discount_percentage?: number | null;
  padelproshop_link?: string | null;

  created_at?: string;
  updated_at?: string;

  // Computed fields for compatibility with existing code
  current_price?: number;
  original_price?: number | null;
  discount_percentage?: number;
  link?: string;
  source?: string;
}

// Types for basic user forms
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

// Specific types for racket filters and search

export interface SearchFilters {
  brand?: string;
  shape?: string;
  balance?: string;
  game_level?: string;
  min_price?: number;
  max_price?: number;
  on_offer?: boolean;
  is_bestseller?: boolean;
}

export interface SortOptions {
  field: string;
  order: "asc" | "desc";
}
