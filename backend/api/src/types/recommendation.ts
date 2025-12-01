export interface Recommendation {
  id: string;
  user_id?: string;
  form_type: 'basic' | 'advanced';
  form_data: BasicFormData | AdvancedFormData;
  recommendation_result: RecommendationResult;
  created_at: string;
}

export interface BasicFormData {
  level: string;
  frequency: string;
  injuries: string;
  budget: number;
  current_racket?: string;
}

export interface AdvancedFormData extends BasicFormData {
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
}

export interface RecommendationResult {
  rackets: RecommendedRacket[];
  analysis: string;
}

export interface RecommendedRacket {
  id: string;
  name: string;
  match_score: number;
  reason: string;
}
