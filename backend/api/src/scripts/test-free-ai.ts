import { freeAiService } from '../services/freeAiService';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function main() {
  console.log('Testing Free AI Service Integration...');
  console.log('URL:', process.env.FREE_AI_API_URL || 'http://localhost:3000 (default)');

  try {
    const prompt = 'Hola, responde con "Funciona" si me recibes.';
    console.log(`Sending prompt: "${prompt}"`);

    const response = await freeAiService.generateContent(prompt);
    console.log('Response received:');
    console.log(response);

    if (response && response.length > 0) {
      console.log('✅ Success!');
    } else {
      console.log('❌ Empty response');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

main().catch(console.error);
