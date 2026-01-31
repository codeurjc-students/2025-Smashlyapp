import { Racket } from '../types/racket';
import { BasicFormData, AdvancedFormData } from '../types/recommendation';
import logger from '../config/logger';

/**
 * Service for intelligently filtering rackets before sending to AI
 * PRIORITY 1: Biomechanical safety (non-negotiable)
 * PRIORITY 2: Performance match (level, style, preferences)
 */
export class RacketFilterService {
  /**
   * Main filtering function - applies cascading filters
   * CRITICAL: Biomechanical filter runs FIRST to ensure player safety
   */
  static filterRackets(allRackets: Racket[], profile: BasicFormData | AdvancedFormData): Racket[] {
    logger.info(`🔍 Starting smart filtering from ${allRackets.length} rackets`);

    let filtered = [...allRackets];
    const initialCount = filtered.length;

    // ===== PHASE 1: BIOMECHANICAL FILTER (NON-NEGOTIABLE) =====
    // This filter runs FIRST to prioritize player health
    const biomechanicalResult = this.applyBiomechanicalFilter(filtered, profile);
    filtered = biomechanicalResult.safe;

    logger.info(
      `🛡️  BIOMECHANICAL FILTER: ${biomechanicalResult.discarded.length} rackets discarded for safety`
    );
    if (biomechanicalResult.discarded.length > 0) {
      logger.debug(`   Reasons: ${JSON.stringify(biomechanicalResult.reasons)}`);
    }
    logger.info(
      `✅ Safe rackets: ${filtered.length} (${Math.round((filtered.length / initialCount) * 100)}% of catalog)`
    );

    // If biomechanical filter leaves us with too few options, warn but continue
    if (filtered.length < 5) {
      logger.warn(
        `⚠️  Biomechanical filter left only ${filtered.length} safe options. Consider relaxing constraints.`
      );
    }

    // ===== PHASE 2: PERFORMANCE FILTERS =====

    // 1. Filter by budget
    filtered = this.filterByBudget(filtered, profile.budget);
    logger.info(`💰 After budget filter: ${filtered.length} rackets`);

    // 2. Filter by level (critical filter)
    filtered = this.filterByLevel(filtered, profile.level);
    logger.info(`🎯 After level filter: ${filtered.length} rackets`);

    // 3. Advanced filtering for advanced forms
    if ('play_style' in profile) {
      filtered = this.filterByPlayStyle(filtered, profile);
      logger.info(`⚡ After play style filter: ${filtered.length} rackets`);
    }

    // 4. Calculate match scores for remaining rackets
    const scored = filtered.map(racket => ({
      racket,
      score: this.calculateMatchScore(racket, profile),
    }));

    // 5. Sort by score and take top candidates
    scored.sort((a, b) => b.score - a.score);

    // 6. Ensure diversity (different brands, price ranges)
    const topCandidates = this.ensureDiversity(scored, 40);

    logger.info(`✅ Final filtered set: ${topCandidates.length} rackets`);
    return topCandidates.map(s => s.racket);
  }

  /**
   * BIOMECHANICAL FILTER (PHASE 1 - Strategic Report)
   * Descarts rackets that pose injury risk based on user profile
   * This is a NON-NEGOTIABLE filter that prioritizes player health
   */
  private static applyBiomechanicalFilter(
    rackets: Racket[],
    profile: BasicFormData | AdvancedFormData
  ): {
    safe: Racket[];
    discarded: Racket[];
    reasons: Record<string, number>;
  } {
    const safe: Racket[] = [];
    const discarded: Racket[] = [];
    const reasons: Record<string, number> = {};

    const hasInjuries = profile.injuries && profile.injuries !== 'no';
    const isBeginnerLevel =
      profile.level?.toLowerCase().includes('principiante') ||
      profile.level?.toLowerCase().includes('iniciación');

    // Calculate safe weight range based on profile
    const safeWeightRange = this.calculateSafeWeightRange(profile);

    for (const racket of rackets) {
      const r: any = racket;
      const discardReasons: string[] = [];

      // Extract racket characteristics with null-safe defaults
      const dureza = (r.caracteristicas_dureza || '').toLowerCase();
      const balance = (r.caracteristicas_balance || '').toLowerCase();
      const forma = (r.caracteristicas_forma || '').toLowerCase();

      // Only use peso if it exists and is a valid number
      const peso = typeof r.peso === 'number' && r.peso > 0 ? r.peso : null;

      // Only consider anti-vibration if explicitly set
      const hasAntiVibration = r.tiene_antivibracion === true;
      const antiVibrationDataAvailable =
        r.tiene_antivibracion !== null && r.tiene_antivibracion !== undefined;

      const confort = r.testea_confort || 0;

      // RULE 1: If user has injury history
      if (hasInjuries) {
        // Discard hard rackets ONLY if dureza data exists
        if (dureza && (dureza.includes('dura') || dureza.includes('hard'))) {
          discardReasons.push('dureza_dura_con_lesiones');
        }

        // Discard high balance rackets ONLY if balance data exists
        if (balance && (balance.includes('alto') || balance.includes('high'))) {
          discardReasons.push('balance_alto_con_lesiones');
        }

        // Only check anti-vibration if this data is available in the database
        // Skip this check if data is missing (null/undefined)
        if (antiVibrationDataAvailable && !hasAntiVibration) {
          discardReasons.push('sin_antivibracion_con_lesiones');
        }

        // Discard rackets with low comfort score (if Testea data available)
        if (confort > 0 && confort < 7) {
          discardReasons.push('confort_bajo_con_lesiones');
        }
      }

      // RULE 2: If user is beginner level
      if (isBeginnerLevel) {
        // Discard diamond shape ONLY if forma data exists
        if (forma && (forma.includes('diamante') || forma.includes('diamond'))) {
          discardReasons.push('diamante_para_principiante');
        }

        // Discard high balance ONLY if balance data exists
        if (balance && (balance.includes('alto') || balance.includes('high'))) {
          discardReasons.push('balance_alto_para_principiante');
        }

        // Discard heavy rackets ONLY if peso data is available
        if (peso !== null && peso > 370) {
          discardReasons.push('peso_excesivo_para_principiante');
        }
      }

      // RULE 3: Safe weight range - ONLY apply if peso data is available
      if (peso !== null && (peso < safeWeightRange.min || peso > safeWeightRange.max)) {
        discardReasons.push(
          `peso_fuera_rango_seguro_${safeWeightRange.min}-${safeWeightRange.max}g`
        );
      }

      // Classify racket
      if (discardReasons.length > 0) {
        discarded.push(racket);
        // Count reasons for logging
        discardReasons.forEach(reason => {
          reasons[reason] = (reasons[reason] || 0) + 1;
        });
      } else {
        safe.push(racket);
      }
    }

    return { safe, discarded, reasons };
  }

  /**
   * Calculate safe weight range based on user profile
   * Strategic Report baseline: 360-365g (men), 355g (women)
   * Adjusted by: physical condition, injuries, level
   */
  private static calculateSafeWeightRange(profile: BasicFormData | AdvancedFormData): {
    min: number;
    max: number;
  } {
    // Baseline by gender (Strategic Report convention)
    let baselineMax = 365; // Default for men
    if (profile.gender === 'femenino') {
      baselineMax = 360;
    }

    let min = 340; // Absolute minimum for adults
    let max = baselineMax;

    // Adjust for physical condition
    if (profile.physical_condition === 'ocasional') {
      max -= 5; // Reduce 5-10g for occasional athletes
    }

    // Adjust for skill level
    const isBeginnerLevel =
      profile.level?.toLowerCase().includes('principiante') ||
      profile.level?.toLowerCase().includes('iniciación');
    if (isBeginnerLevel) {
      max = Math.min(max, profile.gender === 'femenino' ? 360 : 365);
    }

    // Adjust for injuries (most restrictive)
    const hasInjuries = profile.injuries && profile.injuries !== 'no';
    if (hasInjuries) {
      max = Math.min(max, profile.gender === 'femenino' ? 355 : 360);
    }

    return { min, max };
  }

  /**
   * Filter by budget range
   * Supports both:
   * - Object: { min: number, max: number }
   * - Legacy: number or string (e.g., "200", "100-200", "150+")
   */
  private static filterByBudget(
    rackets: Racket[],
    budget: { min: number; max: number } | number | string
  ): Racket[] {
    // Handle object format { min, max }
    if (typeof budget === 'object' && budget !== null && 'min' in budget && 'max' in budget) {
      logger.info(`💰 Budget filter (range): €${budget.min} - €${budget.max}`);
      return rackets.filter((r: any) => {
        if (!r.precio_actual) return true; // Include rackets without price
        return r.precio_actual >= budget.min && r.precio_actual <= budget.max;
      });
    }

    // Legacy support: string or number
    const budgetStr = String(budget);

    if (budgetStr.includes('+')) {
      const minBudget = parseInt(budgetStr.replace('+', ''));
      logger.info(`💰 Budget filter (min): €${minBudget}+`);
      return rackets.filter((r: any) => !r.precio_actual || r.precio_actual >= minBudget);
    } else if (budgetStr.includes('-')) {
      const [min, max] = budgetStr.split('-').map(Number);
      logger.info(`💰 Budget filter (range): €${min} - €${max}`);
      return rackets.filter((r: any) => {
        if (!r.precio_actual) return true;
        return r.precio_actual >= min && r.precio_actual <= max;
      });
    } else {
      const maxBudget = parseInt(budgetStr);
      logger.info(`💰 Budget filter (max): ≤ €${maxBudget}`);
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
  private static filterByPlayStyle(rackets: Racket[], profile: AdvancedFormData): Racket[] {
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
        if (priceRatio <= 0.8)
          score += 20; // Good value
        else if (priceRatio <= 1.0) score += 15; // Within budget
      }
    }

    // 3. Play style match (20 points) - for advanced forms
    if ('play_style' in profile) {
      const playStyle = profile.play_style?.toLowerCase() || '';
      const forma = (racket.caracteristicas_forma || '').toLowerCase();
      const balance = (racket.caracteristicas_balance || '').toLowerCase();

      if (
        playStyle.includes('ofensivo') &&
        (forma.includes('diamante') || balance.includes('alto'))
      ) {
        score += 20;
      } else if (
        playStyle.includes('defensivo') &&
        (forma.includes('redonda') || balance.includes('bajo'))
      ) {
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
