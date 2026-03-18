import { supabase } from '../config/supabase';
import logger from '../config/logger';
import {
  Recommendation,
  BasicFormData,
  AdvancedFormData,
  RecommendationResult,
  TesteaMetrics,
  BiomechanicalSafety,
} from '../types/recommendation';
import { RacketService } from './racketService';
import { OpenRouterService } from './openRouterService';
import { CacheService } from './cacheService';
import { RacketFilterService } from './racketFilterService';
import { TesteaMetricsService } from './testeaMetricsService';

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
      const allRackets = await RacketService.getAllRackets();
      logger.info(`📊 Loaded ${allRackets.length} rackets from database`);

      // Log Testea certification coverage
      const coverage = TesteaMetricsService.getCertificationCoverage(allRackets);
      logger.info(
        `🔬 Testea certification coverage: ${coverage.certified}/${coverage.total} (${coverage.percentage}%)`
      );

      // 3. Apply smart filtering (includes biomechanical filter)
      const filteredRackets = RacketFilterService.filterRackets(allRackets, data);

      if (filteredRackets.length === 0) {
        throw new Error('No rackets match your criteria. Please adjust your filters.');
      }

      // 4. Build strategic prompt with Testea metrics
      const prompt = this.buildStrategicPrompt(filteredRackets, data);

      // 5. Call OpenRouter with strategic prompt
      logger.info(`🤖 Sending ${filteredRackets.length} safe rackets to AI with strategic prompt`);
      const aiResponse = await OpenRouterService.generateContent(prompt);

      // 6. Parse response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        logger.error('❌ Failed to parse AI response - no JSON found');
        throw new Error('Failed to parse AI response');
      }

      const aiResult = JSON.parse(jsonMatch[0]);
      logger.info(`🤖 AI recommended ${aiResult.rackets?.length || 0} rackets`);

      // 7. Enrich AI recommendations with Testea metrics and biomechanical safety
      const enrichedRackets = await this.enrichRecommendations(
        aiResult.rackets,
        filteredRackets,
        data
      );

      if (enrichedRackets.length === 0) {
        logger.error('❌ No valid recommendations after enrichment');
        throw new Error('No valid recommendations could be generated');
      }

      const result: RecommendationResult = {
        rackets: enrichedRackets,
        analysis: aiResult.analysis,
        coaching_tip: aiResult.coaching_tip || undefined,
        process_summary: {
          total_catalog: allRackets.length,
          discarded_biomechanical: allRackets.length - filteredRackets.length,
          safe_evaluated: filteredRackets.length,
          main_criterion: this.getMainCriterion(data),
        },
        transparency_note:
          'Las puntuaciones de Potencia, Control, Manejabilidad, Punto Dulce y Salida de Bola son calculadas de forma determinista a partir de las características físicas de cada pala (forma, balance, dureza) y permanecen fijas para cada modelo. Las valoraciones de usuarios reflejan la experiencia de la comunidad Smashly.',
      };

      // 8. Cache the result
      CacheService.set(cacheHash, result);

      const elapsed = Date.now() - startTime;
      logger.info(`✅ Generated strategic recommendation in ${elapsed}ms`);

      return result;
    } catch (error: unknown) {
      logger.error('Error generating recommendation:', error);
      throw error;
    }
  }

  /**
   * Build strategic prompt based on the research report
   * Implements the complete system context, principles, and weighting formula
   */
  private static buildStrategicPrompt(
    rackets: any[],
    profile: BasicFormData | AdvancedFormData
  ): string {
    // Build catalog with Testea metrics
    const catalogWithMetrics = rackets
      .map((r: any) => {
        const metrics = TesteaMetricsService.getTesteaMetrics(r);
        const derived = TesteaMetricsService.calculateDerivedMetrics(r);

        return `${r.id}|${r.marca} ${r.nombre}|${r.caracteristicas_nivel_de_juego || 'N/A'}|${r.caracteristicas_forma || 'N/A'}|${r.caracteristicas_balance || 'N/A'}|€${r.precio_actual || 'N/A'}|P:${metrics.potencia}|C:${metrics.control}|M:${metrics.manejabilidad}|Conf:${metrics.confort}|Cert:${metrics.certificado ? 'Sí' : 'No'}`;
      })
      .join('\n');

    // Build user profile
    const userProfile = {
      nivel: profile.level,
      frecuencia: profile.frequency,
      lesiones: profile.injuries,
      presupuesto: profile.budget,
      genero: profile.gender || 'no especificado',
      condicion_fisica: profile.physical_condition || 'no especificado',
      tacto_preferido: profile.touch_preference || 'no especificado',
      ...('play_style' in profile && {
        estilo_juego: profile.play_style,
        posicion: profile.position,
        prioridades: profile.characteristic_priorities || [],
      }),
    };

    // Calculate priority weights if available
    let priorityWeights = '';
    if ('characteristic_priorities' in profile && profile.characteristic_priorities) {
      priorityWeights = `\nPRIORIDADES DEL USUARIO (ordenadas de más a menos importante):\n`;
      profile.characteristic_priorities.forEach((char, index) => {
        const weight = 5 - index; // 1st=5 points, 2nd=4, etc.
        priorityWeights += `${index + 1}. ${char.toUpperCase()} (peso: ${weight} puntos)\n`;
      });
    }

    return `CONTEXTO DEL SISTEMA:
Eres el motor de recomendación de "Smashly", una plataforma experta en palas de pádel que prioriza la salud biomecánica del jugador sobre cualquier otro factor. Tu objetivo es generar recomendaciones personalizadas, científicamente fundamentadas y transparentes.

PRINCIPIOS IRRENUNCIABLES:
1. Seguridad Biomecánica Primero: Las palas que recibiste ya han pasado un filtro biomecánico restrictivo. TODAS son seguras para este usuario.
2. Verdad Objetiva: Prioriza las métricas certificadas de Testea Pádel (columnas P, C, M, Conf) sobre cualquier otra consideración.
3. Transparencia Total: Explica el "porqué" de cada recomendación vinculándolo a las prioridades del usuario.

PERFIL DEL USUARIO:
${JSON.stringify(userProfile, null, 2)}
${priorityWeights}

CATÁLOGO DE PALAS SEGURAS (${rackets.length} pre-filtradas por seguridad biomecánica):
ID | Marca Modelo | Nivel | Forma | Balance | Precio | P:Potencia | C:Control | M:Manejabilidad | Conf:Confort | Cert:Testea
${catalogWithMetrics}

MOTOR DE PONDERACIÓN:
Calcula una puntuación final para cada pala usando esta fórmula:
Puntuación_Final = Σ(Peso_Prioridad[i] × Métrica_Testea[i]) + Ajustes

Donde:
- Peso_Prioridad: 1º prioridad=5 puntos, 2º=4, 3º=3, 4º=2, 5º=1
- Métrica_Testea: Puntuación certificada (P, C, M, Conf) de 0-10
- Ajustes:
  + 1 punto si tacto coincide con preferencia del usuario
  + 0.5 puntos si está dentro del presupuesto
  + 0.5 puntos si tiene certificación Testea (Cert:Sí)

MAPEO DE PRIORIDADES A MÉTRICAS:
- potencia → P (Potencia Testea)
- control → C (Control Testea)
- manejabilidad → M (Manejabilidad Testea)
- salida_de_bola → Correlaciona con dureza (blanda=alta, dura=baja)
- punto_dulce → Correlaciona con forma (redonda=amplio, diamante=reducido)

INSTRUCCIONES:
1. Selecciona EXACTAMENTE 3 palas del catálogo
2. Usa SOLO los IDs del catálogo proporcionado
3. Ordena por Puntuación_Final descendente (la mejor recomendación primero)
4. Para cada pala, proporciona explicaciones ESPECÍFICAS y CONCRETAS:
   - NO uses frases genéricas como "buena pala para tu nivel"
   - SÍ menciona datos concretos: materiales, valores P/C/M/Conf, balance, forma y su impacto real en juego
   - SÍ relaciona cada característica con el perfil exacto del usuario
   - El usuario debe entender QUÉ le da CONCRETAMENTE esta pala y POR QUÉ es mejor que las otras para ÉL

FORMATO DE RESPUESTA (JSON puro, sin markdown):
{
  "rackets": [
    {
      "id": <número entero del catálogo>,
      "match_score": <número 0-100 según fórmula>,
      "reason": "<2-3 frases específicas: qué materiales/características tiene y cómo resuelven las necesidades de este usuario concreto>",
      "what_it_gives_you": "<3-4 beneficios concretos que el usuario notará en pista: ej. 'Manejabilidad 8/10 te da más tiempo de reacción en defensa', 'Goma blanda reduce fatiga en sesiones largas', 'Punto dulce amplio perdona los golpes menos centrados'>",
      "what_it_sacrifices": "<qué cede esta pala honestamente comparada con las otras opciones: ej. 'Menos explosividad en smash que la opción 2', 'Precio más elevado'>",
      "priority_alignment": "<cómo satisface la 1ª y 2ª prioridad del usuario con valores numéricos: ej. 'Control 8/10 (tu prioridad #1), Manejabilidad 7/10 (#2)'>",
      "biomechanical_fit": "<por qué es segura/óptima para su perfil físico: forma+balance+dureza y su impacto biomecánico>",
      "ideal_for_moment": "<en qué situaciones de juego brilla: ej. 'En bandeja y víbora desde posición de resto', 'En rallies largos de fondo de pista'>"
    }
  ],
  "analysis": "<3-4 frases: resumen del perfil del usuario, lógica de la selección, y qué diferencia a la pala #1 de las demás. Menciona si hay opción calidad-precio destacada>",
  "coaching_tip": "<1 consejo técnico específico para este jugador sobre cómo aprovechar su nueva pala según su nivel y estilo de juego>"
}

RESPONDE SOLO CON EL JSON:`;
  }

  /**
   * Enrich AI recommendations with Testea metrics, biomechanical safety, and community data
   */
  private static async enrichRecommendations(
    aiRackets: any[],
    filteredRackets: any[],
    profile: BasicFormData | AdvancedFormData
  ): Promise<any[]> {
    return aiRackets
      .map((rec: any) => {
        const racket: any = filteredRackets.find((r: any) => r.id === rec.id);

        if (!racket) {
          logger.warn(`✗ Could not find racket with ID ${rec.id}`);
          return null;
        }

        logger.info(`✓ Enriching recommendation for "${racket.nombre}"`);

        // Get Testea metrics
        const testeaMetrics = TesteaMetricsService.getTesteaMetrics(racket);

        // Assess biomechanical safety
        const biomechanicalSafety = this.assessBiomechanicalSafety(racket, profile);

        // Extract community data
        const communityData = {
          user_rating: racket.valoracion_usuarios || undefined,
          quality_price_ratio: racket.relacion_calidad_precio || undefined,
          is_bestseller: racket.es_bestseller || false,
        };

        return {
          id: racket.id,
          name: racket.nombre,
          brand: racket.marca,
          image: racket.imagenes?.[0] || null,
          price: racket.precio_actual,
          match_score: rec.match_score,
          reason: rec.reason,
          // New rich explanation fields from improved prompt
          what_it_gives_you: rec.what_it_gives_you || null,
          what_it_sacrifices: rec.what_it_sacrifices || null,
          ideal_for_moment: rec.ideal_for_moment || null,
          testea_metrics: testeaMetrics,
          biomechanical_safety: biomechanicalSafety,
          community_data: communityData,
          match_details: {
            priority_alignment: rec.priority_alignment || rec.reason,
            biomechanical_fit: rec.biomechanical_fit || 'Pala segura para tu perfil',
            preference_match: rec.preference_match || null,
          },
        };
      })
      .filter((r: any) => r !== null);
  }

  /**
   * Assess biomechanical safety of a racket for a user profile
   */
  private static assessBiomechanicalSafety(
    racket: any,
    profile: BasicFormData | AdvancedFormData
  ): BiomechanicalSafety {
    const dureza = (racket.caracteristicas_dureza || '').toLowerCase();
    const balance = (racket.caracteristicas_balance || '').toLowerCase();
    const peso = racket.peso || 365;
    const hasAntiVibration = racket.tiene_antivibracion || false;

    const hasInjuries = profile.injuries && profile.injuries !== 'no';

    // Calculate safe weight range
    const safeWeightRange = this.calculateSafeWeightRange(profile);
    const weightAppropriate = peso >= safeWeightRange.min && peso <= safeWeightRange.max;

    // Check balance appropriateness
    const balanceAppropriate = hasInjuries ? !balance.includes('alto') : true;

    // Check hardness appropriateness
    const hardnessAppropriate = hasInjuries ? !dureza.includes('dura') : true;

    const isSafe = weightAppropriate && balanceAppropriate && hardnessAppropriate;

    let safetyNotes = '';
    if (hasInjuries && hasAntiVibration) {
      safetyNotes = 'Incluye tecnología anti-vibración, ideal para prevenir lesiones.';
    } else if (hasInjuries) {
      safetyNotes = 'Características suaves que minimizan el riesgo de lesión.';
    }

    return {
      is_safe: isSafe,
      weight_appropriate: weightAppropriate,
      balance_appropriate: balanceAppropriate,
      hardness_appropriate: hardnessAppropriate,
      has_antivibration: hasAntiVibration,
      safety_notes: safetyNotes,
    };
  }

  /**
   * Calculate safe weight range (duplicated from RacketFilterService for independence)
   */
  private static calculateSafeWeightRange(profile: BasicFormData | AdvancedFormData): {
    min: number;
    max: number;
  } {
    let baselineMax = 365;
    if (profile.gender === 'femenino') {
      baselineMax = 360;
    }

    const min = 340;
    let max = baselineMax;

    if (profile.physical_condition === 'ocasional') {
      max -= 5;
    }

    const isBeginnerLevel =
      profile.level?.toLowerCase().includes('principiante') ||
      profile.level?.toLowerCase().includes('iniciación');
    if (isBeginnerLevel) {
      max = Math.min(max, profile.gender === 'femenino' ? 360 : 365);
    }

    const hasInjuries = profile.injuries && profile.injuries !== 'no';
    if (hasInjuries) {
      max = Math.min(max, profile.gender === 'femenino' ? 355 : 360);
    }

    return { min, max };
  }

  /**
   * Get main criterion for recommendation based on profile
   */
  private static getMainCriterion(profile: BasicFormData | AdvancedFormData): string {
    if (
      'characteristic_priorities' in profile &&
      profile.characteristic_priorities &&
      profile.characteristic_priorities.length > 0
    ) {
      return profile.characteristic_priorities[0].toUpperCase();
    }

    if (profile.injuries && profile.injuries !== 'no') {
      return 'SEGURIDAD BIOMECÁNICA';
    }

    return 'NIVEL DE JUEGO';
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
