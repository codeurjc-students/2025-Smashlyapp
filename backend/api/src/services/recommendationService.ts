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
      // 1. Prepare prompt for Gemini - let it use its own knowledge
      const prompt = `
        Actúa como un Experto en Palas de Pádel con amplio conocimiento del mercado actual.
        
        Necesito que recomiendes las 3 mejores palas de pádel para un jugador con el siguiente perfil:
        
        Tipo de análisis: ${type}
        Perfil del jugador:
        ${JSON.stringify(data, null, 2)}
        
        INSTRUCCIONES:
        - Recomienda 3 palas de pádel reales que existan actualmente en el mercado
        - Usa tu conocimiento sobre palas de marcas como: Bullpadel, Nox, Head, Adidas, Babolat, Wilson, Dunlop, etc.
        - Para cada pala, proporciona el nombre COMPLETO y EXACTO (marca + modelo)
        - Asegúrate de que sean palas que realmente existen en 2024-2025
        
        Devuelve un objeto JSON con esta estructura EXACTA:
        {
          "rackets": [
            {
              "name": "Nombre completo de la pala (ej: Bullpadel Vertex 03)",
              "match_score": 95,
              "reason": "Explicación detallada en español de por qué esta pala es perfecta para este jugador"
            },
            {
              "name": "Nombre completo de la pala",
              "match_score": 88,
              "reason": "Explicación detallada en español"
            },
            {
              "name": "Nombre completo de la pala",
              "match_score": 82,
              "reason": "Explicación detallada en español"
            }
          ],
          "analysis": "Análisis general en español del perfil del jugador y por qué se eligieron estas palas específicas"
        }
        
        IMPORTANTE:
        - Responde ÚNICAMENTE en español
        - Usa nombres de palas reales y completos (marca + modelo)
        - Ordena las palas de mayor a menor match_score
        - Las razones deben ser específicas y detalladas
      `;

      // 2. Call Gemini
      const aiResponse = await GeminiService.generateContent(prompt);

      // 3. Parse response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Failed to parse AI response');
      }

      const aiResult = JSON.parse(jsonMatch[0]);

      // 4. Fetch all rackets from database for matching
      const allRackets = await RacketService.getAllRackets();

      // 5. Match AI recommendations to database rackets using fuzzy matching
      const enrichedRackets = await Promise.all(
        aiResult.rackets.map(async (rec: any) => {
          const normalizedRecName = rec.name.toLowerCase().trim();
          
          // Try exact name match
          let racket = allRackets.find(r => 
            r.name?.toLowerCase().trim() === normalizedRecName
          );
          
          // If not found, try partial match (racket name contains AI suggestion or vice versa)
          if (!racket) {
            racket = allRackets.find(r => {
              const racketName = r.name?.toLowerCase().trim() || '';
              return racketName.includes(normalizedRecName) || 
                     normalizedRecName.includes(racketName);
            });
          }
          
          // If still not found, try matching by brand and model separately
          if (!racket && rec.name.includes(' ')) {
            const parts = rec.name.split(' ');
            const possibleBrand = parts[0].toLowerCase();
            const possibleModel = parts.slice(1).join(' ').toLowerCase();
            
            racket = allRackets.find(r => {
              const racketBrand = r.brand?.toLowerCase() || '';
              const racketName = r.name?.toLowerCase() || '';
              const racketModel = r.model?.toLowerCase() || '';
              
              return (racketBrand.includes(possibleBrand) || racketName.includes(possibleBrand)) && 
                     (racketName.includes(possibleModel) || racketModel.includes(possibleModel));
            });
          }
          
          // Try even more fuzzy matching - check if key words match
          if (!racket) {
            const keywords = normalizedRecName.split(' ').filter((w: string) => w.length > 3);
            racket = allRackets.find(r => {
              const racketName = r.name?.toLowerCase() || '';
              return keywords.some((keyword: string) => racketName.includes(keyword)) &&
                     keywords.filter((keyword: string) => racketName.includes(keyword)).length >= 2;
            });
          }
          
          if (racket) {
            logger.info(`✓ Matched AI recommendation "${rec.name}" to DB racket "${racket.name}" (ID: ${racket.id})`);
            return {
              id: racket.id,
              name: racket.name,
              match_score: rec.match_score,
              reason: rec.reason,
              image: racket.image,
              brand: racket.brand,
              price: racket.current_price,
            };
          } else {
            logger.warn(`✗ Could not match AI recommendation "${rec.name}" to any racket in database`);
            return {
              id: 0,
              name: rec.name,
              match_score: rec.match_score,
              reason: rec.reason,
              image: null,
              brand: null,
              price: null,
            };
          }
        })
      );

      const result: RecommendationResult = {
        rackets: enrichedRackets,
        analysis: aiResult.analysis,
      };

      return result;
    } catch (error: unknown) {
      logger.error('Error generating recommendation:', error);
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
