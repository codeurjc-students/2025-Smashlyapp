import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

async function verifyAll() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('❌ GEMINI_API_KEY is not set');
    return;
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  console.log('1. Testing Text Generation (gemini-1.5-flash)...');
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const res = await model.generateContent('ping');
    console.log('✅ Text Generation Success:', res.response.text().trim());
  } catch (err: any) {
    console.error('❌ Text Generation Failed:', err.message);
  }

  console.log('\n2. Testing Embeddings (text-embedding-004)...');
  try {
    const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
    const res = await model.embedContent('ping');
    console.log('✅ Embeddings Success! Vector length:', res.embedding.values.length);
  } catch (err: any) {
    console.error('❌ Embeddings Failed:', err.message);
  }
}

verifyAll();
