import dotenv from 'dotenv';
import path from 'path';

// Load environment variables locally
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { OpenRouterService } from '../services/openRouterService';
import { Racket } from '../types/racket';
import logger from '../config/logger';

async function testComparisonRefactor() {
  console.log('🧪 Testing Comparison Refactor...');

  // Mock rackets data
  const mockRackets: Racket[] = [
    {
      id: 1,
      nombre: 'Bullpadel Vertex 04 2024',
      marca: 'Bullpadel',
      precio_actual: 250,
      imagen_principal: 'url',
      descripcion_corta: 'Potencia pura',
      caracteristicas_forma: 'Diamante',
      caracteristicas_balance: 'Alto',
      caracteristicas_peso: '370g',
      testea_potencia: 9,
      testea_control: 7,
      testea_manejabilidad: 7,
      testea_confort: 8,
      testea_iniciacion: 3,
      url: 'https://example.com/vertex',
    } as any,
    {
      id: 2,
      nombre: 'Nox AT10 Genius 18K 2024',
      marca: 'Nox',
      precio_actual: 280,
      imagen_principal: 'url',
      descripcion_corta: 'Control total',
      caracteristicas_forma: 'Gota',
      caracteristicas_balance: 'Medio',
      caracteristicas_peso: '365g',
      // No testea data for this one to test certification flag
      url: 'https://example.com/at10',
    } as any,
  ];

  const service = new OpenRouterService();

  try {
    console.log('🤖 Requesting comparison...');
    const result = await service.compareRackets(mockRackets);

    console.log('\n✅ Comparison Result Received!');

    // Validate Structure
    console.log('\n🔍 Validating JSON Structure:');

    // 1. Executive Summary
    if (result.executiveSummary && result.executiveSummary.length > 0) {
      console.log(' [x] executiveSummary present');
    } else {
      console.error(' [ ] executiveSummary MISSING');
    }

    // 2. Metrics (Radar Data)
    if (result.metrics && Array.isArray(result.metrics) && result.metrics.length === 2) {
      console.log(' [x] metrics array valid');
      const r1 = result.metrics[0];
      if (r1.radarData && typeof r1.radarData.potencia === 'number') {
        console.log(' [x] metrics.radarData valid');
      } else {
        console.error(' [ ] metrics.radarData INVALID');
        console.log(JSON.stringify(r1, null, 2));
      }

      if (r1.isCertified === true && result.metrics[1].isCertified === false) {
        console.log(' [x] isCertified flag correct (Vertex: true, Nox: false)');
      } else {
        console.error(' [ ] isCertified flag INVALID');
        console.log('Vertex:', r1.isCertified, 'Nox:', result.metrics[1].isCertified);
      }
    } else {
      console.error(' [ ] metrics Structure INVALID');
    }

    // 3. Comparison Table
    if (result.comparisonTable && Array.isArray(result.comparisonTable)) {
      console.log(' [x] comparisonTable is Array');
      if (result.comparisonTable.length > 0 && result.comparisonTable[0].feature) {
        console.log(' [x] comparisonTable items have "feature" property');
      } else {
        console.error(' [ ] comparisonTable items INVALID');
      }
    } else {
      console.error(' [ ] comparisonTable INVALID (not array)');
    }

    console.log('\n📝 Full JSON Preview (Partial):');
    console.log(JSON.stringify(result.metrics, null, 2));
  } catch (error) {
    console.error('❌ Test Failed:', error);
  }
}

testComparisonRefactor();
