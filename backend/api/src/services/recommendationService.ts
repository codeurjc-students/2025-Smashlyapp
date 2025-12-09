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
          allRackets = allRackets.filter((r: any) => !r.precio_actual || r.precio_actual >= minBudget);
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
      
      logger.info(`📊 Filtered catalog: ${allRackets.length} rackets within budget ${data.budget || 'any'}`);
      
      // 3. Build a concise catalog summary for Gemini
      const catalogSummary = allRackets
        .map((r: any) => {
          const characteristics = [];
          if (r.caracteristicas_forma) characteristics.push(`Forma: ${r.caracteristicas_forma}`);
          if (r.caracteristicas_balance) characteristics.push(`Balance: ${r.caracteristicas_balance}`);
          if (r.caracteristicas_nucleo) characteristics.push(`Núcleo: ${r.caracteristicas_nucleo}`);
          if (r.caracteristicas_cara) characteristics.push(`Cara: ${r.caracteristicas_cara}`);
          if (r.caracteristicas_nivel_de_juego) characteristics.push(`Nivel: ${r.caracteristicas_nivel_de_juego}`);
          if (r.precio_actual) characteristics.push(`Precio: €${r.precio_actual.toFixed(2)}`);
          
          return `ID: ${r.id} | ${r.marca || ''} ${r.nombre || r.modelo || ''} | ${characteristics.join(', ')}`;
        })
        .join('\n');

      // 4. Prepare prompt for Gemini with catalog restriction
      const budgetInfo = maxBudget 
        ? `\n⚠️ RESTRICCIÓN DE PRESUPUESTO: El usuario tiene un presupuesto máximo de €${maxBudget?.toFixed(2)}. SOLO recomienda palas dentro de este presupuesto.\n`
        : '';
      
      const prompt = `
        Actúa como un Experto en Palas de Pádel especializado en recomendaciones personalizadas.
        
        Necesito que recomiendes las 3 mejores palas de pádel para un jugador con el siguiente perfil:
        
        Tipo de análisis: ${type}
        Perfil del jugador:
        ${JSON.stringify(data, null, 2)}
        ${budgetInfo}
        ═══════════════════════════════════════════════════════════════
        ⚠️  CATÁLOGO DISPONIBLE (${allRackets.length} palas) ⚠️
        ═══════════════════════════════════════════════════════════════
        
        A continuación tienes el catálogo COMPLETO de palas disponibles.
        
        ⛔ RESTRICCIÓN CRÍTICA: DEBES recomendar ÚNICAMENTE palas de este catálogo usando sus IDs exactos.
        ⛔ NO inventes palas que no estén en la lista.
        ⛔ NO uses nombres genéricos o palas que conozcas del mercado.
        ⛔ SOLO usa los IDs que aparecen a continuación.
        ${maxBudget ? `⛔ RESPETA el presupuesto máximo de €${maxBudget} - todas las palas del catálogo ya están filtradas.` : ''}
        
        ${catalogSummary}
        
        ═══════════════════════════════════════════════════════════════
        
        INSTRUCCIONES OBLIGATORIAS:
        
        1. ✅ Recomienda EXACTAMENTE 3 palas del catálogo anterior
        2. ✅ Usa el ID EXACTO de cada pala (el número que aparece después de "ID:")
        3. ✅ Ordena las palas de mayor a menor match_score (0-100)
        4. ✅ Proporciona razones específicas y detalladas en español
        5. ✅ Menciona las características técnicas de cada pala del catálogo
        6. ⛔ NO inventes IDs que no existan en el catálogo
        7. ⛔ NO uses palas que no estén en la lista anterior
        
        EJEMPLO DE RESPUESTA CORRECTA:
        Si el catálogo contiene "ID: 4989 | Wilson Blade LS V3 2025 | Forma: Redonda, Balance: Bajo...",
        entonces puedes recomendar:
        {
          "rackets": [
            {
              "id": 4989,
              "match_score": 92,
              "reason": "La Wilson Blade LS V3 2025 es perfecta porque..."
            }
          ]
        }
        
        Devuelve un objeto JSON con esta estructura EXACTA (sin bloques markdown, solo JSON puro):
        {
          "rackets": [
            {
              "id": 123,
              "match_score": 95,
              "reason": "Explicación detallada en español de por qué esta pala es perfecta para este jugador, mencionando características específicas como forma, balance, núcleo, etc."
            },
            {
              "id": 456,
              "match_score": 88,
              "reason": "Explicación detallada en español"
            },
            {
              "id": 789,
              "match_score": 82,
              "reason": "Explicación detallada en español"
            }
          ],
          "analysis": "Análisis general en español del perfil del jugador y por qué se eligieron estas palas específicas del catálogo"
        }
        
        ⚠️ RECORDATORIO FINAL:
        - Responde ÚNICAMENTE en español
        - Usa SOLO IDs de palas del catálogo proporcionado
        - NO inventes palas que no estén en el catálogo
        - Las razones deben ser específicas, técnicas y detalladas
        - Asegúrate de que los 3 IDs existan en el catálogo anterior
      `;

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
            logger.warn(`✗ Could not find racket with ID ${rec.id} in database - Gemini ignored instructions!`);
            return null;
          }
        })
        .filter((r: any) => r !== null); // Remove any null entries

      // 7. Ensure we have at least some recommendations
      if (enrichedRackets.length === 0) {
        logger.error('❌ No valid recommendations - Gemini did not follow catalog restrictions');
        throw new Error('No valid recommendations could be generated from the catalog. Please try again.');
      }
      
      if (enrichedRackets.length < aiResult.rackets.length) {
        logger.warn(`⚠️  Only ${enrichedRackets.length} out of ${aiResult.rackets.length} recommendations were valid`);
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
