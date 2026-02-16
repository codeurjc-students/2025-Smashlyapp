import axios from 'axios';
import logger from '../config/logger';

export class FreeAiService {
  // Removed constructor to read env var dynamically on request
  // private baseUrl: string;

  constructor() {}

  private get baseUrl(): string {
    return process.env.FREE_AI_API_URL || 'http://localhost:3001';
  }

  /**
   * Generates content using the local Free AI API.
   * This service buffers the streaming response and returns the complete text.
   */
  async generateContent(prompt: string): Promise<string> {
    try {
      logger.info(`🤖 Requesting content from Free AI API: ${this.baseUrl}`);

      const response = await axios.post(
        `${this.baseUrl}/chat`,
        {
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        },
        {
          responseType: 'stream',
          timeout: 120000, // 2 minutes timeout for long generations
        }
      );

      return new Promise((resolve, reject) => {
        let fullText = '';
        const stream = response.data;

        stream.on('data', (chunk: Buffer) => {
          const text = chunk.toString();
          // The local free-ai-api sends raw text chunks, not standard SSE format.
          // However, we support both just in case.

          if (text.startsWith('data: ')) {
            // Try parsing as SSE
            const lines = text.split('\n');
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = line.slice(6);
                  if (data === '[DONE]') continue;
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content || '';
                  fullText += content;
                } catch (e) {
                  // If parse fails, treat as raw text?
                  // No, if it looks like SSE but fails json parse, it's probably broken SSE.
                }
              } else if (line.trim()) {
                // Non-data line in an SSE stream?
                // Unlikely to happen mixed with raw text.
              }
            }
          } else {
            // Raw text stream (Groq/Cerebras from free-ai-api)
            fullText += text;
          }
        });

        stream.on('end', () => {
          if (!fullText) {
            // Fallback: sometimes the API might return just text or different format if not standard SSE
            // But based on free-ai-api code, it pipes standard chunks.
            // Let's verify free-ai-api implementation again if checking fails.
            // For now assume standard OpenAI-like SSE format.
            if (fullText.length === 0) {
              logger.warn('⚠️ Free AI API returned empty response');
            }
          }
          logger.info(`✅ Free AI API success. Length: ${fullText.length}`);
          resolve(fullText);
        });

        stream.on('error', (err: any) => {
          logger.error('❌ Free AI API stream error:', err);
          reject(err);
        });
      });
    } catch (error: any) {
      const errorMessage = error.message || 'Unknown error contacting Free AI API';
      logger.warn(`❌ Free AI API failed: ${errorMessage}`);
      throw new Error(`Free AI API error: ${errorMessage}`);
    }
  }
}

export const freeAiService = new FreeAiService();
