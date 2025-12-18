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

// Interfaz para subsecciones de la comparación
export interface ComparisonSection {
  title: string;
  content: string;
  subsections?: ComparisonSection[];
}

// Interfaz para la respuesta de comparación completa (estructurada)
export interface ComparisonResult {
  executiveSummary: string;
  technicalAnalysis: ComparisonSection[];
  comparisonTable?: string; // Markdown table
  recommendedProfiles: string;
  biomechanicalConsiderations: string;
  conclusion: string;
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
    'mistralai/mistral-nemo:free',
    'qwen/qwen-2.5-7b-instruct:free',
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
   * Compara palas usando OpenRouter con formato estructurado
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

        // Parsear la respuesta estructurada
        const comparisonResult = this.parseStructuredResponse(fullText, rackets);

        logger.info(`✅ Comparison generated successfully with model: ${model}`);
        return comparisonResult;
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

NOTA IMPORTANTE: Cada pala incluye un "Enlace" que es la URL oficial del producto. Usa este enlace como referencia definitiva para identificar exactamente a qué pala te refieres.

DATOS TÉCNICOS COMPLETOS:
${racketsInfo}

${testeaInfo}

${userContext}

INSTRUCCIONES PARA LA COMPARACIÓN:

Debes generar una respuesta en formato JSON estructurado con las siguientes secciones:

1. **executiveSummary** (string): Resumen ejecutivo de 2-3 líneas con la diferencia clave entre las palas

2. **technicalAnalysis** (array de objetos): Análisis técnico dividido en categorías. Cada objeto tiene:
   - title: Nombre de la categoría
   - content: Análisis detallado en formato markdown (sin emojis en headers)
   - subsections: (opcional) Array de subsecciones con mismo formato
   
   Categorías requeridas:
   - "Potencia y Salida de Bola"
   - "Control y Precisión"
   - "Manejabilidad y Peso"
   - "Confort y Prevención de Lesiones"

3. **comparisonTable** (string): Tabla comparativa en formato markdown con características clave lado a lado

4. **recommendedProfiles** (string): Descripción de qué tipo de jugador se beneficia de cada pala (formato markdown)

5. **biomechanicalConsiderations** (string): Advertencias sobre lesiones y consideraciones biomecánicas para cada pala (formato markdown). OBLIGATORIO mencionar:
   - Si alguna pala es dura (riesgo de epicondilitis)
   - Si alguna tiene balance alto (mayor estrés en brazo/hombro)
   - Si alguna es pesada (>370g puede causar fatiga y lesiones)
   - Si alguna tiene tecnología anti-vibración
   - Recomendaciones para jugadores con lesiones previas

6. **conclusion** (string): Conclusión final con recomendación basada en el perfil del usuario si se proporcionó (formato markdown)

7. **metrics** (array): Array de objetos con métricas numéricas para cada pala:
   - racketName: Nombre exacto de la pala
   - potencia: 1-10
   - control: 1-10
   - salidaDeBola: 1-10
   - manejabilidad: 1-10
   - puntoDulce: 1-10

IMPORTANTE: 
- NO uses emojis en ninguna parte de la respuesta
- Usa formato markdown para negritas (**texto**), listas, etc.
- Si una pala tiene certificación Testea, ÚSALA y menciona que es "dato certificado"
- Si no tiene certificación, estima basándote en especificaciones físicas y menciona que es "estimación"
- Sé conciso pero informativo (máximo 600 palabras en total)

FORMATO DE RESPUESTA OBLIGATORIO:
Responde ÚNICAMENTE con un objeto JSON válido siguiendo esta estructura exacta:

{
  "executiveSummary": "...",
  "technicalAnalysis": [
    {
      "title": "Potencia y Salida de Bola",
      "content": "..."
    },
    {
      "title": "Control y Precisión",
      "content": "..."
    },
    {
      "title": "Manejabilidad y Peso",
      "content": "..."
    },
    {
      "title": "Confort y Prevención de Lesiones",
      "content": "..."
    }
  ],
  "comparisonTable": "| Característica | Pala 1 | Pala 2 |\\n|---|---|---|\\n| ... | ... | ... |",
  "recommendedProfiles": "...",
  "biomechanicalConsiderations": "...",
  "conclusion": "...",
  "metrics": [
    {"racketName": "Nombre pala 1", "potencia": 8, "control": 7, "salidaDeBola": 6, "manejabilidad": 9, "puntoDulce": 7},
    {"racketName": "Nombre pala 2", "potencia": 9, "control": 6, "salidaDeBola": 5, "manejabilidad": 7, "puntoDulce": 6}
  ]
}

RESPONDE AHORA CON EL JSON:`;
  }

  /**
   * Parsea la respuesta estructurada en formato JSON
   */
  private parseStructuredResponse(fullText: string, rackets: Racket[]): ComparisonResult {
    // Limpiar el texto de posibles bloques de código markdown
    let cleanText = fullText.trim();
    
    // Remover bloques de código si existen
    cleanText = cleanText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    // Buscar el objeto JSON en el texto
    const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      logger.error('No JSON found in response');
      logger.error('Raw response:', fullText.substring(0, 500));
      throw new Error('Invalid response format: No JSON found');
    }

    try {
      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validar que tenga las propiedades requeridas
      if (!parsed.executiveSummary || !parsed.technicalAnalysis || !parsed.metrics) {
        logger.error('Missing required properties in JSON response');
        throw new Error('Invalid response format: Missing required properties');
      }

      // Construir el resultado estructurado
      const result: ComparisonResult = {
        executiveSummary: parsed.executiveSummary || '',
        technicalAnalysis: parsed.technicalAnalysis || [],
        comparisonTable: parsed.comparisonTable || '',
        recommendedProfiles: parsed.recommendedProfiles || '',
        biomechanicalConsiderations: parsed.biomechanicalConsiderations || '',
        conclusion: parsed.conclusion || '',
        metrics: parsed.metrics || [],
      };

      // Validar que las métricas tengan el formato correcto
      if (!Array.isArray(result.metrics) || result.metrics.length === 0) {
        logger.warn('Invalid metrics format, using defaults');
        result.metrics = rackets.map((r: any) => ({
          racketName: r.nombre || r.name || 'Pala',
          potencia: 5,
          control: 5,
          salidaDeBola: 5,
          manejabilidad: 5,
          puntoDulce: 5,
        }));
      }

      return result;
    } catch (parseError) {
      logger.error('Error parsing structured JSON:', parseError);
      logger.error('Raw JSON text:', jsonMatch[0].substring(0, 500));
      
      // Valores por defecto si falla completamente el parsing
      return {
        executiveSummary: 'Error al generar la comparación. Por favor, inténtalo de nuevo.',
        technicalAnalysis: [],
        comparisonTable: '',
        recommendedProfiles: '',
        biomechanicalConsiderations: '',
        conclusion: '',
        metrics: rackets.map((r: any) => ({
          racketName: r.nombre || r.name || 'Pala',
          potencia: 5,
          control: 5,
          salidaDeBola: 5,
          manejabilidad: 5,
          puntoDulce: 5,
        })),
      };
    }
  }
}
