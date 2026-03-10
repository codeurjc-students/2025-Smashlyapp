import 'dotenv/config';
import axios from 'axios';

async function testOpenRouterEmbedding() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.error('Error: OPENROUTER_API_KEY is not set');
    return;
  }

  console.log('Testing OpenRouter embedding with openai/text-embedding-3-small...');

  try {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/embeddings',
      {
        model: 'openai/text-embedding-3-small',
        input: 'Hello world',
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

    console.log('✅ Success!');
    console.log('Embedding size:', response.data.data[0].embedding.length);
  } catch (error: any) {
    console.error('❌ Failed:', error.message);
    if (error.response) {
      console.error('Response Status:', error.response.status);
      console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testOpenRouterEmbedding();
