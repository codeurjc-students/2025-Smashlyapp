import 'dotenv/config';
import { RacketService } from '../services/racketService';
import { EmbeddingService } from '../services/embeddingService';
import { VectorStoreService } from '../services/vectorStoreService';
import { supabaseAdmin } from '../config/supabase';
import logger from '../config/logger';

async function generateAllEmbeddings() {
  try {
    logger.info('🚀 Starting full catalog embedding generation...');

    // 1. Get all rackets
    const rackets = await RacketService.getAllRackets();
    logger.info(`📦 Found ${rackets.length} rackets to index.`);

    for (const racket of rackets as any[]) {
      try {
        const doc = EmbeddingService.buildRacketDocument(racket);
        const embedding = await EmbeddingService.embed(doc);

        await VectorStoreService.upsertRacketEmbedding(racket.id!, doc, embedding, {
          name: racket.nombre,
          brand: racket.marca || racket.caracteristicas_marca,
          shape: racket.caracteristicas_forma,
          level: racket.caracteristicas_nivel_de_juego,
          price_range:
            (racket.precio_actual || 0) < 100
              ? 'low'
              : (racket.precio_actual || 0) < 200
                ? 'mid'
                : 'high',
        });
        logger.info(
          `✅ Indexed racket: ${racket.marca || racket.caracteristicas_marca} ${racket.nombre}`
        );
      } catch (err) {
        logger.error(`❌ Failed to index racket ${racket.id}:`, err);
      }
    }

    // 2. Index reviews
    logger.info('💬 Starting review embedding generation...');
    const { data: reviews } = await supabaseAdmin!.from('reviews').select('*, rackets(name)');

    if (reviews) {
      for (const review of reviews) {
        try {
          const doc = EmbeddingService.buildReviewDocument(
            review,
            (review.rackets as any)?.name || ''
          );
          const embedding = await EmbeddingService.embed(doc);

          await VectorStoreService.insertReviewEmbedding(
            review.id,
            review.racket_id,
            doc,
            embedding,
            {
              rating: review.rating,
              user_level: review.user_level,
            }
          );
          logger.info(`✅ Indexed review for racket ID: ${review.racket_id}`);
        } catch (err) {
          logger.error(`❌ Failed to index review ${review.id}:`, err);
        }
      }
    }

    logger.info('🎉 All embeddings generated successfully!');
  } catch (error) {
    logger.error('Fatal error generating embeddings:', error);
    process.exit(1);
  }
}

generateAllEmbeddings();
