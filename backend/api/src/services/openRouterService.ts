import axios, { AxiosInstance } from 'axios';
import { Racket, UserFormData } from '../types/racket';
import logger from '../config/logger';
import { freeAiService } from './freeAiService';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Interfaz para las métricas de radar (0-10)
export interface RadarMetrics {
  potencia: number;
  control: number;
  manejabilidad: number;
  puntoDulce: number;
  salidaDeBola: number;
}

// Interfaz para los datos de cada pala en la comparación
export interface RacketComparisonData {
  racketId: number; // Mapear al ID original
  racketName: string;
  radarData: RadarMetrics;
  isCertified: boolean; // Si los datos vienen de Testea Pádel
}

// Elemento de la tabla comparativa
export interface ComparisonTableItem {
  feature: string; // "Peso", "Balance", "Precio", etc.
  [key: string]: string; // "Pala 1": "365g", "Pala 2": "370g"
}

// Interfaz para subsecciones de la comparación
export interface ComparisonSection {
  title: string;
  content: string;
}

// Interfaz para la respuesta de comparación completa (estructurada)
export interface ComparisonResult {
  executiveSummary: string;
  technicalAnalysis: ComparisonSection[];

  // Tabla dinámica para frontend
  comparisonTable: ComparisonTableItem[];

  // Datos para gráfico de radar
  metrics: RacketComparisonData[];

  recommendedProfiles: string;
  biomechanicalConsiderations: string;
  conclusion: string;
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

  // Modelos gratuitos en orden de preferencia (para OpenRouter)
  private readonly FREE_MODELS = [
    'google/gemini-2.0-flash-exp:free',
    'deepseek/deepseek-r1:free',
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
   * Genera contenido usando sistema híbrido (Free AI API -> OpenRouter Fallback)
   */
  static async generateContent(prompt: string): Promise<string> {
    const service = new OpenRouterService();
    return service.generateContentHybrid(prompt);
  }

  /**
   * Estrategia híbrida: Intenta API local primero, luego OpenRouter
   */
  private async generateContentHybrid(prompt: string): Promise<string> {
    // 1. Intentar con Free AI API (Local/Custom)
    try {
      const content = await freeAiService.generateContent(prompt);
      if (content && content.length > 0) {
        return content;
      }
    } catch (error) {
      logger.warn(`⚠️ Free AI API failed, falling back to OpenRouter: ${error}`);
    }

    // 2. Check if OpenRouter key is available
    if (!this.apiKey) {
      logger.warn('⚠️ OPENROUTER_API_KEY missing, trying Gemini fallback');
      return this.generateContentGeminiFallback(prompt);
    }

    // 3. Fallback a OpenRouter
    try {
      return await this.generateContentOpenRouterFallback(prompt);
    } catch (error) {
      logger.warn(`⚠️ OpenRouter fallback failed, trying Gemini: ${error}`);
      return this.generateContentGeminiFallback(prompt);
    }
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
   * Genera contenido usando Gemini como último recurso
   */
  private async generateContentGeminiFallback(prompt: string): Promise<string> {
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      logger.error('❌ GEMINI_API_KEY missing in environment variables');
      throw new Error(
        'Error al generar contenido con IA: Ni OPENROUTER_API_KEY ni GEMINI_API_KEY están configuradas'
      );
    }

    try {
      logger.info('🤖 Attempting fallback to Gemini API (gemini-1.5-flash)');
      const genAI = new GoogleGenerativeAI(geminiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      logger.info('✅ Gemini fallback success, response length:', text.length);
      return text;
    } catch (error: any) {
      logger.error('❌ Gemini fallback failed:', error);
      throw new Error(`Error generating content with Gemini fallback: ${error.message}`);
    }
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
      logger.warn(`⚠️ Free AI API comparison failed, falling back to OpenRouter: ${error}`);
    }

    // 2. Check if OpenRouter key is available
    if (!this.apiKey) {
      logger.warn('⚠️ OPENROUTER_API_KEY missing for comparison, trying Gemini fallback');
      return this.compareRacketsGeminiFallback(combinedPrompt, rackets);
    }

    // 3. Fallback a OpenRouter
    try {
      return await this.compareRacketsOpenRouterFallback(combinedPrompt, rackets);
    } catch (error) {
      logger.warn(`⚠️ OpenRouter comparison failed, trying Gemini: ${error}`);
      return this.compareRacketsGeminiFallback(combinedPrompt, rackets);
    }
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
   * Compara palas usando Gemini como último recurso
   */
  private async compareRacketsGeminiFallback(
    prompt: string,
    rackets: Racket[]
  ): Promise<ComparisonResult> {
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      logger.error('❌ GEMINI_API_KEY missing in environment variables');
      throw new Error(
        'Error al generar la comparación con IA: Ni OPENROUTER_API_KEY ni GEMINI_API_KEY están configuradas'
      );
    }

    try {
      logger.info('🤖 Attempting comparison fallback to Gemini API (gemini-1.5-flash)');
      const genAI = new GoogleGenerativeAI(geminiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const fullText = response.text();

      if (!fullText) {
        throw new Error('Empty response from Gemini');
      }

      logger.info('✅ Gemini raw response received, length:', fullText.length);

      // Parsear la respuesta estructurada (reutilizamos la lógica existente)
      const comparisonResult = this.parseStructuredResponse(fullText, rackets);

      logger.info('✅ Comparison generated and parsed successfully with Gemini fallback');
      return comparisonResult;
    } catch (error: any) {
      logger.error('❌ Gemini comparison fallback failed:', error);

      // Intentar una vez más con modelo pro si falla el flash
      try {
        logger.info('🔄 Retrying with gemini-1.5-pro...');
        const genAI = new GoogleGenerativeAI(geminiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const fullText = response.text();

        if (!fullText) throw new Error('Empty response from Gemini Pro');

        const comparisonResult = this.parseStructuredResponse(fullText, rackets);
        logger.info('✅ Comparison generated successfully with Gemini Pro fallback');
        return comparisonResult;
      } catch (retryError: any) {
        throw new Error(`Error al generar la comparación con IA (Gemini): ${error.message}`);
      }
    }
  }

  private buildRacketsInfo(rackets: Racket[]): string {
    return rackets
      .map(
        (r: any, index) => `PALA ${index + 1}:
Nombre: ${r.nombre}
Marca: ${r.marca || r.caracteristicas_marca || 'N/A'}
Modelo: ${r.modelo || 'N/A'}
Forma: ${r.caracteristicas_forma || r.caracteristicas_formato || 'N/A'}
Goma: ${r.caracteristicas_nucleo || 'N/A'}
Cara/Fibra: ${r.caracteristicas_cara || 'N/A'}
Balance: ${r.caracteristicas_balance || 'N/A'}
Dureza: ${r.caracteristicas_dureza || 'N/A'}
Peso: ${r.peso ? `${r.peso}g` : 'N/A'}
Nivel: ${r.caracteristicas_nivel_de_juego || 'N/A'}
Precio: ${r.precio_actual ? `€${r.precio_actual}` : 'N/A'}
Testea Certificado: ${r.testea_potencia ? 'SÍ' : 'NO'}`
      )
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
    const racketNames = rackets
      .map((r: any, i) => `${i + 1}. ${r.nombre || `Pala ${i + 1}`}`)
      .join('\n');

    return `CONTEXTO DEL SISTEMA:
Eres el motor de comparación "Smashly". Tu objetivo es proporcionar un análisis técnico, biomecánico y comparativo de alto nivel.

DATOS DE ENTRADA:
${racketsInfo}

${userContext}

INSTRUCCIONES DE SALIDA:
Genera un objeto JSON estricto con esta estructura:

1. **executiveSummary**: String. 2-3 frases resumiendo la comparación.
2. **technicalAnalysis**: Array de objetos { title, content }. Categorías: "Potencia", "Control", "Manejabilidad", "Confort". Markdown permitido en content.
3. **comparisonTable**: Array de objetos representando filas para una tabla dinámica. Cada objeto debe tener la propiedad "feature" (ej: "Peso", "Balance", "Punto Dulce") y luego una propiedad por cada pala con su nombre EXACTO como clave y el valor como string. Incluye al menos 6 características clave.
4. **metrics**: Array de objetos para graficar un RADAR CHART PENTAGONAL.
   - Para cada pala, un objeto con:
     - "racketId": (number) ID de la pala si lo tienes, o índice.
     - "racketName": (string) Nombre exacto.
     - "isCertified": (boolean) true si tiene datos Testea, false si son estimados.
     - "radarData": Objeto con 5 ejes numéricos (0-10): { potencia, control, manejabilidad, puntoDulce, salidaDeBola }.
5. **recommendedProfiles**: String (Markdown).
6. **biomechanicalConsiderations**: String (Markdown). Avisos de salud.
7. **conclusion**: String (Markdown). Veredicto final.

IMPORTANTE: 
- El campo "comparisonTable" debe ser un array de objetos, NO un string markdown. Ejemplo:
  [
    { "feature": "Forma", "Vertex 04": "Diamante", "Hack 03": "Híbrida" },
    { "feature": "Tacto", "Vertex 04": "Duro", "Hack 03": "Medio" }
  ]
- El campo "metrics" alimenta un gráfico de radar. Sé preciso con los números 0-10.

RESPONDE SOLO CON EL JSON.`;
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
        // Fallback si falla metrics
        parsed.metrics = rackets.map((r: any) => ({
          racketId: r.id,
          racketName: r.nombre,
          isCertified: !!r.testea_potencia,
          radarData: {
            potencia: r.testea_potencia || 5,
            control: r.testea_control || 5,
            manejabilidad: r.testea_manejabilidad || 5,
            puntoDulce: 5,
            salidaDeBola: 5,
          },
        }));
      }

      // Validar comparisonTable (asegurar array)
      if (!parsed.comparisonTable || !Array.isArray(parsed.comparisonTable)) {
        parsed.comparisonTable = [];
      }

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

      // Return bare minimum structure on crash
      return {
        executiveSummary: 'Error al procesar la comparación.',
        technicalAnalysis: [],
        comparisonTable: [],
        metrics: rackets.map((r: any) => ({
          racketId: r.id,
          racketName: r.nombre,
          isCertified: false,
          radarData: { potencia: 5, control: 5, manejabilidad: 5, puntoDulce: 5, salidaDeBola: 5 },
        })),
        recommendedProfiles: '',
        biomechanicalConsiderations: '',
        conclusion: '',
      };
    }
  }
}
