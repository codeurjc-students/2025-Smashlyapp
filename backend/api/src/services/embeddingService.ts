import axios from 'axios';
import logger from '../config/logger';

export class EmbeddingService {
  private static readonly OPENROUTER_MODEL = 'openai/text-embedding-3-small';

  /**
   * Genera un embedding para un texto individual usando OpenRouter.
   */
  static async embed(text: string): Promise<number[]> {
    return this.embedWithOpenRouter(text);
  }

  /**
   * Genera embedding usando OpenRouter (OpenAI model).
   */
  private static async embedWithOpenRouter(text: string): Promise<number[]> {
    try {
      const apiKey = process.env.OPENROUTER_API_KEY;
      if (!apiKey) {
        throw new Error('OPENROUTER_API_KEY is not configured');
      }

      const response = await axios.post(
        'https://openrouter.ai/api/v1/embeddings',
        {
          model: this.OPENROUTER_MODEL,
          input: text,
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.OPENROUTER_APP_URL || 'https://smashly.app',
            'X-Title': process.env.OPENROUTER_APP_NAME || 'Smashly',
          },
        }
      );

      return response.data.data[0].embedding;
    } catch (error) {
      logger.error('Error in OpenRouter embedding:', error);
      throw error;
    }
  }

  /**
   * Genera embeddings en batch.
   */
  static async embedBatch(texts: string[]): Promise<number[][]> {
    const results: number[][] = [];
    const batchSize = 25; // Reducido para mayor seguridad con APIs externas

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);

      // Para OpenRouter/OpenAI, podemos hacer batching real en una sola llamada
      const batchResults = await this.embedBatchWithOpenRouter(batch);
      results.push(...batchResults);

      if (i + batchSize < texts.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    return results;
  }

  private static async embedBatchWithOpenRouter(texts: string[]): Promise<number[][]> {
    try {
      const apiKey = process.env.OPENROUTER_API_KEY;
      if (!apiKey) {
        throw new Error('OPENROUTER_API_KEY is not configured');
      }

      const response = await axios.post(
        'https://openrouter.ai/api/v1/embeddings',
        {
          model: this.OPENROUTER_MODEL,
          input: texts,
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.OPENROUTER_APP_URL || 'https://smashly.app',
            'X-Title': process.env.OPENROUTER_APP_NAME || 'Smashly',
          },
        }
      );

      return response.data.data.map((item: any) => item.embedding);
    } catch (error) {
      logger.error('Error in OpenRouter batch embedding:', error);
      throw error;
    }
  }

  /**
   * Genera el "documento rico" de una pala para embedding.
   */
  static buildRacketDocument(racket: any): string {
    const brand = racket.marca || 'Marca desconocida';
    const name = racket.nombre || 'Modelo desconocido';
    const shape = racket.caracteristicas_forma || '';
    const balance = racket.caracteristicas_balance || '';
    const level = racket.caracteristicas_nivel_de_juego || '';
    const hardness = racket.caracteristicas_dureza || '';
    const surface = racket.caracteristicas_superficie || '';
    const core = racket.caracteristicas_nucleo || '';
    const face = racket.caracteristicas_cara || '';
    const price = racket.precio_actual ? `${racket.precio_actual}€` : 'Precio no disponible';

    // Métricas Testea
    const power =
      racket.testea_potencia !== undefined ? `Potencia ${racket.testea_potencia}/10` : '';
    const control =
      racket.testea_control !== undefined ? `Control ${racket.testea_control}/10` : '';
    const handling =
      racket.testea_manejabilidad !== undefined
        ? `Manejabilidad ${racket.testea_manejabilidad}/10`
        : '';
    const comfort =
      racket.testea_confort !== undefined ? `Confort ${racket.testea_confort}/10` : '';
    const certified = racket.testea_certificado ? 'Certificada por Testea Pádel' : '';

    const testeaSection = [power, control, handling, comfort, certified].filter(s => s).join(', ');

    return `${name} de ${brand}. Pala de forma ${shape} con balance ${balance}, diseñada para nivel ${level}. 
    Núcleo de ${core} y caras de ${face}. Dureza ${hardness}. Superficie ${surface}. 
    ${testeaSection ? `Métricas: ${testeaSection}.` : ''} 
    Precio aproximado: ${price}. 
    Ideal para jugadores que buscan ${racket.caracteristicas_estilo_juego || 'un rendimiento equilibrado'}. 
    ${racket.descripcion || ''}`
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Genera el documento de una review para embedding.
   */
  static buildReviewDocument(review: any, racketName: string): string {
    const text = review.comentario || review.content || '';
    const rating = review.valoracion || review.rating || '';
    const level = review.nivel_usuario || review.user_level || '';

    return `Opinión sobre la pala ${racketName}: "${text}". Valoración: ${rating}/5. Perfil del jugador: ${level}.`.trim();
  }

  /**
   * Divide un texto largo en chunks con overlap.
   */
  static chunkText(text: string, chunkSize: number = 500, overlap: number = 50): string[] {
    const chunks: string[] = [];
    const words = text.split(/\s+/);

    for (let i = 0; i < words.length; i += chunkSize - overlap) {
      const chunk = words.slice(i, i + chunkSize).join(' ');
      if (chunk) {
        chunks.push(chunk);
      }
      if (i + chunkSize >= words.length) break;
    }

    return chunks;
  }
}
