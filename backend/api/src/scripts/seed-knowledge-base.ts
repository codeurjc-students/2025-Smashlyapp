import 'dotenv/config';
import { KnowledgeBaseService } from '../services/knowledgeBaseService';
import logger from '../config/logger';

async function seedKnowledge() {
  try {
    logger.info('📚 Starting knowledge base seeding...');
    await KnowledgeBaseService.indexAll();
    logger.info('✅ Knowledge base seeded successfully!');
  } catch (error) {
    logger.error('Fatal error seeding knowledge base:', error);
    process.exit(1);
  }
}

seedKnowledge();
