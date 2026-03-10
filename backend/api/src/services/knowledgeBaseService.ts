import fs from 'fs';
import path from 'path';
import logger from '../config/logger';
import { EmbeddingService } from './embeddingService';
import { VectorStoreService } from './vectorStoreService';

export class KnowledgeBaseService {
  private static readonly KNOWLEDGE_DIR = path.join(__dirname, '../../data/knowledge');

  /**
   * Indexa todos los documentos markdown en la carpeta de conocimiento.
   */
  static async indexAll() {
    try {
      if (!fs.existsSync(this.KNOWLEDGE_DIR)) {
        logger.warn(`Knowledge directory not found: ${this.KNOWLEDGE_DIR}`);
        return;
      }

      const files = fs.readdirSync(this.KNOWLEDGE_DIR).filter(f => f.endsWith('.md'));
      logger.info(`Found ${files.length} knowledge documents to index.`);

      for (const file of files) {
        await this.indexDocument(file);
      }
    } catch (error) {
      logger.error('Error indexing knowledge base:', error);
      throw error;
    }
  }

  /**
   * Indexa un documento individual: lee, divide en chunks, genera embeddings y guarda.
   */
  static async indexDocument(filename: string) {
    const filePath = path.join(this.KNOWLEDGE_DIR, filename);
    const content = fs.readFileSync(filePath, 'utf-8');

    // Chunking
    const chunks = EmbeddingService.chunkText(content, 500, 50);
    logger.info(`Indexing "${filename}": ${chunks.length} chunks.`);

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const embedding = await EmbeddingService.embed(chunk);

      const metadata = {
        category: this.getCategoryFromFilename(filename),
        indexed_at: new Date().toISOString(),
      };

      await VectorStoreService.insertKnowledgeChunk(filename, i, chunk, embedding, metadata);
    }
  }

  private static getCategoryFromFilename(filename: string): string {
    if (filename.includes('biomechanics')) return 'biomechanics';
    if (filename.includes('materials')) return 'materials';
    if (filename.includes('technique')) return 'technique';
    return 'general';
  }
}
