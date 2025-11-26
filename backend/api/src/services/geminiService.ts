import { GoogleGenerativeAI } from '@google/generative-ai';
import { Racket, UserFormData } from '../types/racket';

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

export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY is not set in environment variables');
    }
    this.genAI = new GoogleGenerativeAI(apiKey || '');
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-3-pro-preview' });
  }

  async compareRackets(rackets: Racket[], userProfile?: UserFormData): Promise<ComparisonResult> {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY no está configurada en el servidor');
    }

    if (!rackets || rackets.length < 2) {
      throw new Error('Se necesitan al menos 2 palas para comparar');
    }

    const racketsInfo = rackets
      .map((r: any, index) => {
        return `
PALA ${index + 1}:
Nombre: ${r.nombre}
Marca: ${r.marca || r.caracteristicas_marca || 'N/A'}
Modelo: ${r.modelo || 'N/A'}
Forma: ${r.caracteristicas_forma || r.caracteristicas_formato || 'N/A'}
Goma: ${r.caracteristicas_nucleo || 'N/A'}
Cara/Fibra: ${r.caracteristicas_cara || 'N/A'}
Balance: ${r.caracteristicas_balance || 'N/A'}
Dureza: ${r.caracteristicas_dureza || 'N/A'}
Nivel: ${r.caracteristicas_nivel_de_juego || 'N/A'}
      `.trim();
      })
      .join('\n\n');

    let userContext = '';
    if (userProfile) {
      userContext = `
CONTEXTO DEL USUARIO:
El usuario que solicita la comparación tiene las siguientes características:
Nivel de juego: ${userProfile.gameLevel || 'No especificado'}
Estilo de juego: ${userProfile.playingStyle || 'No especificado'}
Peso: ${userProfile.weight || 'No especificado'}
Altura: ${userProfile.height || 'No especificado'}
Edad: ${userProfile.age || 'No especificado'}
Experiencia: ${userProfile.experience || 'No especificado'}
Preferencias: ${userProfile.preferences || 'No especificado'}

Por favor, ten en cuenta estas características en la sección "Veredicto Situacional" y "Conclusión Final" para recomendar qué pala se ajusta mejor a este usuario específico.
      `;
    }

    const prompt = `
Actúa como un Experto Analista de Materiales de Pádel y Biomecánica Deportiva con más de 20 años de experiencia en testeo de palas (raquetas). Tu objetivo es realizar una comparación técnica, imparcial y profunda entre las palas que te proporcionaré a continuación.

IMPORTANTE: Ignora el lenguaje de marketing subjetivo (ej. "potencia inigualable"). Céntrate en inferir el comportamiento físico de la pala basándote en la combinación de: Molde + Goma + Tipo de fibra + Balance.

Tus instrucciones paso a paso son:

1. **Análisis de Materiales (Internal Monologue):**
   - Analiza la densidad de la goma (EVA Soft, Black EVA, HR3, etc.) y su interacción con las caras (Fibra de vidrio, Carbono 3K, 12K, 18K, etc.).
   - Determina si el tacto resultante es Blando, Medio o Duro.
   - Deduce el tamaño del punto dulce basándote en el molde y la distribución de agujeros.

2. **Generación de Tabla Comparativa:**
   Genera una tabla Markdown bien formateada. Asegúrate de dejar una línea en blanco antes y después de la tabla.
   
   | Característica | Pala 1 | Pala 2 | ${rackets.length > 2 ? 'Pala 3 |' : ''}
   | :--- | :--- | :--- | ${rackets.length > 2 ? ':--- |' : ''}
   | **Tacto/Dureza** | ... | ... | ${rackets.length > 2 ? '... |' : ''}
   | **Balance** | ... | ... | ${rackets.length > 2 ? '... |' : ''}
   | **Punto Dulce** | ... | ... | ${rackets.length > 2 ? '... |' : ''}
   | **Salida de Bola** | ... | ... | ${rackets.length > 2 ? '... |' : ''}
   | **Potencia Bruta** | ... | ... | ${rackets.length > 2 ? '... |' : ''}
   | **Maniobrabilidad** | ... | ... | ${rackets.length > 2 ? '... |' : ''}
   | **Nivel Exigido** | ... | ... | ${rackets.length > 2 ? '... |' : ''}

3. **El Veredicto Situacional (The Verdict):**
   No digas cuál es "mejor" en abstracto. Define el "Ganador" en 3 escenarios distintos:
   - **Escenario 1 (Jugador de Control/Defensivo):** Qué pala beneficia más al volumen de juego y por qué.
   - **Escenario 2 (Jugador Ofensivo/Pegador):** Qué pala maximiza la definición y el juego aéreo.
   - **Escenario 3 (Prevención de Lesiones):** Qué pala transmite menos vibraciones (basado en materiales más blandos o sistemas antivibración).

4. **Conclusión Final:**
   Resume en una frase: "¿Para quién es la Pala A y para quién es la Pala B?".

Centrate simplemente en darme los puntos anteriores, sin introducciones ni conclusiones adicionales.

${userContext}

---
DATOS DE LAS PALAS A COMPARAR:
${racketsInfo}
    `;

    // Prompt adicional para obtener las métricas numéricas
    const metricsPrompt = `
Basándote en el análisis técnico de las siguientes palas de pádel, asigna valores numéricos del 1 al 10 para cada una de estas métricas:

- **Potencia**: Capacidad de generar velocidad en la pelota (1=muy bajo, 10=muy alto)
- **Control**: Precisión y capacidad de colocar la pelota (1=muy bajo, 10=muy alto)
- **Salida de Bola**: Facilidad de impulsión, especialmente en juego defensivo (1=muy bajo, 10=muy alto)
- **Manejabilidad**: Facilidad de movimiento y cambios rápidos de dirección (1=muy bajo, 10=muy alto)
- **Punto Dulce**: Tamaño del área efectiva de impacto (1=muy pequeño, 10=muy grande)

DATOS DE LAS PALAS:
${racketsInfo}

IMPORTANTE: Responde ÚNICAMENTE con un JSON válido en el siguiente formato (sin markdown, sin texto adicional):
[
  {
    "racketName": "Nombre completo de la pala 1",
    "potencia": 8,
    "control": 7,
    "salidaDeBola": 6,
    "manejabilidad": 9,
    "puntoDulce": 7
  },
  {
    "racketName": "Nombre completo de la pala 2",
    "potencia": 7,
    "control": 8,
    "salidaDeBola": 7,
    "manejabilidad": 8,
    "puntoDulce": 8
  }
]
    `;

    try {
      // Generar la comparación de texto
      const textResult = await this.model.generateContent(prompt);
      const textResponse = await textResult.response;
      const textComparison = textResponse.text();

      // Generar las métricas numéricas
      const metricsResult = await this.model.generateContent(metricsPrompt);
      const metricsResponse = await metricsResult.response;
      let metricsText = metricsResponse.text();

      // Limpiar el texto de la respuesta de posibles markdown o caracteres extras
      metricsText = metricsText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

      let metrics: RacketMetrics[];
      try {
        metrics = JSON.parse(metricsText);
      } catch (parseError) {
        console.error('Error parsing metrics JSON:', parseError);
        console.error('Raw metrics text:', metricsText);
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

      return {
        textComparison,
        metrics,
      };
    } catch (error: any) {
      console.error('Error calling Gemini API:', error);
      const errorMessage = error.message || 'Error desconocido de Gemini';
      throw new Error(`Error al generar la comparación con IA: ${errorMessage}`);
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
