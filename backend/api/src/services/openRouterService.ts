import axios, { AxiosInstance } from 'axios';
import { Racket, UserFormData, ComparisonResult } from '../types/racket';
import logger from '../config/logger';
import { freeAiService } from './freeAiService';

// Interfaz para la respuesta de OpenRouter
interface OpenRouterResponse {
  id: string;
  model: string;
  choices: Array<{
    message: {
      content: string;
      role: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class OpenRouterService {
  private client: AxiosInstance;
  private apiKey: string;
  private appName: string;
  private appUrl: string;

  // Modelos disponibles en OpenRouter en orden de preferencia
  // Nota: Evitamos modelos `:free` que ya no tienen endpoints
  private readonly FREE_MODELS = [
    'stepfun/step-3.5-flash:free',
    'nvidia/nemotron-3-super-120b-a12b:free',
    'arcee-ai/trinity-large-preview:free',
    'z-ai/glm-4.5-air:free',
    'qwen/qwen3-coder:free',
  ];

  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY || '';
    this.appName = process.env.OPENROUTER_APP_NAME || 'Smashly';
    this.appUrl = process.env.OPENROUTER_APP_URL || 'https://smashly.app';

    if (!this.apiKey) {
      logger.warn('OPENROUTER_API_KEY is not set in environment variables');
    }

    this.client = axios.create({
      baseURL: 'https://openrouter.ai/api/v1',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'HTTP-Referer': this.appUrl,
        'X-Title': this.appName,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Genera contenido usando sistema híbrido (Free AI API -> OpenRouter Fallback)
   */
  static async generateContent(prompt: string): Promise<string> {
    const service = new OpenRouterService();
    return service.generateContentHybrid(prompt);
  }

  /**
   * Estrategia híbrida: Intenta Free AI API primero y OpenRouter como respaldo.
   */
  private async generateContentHybrid(prompt: string): Promise<string> {
    // 1. Intentar con Free AI API (Local/Custom)
    try {
      const content = await freeAiService.generateContent(prompt);
      if (content && content.length > 0) {
        return content;
      }
    } catch (error) {
      logger.warn(`⚠️ Free AI API not available, falling back to OpenRouter: ${error}`);
    }

    // 2. Check if OpenRouter key is available
    if (!this.apiKey) {
      throw new Error(
        'Error al generar contenido con IA: Free AI API no disponible y OPENROUTER_API_KEY no está configurada'
      );
    }

    // 3. Fallback a OpenRouter
    return this.generateContentOpenRouterFallback(prompt);
  }

  /**
   * Genera contenido con fallback automático entre modelos gratuitos de OpenRouter
   */
  private async generateContentOpenRouterFallback(prompt: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('OPENROUTER_API_KEY no está configurada en el servidor');
    }

    let lastError: any;

    // Intentar cada modelo en orden
    for (let modelIndex = 0; modelIndex < this.FREE_MODELS.length; modelIndex++) {
      const model = this.FREE_MODELS[modelIndex];

      try {
        logger.info(
          `🤖 [OpenRouter] Attempting model ${modelIndex + 1}/${this.FREE_MODELS.length}: ${model}`
        );

        const response = await this.client.post<OpenRouterResponse>('/chat/completions', {
          model,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 4000,
        });

        const content = response.data.choices[0]?.message?.content;

        if (!content) {
          throw new Error('Empty response from model');
        }

        // Log éxito y estadísticas
        logger.info(`✅ [OpenRouter] Success with model: ${model}`);
        if (response.data.usage) {
          logger.info(
            `📊 Tokens used: ${response.data.usage.total_tokens} ` +
              `(prompt: ${response.data.usage.prompt_tokens}, ` +
              `completion: ${response.data.usage.completion_tokens})`
          );
        }

        return content;
      } catch (error: any) {
        lastError = error;
        const errorMessage =
          error.response?.data?.error?.message || error.message || 'Unknown error';

        logger.warn(
          `❌ [OpenRouter] Model ${model} failed: ${errorMessage}. ` +
            `Trying next model (${modelIndex + 1}/${this.FREE_MODELS.length})...`
        );

        // Si no es el último modelo, continuar con el siguiente
        if (modelIndex < this.FREE_MODELS.length - 1) {
          // Pequeña pausa antes de intentar el siguiente modelo
          await new Promise(resolve => setTimeout(resolve, 500));
          continue;
        }
      }
    }

    // Si llegamos aquí, todos los modelos fallaron
    const errorMessage =
      lastError?.response?.data?.error?.message ||
      lastError?.message ||
      'Error desconocido de OpenRouter';

    logger.error('❌ All models failed. Last error:', errorMessage);
    throw new Error(`Error al generar contenido con IA: ${errorMessage}`);
  }

  /**
   * Compara palas usando sistema híbrido con formato estructurado
   */
  async compareRackets(rackets: Racket[], userProfile?: UserFormData): Promise<ComparisonResult> {
    if (!rackets || rackets.length < 2) {
      throw new Error('Se necesitan al menos 2 palas para comparar');
    }

    // Construir información de las palas de forma optimizada
    const racketsInfo = this.buildRacketsInfo(rackets);
    const userContext = this.buildUserContext(userProfile);

    // Construir un único prompt que incluya tanto la comparación textual como las métricas
    const combinedPrompt = this.buildCombinedPrompt(rackets, racketsInfo, userContext);

    // 1. Intentar con Free AI API
    try {
      const fullText = await freeAiService.generateContent(combinedPrompt);
      if (fullText) {
        const result = this.parseStructuredResponse(fullText, rackets);
        logger.info('✅ Comparison generated successfully with Free AI API');
        return result;
      }
    } catch (error) {
      logger.warn(`⚠️ Free AI API not available, falling back to OpenRouter: ${error}`);
    }

    // 2. Check if OpenRouter key is available
    if (!this.apiKey) {
      throw new Error(
        'Error al generar la comparación con IA: Free AI API no disponible y OPENROUTER_API_KEY no está configurada'
      );
    }

    // 3. Fallback a OpenRouter
    return this.compareRacketsOpenRouterFallback(combinedPrompt, rackets);
  }

  private async compareRacketsOpenRouterFallback(
    prompt: string,
    rackets: Racket[]
  ): Promise<ComparisonResult> {
    if (!this.apiKey) {
      throw new Error('OPENROUTER_API_KEY no está configurada en el servidor');
    }

    let lastError: any;

    for (let modelIndex = 0; modelIndex < this.FREE_MODELS.length; modelIndex++) {
      const model = this.FREE_MODELS[modelIndex];

      try {
        logger.info(
          `🤖 [OpenRouter] Comparing rackets with model ${modelIndex + 1}/${this.FREE_MODELS.length}: ${model}`
        );

        const response = await this.client.post<OpenRouterResponse>('/chat/completions', {
          model,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 4000,
        });

        const fullText = response.data.choices[0]?.message?.content;

        if (!fullText) {
          throw new Error('Empty response from model');
        }

        // Parsear la respuesta estructurada
        const comparisonResult = this.parseStructuredResponse(fullText, rackets);

        logger.info(`✅ [OpenRouter] Comparison generated successfully with model: ${model}`);
        return comparisonResult;
      } catch (error: any) {
        lastError = error;
        const errorMessage =
          error.response?.data?.error?.message || error.message || 'Unknown error';

        logger.warn(
          `❌ [OpenRouter] Model ${model} failed for comparison: ${errorMessage}. ` +
            `Trying next model (${modelIndex + 1}/${this.FREE_MODELS.length})...`
        );

        // Si no es el último modelo, continuar con el siguiente
        if (modelIndex < this.FREE_MODELS.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
          continue;
        }
      }
    }

    // Si llegamos aquí, todos los modelos fallaron
    const errorMessage =
      lastError?.response?.data?.error?.message ||
      lastError?.message ||
      'Error desconocido de OpenRouter';

    logger.error('❌ All models failed for comparison. Last error:', errorMessage);
    throw new Error(`Error al generar la comparación con IA: ${errorMessage}`);
  }

  /**
   * Extrae los valores radar de la BD si existen.
   * Soporta tanto el formato frontend (español) como el formato raw de BD (inglés).
   */
  private getDbRadarValues(r: any): {
    potencia: number;
    control: number;
    manejabilidad: number;
    puntoDulce: number;
    salidaDeBola: number;
  } | null {
    const pot = r.radar_potencia ?? null;
    const con = r.radar_control ?? null;
    const man = r.radar_manejabilidad ?? null;
    const pd = r.radar_punto_dulce ?? null;
    const sb = r.radar_salida_bola ?? null;

    if (pot === null || con === null || man === null) return null;

    return {
      potencia: Number(pot),
      control: Number(con),
      manejabilidad: Number(man),
      puntoDulce: pd !== null ? Number(pd) : 5,
      salidaDeBola: sb !== null ? Number(sb) : 5,
    };
  }

  private buildRacketsInfo(rackets: Racket[]): string {
    return rackets
      .map((r: any, index) => {
        const hasTesteaMetrics = [
          r.testea_potencia,
          r.testea_control,
          r.testea_manejabilidad,
          r.testea_confort,
        ].some(value => value !== null && value !== undefined);
        const testeaLine = `Testea Certificado: ${hasTesteaMetrics ? 'SÍ' : 'NO'}`;

        const dbRadar = this.getDbRadarValues(r);
        const radarLine = dbRadar
          ? `⚠️ VALORES RADAR FIJOS DE BD (NO MODIFICAR): Pot:${dbRadar.potencia}, Con:${dbRadar.control}, Man:${dbRadar.manejabilidad}, PD:${dbRadar.puntoDulce}, SB:${dbRadar.salidaDeBola}`
          : 'Métricas Radar: No disponibles (estima basándote en forma y materiales)';

        return `PALA ${index + 1}:
Nombre: ${r.nombre || r.name}
Marca: ${r.marca || r.caracteristicas_marca || r.brand || 'N/A'}
Modelo: ${r.modelo || r.model || 'N/A'}
Forma: ${r.caracteristicas_forma || r.characteristics_shape || 'N/A'}
Goma: ${r.caracteristicas_nucleo || r.characteristics_core || 'N/A'}
Cara/Fibra: ${r.caracteristicas_cara || r.characteristics_face || 'N/A'}
Balance: ${r.caracteristicas_balance || r.characteristics_balance || 'N/A'}
Dureza: ${r.caracteristicas_dureza || r.characteristics_hardness || 'N/A'}
Nivel: ${r.caracteristicas_nivel_de_juego || r.characteristics_game_level || 'N/A'}
${testeaLine}
${radarLine}`;
      })
      .join('\n\n');
  }

  private buildUserContext(userProfile?: UserFormData): string {
    if (!userProfile) return '';

    return `
CONTEXTO DEL USUARIO:
Nivel: ${userProfile.gameLevel || 'No especificado'}
Estilo: ${userProfile.playingStyle || 'No especificado'}
Físico: ${userProfile.weight || ''} ${userProfile.height || ''} (Edad: ${userProfile.age || ''})
Experiencia: ${userProfile.experience || 'No especificada'}
Preferencias: ${userProfile.preferences || 'No especificadas'}
`;
  }

  private buildCombinedPrompt(rackets: Racket[], racketsInfo: string, userContext: string): string {
    return `CONTEXTO DEL SISTEMA:
Eres "Smashly AI", un ex-jugador profesional de pádel, entrenador de élite y experto en biomecánica y materiales de palas (carbono 3K/12K/18K, fibra de vidrio, gomas EVA Soft/Hard).
Tu objetivo es realizar un análisis técnico profundo y comparativo entre las palas solicitadas.

REGLAS DE DOMINIO (PÁDEL):
- Palas Diamante: Balance alto, máximo estrés en el brazo (riesgo de epicondilitis), potencia pura, punto dulce pequeño y superior. Para jugadores ofensivos.
- Palas Redondas: Balance bajo, máxima manejabilidad y control, punto dulce amplio y centrado.
- Palas Lágrima/Gota: Polivalentes, balance medio.
- Materiales: Carbono 18K es más rígido (menos salida de bola a baja velocidad, más potencia en golpes fuertes) que el 3K o Fibra de Vidrio. Gomas Hard aportan control y potencia en bloqueos; Soft aportan salida de bola y confort.

DATOS DE ENTRADA:
${racketsInfo}

${userContext}

INSTRUCCIONES DE SALIDA (JSON ESTRICTO):
Debes generar un único objeto JSON válido sin texto markdown adicional fuera de él. Su estructura DEBE ser EXACTAMENTE esta:

{
  "_reasoning": "ESPACIO PARA CHAIN-OF-THOUGHT. Analiza paso a paso los materiales, forma y nivel de cada pala. Deduce características faltantes basadas en el nombre (ej. 18K = tacto duro). Piensa cómo se adaptan al usuario antes de rellenar el resto del JSON.",
  "executiveSummary": "2-3 frases resumiendo contundentemente la comparativa.",
  "technicalAnalysis": [
    { "title": "Potencia", "content": "Análisis comparativo de potencia basado en los materiales y forma." },
    { "title": "Control", "content": "..." },
    { "title": "Manejabilidad", "content": "..." },
    { "title": "Confort", "content": "..." }
  ],
  "comparisonTable": [
    { "feature": "Forma", "${(rackets[0] as any)?.nombre || (rackets[0] as any)?.name || 'Pala 1'}": "...", "${(rackets[1] as any)?.nombre || (rackets[1] as any)?.name || 'Pala 2'}": "..." }
  ],
  "metrics": [
    {
      "racketId": 0,
      "racketName": "${(rackets[0] as any)?.nombre || (rackets[0] as any)?.name || 'Pala 1'}",
      "isCertified": true,
      "radarData": {
        "potencia": 8,
        "control": 7,
        "manejabilidad": 6,
        "puntoDulce": 5,
        "salidaDeBola": 6
      }
    }
  ],
  "recommendedProfiles": "Describe qué tipo de jugador (nivel, agresivo/defensivo) se beneficia de cada pala.",
  "biomechanicalConsiderations": "Menciona riesgos de lesiones (ej: codo de tenista) considerando el balance y la dureza de las palas.",
  "conclusion": "Un veredicto final directo recomendando la pala más adecuada según el contexto del usuario (si se proporcionó)."
}

IMPORTANTE: 
1. El output debe ser parseable por JSON.parse(). No uses \`\`\`json al principio ni al final.
2. NUNCA cambies los nombres de las claves en 'radarData' (usa puntoDulce y salidaDeBola SIEMPRE).
3. Incluye al menos 6 características clave en 'comparisonTable' (Peso, Balance, Forma, Tacto, Punto Dulce, Precio).`;
  }

  /**
   * Parsea la respuesta estructurada en formato JSON
   */
  private parseStructuredResponse(fullText: string, rackets: Racket[]): ComparisonResult {
    let cleanText = fullText.trim();
    cleanText = cleanText.replace(/```json\n?/g, '').replace(/```\n?/g, '');

    const jsonMatch = cleanText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      logger.error('No JSON found in response');
      throw new Error('Invalid response format: No JSON found');
    }

    try {
      const parsed = JSON.parse(jsonMatch[0]);

      // Validar estructura básica
      if (!parsed.metrics || !Array.isArray(parsed.metrics)) {
        parsed.metrics = rackets.map((r: any) => ({
          racketId: r.id,
          racketName: r.nombre || r.name,
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
              potencia: dbRadar.potencia,
              control: dbRadar.control,
              manejabilidad: dbRadar.manejabilidad,
              puntoDulce: dbRadar.puntoDulce,
              salidaDeBola: dbRadar.salidaDeBola,
            },
          };
        }
        return metric;
      });

      // Validar comparisonTable (asegurar array)
      if (!parsed.comparisonTable || !Array.isArray(parsed.comparisonTable)) {
        parsed.comparisonTable = [];
      }

      // Normalizar comparisonTable para que las keys coincidan con metrics.racketName
      parsed.comparisonTable = this.normalizeComparisonTable(
        parsed.comparisonTable,
        parsed.metrics
      );

      return {
        executiveSummary: parsed.executiveSummary || '',
        technicalAnalysis: parsed.technicalAnalysis || [],
        comparisonTable: parsed.comparisonTable,
        metrics: parsed.metrics,
        recommendedProfiles: parsed.recommendedProfiles || '',
        biomechanicalConsiderations: parsed.biomechanicalConsiderations || '',
        conclusion: parsed.conclusion || '',
      };
    } catch (parseError) {
      logger.error('Error parsing structured JSON:', parseError);

      return {
        executiveSummary: 'Error al procesar la comparación.',
        technicalAnalysis: [],
        comparisonTable: [],
        metrics: rackets.map((r: any) => {
          const dbRadar = this.getDbRadarValues(r);
          return {
            racketId: r.id,
            racketName: r.nombre || r.name,
            isCertified: !!dbRadar,
            radarData: dbRadar
              ? {
                  potencia: dbRadar.potencia,
                  control: dbRadar.control,
                  manejabilidad: dbRadar.manejabilidad,
                  puntoDulce: dbRadar.puntoDulce,
                  salidaDeBola: dbRadar.salidaDeBola,
                }
              : { potencia: 5, control: 5, manejabilidad: 5, puntoDulce: 5, salidaDeBola: 5 },
          };
        }),
        recommendedProfiles: '',
        biomechanicalConsiderations: '',
        conclusion: '',
      };
    }
  }

  /**
   * Normaliza las keys de comparisonTable para que coincidan exactamente con metrics.racketName
   */
  private normalizeComparisonTable(comparisonTable: any[], metrics: any[]): any[] {
    if (!comparisonTable || !metrics || metrics.length === 0) {
      return comparisonTable || [];
    }

    // Obtener los nombres exactos de las palas desde metrics
    const racketNames = metrics.map((m: any) => m.racketName);

    return comparisonTable.map((row: any) => {
      if (!row || typeof row !== 'object') return row;

      const newRow: any = { feature: row.feature };

      // Para cada pala en metrics, buscar la key que coincida
      metrics.forEach((metric: any, index: number) => {
        const exactName = metric.racketName;
        newRow[exactName] = null; // Valor por defecto

        // Buscar en las keys existentes del row
        Object.keys(row).forEach((key: string) => {
          if (key === 'feature') return;

          // Verificar coincidencia exacta o parcial
          const keyLower = key.toLowerCase().trim();
          const exactLower = exactName.toLowerCase().trim();

          // Coincidencia exacta
          if (keyLower === exactLower) {
            newRow[exactName] = row[key];
          }
          // Coincidencia parcial (la key contiene el nombre o viceversa)
          else if (
            keyLower.includes(exactLower) ||
            exactLower.includes(keyLower) ||
            this.areSimilarStrings(keyLower, exactLower)
          ) {
            // Solo asignar si no hay valor todavía
            if (!newRow[exactName]) {
              newRow[exactName] = row[key];
            }
          }
        });
      });

      return newRow;
    });
  }

  /**
   * Compara dos strings y determina si son similares (para maneja variantes de nombres)
   */
  private areSimilarStrings(a: string, b: string): boolean {
    // Eliminar números de año y espacios extra
    const normalize = (s: string) => s.replace(/\d{4}/g, '').replace(/\s+/g, ' ').trim();
    const na = normalize(a);
    const nb = normalize(b);

    // Si son iguales después de normalizar
    if (na === nb) return true;

    // Si una contiene a la otra
    if (na.includes(nb) || nb.includes(na)) return true;

    // Verificar primeras palabras (para "AT10" vs "AT10 2024")
    const wordsA = na.split(' ');
    const wordsB = nb.split(' ');
    if (wordsA[0] === wordsB[0]) return true;

    return false;
  }
}
