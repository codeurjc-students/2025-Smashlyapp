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


def delete_all_records(supabase: Client) -> bool:
    """Borra todos los registros de la tabla rackets"""
    try:
        log_message("🗑️  Borrando todos los registros existentes...")

        # Primero obtener el total para confirmar
        response = supabase.table("rackets").select("id", count="exact").execute()
        total = response.count if hasattr(response, 'count') else len(response.data)

        if total == 0:
            log_message("ℹ️  No hay registros para borrar", "INFO")
            return True

        # Confirmar con el usuario
        print(f"\n⚠️  Se van a borrar {total} registros de la tabla 'rackets'")
        confirm = input("¿Estás seguro? (escribe 'SI' para confirmar): ")

        if confirm != "SI":
            log_message("❌ Operación cancelada por el usuario", "WARNING")
            return False

        # Borrar todos los registros
        # Usamos un filtro que siempre es verdadero para IDs de tipo bigint
        supabase.table("rackets").delete().gte("id", 0).execute()

        log_message(f"✓ Se borraron {total} registros", "SUCCESS")
        return True

    except Exception as e:
        log_message(f"Error borrando registros: {e}", "ERROR")
        return False


def load_json_data() -> List[Dict[str, Any]]:
    """Carga los datos del archivo JSON"""
    try:
        log_message(f"📖 Cargando datos desde {JSON_PATH}...")

        if not os.path.exists(JSON_PATH):
            log_message(f"Error: No se encontró el archivo {JSON_PATH}", "ERROR")
            return []

        with open(JSON_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)

        if not isinstance(data, list):
            log_message("Error: El JSON no contiene una lista de objetos", "ERROR")
            return []

        log_message(f"✓ Cargados {len(data)} registros desde JSON", "SUCCESS")
        return data

    except Exception as e:
        log_message(f"Error cargando JSON: {e}", "ERROR")
        return []


def prepare_record(record: Dict[str, Any]) -> Dict[str, Any]:
    """
    Prepara un registro para inserción en Supabase.
    - Convierte valores None a null
    - Convierte specs a JSON/JSONB
    - Añade timestamps
    """
    # Crear copia para no modificar el original
    clean_record = {}

    # Timestamp actual
    now = datetime.now().isoformat()

    # Campos del registro
    for key, value in record.items():
        # Convertir strings vacíos a None
        if value == "" or value == "null":
            clean_record[key] = None
        # Mantener el valor tal cual
        else:
            clean_record[key] = value

    # Asegurar que specs sea un objeto JSON válido
    if "specs" in clean_record:
        if clean_record["specs"] is None:
            clean_record["specs"] = {"tecnologias": [], "peso": None, "marco": None}
        elif isinstance(clean_record["specs"], str):
            try:
                clean_record["specs"] = json.loads(clean_record["specs"])
            except:
                clean_record["specs"] = {"tecnologias": [], "peso": None, "marco": None}

    # Añadir timestamps (Supabase puede manejarlos automáticamente, pero los añadimos por seguridad)
    clean_record["created_at"] = now
    clean_record["updated_at"] = now

    return clean_record


def insert_records(supabase: Client, records: List[Dict[str, Any]]) -> Dict[str, int]:
    """
    Inserta todos los registros en la base de datos.
    Retorna estadísticas de la inserción.
    """
    stats = {
        "success": 0,
        "failed": 0,
        "total": len(records)
    }

    log_message(f"📥 Insertando {len(records)} registros...")

    # Insertar en lotes de 100 para mejor rendimiento
    BATCH_SIZE = 100

    for i in range(0, len(records), BATCH_SIZE):
        batch = records[i:i + BATCH_SIZE]
        batch_num = (i // BATCH_SIZE) + 1
        total_batches = (len(records) + BATCH_SIZE - 1) // BATCH_SIZE

        try:
            # Preparar registros del batch
            prepared_batch = [prepare_record(record) for record in batch]

            # Insertar batch
            response = supabase.table("rackets").insert(prepared_batch).execute()

            stats["success"] += len(batch)
            log_message(
                f"  ✓ Batch {batch_num}/{total_batches}: {len(batch)} registros insertados "
                f"({stats['success']}/{stats['total']})",
                "INFO"
            )

        except Exception as e:
            stats["failed"] += len(batch)
            log_message(
                f"  ❌ Error en batch {batch_num}/{total_batches}: {e}",
                "ERROR"
            )

            # Intentar insertar uno por uno para identificar el registro problemático
            for idx, record in enumerate(batch):
                try:
                    prepared = prepare_record(record)
                    supabase.table("rackets").insert([prepared]).execute()
                    stats["success"] += 1
                    stats["failed"] -= 1
                except Exception as e2:
                    log_message(
                        f"    ❌ Error en registro '{record.get('name', 'unknown')}': {e2}",
                        "ERROR"
                    )

    return stats


def main():
    """Función principal de migración"""
    # Inicializar log
    log_message("="*60)
    log_message("🚀 INICIO DE MIGRACIÓN A SUPABASE")
    log_message("="*60)

    try:
        # Crear cliente de Supabase
        log_message("🔌 Conectando a Supabase...")
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        log_message("✓ Conectado a Supabase", "SUCCESS")

        # Paso 1: Crear backup
        backup_file = create_backup(supabase)

        # Paso 2: Cargar datos del JSON
        json_data = load_json_data()
        if not json_data:
            log_message("❌ No hay datos para migrar", "ERROR")
            return

        # Paso 3: Borrar datos existentes
        if not delete_all_records(supabase):
            log_message("❌ Migración cancelada", "WARNING")
            return

        # Paso 4: Insertar nuevos datos
        stats = insert_records(supabase, json_data)

        # Resumen final
        log_message("\n" + "="*60)
        log_message("🎉 MIGRACIÓN COMPLETADA")
        log_message("="*60)
        log_message(f"Total registros procesados: {stats['total']}")
        log_message(f"  ✓ Insertados exitosamente: {stats['success']}")
        log_message(f"  ❌ Fallidos:               {stats['failed']}")
        if backup_file:
            log_message(f"  📦 Backup guardado en:     {backup_file}")
        log_message(f"  📄 Log guardado en:        {LOG_FILE}")
        log_message("="*60)

        # Verificar resultado final
        if stats['failed'] > 0:
            log_message("⚠️  La migración se completó con errores. Revisa el log.", "WARNING")
        else:
            log_message("✅ Migración exitosa sin errores", "SUCCESS")

    except Exception as e:
        log_message(f"❌ Error fatal durante la migración: {e}", "ERROR")
        raise


if __name__ == "__main__":
    main()
