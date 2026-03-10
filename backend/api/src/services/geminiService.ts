import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  Racket,
  UserFormData,
  ComparisonResult,
  ComparisonSection,
  ComparisonTableItem,
  RacketComparisonData,
  RadarMetrics,
} from '../types/racket';
import logger from '../config/logger';

export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY is not set in environment variables');
    }
    this.genAI = new GoogleGenerativeAI(apiKey || '');
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  }

  async compareRackets(rackets: Racket[], userProfile?: UserFormData): Promise<ComparisonResult> {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY no está configurada en el servidor');
    }

    if (!rackets || rackets.length < 2) {
      throw new Error('Se necesitan al menos 2 palas para comparar');
    }

    // Construir información de las palas de forma optimizada
    const racketsInfo = this.buildRacketsInfo(rackets);
    const userContext = this.buildUserContext(userProfile);

    // Construir un único prompt que incluya tanto la comparación textual como las métricas
    const combinedPrompt = this.buildCombinedPrompt(rackets, racketsInfo, userContext);

    // Implementar reintentos con backoff exponencial
    const maxRetries = 3;
    let lastError: any;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        console.log(`Intento ${attempt + 1} de ${maxRetries} para generar comparación...`);

        // Una única llamada a la API para obtener ambos resultados
        const result = await this.model.generateContent(combinedPrompt);
        const response = await result.response;
        const fullText = response.text();

        // Separar la comparación textual de las métricas JSON
        const comparisonResult = this.parseResponse(fullText, rackets);

        console.log('Comparación generada exitosamente');
        return comparisonResult;
      } catch (error: any) {
        lastError = error;
        const errorMessage = error.message || 'Error desconocido';

        // Verificar si es un error de sobrecarga (503) o rate limit (429)
        const isRetryableError =
          errorMessage.includes('503') ||
          errorMessage.includes('overloaded') ||
          errorMessage.includes('429') ||
          errorMessage.includes('rate limit');

        if (isRetryableError && attempt < maxRetries - 1) {
          // Calcular tiempo de espera con backoff exponencial: 1s, 2s, 4s
          const waitTime = Math.pow(2, attempt) * 1000;
          console.warn(
            `Gemini API temporalmente no disponible (intento ${attempt + 1}/${maxRetries}). ` +
              `Reintentando en ${waitTime / 1000}s...`
          );

          // Esperar antes de reintentar
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }

        // Si no es un error reintentable o ya agotamos los intentos, lanzar el error
        console.error('Error calling Gemini API:', error);
        break;
      }
    }

    // Si llegamos aquí, todos los intentos fallaron
    const errorMessage = lastError?.message || 'Error desconocido de Gemini';
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
    return `CONTEXTO DEL SISTEMA:
Eres "Smashly AI", un ex-jugador profesional de pádel, entrenador de élite y experto en biomecánica y materiales de palas (carbono 3K/12K/18K, fibra de vidrio, gomas EVA Soft/Hard).
Tu objetivo es realizar un análisis técnico profundo y comparativo entre las palas solicitadas.

REGLAS DE DOMINIO (PÁDEL):
- Palas Diamante: Balance alto, máximo estrés en el brazo (riesgo de epicondilitis), potencia pura, punto dulce pequeño y superior. Para jugadores ofensivos.
- Palas Redondas: Balance bajo, máxima manejabilidad y control, punto dulce amplio y centrado.
- Palas Lágrima/Gota: Polivalentes, balance medio.
- Materiales: Carbono 18K es más rígido (menos salida de bola a baja velocidad, más potencia en golpes fuertes) que el 3K o Fibra de Vidrio. Gomas Hard aportan control y potencia en bloqueos; Soft aportan salida de bola y confort.
- PRIORIDAD DE DATOS: Si se proporcionan "Métricas Reales (Radar)", son valores técnicos exactos de nuestra base de datos. Úsalos como la VERDAD ABSOLUTA para tu análisis y para rellenar la sección "radarData" del JSON. Si no están, estima basándote en materiales y forma.

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
    { "feature": "Forma", "${rackets[0]?.name || (rackets[0] as any)?.nombre || 'Pala 1'}": "...", "${rackets[1]?.name || (rackets[1] as any)?.nombre || 'Pala 2'}": "..." }
  ],
  "metrics": [
    {
      "racketId": 0,
      "racketName": "${rackets[0]?.name || (rackets[0] as any)?.nombre || 'Pala 1'}",
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

  private parseResponse(fullText: string, rackets: Racket[]): ComparisonResult {
    let cleanText = fullText.trim();
    cleanText = cleanText.replace(/```json\n?/g, '').replace(/```\n?/g, '');

    const jsonMatch = cleanText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      console.error('No JSON found in response');
      throw new Error('Invalid response format: No JSON found');
    }

    try {
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
      console.error('Error parsing structured JSON in Gemini:', parseError);
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
      const result = await service.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error: any) {
      console.error('Error calling Gemini API:', error);
      const errorMessage = error.message || 'Error desconocido de Gemini';
      throw new Error(`Error al generar contenido con IA: ${errorMessage}`);
    }
  }
}
