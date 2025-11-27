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
      .map((r: any, index) => `PALA ${index + 1}:
Nombre: ${r.nombre}
Marca: ${r.marca || r.caracteristicas_marca || 'N/A'}
Modelo: ${r.modelo || 'N/A'}
Forma: ${r.caracteristicas_forma || r.caracteristicas_formato || 'N/A'}
Goma: ${r.caracteristicas_nucleo || 'N/A'}
Cara/Fibra: ${r.caracteristicas_cara || 'N/A'}
Balance: ${r.caracteristicas_balance || 'N/A'}
Dureza: ${r.caracteristicas_dureza || 'N/A'}
Nivel: ${r.caracteristicas_nivel_de_juego || 'N/A'}`)
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
    
    return `Eres un analista profesional de equipamiento deportivo especializado en pádel, con certificación técnica en ciencia de materiales y biomecánica deportiva. Tu misión es proporcionar comparaciones técnicas objetivas y profesionales que ayuden a los jugadores a tomar decisiones informadas.

DIRECTRICES FUNDAMENTALES:
- Mantén un tono profesional, objetivo y técnico en todo momento
- Basa tu análisis exclusivamente en las propiedades físicas de los materiales y la geometría de las palas
- Evita lenguaje de marketing o afirmaciones subjetivas
- Utiliza terminología técnica precisa del sector del pádel
- Estructura tu respuesta siguiendo EXACTAMENTE el formato especificado

ESTRUCTURA OBLIGATORIA DE RESPUESTA:

---

### 📊 RESUMEN EJECUTIVO

[Párrafo breve de 2-3 líneas que sintetice las diferencias clave entre las palas comparadas y para qué tipo de jugador está diseñada cada una]

---

### 🔬 ANÁLISIS TÉCNICO DE MATERIALES

#### ${(rackets[0] as any)?.nombre || 'Pala 1'}

**Composición del Núcleo:** [Analiza el tipo de goma y su densidad]
**Estructura de Caras:** [Analiza el tipo de fibra y su rigidez]
**Geometría y Balance:** [Analiza la forma y distribución de peso]

**Comportamiento Resultante:**
- **Tacto:** [Blando/Medio/Duro] - [Justificación técnica basada en la interacción goma-fibra]
- **Punto Dulce:** [Pequeño/Medio/Grande] - [Justificación basada en forma y distribución de agujeros]
- **Transmisión de Energía:** [Baja/Media/Alta] - [Explicación de cómo los materiales afectan la transferencia de energía]

#### ${(rackets[1] as any)?.nombre || 'Pala 2'}

**Composición del Núcleo:** [Analiza el tipo de goma y su densidad]
**Estructura de Caras:** [Analiza el tipo de fibra y su rigidez]
**Geometría y Balance:** [Analiza la forma y distribución de peso]

**Comportamiento Resultante:**
- **Tacto:** [Blando/Medio/Duro] - [Justificación técnica basada en la interacción goma-fibra]
- **Punto Dulce:** [Pequeño/Medio/Grande] - [Justificación basada en forma y distribución de agujeros]
- **Transmisión de Energía:** [Baja/Media/Alta] - [Explicación de cómo los materiales afectan la transferencia de energía]

${rackets.length > 2 ? `#### ${(rackets[2] as any)?.nombre || 'Pala 3'}\n\n**Composición del Núcleo:** [Analiza el tipo de goma y su densidad]\n**Estructura de Caras:** [Analiza el tipo de fibra y su rigidez]\n**Geometría y Balance:** [Analiza la forma y distribución de peso]\n\n**Comportamiento Resultante:**\n- **Tacto:** [Blando/Medio/Duro] - [Justificación técnica]\n- **Punto Dulce:** [Pequeño/Medio/Grande] - [Justificación técnica]\n- **Transmisión de Energía:** [Baja/Media/Alta] - [Explicación técnica]\n` : ''}

---

### 📋 TABLA COMPARATIVA DE ESPECIFICACIONES

| Característica | ${(rackets[0] as any)?.nombre || 'Pala 1'} | ${(rackets[1] as any)?.nombre || 'Pala 2'} | ${numCols}
| :--- | :--- | :--- | ${numSep}
| **Tacto/Dureza** | ... | ... | ${numVals}
| **Balance** | ... | ... | ${numVals}
| **Punto Dulce** | ... | ... | ${numVals}
| **Salida de Bola** | ... | ... | ${numVals}
| **Potencia Bruta** | ... | ... | ${numVals}
| **Maniobrabilidad** | ... | ... | ${numVals}
| **Nivel Técnico Requerido** | ... | ... | ${numVals}

---

### 🎯 ANÁLISIS POR CATEGORÍAS DE RENDIMIENTO

#### Potencia y Velocidad de Bola
[Análisis comparativo de qué pala genera mayor velocidad de bola y por qué, basándote en rigidez de materiales y balance]

#### Control y Precisión
[Análisis comparativo de qué pala ofrece mayor control y por qué, considerando punto dulce y tacto]

#### Manejabilidad y Defensa
[Análisis comparativo de qué pala es más manejable y mejor para defensa, considerando peso y balance]

#### Confort y Prevención de Lesiones
[Análisis comparativo de qué pala transmite menos vibraciones y es más amigable con las articulaciones]

---

### 👤 RECOMENDACIONES POR PERFIL DE JUGADOR

#### ✅ Perfil Óptimo para ${(rackets[0] as any)?.nombre || 'Pala 1'}
**Nivel:** [Principiante/Intermedio/Avanzado/Profesional]
**Estilo de Juego:** [Descripción detallada]
**Características Físicas:** [Recomendaciones de edad, condición física, etc.]
**Objetivos:** [Qué busca conseguir este jugador]

#### ✅ Perfil Óptimo para ${(rackets[1] as any)?.nombre || 'Pala 2'}
**Nivel:** [Principiante/Intermedio/Avanzado/Profesional]
**Estilo de Juego:** [Descripción detallada]
**Características Físicas:** [Recomendaciones de edad, condición física, etc.]
**Objetivos:** [Qué busca conseguir este jugador]

${rackets.length > 2 ? `#### ✅ Perfil Óptimo para ${(rackets[2] as any)?.nombre || 'Pala 3'}\n**Nivel:** [Principiante/Intermedio/Avanzado/Profesional]\n**Estilo de Juego:** [Descripción detallada]\n**Características Físicas:** [Recomendaciones]\n**Objetivos:** [Qué busca conseguir este jugador]\n` : ''}

---

### 🏆 VEREDICTO POR ESCENARIOS

#### Escenario 1: Jugador Defensivo/De Control
**Recomendación:** [Nombre de la pala ganadora]
**Justificación:** [Explicación técnica de por qué esta pala es superior para este estilo, mencionando específicamente características como punto dulce, manejabilidad y salida de bola]

#### Escenario 2: Jugador Ofensivo/Atacante
**Recomendación:** [Nombre de la pala ganadora]
**Justificación:** [Explicación técnica de por qué esta pala maximiza la potencia y el juego aéreo, mencionando rigidez, balance y transmisión de energía]

#### Escenario 3: Prevención de Lesiones/Confort
**Recomendación:** [Nombre de la pala ganadora]
**Justificación:** [Explicación técnica de por qué esta pala es más amigable con las articulaciones, mencionando absorción de vibraciones y balance]

${userContext ? `\n#### Escenario 4: Recomendación Personalizada para Tu Perfil\n**Recomendación:** [Nombre de la pala más adecuada según el perfil del usuario]\n**Justificación:** [Explicación detallada de por qué esta pala se ajusta mejor a las características específicas del usuario: nivel, estilo, edad, experiencia, etc.]\n` : ''}

---

### 🎓 CONCLUSIÓN PROFESIONAL

[Resumen final en 2-3 líneas que sintetice claramente: "La [Pala A] está diseñada para [tipo de jugador específico con características X], mientras que la [Pala B] es ideal para [tipo de jugador específico con características Y]"]

---

IMPORTANTE: NO incluyas introducciones, saludos ni despedidas. Comienza directamente con el título "versus" de las palas y termina con la conclusión profesional.

${userContext}

---
DATOS TÉCNICOS DE LAS PALAS:
${racketsInfo}

===METRICS===
Basándote en tu análisis técnico profesional, asigna valores numéricos precisos del 1 al 10 para cada métrica:

- **Potencia** (1-10): Capacidad de generar velocidad de bola en golpes de ataque
- **Control** (1-10): Precisión y capacidad de colocación en golpes técnicos
- **Salida de Bola** (1-10): Facilidad de impulsión en situaciones defensivas y globos
- **Manejabilidad** (1-10): Agilidad en movimientos rápidos y cambios de dirección
- **Punto Dulce** (1-10): Tamaño del área efectiva de impacto óptimo

FORMATO JSON REQUERIDO (sin bloques markdown, solo JSON puro):
[
  {
    "racketName": "Nombre completo exacto de la pala 1",
    "potencia": 8,
    "control": 7,
    "salidaDeBola": 6,
    "manejabilidad": 9,
    "puntoDulce": 7
  },
  {
    "racketName": "Nombre completo exacto de la pala 2",
    "potencia": 9,
    "control": 6,
    "salidaDeBola": 5,
    "manejabilidad": 7,
    "puntoDulce": 6
  }
]`;
  }

  private parseResponse(fullText: string, rackets: Racket[]): { textComparison: string; metrics: RacketMetrics[] } {
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
