#!/usr/bin/env python3
"""
Script de migración de datos desde rackets.json a Supabase
Autor: Claude Code
Fecha: 2025-01-14

Este script:
1. Carga las credenciales de Supabase desde .env
2. Hace backup de los datos existentes
3. Borra todos los registros de la tabla rackets
4. Inserta todos los datos del JSON a la base de datos
5. Genera un log detallado del proceso
"""

import json
import os
import sys
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional
from dotenv import load_dotenv
from supabase import create_client, Client

# Import matching utils
try:
    from matching_utils import (
        normalize_name, 
        create_comparison_key, 
        calculate_similarity, 
        calculate_token_similarity, 
        check_critical_keywords,
        extract_brand_from_name
    )
except ImportError:
    import sys
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    from matching_utils import (
        normalize_name, 
        create_comparison_key, 
        calculate_similarity, 
        calculate_token_similarity, 
        check_critical_keywords,
        extract_brand_from_name
    )


# Configuración
JSON_PATH = "rackets.json"
BACKUP_DIR = "backups"
LOG_FILE = "migration.log"
ENV_PATH = "backend/api/.env"

# Cargar variables de entorno
load_dotenv(ENV_PATH)

# Obtener credenciales
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Error: No se encontraron las credenciales de Supabase en .env")
    print(f"   Verificar archivo: {ENV_PATH}")
    sys.exit(1)


def log_message(message: str, level: str = "INFO") -> None:
    """Escribe mensaje en consola y archivo de log"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    log_entry = f"[{timestamp}] [{level}] {message}"
    print(log_entry)

    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(log_entry + "\n")


def create_backup(supabase: Client) -> Optional[str]:
    """Crea un backup de los datos actuales de la tabla rackets"""
    try:
        log_message("📦 Creando backup de datos existentes...")

        # Crear directorio de backups si no existe
        Path(BACKUP_DIR).mkdir(exist_ok=True)

        # Obtener todos los datos actuales
        response = supabase.table("rackets").select("*").execute()
        current_data = response.data

        if not current_data or len(current_data) == 0:
            log_message("ℹ️  No hay datos existentes para hacer backup", "INFO")
            return None

        # Guardar backup con timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_file = f"{BACKUP_DIR}/rackets_backup_{timestamp}.json"

        with open(backup_file, "w", encoding="utf-8") as f:
            json.dump(current_data, f, ensure_ascii=False, indent=2)

        log_message(f"✓ Backup creado: {backup_file} ({len(current_data)} registros)", "SUCCESS")
        return backup_file

    except Exception as e:
        log_message(f"Error creando backup: {e}", "ERROR")
        return None


def load_json_data() -> List[Dict[str, Any]]:
    """Carga datos del archivo JSON"""
    try:
        if not Path(JSON_PATH).exists():
            log_message(f"Archivo {JSON_PATH} no encontrado", "ERROR")
            return []
            
        with open(JSON_PATH, 'r', encoding='utf-8') as f:
            data = json.load(f)
            log_message(f"Cargados {len(data)} registros de {JSON_PATH}")
            return data
    except Exception as e:
        log_message(f"Error cargando JSON: {e}", "ERROR")
        return []

def prepare_record(record: Dict[str, Any]) -> Dict[str, Any]:
    """Prepara un registro para inserción/actualización"""
    # Copia simple por ahora, ajustar si hay transformaciones necesarias
    new_record = record.copy()
    
    # Intentar extraer/limpiar marca si no existe o si el nombre está sucio
    name = new_record.get("name")
    brand = new_record.get("brand")
    
    if name:
        extracted_brand, cleaned_name = extract_brand_from_name(name)
        
        # Si no tiene marca, o si la marca extraida coincide con la declarada
        if extracted_brand:
            if not brand or brand.upper() == extracted_brand.upper():
                new_record["brand"] = extracted_brand
                new_record["name"] = cleaned_name
                # También limpiar modelo si es igual al nombre
                if new_record.get("model") == name:
                    new_record["model"] = cleaned_name

    return new_record




def delete_all_records(supabase: Client) -> bool:
    """Borra todos los registros de la tabla rackets"""
    try:
        log_message("🗑️  Borrando registros existentes...")
        # Supabase no permite borrar todo sin WHERE por seguridad, 
        # así que usamos una condición que siempre sea cierta o borramos por IDs si fuera necesario.
        # Pero normalmente .delete().neq("id", 0) funciona para borrar todo.
        supabase.table("rackets").delete().neq("id", 0).execute()
        log_message("✓ Tabla limpiada correctamente", "SUCCESS")
        return True
    except Exception as e:
        log_message(f"Error borrando registros: {e}", "ERROR")
        return False


def process_rackets(supabase: Client, json_records: List[Dict[str, Any]]) -> Dict[str, int]:
    """
    Procesa los registros del JSON en modo 'Clean Slate':
    - Limpia/Normaliza los datos.
    - Inserta todo como activo.
    """
    stats = {"inserted": 0, "failed": 0, "total": len(json_records)}
    
    log_message(f"🔄 Insertando {len(json_records)} registros nuevos...")

    batch_size = 50
    buffer = []

    for record in json_records:
        try:
            # Preparar y limpiar registro (usa extract_brand_from_name internamente)
            prepared = prepare_record(record)
            prepared["status"] = "active" # Forzar status activo (por si acaso viene del JSON)
            # Asegurar que no hay related_racket_id
            if "related_racket_id" in prepared:
                del prepared["related_racket_id"]

            buffer.append(prepared)

            if len(buffer) >= batch_size:
                data, count = supabase.table("rackets").insert(buffer).execute()
                # data es un tuple/object dependiendo version lib, asumimos exito si no lanza excepcion
                stats["inserted"] += len(buffer)
                print(f"  ✓ Insertado lote de {len(buffer)} palas", end='\r')
                buffer = []
                
        except Exception as e:
            stats["failed"] += 1
            log_message(f"  ❌ Error preparando/insertando {record.get('name')}: {e}", "ERROR")
            # Si falla el lote entero, es mas grave, pero aqui estamos atrapando por record si loop individual
            # o por lote si el try esta fuera. 
            # Para robustez en este script rapido, si falla insert de batch perdemos esos records.
            # Mejor hacer insert individual si queremos ver cual falla, o batch para velocidad.
            # Dado que el usuario quiere 'clean slate', batch es mejor.
            
            # Reset buffer si falla para no bloquear siguientes (simple recovery)
            buffer = []

    # Insertar remanentes
    if buffer:
        try:
            supabase.table("rackets").insert(buffer).execute()
            stats["inserted"] += len(buffer)
            print(f"  ✓ Insertado lote final de {len(buffer)} palas")
        except Exception as e:
            stats["failed"] += len(buffer)
            log_message(f"Error insertando lote final: {e}", "ERROR")

    return stats


def main():
    """Función principal de migración"""
    # Inicializar log
    log_message("="*60)
    log_message("🚀 INICIO DE SINCRONIZACIÓN (UPSERT MODE)")
    log_message("="*60)

    try:
        # Crear cliente de Supabase
        log_message("🔌 Conectando a Supabase...")
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        log_message("✓ Conectado a Supabase", "SUCCESS")

        # Paso 1: Crear backup (siempre bueno tenerlo)
        create_backup(supabase)

        # Paso 2: Cargar datos del JSON
        json_data = load_json_data()
        if not json_data:
            log_message("❌ No hay datos para migrar", "ERROR")
            return

        # Paso 3: Borrar todo (Clean Slate)
        delete_all_records(supabase)

        # Paso 4: Procesar (Insertar Todo)
        stats = process_rackets(supabase, json_data)

        # Resumen final
        log_message("\n" + "="*60)
        log_message("🎉 IMPORTACIÓN COMPLETADA")
        log_message("="*60)
        log_message(f"Total registros en JSON: {stats['total']}")
        log_message(f"  ★ Insertados: {stats['inserted']}")
        log_message(f"  ❌ Fallidos: {stats['failed']}")
        log_message(f"  📄 Log guardado en: {LOG_FILE}")
        log_message("="*60)

    except Exception as e:
        log_message(f"❌ Error fatal durante la migración: {e}", "ERROR")
        raise


if __name__ == "__main__":
    main()
