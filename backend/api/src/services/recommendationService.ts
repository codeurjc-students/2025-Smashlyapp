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
      // 1. Fetch all rackets from database to build catalog
      let allRackets = await RacketService.getAllRackets();

      // 2. Filter by budget if specified
      let maxBudget: number | null = null;
      if (data.budget) {
        const budgetStr = String(data.budget);
        // Parse budget string (e.g., "100-150", "150-200", "200+")
        if (budgetStr.includes('+')) {
          // No upper limit for "200+" type budgets
          const minBudget = parseInt(budgetStr.replace('+', ''));
          allRackets = allRackets.filter(
            (r: any) => !r.precio_actual || r.precio_actual >= minBudget
          );
        } else if (budgetStr.includes('-')) {
          const [min, max] = budgetStr.split('-').map(Number);
          maxBudget = max;
          allRackets = allRackets.filter((r: any) => {
            if (!r.precio_actual) return true; // Include rackets without price
            return r.precio_actual >= min && r.precio_actual <= max;
          });
        } else {
          // Single number budget
          const budget = parseInt(budgetStr);
          maxBudget = budget;
          allRackets = allRackets.filter((r: any) => !r.precio_actual || r.precio_actual <= budget);
        }
      }

      logger.info(
        `📊 Filtered catalog: ${allRackets.length} rackets within budget ${data.budget || 'any'}`
      );

      // 3. Build a concise catalog summary for Gemini
      const catalogSummary = allRackets
        .map((r: any) => {
          const characteristics = [];
          if (r.caracteristicas_forma) characteristics.push(`Forma: ${r.caracteristicas_forma}`);
          if (r.caracteristicas_balance)
            characteristics.push(`Balance: ${r.caracteristicas_balance}`);
          if (r.caracteristicas_nucleo) characteristics.push(`Núcleo: ${r.caracteristicas_nucleo}`);
          if (r.caracteristicas_cara) characteristics.push(`Cara: ${r.caracteristicas_cara}`);
          if (r.caracteristicas_nivel_de_juego)
            characteristics.push(`Nivel: ${r.caracteristicas_nivel_de_juego}`);
          if (r.precio_actual) characteristics.push(`Precio: €${r.precio_actual.toFixed(2)}`);

          return `ID: ${r.id} | ${r.marca || ''} ${r.nombre || r.modelo || ''} | ${characteristics.join(', ')}`;
        })
        .join('\n');

      // 4. Prepare prompt for Gemini with catalog restriction
      const budgetInfo = maxBudget
        ? `Presupuesto máximo: €${maxBudget.toFixed(2)} - SOLO recomienda palas dentro de este límite.\n`
        : '';

      const prompt = `Eres un experto en palas de pádel. Recomienda las 3 mejores palas para este jugador:

PERFIL DEL JUGADOR:
${JSON.stringify(data, null, 2)}
${budgetInfo}

CATÁLOGO DISPONIBLE (${allRackets.length} palas):
${catalogSummary}

REGLAS CRÍTICAS:
- Usa SOLO IDs del catálogo anterior
- NO inventes palas ni IDs
- Ordena por match_score (0-100)
- Razones específicas en español

Responde SOLO con JSON (sin markdown):
{
  "rackets": [
    {"id": 123, "match_score": 95, "reason": "Explicación detallada técnica"},
    {"id": 456, "match_score": 88, "reason": "Explicación detallada técnica"},
    {"id": 789, "match_score": 82, "reason": "Explicación detallada técnica"}
  ],
  "analysis": "Análisis general del perfil y elección de palas"
}`;

      // 4. Call Gemini
      logger.info(`📊 Sending ${allRackets.length} rackets to Gemini for recommendation`);
      const aiResponse = await GeminiService.generateContent(prompt);

      // 5. Parse response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        logger.error('❌ Failed to parse AI response - no JSON found');
        throw new Error('Failed to parse AI response');
      }

      const aiResult = JSON.parse(jsonMatch[0]);
      logger.info(`🤖 Gemini recommended ${aiResult.rackets?.length || 0} rackets`);

      // Log the IDs that Gemini recommended
      const recommendedIds = aiResult.rackets?.map((r: any) => r.id) || [];
      logger.info(`📋 Recommended IDs: ${recommendedIds.join(', ')}`);

      // 6. Match AI recommendations to database rackets by ID (simple and accurate)
      const enrichedRackets = aiResult.rackets
        .map((rec: any) => {
          const racket: any = allRackets.find((r: any) => r.id === rec.id);

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
              `✗ Could not find racket with ID ${rec.id} in database - Gemini ignored instructions!`
            );
            return null;
          }
        })
        .filter((r: any) => r !== null); // Remove any null entries

      // 7. Ensure we have at least some recommendations
      if (enrichedRackets.length === 0) {
        logger.error('❌ No valid recommendations - Gemini did not follow catalog restrictions');
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
