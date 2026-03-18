import 'dotenv/config';
import { RagService } from '../services/ragService';
import { BasicFormData, AdvancedFormData } from '../types/recommendation';

async function testRag() {
  console.log('🚀 Testing RAG Recommendation Flow...');

  const testData: AdvancedFormData = {
    level: 'intermedio',
    play_style: 'polivalente',
    injuries: 'epicoindilitis',
    budget: { min: 100, max: 250 },
    touch_preference: 'medio',
    characteristic_priorities: ['control', 'confort'],
    gender: 'hombre',
    position: 'drive',
    matches_per_week: 2,
    current_racket: 'Adidas Adipower',
  };

  try {
    const result = await RagService.generateRecommendation('advanced', testData);

    console.log('\n--- RAG Result Analysis ---');
    console.log('Analysis:', result.analysis);
    console.log('\n--- Recommendations ---');
    result.rackets.forEach((r, i) => {
      console.log(`${i + 1}. ${r.brand} ${r.name} (Match: ${r.match_score}%)`);
      console.log(`   Reason: ${r.reason}`);
      console.log(`   Alignment: ${JSON.stringify(r.match_details)}`);
    });

    console.log('\n--- Process Summary ---');
    console.log(result.process_summary);
  } catch (error) {
    console.error('❌ RAG Test Failed:', error);
  }
}

testRag();
