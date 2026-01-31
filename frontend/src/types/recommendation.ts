export interface BasicFormData {
  level: string;
  frequency: string;
  injuries: string;
  budget: { min: number; max: number };
  current_racket?: string;

  // Strategic fields (Perfil Biomecánico)
  gender?: 'masculino' | 'femenino';
  physical_condition?: 'asiduo' | 'ocasional';

  // Strategic fields (Preferencias)
  touch_preference?: 'duro' | 'medio' | 'blando';
  aesthetic_preference?: {
    color?: string;
    style?: 'minimalista' | 'llamativo';
  };
}

export interface AdvancedFormData extends BasicFormData {
  style: string;
  years_playing: string;
  position: string;
  best_shot: string;
  weakest_shot: string;
  weight_preference: string;
  balance_preference: string;
  shape_preference: string;
  likes_current_racket?: string;
  dislikes_current_racket?: string;
  goals: string[];

  // Strategic field (Ponderación de Características)
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

export interface RacketRecommendation {
  id: number;
  name: string;
  match_score: number;
  reason: string;
  image?: string | null;
  brand?: string | null;
  price?: number | null;

  // Strategic additions
  testea_metrics?: TesteaMetrics;
  biomechanical_safety?: BiomechanicalSafety;
  community_data?: CommunityData;
  match_details?: {
    priority_alignment: string;
    biomechanical_fit: string;
    preference_match: string;
  };
}

export interface RecommendationResult {
  rackets: RacketRecommendation[];
  analysis: string;
  process_summary?: {
    total_catalog: number;
    discarded_biomechanical: number;
    safe_evaluated: number;
    main_criterion: string;
  };
  transparency_note?: string;
}

export interface Recommendation {
  id: string;
  user_id: string;
  form_type: 'basic' | 'advanced';
  form_data: BasicFormData | AdvancedFormData;
  recommendation_result: RecommendationResult;
  created_at: string;
}
