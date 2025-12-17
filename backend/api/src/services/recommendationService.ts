import { supabase } from '../config/supabase';
import logger from '../config/logger';
import {
  Recommendation,
  BasicFormData,
  AdvancedFormData,
  RecommendationResult,
} from '../types/recommendation';
import { RacketService } from './racketService';
import { OpenRouterService } from './openRouterService';
import { CacheService } from './cacheService';
import { RacketFilterService } from './racketFilterService';

export class RecommendationService {
  /**
   * Generates a recommendation based on form data
   */
  static async generateRecommendation(
    type: 'basic' | 'advanced',
    data: BasicFormData | AdvancedFormData
  ): Promise<RecommendationResult> {
    const startTime = Date.now();
    
    try {
      // 1. Check cache first
      const cacheHash = CacheService.generateProfileHash(data);
      const cachedResult = CacheService.get(cacheHash);
      
      if (cachedResult) {
        const elapsed = Date.now() - startTime;
        logger.info(`⚡ Returned cached recommendation in ${elapsed}ms`);
        return cachedResult;
      }
      
      // 2. Fetch all rackets from database to build catalog
      let allRackets = await RacketService.getAllRackets();
      logger.info(`📊 Loaded ${allRackets.length} rackets from database`);

      // 3. Apply smart filtering to reduce rackets sent to Gemini
      const filteredRackets = RacketFilterService.filterRackets(allRackets, data);
      
      if (filteredRackets.length === 0) {
        throw new Error('No rackets match your criteria. Please adjust your filters.');
      }

      // 4. Build ultra-concise catalog summary for Gemini (optimized format)
      const catalogSummary = filteredRackets
        .map((r: any) => {
          const nivel = r.caracteristicas_nivel_de_juego || 'N/A';
          const forma = r.caracteristicas_forma || 'N/A';
          const balance = r.caracteristicas_balance || 'N/A';
          const precio = r.precio_actual ? `€${r.precio_actual}` : 'N/A';
          
          return `${r.id}|${r.marca} ${r.nombre}|${nivel}|${forma}|${balance}|${precio}`;
        })
        .join('\n');

      // 5. Prepare optimized prompt with strict JSON structure
      const essentialProfile = {
        nivel: data.level,
        presupuesto: data.budget,
        lesiones: data.injuries,
        frecuencia: data.frequency,
        ...('play_style' in data && {
          estilo: data.play_style,
          posicion: data.position,
        }),
      };

      const prompt = `Eres un experto en pádel. Tu tarea es recomendar exactamente 3 palas del catálogo proporcionado.

PERFIL DEL USUARIO:
${JSON.stringify(essentialProfile, null, 2)}

CATÁLOGO DE PALAS DISPONIBLES (${filteredRackets.length} pre-filtradas):
ID | Marca Modelo | Nivel | Forma | Balance | Precio
${catalogSummary}

INSTRUCCIONES ESTRICTAS:
1. Selecciona EXACTAMENTE 3 palas del catálogo anterior
2. Usa SOLO los IDs que aparecen en el catálogo
3. Ordena por match_score descendente (100 = perfecto, 0 = inadecuado)
4. La razón debe ser concisa (máximo 40 palabras) y específica
5. El análisis general debe ser breve (máximo 100 palabras) y útil

FORMATO DE RESPUESTA OBLIGATORIO:
Responde ÚNICAMENTE con un objeto JSON válido, sin markdown, sin explicaciones adicionales.

Estructura exacta:
{
  "rackets": [
    {
      "id": <número del catálogo>,
      "match_score": <0-100>,
      "reason": "<explicación concisa de por qué es adecuada>"
    }
  ],
  "analysis": "<análisis general breve del perfil y las recomendaciones>"
}

RESPONDE SOLO CON EL JSON:`;

      // 6. Call OpenRouter with optimized prompt
      logger.info(`🤖 Sending ${filteredRackets.length} pre-filtered rackets to OpenRouter`);
      const aiResponse = await OpenRouterService.generateContent(prompt);

      // 7. Parse response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        logger.error('❌ Failed to parse AI response - no JSON found');
        throw new Error('Failed to parse AI response');
      }

      const aiResult = JSON.parse(jsonMatch[0]);
      logger.info(`🤖 OpenRouter recommended ${aiResult.rackets?.length || 0} rackets`);

      // Log the IDs that OpenRouter recommended
      const recommendedIds = aiResult.rackets?.map((r: any) => r.id) || [];
      logger.info(`📋 Recommended IDs: ${recommendedIds.join(', ')}`);

      // 8. Match AI recommendations to database rackets by ID
      const enrichedRackets = aiResult.rackets
        .map((rec: any) => {
          const racket: any = filteredRackets.find((r: any) => r.id === rec.id);

          if (racket) {
            logger.info(`✓ Matched AI recommendation ID ${rec.id} to racket "${racket.nombre}"`);
            return {
              id: racket.id,
              name: racket.nombre,
              match_score: rec.match_score,
              reason: rec.reason,
              image: racket.imagen,
              brand: racket.marca,
              price: racket.precio_actual,
            };
          } else {
            logger.warn(
              `✗ Could not find racket with ID ${rec.id} in database - AI ignored instructions!`
            );
            return null;
          }
        })
        .filter((r: any) => r !== null); // Remove any null entries

      // 9. Ensure we have at least some recommendations
      if (enrichedRackets.length === 0) {
        logger.error('❌ No valid recommendations - AI did not follow catalog restrictions');
        throw new Error(
          'No valid recommendations could be generated from the catalog. Please try again.'
        );
      }

      if (enrichedRackets.length < aiResult.rackets.length) {
        logger.warn(
          `⚠️  Only ${enrichedRackets.length} out of ${aiResult.rackets.length} recommendations were valid`
        );
      }

      const result: RecommendationResult = {
        rackets: enrichedRackets,
        analysis: aiResult.analysis,
      };
      
      // 10. Cache the result
      CacheService.set(cacheHash, result);
      
      const elapsed = Date.now() - startTime;
      logger.info(`✅ Generated recommendation in ${elapsed}ms`);

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

  /**
   * Clear recommendation cache (call when catalog is updated)
   */
  static clearCache(): void {
    CacheService.clearAll();
    logger.info('🗑️  Recommendation cache cleared');
  }

  /**
   * Get cache statistics
   */
  static getCacheStats() {
    return CacheService.getStats();
  }
}
