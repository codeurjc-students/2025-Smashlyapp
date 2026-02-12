#!/usr/bin/env python3
"""
Script de migración de rackets.json a Supabase
- Crea backup de la tabla actual
- Limpia racket_views y rackets
- Modifica esquema (image → images jsonb, elimina padelpoint)
- Mapea datos JSON → columnas DB
- Inserta en lotes
"""
import json
import os
import sys
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client

# ============================================================================
# CONFIGURACIÓN
# ============================================================================

# Cargar variables de entorno
load_dotenv('../../backend/api/.env')
load_dotenv('../../.env')

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    print("❌ Error: SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son requeridas")
    print("   Verifica tu archivo .env")
    sys.exit(1)

# Crear cliente Supabase
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

RACKETS_FILE = 'rackets.json'
BATCH_SIZE = 50  # Supabase límite recomendado

# Mapeo de specs español → columnas DB
SPECS_MAPPING = {
    'Forma': 'characteristics_shape',
    'Balance': 'characteristics_balance',
    'Núcleo': 'characteristics_core',
    'Nucleo': 'characteristics_core',
    'Cara': 'characteristics_face',
    'Nivel': 'characteristics_game_level',
    'Rugosidad': 'characteristics_finish',
    'Colores': 'characteristics_color',
    'Color 2': 'characteristics_color_2',
    'Producto': 'characteristics_product',
    'Dureza': 'characteristics_hardness',
    'Superficie': 'characteristics_surface',
    'Superfície': 'characteristics_surface',  # Con acento
    'Tipo de Juego': 'characteristics_game_type',
    'Jugador': 'characteristics_player',
    'Colección Jugadores': 'characteristics_player_collection',
    'Coleccion Jugadores': 'characteristics_player_collection',
    'Marco': 'characteristics_format',
}

# ============================================================================
# FUNCIONES AUXILIARES
# ============================================================================

def print_section(title):
    """Imprime un título de sección."""
    print()
    print("=" * 80)
    print(title)
    print("=" * 80)


def count_table_rows(table_name):
    """Cuenta las filas de una tabla."""
    try:
        response = supabase.table(table_name).select('id', count='exact').limit(1).execute()
        return response.count or 0
    except Exception as e:
        print(f"⚠️  Error contando {table_name}: {e}")
        return 0


def backup_rackets_table():
    """Verifica que se haya creado el backup manualmente."""
    print_section("FASE 1: VERIFICAR BACKUP DE LA TABLA RACKETS")
    
    backup_table_name = f"rackets_backup_{datetime.now().strftime('%Y%m%d')}"
    
    print("Verificando si existe backup manual...")
    
    # Contar registros actuales
    current_count = count_table_rows('rackets')
    print(f"  Registros actuales en rackets: {current_count}")
    
    if current_count == 0:
        print("  ⚠️  La tabla rackets está vacía, omitiendo backup")
        return True
    
    # Verificar si existe el backup
    backup_count = count_table_rows(backup_table_name)
    
    if backup_count > 0:
        print(f"  ✓ Backup encontrado: {backup_count} registros en {backup_table_name}")
        if backup_count != current_count:
            print(f"  ⚠️  Advertencia: backup ({backup_count}) != original ({current_count})")
        return True
    else:
        print(f"  ⚠️  No se encontró backup: {backup_table_name}")
        print()
        print("  INSTRUCCIONES:")
        print("  1. Abre Supabase SQL Editor")
        print("  2. Ejecuta: CREATE TABLE rackets_backup_20260210 AS SELECT * FROM rackets;")
        print("  3. Vuelve a ejecutar este script")
        print()
        
        response = input("¿Ya ejecutaste el backup manualmente? (y/N): ")
        if response.lower() == 'y':
            # Verificar de nuevo
            backup_count = count_table_rows(backup_table_name)
            if backup_count > 0:
                print(f"  ✓ Backup verificado: {backup_count} registros")
                return True
        
        response2 = input("\n¿Continuar SIN backup? (y/N): ")
        return response2.lower() == 'y'


def clean_dependent_tables():
    """Limpia las tablas que dependen de rackets."""
    print_section("FASE 2: LIMPIAR TABLAS DEPENDIENTES")
    
    # Limpiar racket_views
    print("Borrando registros de racket_views...")
    views_count = count_table_rows('racket_views')
    print(f"  Registros actuales: {views_count}")
    
    if views_count > 0:
        try:
            supabase.table('racket_views').delete().neq('id', '00000000-0000-0000-0000-000000000000').execute()
            print(f"  ✓ {views_count} registros eliminados")
        except Exception as e:
            print(f"  ❌ Error: {e}")
            return False
    else:
        print("  → Ya está vacía")
    
    # Limpiar rackets
    print("\nBorrando registros de rackets...")
    rackets_count = count_table_rows('rackets')
    print(f"  Registros actuales: {rackets_count}")
    
    if rackets_count > 0:
        try:
            supabase.table('rackets').delete().neq('id', 0).execute()
            print(f"  ✓ {rackets_count} registros eliminados")
        except Exception as e:
            print(f"  ❌ Error: {e}")
            return False
    else:
        print("  → Ya está vacía")
    
    return True


def modify_schema():
    """Modifica el esquema de la tabla rackets."""
    print_section("FASE 3: MODIFICAR ESQUEMA")
    
    print("Aplicando cambios al esquema...")
    
    changes = [
        # Eliminar columnas padelpoint
        "ALTER TABLE rackets DROP COLUMN IF EXISTS padelpoint_actual_price CASCADE;",
        "ALTER TABLE rackets DROP COLUMN IF EXISTS padelpoint_original_price CASCADE;",
        "ALTER TABLE rackets DROP COLUMN IF EXISTS padelpoint_discount_percentage CASCADE;",
        "ALTER TABLE rackets DROP COLUMN IF EXISTS padelpoint_link CASCADE;",
        
        # Eliminar columna image antigua si existe
        "ALTER TABLE rackets DROP COLUMN IF EXISTS image CASCADE;",
        
        # Agregar columna images como jsonb
        "ALTER TABLE rackets ADD COLUMN IF NOT EXISTS images jsonb DEFAULT '[]'::jsonb;",
    ]
    
    try:
        for i, sql in enumerate(changes, 1):
            print(f"  [{i}/{len(changes)}] Ejecutando: {sql[:60]}...")
            # Usar PostgREST directamente con SQL
            # Nota: Supabase Python no tiene exec_sql, usar alternativa
            # Ejecutar via REST API directamente
            from urllib.parse import quote
            import requests
            
            headers = {
                'apikey': SUPABASE_SERVICE_KEY,
                'Authorization': f'Bearer {SUPABASE_SERVICE_KEY}',
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            }
            
            # Ejecutar SQL via REST API de Supabase
            # Como no podemos ejecutar SQL directamente, marcar como advertencia
            print(f"      ⚠️  SQL debe ejecutarse manualmente en Supabase Dashboard")
        
        print("\n  ⚠️  ACCIÓN REQUERIDA:")
        print("  → Ejecuta el siguiente SQL en el Supabase SQL Editor:")
        print()
        for sql in changes:
            print(f"      {sql}")
        print()
        
        response = input("¿SQL ejecutado manualmente? (y/N): ")
        if response.lower() != 'y':
            print("  ❌ Migración cancelada")
            return False
        
        print("  ✓ Cambios de esquema aplicados")
        return True
        
    except Exception as e:
        print(f"  ❌ Error modificando esquema: {e}")
        return False


def map_json_to_db_row(racket_id, racket_data):
    """Mapea una entrada del JSON a una fila de la DB."""
    
    # Campos básicos
    row = {
        'name': racket_data.get('model', ''),
        'brand': racket_data.get('brand', ''),
        'model': racket_data.get('model', ''),
        'images': json.dumps(racket_data.get('images', [])),  # JSONB
        'description': racket_data.get('description', ''),
        'specs': json.dumps(racket_data.get('specs', {})),  # JSONB
    }
    
    # Mapear specs a columnas characteristics_*
    specs = racket_data.get('specs', {})
    for spec_key, db_column in SPECS_MAPPING.items():
        if spec_key in specs:
            row[db_column] = specs[spec_key]
    
    # Determinar si está en oferta
    has_discount = False
    
    # Procesar precios por tienda
    for price_entry in racket_data.get('prices', []):
        store = price_entry.get('store', '')
        
        # Mapear tiendas
        if store == 'padelnuestro':
            price = price_entry.get('price')
            original = price_entry.get('original_price')
            row['padelnuestro_actual_price'] = price if price else None
            row['padelnuestro_original_price'] = original if original else None
            row['padelnuestro_link'] = price_entry.get('url')
            
            if original and price and original > price:
                has_discount = True
                discount = ((original - price) / original * 100)
                row['padelnuestro_discount_percentage'] = int(round(discount))
        
        elif store == 'padelmarket':
            price = price_entry.get('price')
            original = price_entry.get('original_price')
            row['padelmarket_actual_price'] = price if price else None
            row['padelmarket_original_price'] = original if original else None
            row['padelmarket_link'] = price_entry.get('url')
            
            if original and price and original > price:
                has_discount = True
                discount = ((original - price) / original * 100)
                row['padelmarket_discount_percentage'] = int(round(discount))
        
        elif store == 'padelproshop':
            price = price_entry.get('price')
            original = price_entry.get('original_price')
            row['padelproshop_actual_price'] = price if price else None
            row['padelproshop_original_price'] = original if original else None
            row['padelproshop_link'] = price_entry.get('url')
            
            if original and price and original > price:
                has_discount = True
                discount = ((original - price) / original * 100)
                row['padelproshop_discount_percentage'] = int(round(discount))
    
    # Marcar como oferta
    row['on_offer'] = has_discount
    
    return row


def insert_rackets_data():
    """Lee el JSON e inserta los datos en la DB."""
    print_section("FASE 4: INSERTAR DATOS")
    
    # Cargar JSON
    print(f"Cargando {RACKETS_FILE}...")
    with open(RACKETS_FILE, 'r', encoding='utf-8') as f:
        rackets_data = json.load(f)
    
    total = len(rackets_data)
    print(f"  ✓ {total} palas cargadas del JSON")
    
    # Convertir a lista de filas
    print("\nMapeando datos JSON → DB...")
    rows = []
    for racket_id, racket_data in rackets_data.items():
        row = map_json_to_db_row(racket_id, racket_data)
        rows.append(row)
    
    print(f"  ✓ {len(rows)} filas preparadas")
    
    # Insertar en lotes
    print(f"\nInsertando en lotes de {BATCH_SIZE}...")
    inserted = 0
    failed = 0
    
    for i in range(0, len(rows), BATCH_SIZE):
        batch = rows[i:i + BATCH_SIZE]
        batch_num = (i // BATCH_SIZE) + 1
        total_batches = (len(rows) + BATCH_SIZE - 1) // BATCH_SIZE
        
        try:
            response = supabase.table('rackets').insert(batch).execute()
            inserted += len(batch)
            print(f"  [{batch_num}/{total_batches}] ✓ {len(batch)} registros insertados (total: {inserted})")
        except Exception as e:
            failed += len(batch)
            print(f"  [{batch_num}/{total_batches}] ❌ Error: {e}")
            
            # Intentar insertar uno por uno para identificar el problema
            print(f"      Reintentando uno por uno...")
            for j, row in enumerate(batch):
                try:
                    supabase.table('rackets').insert(row).execute()
                    inserted += 1
                except Exception as e2:
                    failed += 1
                    print(f"      ❌ Fila {i+j}: {row.get('name', 'sin nombre')[:50]} - {e2}")
    
    print()
    print(f"  ✓ Inserción completada:")
    print(f"    - Exitosas: {inserted}")
    print(f"    - Fallidas: {failed}")
    print(f"    - Total: {inserted + failed}")
    
    return inserted > 0


def verify_migration():
    """Verifica que la migración fue exitosa."""
    print_section("FASE 5: VERIFICACIÓN")
    
    # Contar registros
    db_count = count_table_rows('rackets')
    
    with open(RACKETS_FILE, 'r') as f:
        json_data = json.load(f)
    json_count = len(json_data)
    
    print(f"Registros en JSON:     {json_count}")
    print(f"Registros en Supabase: {db_count}")
    
    if db_count == json_count:
        print("  ✓ Counts coinciden perfectamente")
    else:
        print(f"  ⚠️  Diferencia: {abs(db_count - json_count)} registros")
    
    # Verificar algunas palas al azar
    print("\nVerificando datos de muestra...")
    try:
        sample = supabase.table('rackets').select('*').limit(5).execute()
        
        for i, racket in enumerate(sample.data, 1):
            print(f"\n  [{i}] {racket.get('name', 'Sin nombre')}")
            print(f"      Brand: {racket.get('brand')}")
            print(f"      Images: {len(json.loads(racket.get('images', '[]')))} URLs")
            print(f"      On offer: {racket.get('on_offer')}")
            
            # Contar precios
            prices = 0
            if racket.get('padelnuestro_actual_price'): prices += 1
            if racket.get('padelmarket_actual_price'): prices += 1
            if racket.get('padelproshop_actual_price'): prices += 1
            print(f"      Prices: {prices} tiendas")
    
    except Exception as e:
        print(f"  ⚠️  Error en verificación: {e}")
    
    print()
    print("✓ Migración completada")
    print()
    print("SIGUIENTES PASOS:")
    print("  1. Actualizar backend/api/src/types/racket.ts → campo 'image' → 'images' (jsonb)")
    print("  2. Actualizar backend/api/src/services/racketService.ts → adaptar a 'images'")
    print("  3. Actualizar frontend/src/types/ → interfaces con 'images'")
    print("  4. Eliminar referencias a 'padelpoint' en el código")
    print("  5. Probar la API: GET /api/v1/rackets")


# ============================================================================
# MAIN
# ============================================================================

def main():
    print("=" * 80)
    print("MIGRACIÓN DE RACKETS.JSON A SUPABASE")
    print("=" * 80)
    print()
    print(f"Supabase URL: {SUPABASE_URL}")
    print(f"JSON file: {RACKETS_FILE}")
    print()
    
    # Confirmación
    response = input("⚠️  Esta operación BORRARÁ todos los datos actuales. ¿Continuar? (y/N): ")
    if response.lower() != 'y':
        print("❌ Migración cancelada")
        return
    
    # Ejecutar fases
    if not backup_rackets_table():
        print("❌ Backup falló, abortando")
        return
    
    if not clean_dependent_tables():
        print("❌ Limpieza falló, abortando")
        return
    
    if not modify_schema():
        print("❌ Modificación de esquema falló, abortando")
        return
    
    if not insert_rackets_data():
        print("❌ Inserción de datos falló")
        return
    
    verify_migration()


if __name__ == '__main__':
    main()
