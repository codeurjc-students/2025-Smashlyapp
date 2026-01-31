export interface Recommendation {
  id: string;
  user_id?: string;
  form_type: 'basic' | 'advanced';
  form_data: BasicFormData | AdvancedFormData;
  recommendation_result: RecommendationResult;
  created_at: string;
}

// Biomechanical and preference fields for strategic recommendation
export interface BasicFormData {
  // Existing fields
  level: string;
  frequency: string;
  injuries: string;
  budget: { min: number; max: number } | number | string; // Support new range format + legacy
  current_racket?: string;

  // New strategic fields (Perfil Biomecánico)
  gender?: 'masculino' | 'femenino';
  physical_condition?: 'asiduo' | 'ocasional';

  // New strategic fields (Preferencias)
  touch_preference?: 'duro' | 'medio' | 'blando';
  aesthetic_preference?: {
    color?: string;
    style?: 'minimalista' | 'llamativo';
  };
}

export interface AdvancedFormData extends BasicFormData {
  // Existing advanced fields
  play_style: string;
  years_playing: number;
  position: string;
  best_shot: string;
  weak_shot: string;
  weight_preference: string;
  balance_preference: string;
  shape_preference: string;
  current_racket_likes: string;
  current_racket_dislikes: string;
  objectives: string[];

  // New strategic field (Ponderación de Características)
  // Array ordenado de 1 (más importante) a 5 (menos importante)
  characteristic_priorities?: Array<
    'potencia' | 'control' | 'manejabilidad' | 'salida_de_bola' | 'punto_dulce'
  >;
}

// Testea Pádel certified metrics
export interface TesteaMetrics {
  potencia: number; // 0-10
  control: number; // 0-10
  manejabilidad: number; // 0-10
  confort: number; // 0-10
  iniciacion?: number; // 0-10 (composite score for beginners)
  certificado: boolean; // True if data is from Testea Pádel lab
}

// Biomechanical safety assessment
export interface BiomechanicalSafety {
  is_safe: boolean;
  weight_appropriate: boolean;
  balance_appropriate: boolean;
  hardness_appropriate: boolean;
  has_antivibration: boolean;
  safety_notes?: string;
}

// Community and market data
export interface CommunityData {
  user_rating?: number; // 0-5 stars
  quality_price_ratio?: number; // 0-10 internal Smashly metric
  is_bestseller?: boolean;
}

export interface RecommendationResult {
  rackets: RecommendedRacket[];
  analysis: string;
  process_summary?: {
    total_catalog: number;
    discarded_biomechanical: number;
    safe_evaluated: number;
    main_criterion: string;
  };
  transparency_note?: string;
}

export interface RecommendedRacket {
  // Basic identification
  id: string;
  name: string;
  brand?: string;
  image?: string;
  price?: number;

  // Match scoring
  match_score: number;
  reason: string;

  // Strategic additions: Datos Duros (Testea Pádel)
  testea_metrics?: TesteaMetrics;

  // Strategic additions: Biomechanical safety
  biomechanical_safety?: BiomechanicalSafety;

  // Strategic additions: Community data
  community_data?: CommunityData;

  // Strategic additions: Detailed match explanation
  match_details?: {
    priority_alignment: string; // How it matches user's priorities
    biomechanical_fit: string; // Why it's safe for user's profile
    preference_match: string; // How it matches touch/aesthetic preferences
  };
}
