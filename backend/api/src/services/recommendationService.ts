import { supabase } from '../config/supabase';
import logger from '../config/logger';
import {
  Recommendation,
  BasicFormData,
  AdvancedFormData,
  RecommendationResult,
} from '../types/recommendation';
import { RacketService } from './racketService';
import { GeminiService } from './geminiService';

export class RecommendationService {
  /**
   * Generates a recommendation based on form data
   */
  static async generateRecommendation(
    type: 'basic' | 'advanced',
    data: BasicFormData | AdvancedFormData
  ): Promise<RecommendationResult> {
    try {
      // 1. Fetch all rackets (or a filtered subset if possible)
      const allRackets = await RacketService.getAllRackets();

      // 2. Prepare prompt for Gemini
      // This is a simplified version. In a real scenario, we might want to filter first
      // or send a summarized list to the AI to avoid token limits if the catalog is huge.
      // For now, assuming the catalog fits or we send key attributes.

      const prompt = `
        Act as a Padel Racket Expert. I need you to recommend the best 3 rackets for a player with the following profile:
        
        Type: ${type}
        Profile Data: ${JSON.stringify(data, null, 2)}
        
        Available Rackets (JSON):
        ${JSON.stringify(
          allRackets.map(r => ({
            id: r.id,
            name: r.name,
            shape: r.shape,
            balance: r.balance,
            level: r.level,
            price: r.price,
          })),
          null,
          2
        )}
        
        Return a JSON object with this structure:
        {
          "rackets": [
            { "id": "racket_id", "name": "Racket Name", "match_score": 85, "reason": "Why this fits..." }
          ],
          "analysis": "General analysis of the player profile and why these rackets were chosen."
        }
      `;

      // 3. Call Gemini
      const aiResponse = await GeminiService.generateContent(prompt);

      // 4. Parse response
      // Assuming GeminiService returns a string, we need to extract JSON
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Failed to parse AI response');
      }

      const result: RecommendationResult = JSON.parse(jsonMatch[0]);
      return result;
    } catch (error: unknown) {
      logger.error('Error generating recommendation:', error);
      // Fallback or rethrow
      throw error;
    }
  }

  /**
   * Saves a recommendation for a user
   */
  static async saveRecommendation(
    userId: string,
    type: 'basic' | 'advanced',
    formData: BasicFormData | AdvancedFormData,
    result: RecommendationResult
  ): Promise<Recommendation> {
    try {
      const { data, error } = await supabase
        .from('recommendations')
        .insert({
          user_id: userId,
          form_type: type,
          form_data: formData,
          recommendation_result: result,
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Error saving recommendation: ${error.message}`);
      }

      return data;
    } catch (error: unknown) {
      logger.error('Error saving recommendation:', error);
      throw error;
    }
  }

  /**
   * Gets the latest recommendation for a user
   */
  static async getLastRecommendation(userId: string): Promise<Recommendation | null> {
    try {
      const { data, error } = await supabase
        .from('recommendations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // No rows found
        throw new Error(`Error fetching recommendation: ${error.message}`);
      }

      return data;
    } catch (error: unknown) {
      logger.error('Error fetching last recommendation:', error);
      throw error;
    }
  }
}
