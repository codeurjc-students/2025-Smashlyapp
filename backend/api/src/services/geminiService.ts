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

    try {
      // Una única llamada a la API para obtener ambos resultados
      const result = await this.model.generateContent(combinedPrompt);
      const response = await result.response;
      const fullText = response.text();

      // Separar la comparación textual de las métricas JSON
      const { textComparison, metrics } = this.parseResponse(fullText, rackets);

      return { textComparison, metrics };
    } catch (error: any) {
      console.error('Error calling Gemini API:', error);
      const errorMessage = error.message || 'Error desconocido de Gemini';
      throw new Error(`Error al generar la comparación con IA: ${errorMessage}`);
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
Nivel: ${r.caracteristicas_nivel_de_juego || 'N/A'}`
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
    const numCols = rackets.length > 2 ? 'Pala 3 |' : '';
    const numSep = rackets.length > 2 ? ':--- |' : '';
    const numVals = rackets.length > 2 ? '... |' : '';

    return `Eres un analista profesional de pádel. Proporciona una comparación técnica objetiva basada en materiales y geometría.

### 📊 RESUMEN EJECUTIVO
[2-3 líneas: diferencias clave y para qué jugador es cada pala]

### 🔬 ANÁLISIS TÉCNICO DE MATERIALES

#### ${(rackets[0] as any)?.nombre || 'Pala 1'}
**Núcleo:** [Tipo de goma y densidad]
**Caras:** [Tipo de fibra y rigidez]
**Geometría:** [Forma y balance]
**Comportamiento:** Tacto [Blando/Medio/Duro], Punto Dulce [Pequeño/Medio/Grande], Transmisión [Baja/Media/Alta]

#### ${(rackets[1] as any)?.nombre || 'Pala 2'}
**Núcleo:** [Tipo de goma y densidad]
**Caras:** [Tipo de fibra y rigidez]
**Geometría:** [Forma y balance]
**Comportamiento:** Tacto [Blando/Medio/Duro], Punto Dulce [Pequeño/Medio/Grande], Transmisión [Baja/Media/Alta]

${rackets.length > 2 ? `#### ${(rackets[2] as any)?.nombre || 'Pala 3'}\n**Núcleo:** [Tipo de goma]\n**Caras:** [Tipo de fibra]\n**Geometría:** [Forma y balance]\n**Comportamiento:** Tacto, Punto Dulce, Transmisión\n` : ''}

### 📋 TABLA COMPARATIVA

| Característica | ${(rackets[0] as any)?.nombre || 'Pala 1'} | ${(rackets[1] as any)?.nombre || 'Pala 2'} | ${numCols}
| :--- | :--- | :--- | ${numSep}
| **Tacto/Dureza** | ... | ... | ${numVals}
| **Balance** | ... | ... | ${numVals}
| **Punto Dulce** | ... | ... | ${numVals}
| **Salida de Bola** | ... | ... | ${numVals}
| **Potencia** | ... | ... | ${numVals}
| **Manejabilidad** | ... | ... | ${numVals}
| **Nivel Requerido** | ... | ... | ${numVals}

### 🎯 ANÁLISIS POR CATEGORÍAS

#### Potencia y Velocidad
[Comparación basada en rigidez y balance]

#### Control y Precisión
[Comparación basada en punto dulce y tacto]

#### Manejabilidad y Defensa
[Comparación basada en peso y balance]

#### Confort
[Comparación de absorción de vibraciones]

### 👤 PERFILES RECOMENDADOS

#### ${(rackets[0] as any)?.nombre || 'Pala 1'}
**Nivel:** [Nivel]
**Estilo:** [Estilo de juego]
**Características:** [Físicas recomendadas]

#### ${(rackets[1] as any)?.nombre || 'Pala 2'}
**Nivel:** [Nivel]
**Estilo:** [Estilo de juego]
**Características:** [Físicas recomendadas]

${rackets.length > 2 ? `#### ${(rackets[2] as any)?.nombre || 'Pala 3'}\n**Nivel:** [Nivel]\n**Estilo:** [Estilo]\n**Características:** [Físicas]\n` : ''}

### 🏆 VEREDICTOS

#### Jugador Defensivo
**Ganadora:** [Pala]
**Por qué:** [Justificación técnica]

#### Jugador Ofensivo
**Ganadora:** [Pala]
**Por qué:** [Justificación técnica]

#### Confort/Prevención Lesiones
**Ganadora:** [Pala]
**Por qué:** [Justificación técnica]

${userContext ? `\n#### Tu Perfil Específico\n**Recomendación:** [Pala]\n**Por qué:** [Justificación personalizada]\n` : ''}

### 🎓 CONCLUSIÓN
[2-3 líneas: "La [Pala A] es ideal para [tipo jugador X], mientras que la [Pala B] es mejor para [tipo jugador Y]"]

${userContext}

DATOS TÉCNICOS:
${racketsInfo}

===METRICS===
Asigna valores 1-10 para:
- Potencia: Velocidad de bola
- Control: Precisión
- Salida de Bola: Facilidad impulsión
- Manejabilidad: Agilidad
- Punto Dulce: Área efectiva

JSON (sin markdown):
[
  {"racketName": "Nombre pala 1", "potencia": 8, "control": 7, "salidaDeBola": 6, "manejabilidad": 9, "puntoDulce": 7},
  {"racketName": "Nombre pala 2", "potencia": 9, "control": 6, "salidaDeBola": 5, "manejabilidad": 7, "puntoDulce": 6}
]`;
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

    return { textComparison, metrics };
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
