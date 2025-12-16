import NodeCache from 'node-cache';
import crypto from 'crypto';
import logger from '../config/logger';
import { RecommendationResult, BasicFormData, AdvancedFormData } from '../types/recommendation';

/**
 * Cache service for storing recommendation results
 * Uses in-memory cache with TTL
 */
export class CacheService {
  private static cache = new NodeCache({
    stdTTL: 604800, // 7 days in seconds
    checkperiod: 3600, // Check for expired keys every hour
    useClones: false, // Don't clone objects for better performance
  });

  /**
   * Generate a unique hash for a user profile
   * Similar profiles will have the same hash
   */
  static generateProfileHash(data: BasicFormData | AdvancedFormData): string {
    // Extract essential fields that define the profile
    const essentialData = {
      level: data.level,
      budget: data.budget,
      injuries: data.injuries,
      frequency: data.frequency,
      // For advanced forms, include additional fields
      ...(('play_style' in data) && {
        play_style: data.play_style,
        position: data.position,
        balance_preference: data.balance_preference,
        shape_preference: data.shape_preference,
      }),
    };

    // Create deterministic string from essential data
    const dataString = JSON.stringify(essentialData, Object.keys(essentialData).sort());
    
    // Generate MD5 hash
    const hash = crypto.createHash('md5').update(dataString).digest('hex');
    
    logger.debug(`Generated cache hash: ${hash} for profile: ${dataString}`);
    return hash;
  }

  /**
   * Get cached recommendation result
   */
  static get(hash: string): RecommendationResult | null {
    const cached = this.cache.get<RecommendationResult>(hash);
    
    if (cached) {
      logger.info(`✅ Cache HIT for hash: ${hash}`);
      return cached;
    }
    
    logger.info(`❌ Cache MISS for hash: ${hash}`);
    return null;
  }

  /**
   * Store recommendation result in cache
   */
  static set(hash: string, result: RecommendationResult): void {
    this.cache.set(hash, result);
    logger.info(`💾 Cached recommendation for hash: ${hash}`);
  }

  /**
   * Clear all cache (useful when catalog is updated)
   */
  static clearAll(): void {
    this.cache.flushAll();
    logger.info('🗑️  Cache cleared');
  }

  /**
   * Get cache statistics
   */
  static getStats() {
    const stats = this.cache.getStats();
    return {
      keys: this.cache.keys().length,
      hits: stats.hits,
      misses: stats.misses,
      hitRate: stats.hits / (stats.hits + stats.misses) || 0,
    };
  }
}
