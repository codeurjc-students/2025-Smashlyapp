import 'dotenv/config';
import axios from 'axios';

async function testEmbeddings() {
  const baseUrl = process.env.FREE_AI_API_URL || 'https://free-ai-api-hiwg.onrender.com';
  console.log(`Testing embeddings on: ${baseUrl}/embeddings`);

  try {
    const response = await axios.post(`${baseUrl}/embeddings`, {
      text: 'Hola mundo',
    });
    console.log('Success!', response.data);
  } catch (error: any) {
    console.log('Failed. Status:', error.response?.status);
    console.log('Data:', error.response?.data);
  }
}

testEmbeddings();
