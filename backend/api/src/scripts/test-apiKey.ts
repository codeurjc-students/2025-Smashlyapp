import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

async function testSpecificModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('Error: GEMINI_API_KEY is not set');
    return;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const modelsToTest = ['text-embedding-004', 'embedding-001'];

  for (const modelName of modelsToTest) {
    console.log(`\nTesting model: ${modelName}`);
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.embedContent('Hello world');
      console.log(`✅ Success for ${modelName}! Embedding size: ${result.embedding.values.length}`);
    } catch (error: any) {
      console.error(`❌ Failed for ${modelName}: ${error.message}`);
      if (error.response) {
        console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
      }
    }
  }
}

testSpecificModels();
