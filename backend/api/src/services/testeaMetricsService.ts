import { Racket } from '../types/racket';
import { TesteaMetrics } from '../types/recommendation';
import logger from '../config/logger';

/**
 * Service for managing Testea Pádel certified metrics
 * Provides the scientific foundation for the strategic recommendation system
 */
export class TesteaMetricsService {
  /**
   * Extract Testea Pádel certified metrics from a racket
   * Returns certified data if available, otherwise calculates fallback metrics
   */
  static getTesteaMetrics(racket: any): TesteaMetrics {
    // Check if racket has Testea certification
    if (this.hasTesteaCertification(racket)) {
      return {
        potencia: racket.testea_potencia || 5,
        control: racket.testea_control || 5,
        manejabilidad: racket.testea_manejabilidad || 5,
        confort: racket.testea_confort || 5,
        iniciacion: racket.testea_iniciacion,
        certificado: true,
      };
    }

    // Fallback: calculate estimated metrics from physical specifications
    return this.calculateFallbackMetrics(racket);
  }

  /**
   * Verify if a racket has Testea Pádel certification
   */
  static hasTesteaCertification(racket: any): boolean {
    return (
      racket.testea_certificado === true ||
      (racket.testea_potencia !== undefined &&
        racket.testea_control !== undefined &&
        racket.testea_manejabilidad !== undefined &&
        racket.testea_confort !== undefined)
    );
  }

  /**
   * Calculate fallback metrics based on physical specifications
   * Used when Testea Pádel data is not available
   */
  static calculateFallbackMetrics(racket: any): TesteaMetrics {
    const forma = (racket.caracteristicas_forma || '').toLowerCase();
    const balance = (racket.caracteristicas_balance || '').toLowerCase();
    const dureza = (racket.caracteristicas_dureza || '').toLowerCase();
    const peso = racket.peso || 365;

    // Potencia: influenced by shape (diamond=high), balance (high=high), weight (high=high)
    let potencia = 5;
    if (forma.includes('diamante')) potencia += 2;
    else if (forma.includes('lágrima')) potencia += 1;
    if (balance.includes('alto')) potencia += 2;
    else if (balance.includes('medio')) potencia += 1;
    if (peso > 370) potencia += 1;
    if (dureza.includes('dura')) potencia += 1;

    // Control: influenced by shape (round=high), balance (low=high), sweet spot
    let control = 5;
    if (forma.includes('redonda')) control += 2;
    else if (forma.includes('lágrima')) control += 1;
    if (balance.includes('bajo')) control += 2;
    else if (balance.includes('medio')) control += 1;
    if (dureza.includes('dura')) control += 1;

    // Manejabilidad: influenced by weight (low=high), balance (low=high)
    let manejabilidad = 5;
    if (peso < 360) manejabilidad += 2;
    else if (peso < 370) manejabilidad += 1;
    if (balance.includes('bajo')) manejabilidad += 2;
    else if (balance.includes('medio')) manejabilidad += 1;

    // Confort: influenced by hardness (soft=high), anti-vibration tech
    let confort = 5;
    if (dureza.includes('blanda') || dureza.includes('soft')) confort += 3;
    else if (dureza.includes('media')) confort += 1;
    if (racket.tiene_antivibracion) confort += 2;

    // Normalize to 0-10 range
    potencia = Math.min(Math.max(potencia, 0), 10);
    control = Math.min(Math.max(control, 0), 10);
    manejabilidad = Math.min(Math.max(manejabilidad, 0), 10);
    confort = Math.min(Math.max(confort, 0), 10);

    // Calculate iniciacion score (weighted for beginners: control + confort + manejabilidad)
    const iniciacion = Math.round(control * 0.3 + confort * 0.4 + manejabilidad * 0.3);

    logger.debug(
      `Calculated fallback metrics for ${racket.nombre}: ` +
        `Potencia=${potencia}, Control=${control}, Manejabilidad=${manejabilidad}, Confort=${confort}`
    );

    return {
      potencia,
      control,
      manejabilidad,
      confort,
      iniciacion,
      certificado: false,
    };
  }

  /**
   * Map user characteristic priority to Testea metric name
   */
  static mapCharacteristicToTestea(
    characteristic: 'potencia' | 'control' | 'manejabilidad' | 'salida_de_bola' | 'punto_dulce'
  ): keyof TesteaMetrics | null {
    const mapping: Record<string, keyof TesteaMetrics | null> = {
      potencia: 'potencia',
      control: 'control',
      manejabilidad: 'manejabilidad',
      salida_de_bola: null, // Correlates with hardness (soft=high), not a direct Testea metric
      punto_dulce: null, // Correlates with shape (round=wide), not a direct Testea metric
    };

    return mapping[characteristic] || null;
  }

  /**
   * Calculate derived metrics that correlate with physical properties
   */
  static calculateDerivedMetrics(racket: any): {
    salida_de_bola: 'baja' | 'media' | 'alta';
    punto_dulce: 'reducido' | 'medio' | 'amplio';
  } {
    const dureza = (racket.caracteristicas_dureza || '').toLowerCase();
    const forma = (racket.caracteristicas_forma || '').toLowerCase();

    // Salida de Bola: correlates with hardness (soft=high, hard=low)
    let salida_de_bola: 'baja' | 'media' | 'alta' = 'media';
    if (dureza.includes('blanda') || dureza.includes('soft')) {
      salida_de_bola = 'alta';
    } else if (dureza.includes('dura') || dureza.includes('hard')) {
      salida_de_bola = 'baja';
    }

    // Punto Dulce: correlates with shape (round=wide, diamond=narrow)
    let punto_dulce: 'reducido' | 'medio' | 'amplio' = 'medio';
    if (forma.includes('redonda')) {
      punto_dulce = 'amplio';
    } else if (forma.includes('diamante')) {
      punto_dulce = 'reducido';
    }

    return { salida_de_bola, punto_dulce };
  }

  /**
   * Get percentage of catalog with Testea certification
   */
  static getCertificationCoverage(rackets: any[]): {
    total: number;
    certified: number;
    percentage: number;
  } {
    const certified = rackets.filter(r => this.hasTesteaCertification(r)).length;
    const total = rackets.length;
    const percentage = total > 0 ? Math.round((certified / total) * 100) : 0;

    return { total, certified, percentage };
  }
}
