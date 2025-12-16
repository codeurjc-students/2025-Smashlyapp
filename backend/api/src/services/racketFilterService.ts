import { Racket } from '../types/racket';
import { BasicFormData, AdvancedFormData } from '../types/recommendation';
import logger from '../config/logger';

/**
 * Service for intelligently filtering rackets before sending to Gemini
 * Reduces 831 rackets to 30-50 most relevant candidates
 */
export class RacketFilterService {
  /**
   * Main filtering function - applies cascading filters
   */
  static filterRackets(
    allRackets: Racket[],
    profile: BasicFormData | AdvancedFormData
  ): Racket[] {
    logger.info(`🔍 Starting smart filtering from ${allRackets.length} rackets`);

    let filtered = [...allRackets];

    // 1. Filter by budget (already done in recommendationService, but ensure it's applied)
    filtered = this.filterByBudget(filtered, profile.budget);
    logger.info(`💰 After budget filter: ${filtered.length} rackets`);

    // 2. Filter by level (critical filter)
    filtered = this.filterByLevel(filtered, profile.level);
    logger.info(`🎯 After level filter: ${filtered.length} rackets`);

    // 3. Filter by injuries/physical needs
    if (profile.injuries && profile.injuries !== 'no') {
      filtered = this.filterByInjuries(filtered);
      logger.info(`🏥 After injury filter: ${filtered.length} rackets`);
    }

    // 4. Advanced filtering for advanced forms
    if ('play_style' in profile) {
      filtered = this.filterByPlayStyle(filtered, profile);
      logger.info(`⚡ After play style filter: ${filtered.length} rackets`);
    }

    // 5. Calculate match scores for remaining rackets
    const scored = filtered.map(racket => ({
      racket,
      score: this.calculateMatchScore(racket, profile),
    }));

    // 6. Sort by score and take top candidates
    scored.sort((a, b) => b.score - a.score);

    // 7. Ensure diversity (different brands, price ranges)
    const topCandidates = this.ensureDiversity(scored, 40);

    logger.info(`✅ Final filtered set: ${topCandidates.length} rackets`);
    return topCandidates.map(s => s.racket);
  }

  /**
   * Filter by budget range
   */
  private static filterByBudget(rackets: Racket[], budget: number): Racket[] {
    const budgetStr = String(budget);

    if (budgetStr.includes('+')) {
      const minBudget = parseInt(budgetStr.replace('+', ''));
      return rackets.filter((r: any) => !r.precio_actual || r.precio_actual >= minBudget);
    } else if (budgetStr.includes('-')) {
      const [min, max] = budgetStr.split('-').map(Number);
      return rackets.filter((r: any) => {
        if (!r.precio_actual) return true;
        return r.precio_actual >= min && r.precio_actual <= max;
      });
    } else {
      const maxBudget = parseInt(budgetStr);
      return rackets.filter((r: any) => !r.precio_actual || r.precio_actual <= maxBudget);
    }
  }

  /**
   * Filter by player level
   */
  private static filterByLevel(rackets: Racket[], level: string): Racket[] {
    const levelMap: Record<string, string[]> = {
      principiante: ['principiante', 'iniciación', 'fácil', 'intermedio', 'polivalente'],
      intermedio: ['intermedio', 'polivalente', 'avanzado'],
      avanzado: ['avanzado', 'pro', 'competición', 'profesional', 'intermedio'],
    };

    const acceptedLevels = levelMap[level.toLowerCase()] || [];
    
    return rackets.filter((r: any) => {
      const racketLevel = (r.caracteristicas_nivel_de_juego || '').toLowerCase();
      return acceptedLevels.some(lvl => racketLevel.includes(lvl));
    });
  }

  /**
   * Filter for injury-prone players (soft, low balance rackets)
   */
  private static filterByInjuries(rackets: Racket[]): Racket[] {
    return rackets.filter((r: any) => {
      const dureza = (r.caracteristicas_dureza || '').toLowerCase();
      const balance = (r.caracteristicas_balance || '').toLowerCase();
      
      // Prefer soft rackets and low/medium balance
      const isSoft = dureza.includes('blanda') || dureza.includes('soft');
      const isLowBalance = balance.includes('bajo') || balance.includes('medio');
      
      return isSoft || isLowBalance;
    });
  }

  /**
   * Filter by play style (advanced form only)
   */
  private static filterByPlayStyle(
    rackets: Racket[],
    profile: AdvancedFormData
  ): Racket[] {
    const playStyle = profile.play_style?.toLowerCase();
    
    if (!playStyle) return rackets;

    return rackets.filter((r: any) => {
      const forma = (r.caracteristicas_forma || '').toLowerCase();
      const balance = (r.caracteristicas_balance || '').toLowerCase();

      if (playStyle.includes('ofensivo') || playStyle.includes('atacante')) {
        // Offensive players: diamond shape, high balance
        return forma.includes('diamante') || balance.includes('alto');
      } else if (playStyle.includes('defensivo') || playStyle.includes('control')) {
        // Defensive players: round shape, low balance
        return forma.includes('redonda') || balance.includes('bajo');
      } else {
        // Balanced players: any shape
        return true;
      }
    });
  }

  /**
   * Calculate match score for a racket (0-100)
   */
  private static calculateMatchScore(
    racket: any,
    profile: BasicFormData | AdvancedFormData
  ): number {
    let score = 0;

    // 1. Level match (40 points)
    const racketLevel = (racket.caracteristicas_nivel_de_juego || '').toLowerCase();
    const userLevel = profile.level.toLowerCase();
    
    if (racketLevel.includes(userLevel)) {
      score += 40;
    } else if (
      (userLevel === 'principiante' && racketLevel.includes('intermedio')) ||
      (userLevel === 'intermedio' && racketLevel.includes('avanzado')) ||
      (userLevel === 'avanzado' && racketLevel.includes('intermedio'))
    ) {
      score += 20; // Adjacent level
    }

    // 2. Budget optimization (20 points)
    if (racket.precio_actual) {
      const budgetStr = String(profile.budget);
      let maxBudget = 0;
      
      if (budgetStr.includes('-')) {
        maxBudget = parseInt(budgetStr.split('-')[1]);
      } else if (!budgetStr.includes('+')) {
        maxBudget = parseInt(budgetStr);
      }
      
      if (maxBudget > 0) {
        const priceRatio = racket.precio_actual / maxBudget;
        if (priceRatio <= 0.8) score += 20; // Good value
        else if (priceRatio <= 1.0) score += 15; // Within budget
      }
    }

    // 3. Play style match (20 points) - for advanced forms
    if ('play_style' in profile) {
      const playStyle = profile.play_style?.toLowerCase() || '';
      const forma = (racket.caracteristicas_forma || '').toLowerCase();
      const balance = (racket.caracteristicas_balance || '').toLowerCase();

      if (playStyle.includes('ofensivo') && (forma.includes('diamante') || balance.includes('alto'))) {
        score += 20;
      } else if (playStyle.includes('defensivo') && (forma.includes('redonda') || balance.includes('bajo'))) {
        score += 20;
      } else if (playStyle.includes('polivalente')) {
        score += 15;
      }
    }

    // 4. Injury consideration (20 points)
    if (profile.injuries && profile.injuries !== 'no') {
      const dureza = (racket.caracteristicas_dureza || '').toLowerCase();
      if (dureza.includes('blanda') || dureza.includes('soft')) {
        score += 20;
      }
    }

    // 5. Bonus for popular/bestseller rackets (10 points)
    if (racket.es_bestseller) {
      score += 10;
    }

    return Math.min(score, 100);
  }

  /**
   * Ensure diversity in recommendations (different brands, prices)
   */
  private static ensureDiversity(
    scored: Array<{ racket: any; score: number }>,
    targetCount: number
  ): Array<{ racket: any; score: number }> {
    const result: Array<{ racket: any; score: number }> = [];
    const seenBrands = new Set<string>();
    const priceRanges = new Map<string, number>(); // Track how many per price range

    // First pass: take top scorers ensuring brand diversity
    for (const item of scored) {
      if (result.length >= targetCount) break;

      const brand = item.racket.marca || 'Unknown';
      const brandCount = Array.from(result).filter(r => r.racket.marca === brand).length;

      // Limit to max 8 rackets per brand to ensure variety
      if (brandCount < 8) {
        result.push(item);
        seenBrands.add(brand);
      }
    }

    // If we don't have enough, fill with remaining high scorers
    if (result.length < targetCount) {
      const remaining = scored.filter(s => !result.includes(s));
      result.push(...remaining.slice(0, targetCount - result.length));
    }

    return result;
  }
}
