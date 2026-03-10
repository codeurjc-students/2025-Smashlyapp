import logger from '../config/logger';
import { BasicFormData, AdvancedFormData, RecommendationResult } from '../types/recommendation';
import { EmbeddingService } from './embeddingService';
import { VectorStoreService } from './vectorStoreService';
import { PromptAssemblyService } from './promptAssemblyService';
import { OpenRouterService } from './openRouterService';
import { RacketFilterService } from './racketFilterService';
import { RacketService } from './racketService';
import { CacheService } from './cacheService';
import { TesteaMetricsService } from './testeaMetricsService';

export class RagService {
  /**
   * Genera una recomendación usando el flujo RAG.
   */
  static async generateRecommendation(
    type: 'basic' | 'advanced',
    data: BasicFormData | AdvancedFormData
  ): Promise<RecommendationResult> {
    const startTime = Date.now();
    logger.info(`🚀 Starting RAG recommendation flow (${type})`);

    try {
      // 1. Check Cache
      const cacheHash = CacheService.generateProfileHash(data);
      const cachedResult = CacheService.get(cacheHash);
      if (cachedResult) {
        logger.info('⚡ RAG: Returning cached result');
        return cachedResult;
      }

      // 2. Filtro Biomecánico (Determinista)
      const allRackets = await RacketService.getAllRackets();
      const filteredRackets = RacketFilterService.filterRackets(allRackets, data);
      const safeRacketIds = filteredRackets.map(r => r.id as number);

      if (safeRacketIds.length === 0) {
        throw new Error('No safe rackets found for your profile.');
      }

      // 3. Build Natural Language Query
      const query = this.buildNaturalLanguageQuery(data);
      logger.info(`🔍 RAG Query: "${query}"`);

      // 4. Embed Query
      const queryEmbedding = await EmbeddingService.embed(query);

      logger.info(`📥 RAG: safeRacketIds count: ${safeRacketIds.length}`);

      // 5. Retrieve (Parallel where possible)
      const [topRackets, knowledgeChunks] = await Promise.all([
        VectorStoreService.searchSimilarRackets(queryEmbedding, {
          limit: 10,
          safeRacketIds: safeRacketIds,
        }),
        VectorStoreService.searchKnowledge(queryEmbedding, {
          limit: 3,
        }),
      ]);

      // Retrieve reviews for the top rackets
      const topRacketIds = topRackets.map(r => r.racketId);
      const relevantReviews = await VectorStoreService.searchRelevantReviews(queryEmbedding, {
        limit: 5,
        racketIds: topRacketIds,
      });

      logger.info(
        `📥 Retrieved: ${topRackets.length} rackets, ${relevantReviews.length} reviews, ${knowledgeChunks.length} knowledge chunks`
      );

      if (topRackets.length > 0) {
        logger.info(`Top racket similarity: ${topRackets[0].similarity}`);
      }
      if (knowledgeChunks.length > 0) {
        logger.info(`Top knowledge similarity: ${knowledgeChunks[0].similarity}`);
      }

      // 6. Assemble Prompt
      const ragPrompt = PromptAssemblyService.buildRecommendationPrompt({
        userProfile: data,
        retrievedRackets: topRackets,
        relevantReviews: relevantReviews,
        knowledgeContext: knowledgeChunks,
        safeRacketCount: safeRacketIds.length,
        totalCatalog: allRackets.length,
      });

      // 7. LLM Call (OpenRouter)
      logger.info(`🤖 Sending RAG prompt to AI...`);
      const aiResponse = await OpenRouterService.generateContent(ragPrompt);

      // 8. Parse AI Response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Failed to parse AI response JSON');
      }
      const aiResult = JSON.parse(jsonMatch[0]);

      // 9. Enrich Recommendations (Using existing logic from RecommendationService or similar)
      const enrichedRackets = await this.enrichRAGResult(aiResult.rackets, filteredRackets, data);

      const result: RecommendationResult = {
        rackets: enrichedRackets,
        analysis: aiResult.analysis,
        process_summary: {
          total_catalog: allRackets.length,
          discarded_biomechanical: allRackets.length - filteredRackets.length,
          safe_evaluated: filteredRackets.length,
          main_criterion: this.getMainCriterion(data),
          rag_retrieved_count: topRackets.length,
        },
        transparency_note:
          'Recomendación generada mediante búsqueda semántica (RAG) en nuestro catálogo de palas y reviews.',
      };

      // 10. Cache + Return
      CacheService.set(cacheHash, result);

      const elapsed = Date.now() - startTime;
      logger.info(`✅ RAG: Recommendation generated in ${elapsed}ms`);

      return result;
    } catch (error) {
      logger.error('Error in RagService:', error);
      throw error;
    }
  }

  private static buildNaturalLanguageQuery(data: BasicFormData | AdvancedFormData): string {
    const level = data.level || 'intermedio';
    const injuries =
      data.injuries && data.injuries !== 'no' ? `con lesión en ${data.injuries}` : 'sin lesiones';
    const budget =
      typeof data.budget === 'object'
        ? `${data.budget.min}-${data.budget.max}€`
        : `${data.budget}€`;
    const touch = data.touch_preference ? `tacto ${data.touch_preference}` : '';

    let query = `Jugador ${level}, ${injuries}, presupuesto ${budget}. Busca una pala ${touch}.`;

    if ('play_style' in data) {
      const style = data.play_style || 'polivalente';
      const priorities = data.characteristic_priorities?.join(', ') || 'equilibrada';
      query += ` Estilo de juego ${style}, prioriza ${priorities}.`;
    }

    if (data.current_racket) {
      query += ` Actualmente usa la ${data.current_racket}.`;
    }

    return query;
  }

  private static async enrichRAGResult(
    aiRackets: any[],
    filteredRackets: any[],
    profile: any
  ): Promise<any[]> {
    // Reuse enrichment logic (simplified version of RecommendationService.enrichRecommendations)
    return aiRackets
      .map(rec => {
        const racket = filteredRackets.find(r => r.id === rec.id);
        if (!racket) return null;

        const metrics = TesteaMetricsService.getTesteaMetrics(racket);

        return {
          id: racket.id,
          name: racket.nombre,
          brand: racket.marca,
          image: racket.imagenes?.[0] || null,
          price: racket.precio_actual,
          match_score: rec.match_score,
          reason: rec.reason,
          testea_metrics: metrics,
          match_details: {
            priority_alignment: rec.priority_alignment,
            biomechanical_fit: rec.biomechanical_fit,
            preference_match: rec.preference_match,
          },
          community_data: {
            user_rating: racket.valoracion_usuarios,
            is_bestseller: racket.es_bestseller,
          },
        };
      })
      .filter(r => r !== null);
  }

  private static getMainCriterion(profile: any): string {
    if (profile.characteristic_priorities?.length > 0) {
      return profile.characteristic_priorities[0].toUpperCase();
    }
    return 'SIMILITUD SEMÁNTICA';
  }
}
