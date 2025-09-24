const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function setupTestDatabase() {
  console.log('🚀 Setting up test database...');
  
  try {
    // Verificar variables de entorno
    const supabaseUrl = process.env.SUPABASE_TEST_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_TEST_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase test environment variables. Please check your .env file.');
    }
    
    console.log('🔍 Testing database connection...');
    
    // Crear cliente de Supabase para testing
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Verificar conexión
    const { data: healthCheck, error: healthError } = await supabase
      .from('rackets')
      .select('count(*)', { count: 'exact', head: true });
    
    if (healthError) {
      throw new Error(`Database connection failed: ${healthError.message}`);
    }
    
    console.log('✅ Database connection successful');
    
    // Leer datos de ejemplo del JSON
    const jsonPath = path.join(__dirname, '../public/palas_padel.json');
    console.log('📁 Loading test data from:', jsonPath);
    
    if (!fs.existsSync(jsonPath)) {
      throw new Error(`Test data file not found: ${jsonPath}`);
    }
    
    const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    const palas = jsonData.palas || [];
    
    if (palas.length === 0) {
      throw new Error('No test data found in JSON file');
    }
    
    console.log(`📊 Found ${palas.length} rackets in JSON file`);
    
    // Tomar solo las primeras 1400 palas para testing
    const testData = palas.slice(0, 1400);
    console.log(`🎯 Using ${testData.length} rackets for testing`);
    
    // Limpiar datos existentes en la tabla de test (si existe)
    console.log('🧹 Cleaning existing test data...');
    const { error: deleteError } = await supabase
      .from('rackets')
      .delete()
      .neq('id', 0); // Eliminar todos los registros
    
    if (deleteError && !deleteError.message.includes('table "rackets" does not exist')) {
      console.warn('⚠️  Warning during cleanup:', deleteError.message);
    }
    
    // Transformar datos para que coincidan con el esquema de la BD
    console.log('🔄 Transforming data for database...');
    const transformedData = testData.map((pala, index) => ({
      // Campos básicos
      nombre: pala.nombre || `Pala Test ${index + 1}`,
      marca: pala.marca || null,
      modelo: pala.modelo || null,
      imagen: pala.imagen || null,
      es_bestseller: pala.es_bestseller || false,
      en_oferta: pala.en_oferta || false,
      scrapeado_en: pala.scrapeado_en || new Date().toISOString(),
      descripcion: pala.descripcion || null,
      
      // Precios
      precio_actual: pala.precio_actual || 0,
      precio_original: pala.precio_original || null,
      descuento_porcentaje: pala.descuento_porcentaje || 0,
      
      // Enlaces y fuente
      enlace: pala.enlace || null,
      fuente: pala.fuente || 'test-data',
      
      // Características (valores por defecto para testing)
      caracteristicas_marca: pala.marca || null,
      caracteristicas_color: 'Negro',
      caracteristicas_producto: 'Pala',
      caracteristicas_balance: 'Medio',
      caracteristicas_nucleo: 'EVA',
      caracteristicas_cara: 'Rugosa',
      caracteristicas_formato: 'Redonda',
      caracteristicas_dureza: 'Media',
      caracteristicas_nivel_de_juego: 'Intermedio',
      caracteristicas_acabado: 'Brillante',
      caracteristicas_peso: '365',
      caracteristicas_grosor: '38'
    }));
    
    // Insertar datos en lotes para evitar límites de Supabase
    console.log('💾 Inserting test data in batches...');
    const batchSize = 100;
    let inserted = 0;
    
    for (let i = 0; i < transformedData.length; i += batchSize) {
      const batch = transformedData.slice(i, i + batchSize);
      
      const { data, error } = await supabase
        .from('rackets')
        .insert(batch)
        .select('id');
      
      if (error) {
        console.error(`❌ Error inserting batch ${Math.floor(i/batchSize) + 1}:`, error);
        throw error;
      }
      
      inserted += data.length;
      console.log(`📦 Batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(transformedData.length/batchSize)} inserted. Total: ${inserted}/${transformedData.length}`);
    }
    
    // Verificar inserción
    const { count: finalCount, error: countError } = await supabase
      .from('rackets')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      throw new Error(`Error verifying data: ${countError.message}`);
    }
    
    console.log('✅ Test database setup completed successfully!');
    console.log(`📊 Total rackets in test database: ${finalCount}`);
    console.log('🎯 Ready for testing!');
    
  } catch (error) {
    console.error('❌ Test database setup failed:', error.message);
    process.exit(1);
  }
}

// Ejecutar setup si el script se llama directamente
if (require.main === module) {
  setupTestDatabase();
}

module.exports = { setupTestDatabase };