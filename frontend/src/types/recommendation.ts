export interface BasicFormData {
  level: string;
  frequency: string;
  injuries: string;
  budget: string;
  current_racket?: string;
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
}

export interface RacketRecommendation {
  id: number;
  name: string;
  match_score: number;
  reason: string;
  image?: string | null;
  brand?: string | null;
  price?: number | null;
}

export interface RecommendationResult {
  rackets: RacketRecommendation[];
  analysis: string;
}

export interface Recommendation {
  id: string;
  user_id: string;
  form_type: 'basic' | 'advanced';
  form_data: BasicFormData | AdvancedFormData;
  recommendation_result: RecommendationResult;
  created_at: string;
}
