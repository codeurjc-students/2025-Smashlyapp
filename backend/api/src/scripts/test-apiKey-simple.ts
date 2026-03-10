import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('Error: GEMINI_API_KEY is not set');
    return;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    // There isn't a direct listModels in the main GoogleGenerativeAI class in older versions,
    // but we can try to fetch it if the SDK supports it or use a simple embed call with a known model.
    // Actually, let's try a different model like 'gemini-1.5-flash' just to see if the key works for ANYTHING.

    console.log('Testing gemini-1.5-flash text generation...');
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent('Say hello');
    console.log('✅ Success! Text generated:', result.response.text());
  } catch (error: any) {
    console.error('❌ Failed even for gemini-1.5-flash.');
    console.error('Status:', error.status);
    console.error('Message:', error.message);
  }
}

listModels();
