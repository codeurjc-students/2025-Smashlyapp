import { supabaseAdmin } from '../config/supabase';
import logger from '../config/logger';

export class VectorStoreService {
  /**
   * Inserta o actualiza el embedding de una pala.
   */
  static async upsertRacketEmbedding(
    racketId: number,
    content: string,
    embedding: number[],
    metadata: Record<string, any>
  ): Promise<void> {
    const { error } = await supabaseAdmin.from('racket_embeddings').upsert(
      {
        racket_id: racketId,
        content,
        embedding,
        metadata,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'racket_id' }
    );

    if (error) {
      logger.error(`Error upserting racket embedding for ID ${racketId}:`, error);
      throw error;
    }
  }

  /**
   * Inserta el embedding de una review.
   */
  static async insertReviewEmbedding(
    reviewId: string,
    racketId: number,
    content: string,
    embedding: number[],
    metadata: Record<string, any>
  ): Promise<void> {
    const { error } = await supabaseAdmin.from('review_embeddings').upsert(
      {
        review_id: reviewId,
        racket_id: racketId,
        content,
        embedding,
        metadata,
      },
      { onConflict: 'review_id' }
    );

    if (error) {
      logger.error(`Error inserting review embedding for ID ${reviewId}:`, error);
      throw error;
    }
  }

  /**
   * Inserta un chunk de knowledge base.
   */
  static async insertKnowledgeChunk(
    source: string,
    chunkIndex: number,
    content: string,
    embedding: number[],
    metadata: Record<string, any>
  ): Promise<void> {
    const { error } = await supabaseAdmin.from('knowledge_embeddings').upsert(
      {
        source,
        chunk_index: chunkIndex,
        content,
        embedding,
        metadata,
      },
      { onConflict: 'source,chunk_index' }
    );

    if (error) {
      logger.error(`Error inserting knowledge chunk for ${source} index ${chunkIndex}:`, error);
      throw error;
    }
  }

  /**
   * Busca palas similares filtra por seguridad biomecánica.
   */
  static async searchSimilarRackets(
    queryEmbedding: number[],
    options: {
      threshold?: number;
      limit?: number;
      metadata?: Record<string, any>;
      safeRacketIds: number[];
    }
  ): Promise<
    Array<{
      racketId: number;
      content: string;
      metadata: Record<string, any>;
      similarity: number;
    }>
  > {
    const { threshold = 0.3, limit = 10, metadata = {}, safeRacketIds } = options;

    const { data, error } = await supabaseAdmin.rpc('match_rackets', {
      query_embedding: queryEmbedding,
      match_threshold: threshold,
      match_count: 100, // Solicitamos más resultados para compensar el filtro biomecánico
      filter_metadata: metadata,
    });

    if (error) {
      logger.error('Error searching similar rackets:', error);
      throw error;
    }

    // Post-filtro: Solo aquellos que pasaron el filtro biomecánico
    const filteredResults = (data || [])
      .filter((r: any) => safeRacketIds.includes(r.racket_id))
      .slice(0, limit)
      .map((r: any) => ({
        racketId: r.racket_id,
        content: r.content,
        metadata: r.metadata,
        similarity: r.similarity,
      }));

    return filteredResults;
  }

  /**
   * Busca reviews relevantes.
   */
  static async searchRelevantReviews(
    queryEmbedding: number[],
    options: {
      threshold?: number;
      limit?: number;
      racketIds?: number[];
    }
  ): Promise<
    Array<{
      reviewId: string;
      racketId: number;
      content: string;
      metadata: Record<string, any>;
      similarity: number;
    }>
  > {
    const { threshold = 0.3, limit = 5, racketIds = null } = options;

    const { data, error } = await supabaseAdmin.rpc('match_reviews', {
      query_embedding: queryEmbedding,
      match_threshold: threshold,
      match_count: limit,
      filter_racket_ids: racketIds,
    });

    if (error) {
      logger.error('Error searching relevant reviews:', error);
      throw error;
    }

    return (data || []).map((r: any) => ({
      reviewId: r.review_id,
      racketId: r.racket_id,
      content: r.content,
      metadata: r.metadata,
      similarity: r.similarity,
    }));
  }

  /**
   * Busca chunks de conocimiento.
   */
  static async searchKnowledge(
    queryEmbedding: number[],
    options: {
      threshold?: number;
      limit?: number;
    }
  ): Promise<
    Array<{
      id: number;
      source: string;
      content: string;
      metadata: Record<string, any>;
      similarity: number;
    }>
  > {
    const { threshold = 0.3, limit = 3 } = options;

    const { data, error } = await supabaseAdmin.rpc('match_knowledge', {
      query_embedding: queryEmbedding,
      match_threshold: threshold,
      match_count: limit,
    });

    if (error) {
      logger.error('Error searching knowledge:', error);
      throw error;
    }

    return (data || []).map((k: any) => ({
      id: k.id,
      source: k.source,
      content: k.content,
      metadata: k.metadata,
      similarity: k.similarity,
    }));
  }

  /**
   * Estadísticas básicas.
   */
  static async getStats() {
    try {
      const [rackets, reviews, knowledge] = await Promise.all([
        supabaseAdmin.from('racket_embeddings').select('*', { count: 'exact', head: true }),
        supabaseAdmin.from('review_embeddings').select('*', { count: 'exact', head: true }),
        supabaseAdmin.from('knowledge_embeddings').select('*', { count: 'exact', head: true }),
      ]);

      return {
        totalRacketEmbeddings: rackets.count || 0,
        totalReviewEmbeddings: reviews.count || 0,
        totalKnowledgeChunks: knowledge.count || 0,
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Error getting vector store stats:', error);
      return null;
    }
  }
}
