import axios, { AxiosInstance } from 'axios';
import { Racket, UserFormData } from '../types/racket';
import logger from '../config/logger';

// Interfaz para las métricas de cada pala
export interface RacketMetrics {
  racketName: string;
  potencia: number;
  control: number;
  salidaDeBola: number;
  manejabilidad: number;
  puntoDulce: number;
}

// Interfaz para la respuesta de comparación completa
export interface ComparisonResult {
  textComparison: string;
  metrics: RacketMetrics[];
}

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

  // Modelos gratuitos en orden de preferencia
  private readonly FREE_MODELS = [
    'google/gemini-2.0-flash-exp:free',
    'meta-llama/llama-3.3-70b-instruct:free',
    'mistralai/mistral-small-3.1:free',
    'deepseek/deepseek-r1-distill-llama-70b:free',
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
   * Genera contenido usando OpenRouter con sistema de fallback
   */
  static async generateContent(prompt: string): Promise<string> {
    const service = new OpenRouterService();
    return service.generateContentWithFallback(prompt);
  }

  /**
   * Genera contenido con fallback automático entre modelos gratuitos
   */
  private async generateContentWithFallback(prompt: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('OPENROUTER_API_KEY no está configurada en el servidor');
    }

    let lastError: any;

    // Intentar cada modelo en orden
    for (let modelIndex = 0; modelIndex < this.FREE_MODELS.length; modelIndex++) {
      const model = this.FREE_MODELS[modelIndex];

      try {
        logger.info(`🤖 Attempting model ${modelIndex + 1}/${this.FREE_MODELS.length}: ${model}`);

        const response = await this.client.post<OpenRouterResponse>('/chat/completions', {
          model: model,
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
        logger.info(`✅ Success with model: ${model}`);
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
          `❌ Model ${model} failed: ${errorMessage}. ` +
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
   * Compara palas usando OpenRouter
   */
  async compareRackets(rackets: Racket[], userProfile?: UserFormData): Promise<ComparisonResult> {
    if (!this.apiKey) {
      throw new Error('OPENROUTER_API_KEY no está configurada en el servidor');
    }

    if (!rackets || rackets.length < 2) {
      throw new Error('Se necesitan al menos 2 palas para comparar');
    }

    // Construir información de las palas de forma optimizada
    const racketsInfo = this.buildRacketsInfo(rackets);
    const userContext = this.buildUserContext(userProfile);

    // Construir un único prompt que incluya tanto la comparación textual como las métricas
    const combinedPrompt = this.buildCombinedPrompt(rackets, racketsInfo, userContext);

    // Implementar reintentos con fallback entre modelos
    let lastError: any;

    for (let modelIndex = 0; modelIndex < this.FREE_MODELS.length; modelIndex++) {
      const model = this.FREE_MODELS[modelIndex];

      try {
        logger.info(
          `🤖 Comparing rackets with model ${modelIndex + 1}/${this.FREE_MODELS.length}: ${model}`
        );

        const response = await this.client.post<OpenRouterResponse>('/chat/completions', {
          model: model,
          messages: [
            {
              role: 'user',
              content: combinedPrompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 4000,
        });

        const fullText = response.data.choices[0]?.message?.content;

        if (!fullText) {
          throw new Error('Empty response from model');
        }

        // Separar la comparación textual de las métricas JSON
        const { textComparison, metrics } = this.parseResponse(fullText, rackets);

        logger.info(`✅ Comparison generated successfully with model: ${model}`);
        return { textComparison, metrics };
      } catch (error: any) {
        lastError = error;
        const errorMessage =
          error.response?.data?.error?.message || error.message || 'Unknown error';

        logger.warn(
          `❌ Model ${model} failed for comparison: ${errorMessage}. ` +
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

  private buildRacketsInfo(rackets: Racket[]): string {
    return rackets
      .map(
        (r: any, index) => `PALA ${index + 1}:
Nombre: ${r.nombre}
Marca: ${r.marca || r.caracteristicas_marca || 'N/A'}
Modelo: ${r.modelo || 'N/A'}
Enlace: ${r.enlace || r.url || 'N/A'}
Forma: ${r.caracteristicas_forma || r.caracteristicas_formato || 'N/A'}
Goma: ${r.caracteristicas_nucleo || 'N/A'}
Cara/Fibra: ${r.caracteristicas_cara || 'N/A'}
Balance: ${r.caracteristicas_balance || 'N/A'}
Dureza: ${r.caracteristicas_dureza || 'N/A'}
Peso: ${r.peso ? `${r.peso}g` : 'N/A'}
Nivel: ${r.caracteristicas_nivel_de_juego || 'N/A'}
Precio: ${r.precio_actual ? `€${r.precio_actual}` : 'N/A'}`
      )
      .join('\n\n');
  }

  private buildUserContext(userProfile?: UserFormData): string {
    if (!userProfile) return '';

    return `
CONTEXTO DEL USUARIO:
El usuario que solicita la comparación tiene las siguientes características:
Nivel de juego: ${userProfile.gameLevel || 'No especificado'}
Estilo de juego: ${userProfile.playingStyle || 'No especificado'}
Peso: ${userProfile.weight || 'No especificado'}
Altura: ${userProfile.height || 'No especificado'}
Edad: ${userProfile.age || 'No especificado'}
Experiencia: ${userProfile.experience || 'No especificado'}
Preferencias: ${userProfile.preferences || 'No especificado'}

Por favor, ten en cuenta estas características en la sección "Veredicto Situacional" y "Conclusión Final" para recomendar qué pala se ajusta mejor a este usuario específico.`;
  }

  private buildCombinedPrompt(rackets: Racket[], racketsInfo: string, userContext: string): string {
    const racketNames = rackets
      .map((r: any, i) => `${i + 1}. ${r.nombre || `Pala ${i + 1}`}`)
      .join('\n');

    // Build Testea metrics info for each racket
    const testeaInfo = rackets
      .map((r: any, i) => {
        const hasCertification = r.testea_potencia !== undefined && r.testea_potencia !== null;
        if (hasCertification) {
          return `PALA ${i + 1} - MÉTRICAS CERTIFICADAS TESTEA PÁDEL:
- Potencia: ${r.testea_potencia}/10
- Control: ${r.testea_control}/10
- Manejabilidad: ${r.testea_manejabilidad}/10
- Confort: ${r.testea_confort}/10
- Iniciación: ${r.testea_iniciacion || 'N/A'}/10`;
        } else {
          return `PALA ${i + 1} - SIN CERTIFICACIÓN TESTEA (usar estimaciones basadas en especificaciones físicas)`;
        }
      })
      .join('\n\n');

    return `CONTEXTO DEL SISTEMA:
Eres el motor de comparación de "Smashly", una plataforma experta en palas de pádel que prioriza la salud biomecánica del jugador y la transparencia científica.

PRINCIPIOS IRRENUNCIABLES:
1. Seguridad Biomecánica Primero: Destaca riesgos potenciales de lesión (palas duras, balance alto, peso excesivo)
2. Verdad Objetiva: Prioriza métricas certificadas de Testea Pádel sobre estimaciones
3. Transparencia Total: Indica claramente qué datos son certificados vs estimados

PALAS A COMPARAR:
${racketNames}

NOTA IMPORTANTE: Cada pala incluye un "Enlace" que es la URL oficial del producto. Usa este enlace como referencia definitiva para identificar exactamente a qué pala te refieres. Los enlaces garantizan que estás comparando las palas correctas.

DATOS TÉCNICOS COMPLETOS:
${racketsInfo}

${testeaInfo}

${userContext}

INSTRUCCIONES PARA LA COMPARACIÓN:

1. **Estructura de la Comparación** (formato markdown):
   - 📊 **Resumen Ejecutivo**: Diferencia clave entre las palas en 2-3 líneas
   - 🔬 **Análisis Técnico por Categorías**:
     * Potencia y Salida de Bola
     * Control y Precisión
     * Manejabilidad y Peso
     * Confort y Prevención de Lesiones (CRÍTICO)
   - 📋 **Tabla Comparativa**: Características clave lado a lado
   - 👤 **Perfiles Recomendados**: Qué tipo de jugador se beneficia de cada pala
   - 🛡️ **Consideraciones Biomecánicas**: Advertencias sobre lesiones para cada pala
   - ✅ **Conclusión Final**: Recomendación basada en el perfil del usuario (si se proporcionó)

2. **Consideraciones Biomecánicas OBLIGATORIAS**:
   - Menciona si alguna pala es dura (riesgo de epicondilitis)
   - Menciona si alguna tiene balance alto (mayor estrés en brazo/hombro)
   - Menciona si alguna es pesada (>370g puede causar fatiga y lesiones)
   - Destaca si alguna tiene tecnología anti-vibración
   - Recomienda palas más seguras para jugadores con lesiones previas

3. **Uso de Métricas Testea**:
   - Si una pala tiene certificación Testea, ÚSALA y menciona que es "dato certificado"
   - Si no tiene certificación, estima basándote en especificaciones físicas y menciona que es "estimación"
   - Diferencia claramente entre datos duros y estimaciones

4. **Formato y Estilo**:
   - Usa emojis para mejorar legibilidad
   - Sé conciso pero informativo (máximo 600 palabras)
   - Usa negritas para destacar puntos clave
   - Incluye advertencias ⚠️ para riesgos biomecánicos

FORMATO DE RESPUESTA OBLIGATORIO:
Responde con markdown seguido de un separador y luego JSON de métricas.

Estructura:
[Tu comparación en markdown aquí]

===METRICS===
[
{"racketName": "Nombre exacto pala 1", "potencia": 8, "control": 7, "salidaDeBola": 6, "manejabilidad": 9, "puntoDulce": 7},
{"racketName": "Nombre exacto pala 2", "potencia": 9, "control": 6, "salidaDeBola": 5, "manejabilidad": 7, "puntoDulce": 6}
]

MÉTRICAS (escala 1-10):
- Potencia: Velocidad de bola generada
- Control: Precisión y dominio del golpeo
- Salida de Bola: Facilidad de impulsión (correlaciona con dureza)
- Manejabilidad: Agilidad y facilidad de manejo
- Punto Dulce: Tamaño del área efectiva de golpeo

IMPORTANTE: Si una pala tiene métricas Testea certificadas, usa esos valores exactos. Si no, estima basándote en las especificaciones físicas.

RESPONDE AHORA:`;
  }

  private parseResponse(
    fullText: string,
    rackets: Racket[]
  ): { textComparison: string; metrics: RacketMetrics[] } {
    // Intentar separar la comparación textual de las métricas JSON
    const metricsMarkerIndex = fullText.lastIndexOf('===METRICS===');
    let textComparison: string;
    let metricsText: string;

    if (metricsMarkerIndex !== -1) {
      textComparison = fullText.substring(0, metricsMarkerIndex).trim();
      metricsText = fullText.substring(metricsMarkerIndex + '===METRICS==='.length).trim();
    } else {
      // Si no encuentra el marcador, buscar el último bloque JSON
      const jsonMatch = fullText.match(/\[[\s\S]*\{[\s\S]*"racketName"[\s\S]*\}[\s\S]*\]/);
      if (jsonMatch) {
        const jsonStartIndex = jsonMatch.index!;
        textComparison = fullText.substring(0, jsonStartIndex).trim();
        metricsText = jsonMatch[0];
      } else {
        textComparison = fullText;
        metricsText = '';
      }
    }

    // Limpiar y parsear las métricas
    metricsText = metricsText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    let metrics: RacketMetrics[];
    try {
      metrics = JSON.parse(metricsText);
    } catch (parseError) {
      logger.error('Error parsing metrics JSON:', parseError);
      logger.error('Raw metrics text:', metricsText);
      // Valores por defecto si falla el parsing
      metrics = rackets.map((r: any) => ({
        racketName: r.nombre || r.name || 'Pala',
        potencia: 5,
        control: 5,
        salidaDeBola: 5,
        manejabilidad: 5,
        puntoDulce: 5,
      }));
    }

    return { textComparison, metrics };
  }
}
