#!/usr/bin/env python3
"""
Script para migrar datos de palas con características detalladas a Supabase
"""

import json
import os
from supabase import create_client, Client
from typing import Dict, List, Any
import time

# Configuración de Supabase (necesitarás tus credenciales)
SUPABASE_URL = os.getenv("VITE_SUPABASE_URL", "https://lrdgyfmkkboyhoycrnov.supabase.co")
# Para migración, usar SERVICE_ROLE_KEY en lugar de ANON_KEY
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxyZGd5Zm1ra2JveWhveWNybm92Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQ3MTg0NSwiZXhwIjoyMDY3MDQ3ODQ1fQ.etjT9fa5Ev8OX56IP1mRRwh-Ow7lZl93MfLvxfTM8mc")

def init_supabase() -> Client:
    """Inicializa el cliente de Supabase"""
    try:
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        return supabase
    except Exception as e:
        print(f"❌ Error conectando a Supabase: {e}")
        return None

def prepare_racket_data(pala: Dict[str, Any], show_debug: bool = False) -> Dict[str, Any]:
    """Prepara los datos de una pala para insertar en Supabase"""
    prepared_data = {
        "nombre": pala.get("nombre", ""),
        "marca": pala.get("marca", ""),
        "modelo": pala.get("modelo", ""),
        "precio_actual": pala.get("precio_actual", 0),
        "precio_original": pala.get("precio_original"),
        "descuento_porcentaje": pala.get("descuento_porcentaje", 0),
        "enlace": pala.get("enlace", ""),
        "imagen": pala.get("imagen", ""),
        "es_bestseller": pala.get("es_bestseller", False),
        "en_oferta": pala.get("en_oferta", False),
        "scrapeado_en": pala.get("scrapeado_en", ""),
        "fuente": pala.get("fuente", "padelnuestro.com"),
        "descripcion": pala.get("descripcion", ""),
        "caracteristicas": pala.get("caracteristicas", {}),
        "especificaciones": pala.get("especificaciones", {})
    }
    
    # Debug: verificar que tenemos los datos nuevos
    if show_debug:
        if prepared_data["descripcion"] or prepared_data["caracteristicas"]:
            print(f"   ✅ {prepared_data['nombre']} tiene datos adicionales")
            if prepared_data["caracteristicas"]:
                print(f"      Características: {list(prepared_data['caracteristicas'].keys())[:3]}...")
        else:
            print(f"   ⚠️ {prepared_data['nombre']} NO tiene datos adicionales")
    
    return prepared_data

def migrate_rackets_to_supabase(json_file: str = "../palas_padel.json"):
    """Migra las palas del JSON a Supabase"""
    
    if not os.path.exists(json_file):
        # Intentar buscar en el directorio actual
        local_file = "palas_padel.json"
        if os.path.exists(local_file):
            json_file = local_file
        else:
            print(f"❌ Archivo {json_file} no encontrado.")
            print(f"❌ Tampoco se encontró {local_file} en el directorio actual.")
            print("💡 Asegúrate de que el archivo palas_padel.json esté disponible.")
            return
    
    # Inicializar Supabase
    supabase = init_supabase()
    if not supabase:
        print("❌ No se pudo conectar a Supabase. Verifica tus credenciales.")
        return
    
    # Cargar datos del JSON
    try:
        with open(json_file, 'r', encoding='utf-8') as f:
            datos = json.load(f)
        
        palas = datos.get("palas", [])
        print(f"📊 Encontradas {len(palas)} palas para migrar")
        
        # Debug: mostrar ejemplo de la primera pala
        if palas:
            primera_pala = palas[0]
            print(f"🔍 Debug - Primera pala ejemplo:")
            print(f"   Nombre: {primera_pala.get('nombre', 'N/A')}")
            print(f"   Tiene descripción: {'Sí' if primera_pala.get('descripcion') else 'No'}")
            print(f"   Tiene características: {'Sí' if primera_pala.get('caracteristicas') else 'No'}")
            if primera_pala.get('caracteristicas'):
                print(f"   Características ejemplo: {list(primera_pala['caracteristicas'].keys())[:3]}")
        
    except Exception as e:
        print(f"❌ Error leyendo {json_file}: {e}")
        return
    
    # Migrar palas a Supabase
    migradas = 0
    errores = 0
    
    print(f"\n🔄 Iniciando migración...")
    
    for i, pala in enumerate(palas, 1):
        try:
            # Preparar datos (solo mostrar debug para las primeras 5)
            show_debug = i <= 5
            pala_data = prepare_racket_data(pala, show_debug)
            
            # Verificar si ya existe (por nombre)
            existing = supabase.table("palas_padel").select("id").eq("nombre", pala_data["nombre"]).execute()
            
            if existing.data:
                # Actualizar existente
                result = supabase.table("palas_padel").update(pala_data).eq("nombre", pala_data["nombre"]).execute()
                if show_debug:
                    print(f"🔄 Actualizada: {pala_data['nombre']}")
            else:
                # Insertar nueva
                result = supabase.table("palas_padel").insert(pala_data).execute()
                if show_debug:
                    print(f"✅ Insertada: {pala_data['nombre']}")
            
            migradas += 1
            
            # Pausa cada 10 inserts para no saturar
            if i % 10 == 0:
                time.sleep(1)
                print(f"   📈 Progreso: {i}/{len(palas)} palas procesadas")
                
        except Exception as e:
            print(f"❌ Error con {pala.get('nombre', 'Unknown')}: {e}")
            errores += 1
            continue
    
    print(f"\n🎉 Migración completada!")
    print(f"✅ Palas migradas: {migradas}")
    print(f"❌ Errores: {errores}")
    print(f"📊 Total: {len(palas)}")

def create_supabase_table_sql():
    """Genera el SQL para crear/actualizar la tabla en Supabase"""
    sql = """
-- Actualizar tabla palas_padel para incluir nuevos campos
ALTER TABLE palas_padel 
ADD COLUMN IF NOT EXISTS descripcion TEXT,
ADD COLUMN IF NOT EXISTS caracteristicas JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS especificaciones JSONB DEFAULT '{}';

-- Crear índices para mejorar las búsquedas
CREATE INDEX IF NOT EXISTS idx_palas_caracteristicas ON palas_padel USING GIN (caracteristicas);
CREATE INDEX IF NOT EXISTS idx_palas_especificaciones ON palas_padel USING GIN (especificaciones);

-- Índices adicionales para características específicas
CREATE INDEX IF NOT EXISTS idx_palas_forma ON palas_padel ((caracteristicas->>'forma'));
CREATE INDEX IF NOT EXISTS idx_palas_balance ON palas_padel ((caracteristicas->>'balance'));
CREATE INDEX IF NOT EXISTS idx_palas_nivel_jugador ON palas_padel ((caracteristicas->>'nivel_jugador'));
"""
    
    print("📝 SQL para actualizar la tabla en Supabase:")
    print("=" * 60)
    print(sql)
    print("=" * 60)
    print("\n💡 Copia y ejecuta este SQL en el SQL Editor de Supabase antes de la migración.")

if __name__ == "__main__":
    print("🚀 Script de migración de palas con características detalladas")
    print("=" * 60)
    
    # Mostrar SQL para actualizar tabla
    create_supabase_table_sql()
    
    # Preguntar si continuar
    respuesta = input("\n¿Has ejecutado el SQL en Supabase? (s/N): ").lower().strip()
    
    if respuesta in ['s', 'si', 'sí', 'y', 'yes']:
        # Migrar datos
        migrate_rackets_to_supabase()
    else:
        print("👍 Perfecto. Ejecuta primero el SQL en Supabase y luego vuelve a ejecutar este script.")
        print("\nPasos a seguir:")
        print("1. Ve a tu proyecto en Supabase")
        print("2. Abre el SQL Editor")
        print("3. Copia y ejecuta el SQL mostrado arriba")
        print("4. Vuelve a ejecutar este script")
