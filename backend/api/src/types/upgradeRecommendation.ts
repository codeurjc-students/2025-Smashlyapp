import { RecommendedRacket } from './recommendation';

// The aspects a user can select for improvement
export type ImprovementAspect =
  | 'potencia'
  | 'control'
  | 'manejabilidad'
  | 'punto_dulce'
  | 'salida_de_bola'
  | 'confort'
  | 'durabilidad';

// Request body for generating upgrade recommendations
export interface UpgradeRecommendationRequest {
  improvement_aspects: ImprovementAspect[];
  budget_min?: number;
  budget_max?: number;
}

// The persisted upgrade recommendation record
export interface UserRacketUpgrade {
  id: string;
  user_id: string;
  current_racket_id: number | null;
  current_racket_name: string | null;
  improvement_aspects: ImprovementAspect[];
  budget_max: number | null;
  recommended_rackets: RecommendedRacket[];
  is_active: boolean;
  created_at: string;
}

// Current racket info for display
export interface CurrentRacketInfo {
  id: number | null;
  name: string;
  brand?: string;
  image?: string;
}

// Response from generate endpoint
export interface UpgradeRecommendationResult {
  id: string;
  current_racket: CurrentRacketInfo | null;
  improvement_aspects: ImprovementAspect[];
  budget_max: number | null;
  recommended_rackets: RecommendedRacket[];
  analysis: string;
  created_at: string;
}
