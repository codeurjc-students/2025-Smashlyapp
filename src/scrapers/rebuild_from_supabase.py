#!/usr/bin/env python3
"""
rebuild_from_supabase.py — Reconstruye rackets.json desde Supabase.

Propósito:
  Sincroniza el JSON local con el estado actual de la base de datos,
  aplicando normalización de nombres a todos los modelos.
  Útil para limpiar el JSON antes de un sync_catalog completo.

Uso:
  python -m src.scrapers.rebuild_from_supabase
  python -m src.scrapers.rebuild_from_supabase --dry-run
  python -m src.scrapers.rebuild_from_supabase --output rackets_clean.json

Requisitos:
  pip install supabase python-dotenv
"""

import json
import os
import sys
import argparse
from datetime import datetime

# ── Path setup ────────────────────────────────────────────────────────────────
if __name__ == "__main__" and __package__ is None:
    project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    if project_root not in sys.path:
        sys.path.insert(0, project_root)
    __package__ = "src.scrapers"

from dotenv import load_dotenv
from supabase import create_client, Client

from .paddle_normalizer import normalize_paddle_name, slugify_paddle

# ── Env ───────────────────────────────────────────────────────────────────────
def _load_env():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    for rel in ["../../backend/api/.env", "../../.env", ".env"]:
        load_dotenv(os.path.join(script_dir, rel))

_load_env()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

RACKETS_JSON = os.path.join(os.path.dirname(os.path.abspath(__file__)), "rackets.json")

# Tiendas que existen como columnas en Supabase
STORES = ["padelnuestro", "padelmarket", "padelproshop"]


def fetch_all_rackets(client: Client) -> list[dict]:
    """Descarga todos los rackets de Supabase en batches de 1000."""
    all_rows = []
    page = 0
    page_size = 1000

    print("📥 Descargando palas de Supabase...")
    while True:
        result = (
            client.table("rackets")
            .select("*")
            .range(page * page_size, (page + 1) * page_size - 1)
            .execute()
        )
        batch = result.data or []
        all_rows.extend(batch)
        print(f"  Página {page + 1}: {len(batch)} palas (total: {len(all_rows)})")
        if len(batch) < page_size:
            break
        page += 1

    print(f"✅ Total descargadas: {len(all_rows)} palas\n")
    return all_rows


def supabase_row_to_json(row: dict) -> dict:
    """
    Convierte una fila de Supabase al formato de rackets.json,
    aplicando normalización al nombre del modelo.
    """
    raw_model = row.get("model") or row.get("name") or ""
    brand = row.get("brand") or "Unknown"

    # Normalizar nombre del modelo
    normalized_model = normalize_paddle_name(raw_model)
    if normalized_model != raw_model:
        print(f"  [norm] '{raw_model}' → '{normalized_model}'")

    # Construir slug desde datos limpios
    slug = row.get("slug")
    if not slug:
        slug = slugify_paddle(brand, normalized_model)

    # Reconstruir precios desde columnas planas de Supabase
    prices = []
    for store in STORES:
        price = row.get(f"{store}_actual_price")
        original = row.get(f"{store}_original_price")
        link = row.get(f"{store}_link")
        last_seen = row.get(f"{store}_last_seen")

        if price is not None or link:
            prices.append({
                "store": store,
                "price": price,
                "original_price": original,
                "url": link or "",
                "currency": "EUR",
                "last_updated": last_seen or row.get("updated_at", datetime.now().isoformat()),
            })

    return {
        "id": slug,
        "brand": brand,
        "model": normalized_model,
        "description": row.get("description") or "",
        "specs": row.get("specs") or {},
        "images": row.get("images") or [],
        "prices": prices,
        # Metadatos extra por si son útiles
        "_supabase_id": row.get("id"),
        "_discontinued": row.get("discontinued", False),
        "_comparison_only": row.get("comparison_only", False),
    }


def rebuild(dry_run: bool = False, output_path: str = None):
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        print("❌ Faltan credenciales de Supabase en .env")
        sys.exit(1)

    client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    rows = fetch_all_rackets(client)

    print("🔄 Convirtiendo y normalizando nombres...")
    new_data = {}
    slug_collisions = 0

    for row in rows:
        entry = supabase_row_to_json(row)
        slug = entry["id"]

        # Resolver colisiones de slug
        if slug in new_data:
            slug_collisions += 1
            slug = f"{slug}-{row.get('id', slug_collisions)}"
            entry["id"] = slug

        new_data[slug] = entry

    print(f"\n📊 Resumen:")
    print(f"  Palas procesadas:   {len(rows)}")
    print(f"  Palas en JSON:      {len(new_data)}")
    print(f"  Colisiones slug:    {slug_collisions}")

    # Comparar con el JSON actual
    if os.path.exists(RACKETS_JSON):
        with open(RACKETS_JSON) as f:
            old_data = json.load(f)
        print(f"  JSON anterior:      {len(old_data)} palas")

        # Palas en Supabase pero no en JSON local (nuevas en BD)
        new_slugs = set(new_data.keys()) - set(old_data.keys())
        removed_slugs = set(old_data.keys()) - set(new_data.keys())
        if new_slugs:
            print(f"  Nuevas en Supabase: {len(new_slugs)}")
        if removed_slugs:
            print(f"  Solo en JSON local: {len(removed_slugs)} (no están en Supabase)")

    target = output_path or RACKETS_JSON

    if dry_run:
        print(f"\n🧪 DRY-RUN: No se ha escrito nada. El JSON resultante tendría {len(new_data)} entradas.")
        print(f"   Destino sería: {target}")
    else:
        # Backup del JSON actual antes de sobreescribir
        if os.path.exists(RACKETS_JSON):
            backup_path = RACKETS_JSON.replace(".json", f"_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json")
            with open(RACKETS_JSON) as f:
                old_content = f.read()
            with open(backup_path, "w") as f:
                f.write(old_content)
            print(f"\n💾 Backup guardado en: {backup_path}")

        with open(target, "w", encoding="utf-8") as f:
            json.dump(new_data, f, indent=4, ensure_ascii=False)
        print(f"✅ rackets.json actualizado: {target} ({len(new_data)} palas)")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Reconstruye rackets.json desde Supabase con nombres normalizados.")
    parser.add_argument("--dry-run", action="store_true", help="Simula sin escribir nada.")
    parser.add_argument("--output", type=str, help="Ruta alternativa de salida (por defecto: rackets.json).")
    args = parser.parse_args()

    rebuild(dry_run=args.dry_run, output_path=args.output)
