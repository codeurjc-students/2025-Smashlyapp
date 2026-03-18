import axios from 'axios';
import {
  Racket,
  UserFormData,
  ComparisonResult,
} from '../types/racket';
import logger from '../config/logger';

export class GeminiService {
  constructor() {
    if (!process.env.FREE_AI_API_URL) {
      console.warn('FREE_AI_API_URL is not set in environment variables, using default');
    }
  }

  private get baseUrl(): string {
    return process.env.FREE_AI_API_URL || 'http://localhost:3001';
  }

  async compareRackets(rackets: Racket[], userProfile?: UserFormData): Promise<ComparisonResult> {
    if (!rackets || rackets.length < 2) {
      throw new Error('Se necesitan al menos 2 palas para comparar');
    }

    const racketsInfo = this.buildRacketsInfo(rackets);
    const userContext = this.buildUserContext(userProfile);
    const combinedPrompt = this.buildCombinedPrompt(rackets, racketsInfo, userContext);

    const maxRetries = 3;
    let lastError: any;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        console.log(`Intento ${attempt + 1} de ${maxRetries} para generar comparación vía Free AI API...`);

        const response = await axios.post(
          `${this.baseUrl}/chat`,
          {
            messages: [{ role: 'user', content: combinedPrompt }],
            stream: false // Using non-stream for simpler integration here
          },
          { timeout: 120000 }
        );

        const fullText = response.data.content || response.data;
        const comparisonResult = this.parseResponse(fullText, rackets);

        console.log('Comparación generada exitosamente');
        return comparisonResult;
      } catch (error: any) {
        lastError = error;
        const errorMessage = error.message || 'Error desconocido';

        const isRetryableError =
          errorMessage.includes('503') ||
          errorMessage.includes('overloaded') ||
          errorMessage.includes('429') ||
          errorMessage.includes('rate limit') ||
          error.code === 'ECONNABORTED';

        if (isRetryableError && attempt < maxRetries - 1) {
          const waitTime = Math.pow(2, attempt) * 1000;
          console.warn(
            `Free AI API temporalmente no disponible (intento ${attempt + 1}/${maxRetries}). ` +
              `Reintentando en ${waitTime / 1000}s...`
          );
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }

        console.error('Error calling Free AI API:', error);
        break;
      }
    }

    const errorMessage = lastError?.message || 'Error desconocido de Free AI API';
    throw new Error(`Error al generar la comparación con IA: ${errorMessage}`);
  }

  /**
   * Extrae los valores radar de la BD si existen.
   * Soporta tanto el formato frontend (español) como el formato raw de BD (inglés).
   */
  private getDbRadarValues(r: any): {
    potencia: number; control: number; manejabilidad: number;
    puntoDulce: number; salidaDeBola: number;
  } | null {
    // Los campos pueden venir del formato frontend (español) o del raw de BD
    const pot = r.radar_potencia ?? null;
    const con = r.radar_control ?? null;
    const man = r.radar_manejabilidad ?? null;
    const pd  = r.radar_punto_dulce ?? null;
    const sb  = r.radar_salida_bola ?? null;

    if (pot === null || con === null || man === null) return null;

    return {
      potencia:     Number(pot),
      control:      Number(con),
      manejabilidad: Number(man),
      puntoDulce:   pd !== null ? Number(pd) : 5,
      salidaDeBola: sb !== null ? Number(sb) : 5,
    };
  }

  private buildRacketsInfo(rackets: Racket[]): string {
    return rackets
      .map(
        (r: any, index) => {
          const dbRadar = this.getDbRadarValues(r);
          const radarLine = dbRadar
            ? `⚠️ VALORES RADAR FIJOS DE BD (NO MODIFICAR): Potencia:${dbRadar.potencia}, Control:${dbRadar.control}, Manejabilidad:${dbRadar.manejabilidad}, PuntoDulce:${dbRadar.puntoDulce}, SalidaBola:${dbRadar.salidaDeBola}`
            : 'Métricas Radar: No disponibles (estima basándote en forma y materiales)';

          return `PALA ${index + 1}:
Nombre: ${(r as any).nombre || (r as any).name}
Marca: ${r.marca || r.caracteristicas_marca || r.brand || 'N/A'}
Modelo: ${r.modelo || r.model || 'N/A'}
Forma: ${r.caracteristicas_forma || r.characteristics_shape || 'N/A'}
Goma: ${r.caracteristicas_nucleo || r.characteristics_core || 'N/A'}
Cara/Fibra: ${r.caracteristicas_cara || r.characteristics_face || 'N/A'}
Balance: ${r.caracteristicas_balance || r.characteristics_balance || 'N/A'}
Dureza: ${r.caracteristicas_dureza || r.characteristics_hardness || 'N/A'}
Nivel: ${r.caracteristicas_nivel_de_juego || r.characteristics_game_level || 'N/A'}
${radarLine}`;
        }
      )
      .join('\n\n');
  }

  private buildUserContext(userProfile?: UserFormData): string {
    if (!userProfile) return '';

    return `
CONTEXTO DEL USUARIO:
Nivel: ${userProfile.gameLevel || 'No especificado'}
Estilo: ${userProfile.playingStyle || 'No especificado'}
Preferencias: ${userProfile.preferences || 'No especificado'}`;
  }

  private buildCombinedPrompt(rackets: Racket[], racketsInfo: string, userContext: string): string {
    return `Eres "Smashly AI", un experto en materiales de palas de pádel.
Realiza un análisis técnico comparativo.

DATOS:
${racketsInfo}
${userContext}

SALIDA (JSON ESTRICTO):
{
  "_reasoning": "Análisis interno...",
  "executiveSummary": "Resumen...",
  "technicalAnalysis": [{ "title": "Potencia", "content": "..." }, ...],
  "comparisonTable": [{ "feature": "Forma", "${rackets[0]?.nombre || 'Pala 1'}": "...", "${rackets[1]?.nombre || 'Pala 2'}": "..." }],
  "metrics": [{ "racketId": 0, "racketName": "...", "radarData": { "potencia": 8, "control": 7, "manejabilidad": 6, "puntoDulce": 5, "salidaDeBola": 6 } }],
  "recommendedProfiles": "...",
  "biomechanicalConsiderations": "...",
  "conclusion": "..."
}

IMPORTANTE: Solo JSON, sin bloques de código markdown.`;
  }

  private parseResponse(fullText: string, rackets: Racket[]): ComparisonResult {
    let cleanText = fullText.trim();
    cleanText = cleanText.replace(/```json\n?/g, '').replace(/```\n?/g, '');

    try {
      const jsonMatch = cleanText.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Validar estructura básica de metrics
      if (!parsed.metrics || !Array.isArray(parsed.metrics)) {
        parsed.metrics = rackets.map((r: any) => ({
          racketId: r.id,
          racketName: (r as any).nombre || (r as any).name,
          isCertified: false,
          radarData: { potencia: 5, control: 5, manejabilidad: 5, puntoDulce: 5, salidaDeBola: 5 },
        }));
      }

      // ─────────────────────────────────────────────────────────────────────
      // OVERRIDE DE SEGURIDAD: Si la pala tiene valores radar en la BD,
      // los usamos SIEMPRE, ignorando lo que haya generado el LLM.
      // Esto garantiza consistencia entre comparaciones.
      // ─────────────────────────────────────────────────────────────────────
      parsed.metrics = parsed.metrics.map((metric: any, index: number) => {
        const racket = rackets[index] as any;
        if (!racket) return metric;

        const dbRadar = this.getDbRadarValues(racket);
        if (dbRadar) {
          return {
            ...metric,
            isCertified: true,
            radarData: {
              potencia:      dbRadar.potencia,
              control:       dbRadar.control,
              manejabilidad: dbRadar.manejabilidad,
              puntoDulce:    dbRadar.puntoDulce,
              salidaDeBola:  dbRadar.salidaDeBola,
            },
          };
        }
        return metric;
      });

      return {
        executiveSummary:            parsed.executiveSummary || '',
        technicalAnalysis:           parsed.technicalAnalysis || [],
        comparisonTable:             parsed.comparisonTable || [],
        metrics:                     parsed.metrics,
        recommendedProfiles:         parsed.recommendedProfiles || '',
        biomechanicalConsiderations: parsed.biomechanicalConsiderations || '',
        conclusion:                  parsed.conclusion || '',
        _reasoning:                  parsed._reasoning,
      };
    } catch (parseError) {
      console.error('Error parsing JSON:', parseError);
      return {
        executiveSummary: 'Error al procesar la comparación.',
        technicalAnalysis: [],
        comparisonTable: [],
        metrics: rackets.map((r: any) => {
          const dbRadar = this.getDbRadarValues(r);
          return {
            racketId:   r.id,
            racketName: (r as any).nombre || (r as any).name,
            isCertified: !!dbRadar,
            radarData:  dbRadar
              ? { potencia: dbRadar.potencia, control: dbRadar.control, manejabilidad: dbRadar.manejabilidad, puntoDulce: dbRadar.puntoDulce, salidaDeBola: dbRadar.salidaDeBola }
              : { potencia: 5, control: 5, manejabilidad: 5, puntoDulce: 5, salidaDeBola: 5 },
          };
        }),
        recommendedProfiles:         '',
        biomechanicalConsiderations: '',
        conclusion:                  '',
      };
    }
  }

  static async generateContent(prompt: string): Promise<string> {
    const service = new GeminiService();
    try {
      const response = await axios.post(`${service.baseUrl}/chat`, {
        messages: [{ role: 'user', content: prompt }],
        stream: false
      });
      return response.data.content || response.data;
    } catch (error: any) {
      throw new Error(`Error al generar contenido con IA: ${error.message}`);
    }
  }
}
