import 'dotenv/config';
import { RagService } from '../services/ragService';
import { BasicFormData, AdvancedFormData } from '../types/recommendation';

async function testRag() {
  console.log('🚀 Testing RAG Recommendation Flow...');

  const testData: AdvancedFormData = {
    level: 'intermedio',
    frequency: '2-3 veces por semana',
    play_style: 'polivalente',
    injuries: 'epicoindilitis',
    budget: { min: 100, max: 250 },
    touch_preference: 'medio',
    characteristic_priorities: ['control', 'punto_dulce'],
    gender: 'masculino',
    years_playing: 3,
    position: 'drive',
    best_shot: 'volea de derecha',
    weak_shot: 'remate por 3',
    weight_preference: 'medio',
    balance_preference: 'medio',
    shape_preference: 'redonda',
    current_racket_likes: 'buen control y comodidad',
    current_racket_dislikes: 'falta de potencia en golpes definitivos',
    objectives: ['mejorar potencia', 'reducir molestias en codo'],
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
