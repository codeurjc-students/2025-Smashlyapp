#!/usr/bin/env python3
"""
sync_catalog.py — Script unificado de sincronización de catálogo para Smashly.

Modos de ejecución:
  --mode full     Scraping completo de catálogos (mensual, ~20-30min con concurrencia).
                  Descubre palas nuevas, actualiza precios y detecta palas
                  descatalogadas (sin aparición en ninguna tienda en >30 días).

  --mode prices   Solo actualiza precios de URLs ya conocidas (semanal, ~10-15min).
                  Registra en price_history únicamente cuando el precio cambia.
                  Si una pala pierde todos sus precios, se marca como 'comparison_only'.

Uso:
  python -m src.scrapers.sync_catalog --mode full
  python -m src.scrapers.sync_catalog --mode prices
  python -m src.scrapers.sync_catalog --mode full --stores padelmarket,padelnuestro --limit 20 --dry-run
  python -m src.scrapers.sync_catalog --mode prices --stores padelproshop --dry-run
"""

import asyncio
import argparse
import json
import os
import re
import ssl
import sys
import unicodedata
from datetime import datetime, timezone, timedelta
from typing import Dict, Optional, Set

from dotenv import load_dotenv
from supabase import create_client, Client

# ── SSL fix para macOS ─────────────────────────────────────────────────────────
# Python en macOS no usa los certificados del sistema. Este parche afecta a
# todas las llamadas urllib del proceso (los scrapers que usan urllib lo heredan).
# No es un riesgo real en un script de scraping local.
ssl._create_default_https_context = ssl._create_unverified_context

# ── Path setup ────────────────────────────────────────────────────────────────
if __name__ == "__main__" and __package__ is None:
    project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    if project_root not in sys.path:
        sys.path.insert(0, project_root)
    __package__ = "src.scrapers"

from .padelnuestro_scraper import PadelNuestroScraper
from .padelproshop_scraper import PadelProShopScraper
from .padelmarket_scraper import PadelMarketScraper
from .racket_manager import RacketManager

# ── Configuración ─────────────────────────────────────────────────────────────

STORE_CONFIGS = {
    "padelmarket":  (PadelMarketScraper,  "https://padelmarket.com/collections/palas"),
    "padelnuestro": (PadelNuestroScraper,  "https://www.padelnuestro.com/palas-padel"),
    "padelproshop": (PadelProShopScraper,  "https://padelproshop.com/collections/palas-padel"),
}

# Días sin aparecer en el catálogo de TODAS las tiendas para marcar como descatalogada
DISCONTINUED_THRESHOLD_DAYS = 30

RACKETS_JSON = os.path.join(os.path.dirname(os.path.abspath(__file__)), "rackets.json")


# ── Supabase init ──────────────────────────────────────────────────────────────

def _load_env():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    for rel in ["../../backend/api/.env", "../../.env", ".env"]:
        load_dotenv(os.path.join(script_dir, rel))

_load_env()

supabase: Optional[Client] = None
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if SUPABASE_URL and SUPABASE_SERVICE_KEY:
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
        print("✅ Supabase client initialized.")
    except Exception as e:
        print(f"⚠️  Supabase init failed: {e}")
else:
    print("⚠️  Supabase credentials not found. DB sync will be skipped.")


# ── Helpers ────────────────────────────────────────────────────────────────────

def _slugify(text: str) -> str:
    text = str(text).lower()
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("utf-8")
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[-\s]+", "-", text).strip("-")
    return text


def _slug_from_model(brand: str, model: str) -> str:
    return _slugify(f"{brand}-{model}")


def now_utc() -> str:
    return datetime.now(timezone.utc).isoformat()


# ── Supabase helpers ───────────────────────────────────────────────────────────

def get_slug_id_map(client: Client) -> Dict[str, int]:
    """
    Devuelve un dict {slug: numeric_id} de todos los rackets en Supabase.
    Para rackets sin slug aún asignado los ignora (se asignarán en el primer upsert).
    """
    result = client.table("rackets").select("id, slug, model, brand").execute()
    mapping = {}
    for row in result.data or []:
        if row.get("slug"):
            mapping[row["slug"]] = row["id"]
    return mapping


def ensure_slug_column_populated(client: Client, dry_run: bool = False) -> Dict[str, int]:
    """
    Rellena la columna slug para los rackets que aún no la tienen,
    generando el slug a partir de los campos brand+model de Supabase.

    Supabase es la fuente de verdad: el slug se construye desde los datos
    que ya están en la DB, sin depender del JSON local.
    Las colisiones se resuelven añadiendo el ID numérico como sufijo.
    """
    result = client.table("rackets").select("id, slug, model, brand").execute()
    all_rows = result.data or []
    rows_without_slug = [r for r in all_rows if not r.get("slug")]

    if not rows_without_slug:
        return get_slug_id_map(client)

    print(f"📋 Poblando columna slug para {len(rows_without_slug)} rackets sin slug...")

    # Slugs ya ocupados en Supabase
    occupied: set = {r["slug"] for r in all_rows if r.get("slug")}

    updated = 0
    failed = 0
    for row in rows_without_slug:
        brand = row.get("brand") or "generic"
        model = row.get("model") or row.get("name") or str(row["id"])
        base_slug = _slug_from_model(brand, model)

        # Resolver colisiones añadiendo el ID numérico
        slug = base_slug
        if slug in occupied:
            slug = f"{base_slug}-{row['id']}"
        counter = 2
        while slug in occupied:
            slug = f"{base_slug}-{row['id']}-{counter}"
            counter += 1

        occupied.add(slug)

        if not dry_run:
            try:
                client.table("rackets").update({"slug": slug}).eq("id", row["id"]).execute()
                updated += 1
            except Exception as e:
                print(f"  ⚠️  Could not set slug for id={row['id']} (slug='{slug}'): {e}")
                failed += 1
        else:
            updated += 1

    print(f"  ✅ Slugs populados: {updated} OK, {failed} errores.")
    return get_slug_id_map(client)


def upsert_racket(client: Client, slug: str, racket: dict, slug_id_map: Dict[str, int], dry_run: bool) -> Optional[int]:
    """
    Inserta o actualiza un racket en Supabase.
    Devuelve el id numérico del racket en Supabase.
    """
    prices = racket.get("prices", [])

    # Construir el payload con los campos de precio por tienda
    payload: dict = {
        "slug":        slug,
        "name":        racket.get("model", ""),
        "brand":       racket.get("brand", ""),
        "model":       racket.get("model", ""),
        "description": racket.get("description", ""),
        "images":      racket.get("images", []),
        "specs":       racket.get("specs", {}),
        "updated_at":  now_utc(),
    }

    # Mapear precios del JSON al schema de Supabase
    any_on_offer = False
    for entry in prices:
        store = entry.get("store", "")
        price = entry.get("price")
        original = entry.get("original_price")
        url = entry.get("url", "")

        if store not in STORE_CONFIGS:
            continue

        discount = 0
        if price and original and original > price:
            discount = round((1 - price / original) * 100)
            any_on_offer = True

        payload[f"{store}_actual_price"]        = price
        payload[f"{store}_original_price"]      = original
        payload[f"{store}_discount_percentage"] = discount
    payload[f"{store}_link"]                = url

    payload["on_offer"] = any_on_offer
    
    # Si estamos insertando/actualizando una pala con precio, asegurarnos de que NO sea comparison_only
    # Solo si el modo actual es capaz de determinar que hay al menos un precio válido
    has_any_price = any(payload.get(f"{s}_actual_price") is not None for s in STORE_CONFIGS.keys())
    if has_any_price:
        payload["comparison_only"] = False

    if dry_run:
        return slug_id_map.get(slug)

    try:
        if slug in slug_id_map:
            db_id = slug_id_map[slug]
            client.table("rackets").update(payload).eq("id", db_id).execute()
            return db_id
        else:
            # Nueva pala — insert
            payload["created_at"] = now_utc()
            result = client.table("rackets").insert(payload).execute()
            if result.data:
                new_id = result.data[0]["id"]
                slug_id_map[slug] = new_id
                return new_id
    except Exception as e:
        print(f"    ❌ Supabase upsert error for '{slug}': {e}")
    return None


def record_price_history(
    client: Client,
    racket_db_id: int,
    store: str,
    price: float,
    original_price: Optional[float],
    discount_pct: int,
    dry_run: bool,
):
    """Inserta una fila en price_history. Solo llamar si el precio realmente cambió."""
    if dry_run:
        print(f"    [dry-run] price_history: racket_id={racket_db_id} store={store} price={price}")
        return
    try:
        client.table("price_history").insert({
            "racket_id":           racket_db_id,
            "store":               store,
            "price":               price,
            "original_price":      original_price,
            "discount_percentage": discount_pct,
            "recorded_at":         now_utc(),
        }).execute()
    except Exception as e:
        print(f"    ❌ price_history insert error: {e}")


def get_current_db_prices(client: Client) -> Dict[int, Dict[str, Optional[float]]]:
    """
    Devuelve {racket_db_id: {store: current_price}} para detectar cambios de precio.
    """
    result = client.table("rackets").select(
        "id,"
        "padelnuestro_actual_price,padelmarket_actual_price,padelproshop_actual_price"
    ).execute()

    prices: Dict[int, Dict[str, Optional[float]]] = {}
    for row in result.data or []:
        prices[row["id"]] = {
            "padelnuestro": row.get("padelnuestro_actual_price"),
            "padelmarket":  row.get("padelmarket_actual_price"),
            "padelproshop": row.get("padelproshop_actual_price"),
        }
    return prices


def mark_discontinued_rackets(
    client: Client,
    seen_slugs_per_store: Dict[str, Set[str]],
    slug_id_map: Dict[str, int],
    dry_run: bool,
):
    """
    Para cada tienda actualiza last_seen de las palas vistas.
    Marca como discontinued las que llevan >DISCONTINUED_THRESHOLD_DAYS sin aparecer en
    NINGUNA tienda (no elimina, solo pone discontinued=True).
    """
    now = now_utc()
    threshold = datetime.now(timezone.utc) - timedelta(days=DISCONTINUED_THRESHOLD_DAYS)

    # 1. Actualizar last_seen para las palas vistas en este scan
    for store, seen_slugs in seen_slugs_per_store.items():
        col = f"{store}_last_seen"
        for slug in seen_slugs:
            db_id = slug_id_map.get(slug)
            if not db_id or dry_run:
                continue
            try:
                client.table("rackets").update({col: now}).eq("id", db_id).execute()
            except Exception as e:
                print(f"  ⚠️  last_seen update error for {slug}: {e}")

    if dry_run:
        print("  [dry-run] Skipping discontinued marking.")
        return

    # 2. Buscar palas donde TODAS las last_seen sean None o anteriores al threshold
    result = client.table("rackets").select(
        "id, slug, discontinued,"
        "padelnuestro_last_seen, padelmarket_last_seen, padelproshop_last_seen"
    ).eq("discontinued", False).execute()

    discontinued_count = 0
    for row in result.data or []:
        last_seens = [
            row.get("padelnuestro_last_seen"),
            row.get("padelmarket_last_seen"),
            row.get("padelproshop_last_seen"),
        ]
        # Una pala se marca descatalogada solo si NUNCA ha sido vista o si todas sus
        # fechas son anteriores al threshold
        has_recent = False
        for ls in last_seens:
            if ls:
                ls_dt = datetime.fromisoformat(ls.replace("Z", "+00:00"))
                if ls_dt > threshold:
                    has_recent = True
                    break

        # Si nunca se ha visto en ninguna tienda Y tiene más de X días de antigüedad
        all_null = all(ls is None for ls in last_seens)
        if all_null:
            # Todavía no ha pasado por ningún full scan — no marcar aún
            continue

        if not has_recent:
            try:
                client.table("rackets").update({"discontinued": True}).eq("id", row["id"]).execute()
                discontinued_count += 1
                print(f"  🗑️  Marcada como descatalogada: {row.get('slug') or row['id']}")
            except Exception as e:
                print(f"  ⚠️  Error marking discontinued {row['id']}: {e}")

    if discontinued_count:
        print(f"\n  📊 {discontinued_count} palas marcadas como descatalogadas.")
    else:
        print("  ✅ Sin palas descatalogadas nuevas.")


# ── Modo FULL ──────────────────────────────────────────────────────────────────

async def run_full_sync(
    target_stores: list,
    limit: Optional[int],
    dry_run: bool,
):
    """
    Scraping completo: recorre los catálogos, actualiza rackets.json y sincroniza
    con Supabase. Detecta palas nuevas y descatalogadas.
    """
    print(f"\n{'='*60}")
    print(f"🚀 MODO FULL — Tiendas: {target_stores}")
    if dry_run:
        print("🧪 DRY-RUN ACTIVO — No se guardarán cambios")
    print(f"{'='*60}\n")

    manager = RacketManager(RACKETS_JSON)
    seen_slugs_per_store: Dict[str, Set[str]] = {s: set() for s in target_stores}

    # Cargar slug→id map de Supabase
    slug_id_map: Dict[str, int] = {}
    if supabase:
        slug_id_map = ensure_slug_column_populated(supabase, dry_run)
        print(f"📋 {len(slug_id_map)} slugs mapeados en Supabase.\n")

    # Cargar precios actuales en DB para detectar cambios
    current_db_prices: Dict[int, Dict[str, Optional[float]]] = {}
    if supabase:
        current_db_prices = get_current_db_prices(supabase)

    total_new = 0
    total_updated = 0

    for store_name in target_stores:
        if store_name not in STORE_CONFIGS:
            print(f"⚠️  Tienda desconocida: {store_name}. Skipping.")
            continue

        cls, category_url = STORE_CONFIGS[store_name]
        print(f"\n{'─'*50}")
        print(f"🏪 Scraping catálogo: {store_name}")
        print(f"{'─'*50}")

        scraper = cls()
        await scraper.init()

        try:
            product_urls = await scraper.scrape_category(category_url)
            print(f"  🔗 {len(product_urls)} URLs encontradas en catálogo.")

            if limit:
                product_urls = product_urls[:limit]
                print(f"  ⚙️  Limitado a {limit} productos.")

            # --- Procesamiento Concurrente ---
            MAX_CONCURRENT_SCRAPES = 5
            semaphore = asyncio.Semaphore(MAX_CONCURRENT_SCRAPES)

            async def ScrapeAndMerge(url, idx):
                async with semaphore:
                    print(f"  [{idx+1}/{len(product_urls)}] Scraping: {url}")
                    try:
                        product = await scraper.scrape_product(url)
                        if product:
                            slug = manager.merge_product(product, store_name)
                            if slug:
                                seen_slugs_per_store[store_name].add(slug)
                            print(f"    ✅ {product.name}")
                        else:
                            print(f"    ⚠️  No se pudo extraer producto: {url}")
                    except Exception as e:
                        print(f"    ❌ Error en {url}: {e}")

            tasks = [ScrapeAndMerge(url, i) for i, url in enumerate(product_urls)]
            await asyncio.gather(*tasks)

        except Exception as e:
            print(f"  ❌ Error crítico en {store_name}: {e}")
        finally:
            await scraper.close()

    # Guardar JSON
    if not dry_run:
        manager.save_db()
        print(f"\n💾 rackets.json guardado ({len(manager.data)} palas).")

    # Sincronizar con Supabase
    if supabase:
        print(f"\n{'─'*50}")
        print("☁️  Sincronizando con Supabase...")
        print(f"{'─'*50}")

        for slug, racket in manager.data.items():
            db_id = upsert_racket(supabase, slug, racket, slug_id_map, dry_run)

            if not db_id:
                continue

            # Comprobar cambios de precio y registrar en price_history
            old_prices = current_db_prices.get(db_id, {})
            for entry in racket.get("prices", []):
                store = entry.get("store")
                new_price = entry.get("price")
                original = entry.get("original_price")

                if not store or new_price is None:
                    continue

                old_price = old_prices.get(store)

                # Solo registrar si el precio ha cambiado respecto al valor en DB
                if old_price is None or abs(float(old_price) - float(new_price)) > 0.01:
                    discount = 0
                    if original and original > new_price:
                        discount = round((1 - new_price / original) * 100)

                    print(f"  💰 {slug} [{store}]: {old_price} → {new_price} €")
                    record_price_history(supabase, db_id, store, new_price, original, discount, dry_run)
                    if old_price is None:
                        total_new += 1
                    else:
                        total_updated += 1

        # Marcar descatalogadas
        print(f"\n{'─'*50}")
        print("🔍 Comprobando palas descatalogadas...")
        mark_discontinued_rackets(supabase, seen_slugs_per_store, slug_id_map, dry_run)

    print(f"\n{'='*60}")
    print(f"🏁 FULL SYNC completado.")
    print(f"   Palas en JSON:         {len(manager.data)}")
    print(f"   Nuevas en price_hist:  {total_new}")
    print(f"   Actualizadas:          {total_updated}")
    print(f"{'='*60}\n")


# ── Modo PRICES ────────────────────────────────────────────────────────────────

async def run_prices_sync(
    target_stores: list,
    limit: Optional[int],
    dry_run: bool,
):
    """
    Actualización rápida de precios: re-rasca las URLs ya conocidas sin tocar
    el catálogo completo. Registra en price_history solo si el precio cambió.
    """
    print(f"\n{'='*60}")
    print(f"💸 MODO PRICES — Tiendas: {target_stores}")
    if dry_run:
        print("🧪 DRY-RUN ACTIVO — No se guardarán cambios")
    print(f"{'='*60}\n")

    # Cargar JSON
    with open(RACKETS_JSON, "r", encoding="utf-8") as f:
        rackets_data: dict = json.load(f)

    # Cargar slug→id map y precios actuales desde Supabase
    slug_id_map: Dict[str, int] = {}
    current_db_prices: Dict[int, Dict[str, Optional[float]]] = {}
    if supabase:
        slug_id_map = ensure_slug_column_populated(supabase, dry_run)
        current_db_prices = get_current_db_prices(supabase)

    # Instanciar solo los scrapers necesarios
    scrapers = {}
    for store in target_stores:
        if store in STORE_CONFIGS:
            scrapers[store] = STORE_CONFIGS[store][0]()

    racket_ids = list(rackets_data.keys())
    if limit:
        racket_ids = racket_ids[:limit]

    processed = updated = errors = 0

    for slug in racket_ids:
        racket = rackets_data[slug]
        model_name = racket.get("model", slug)

        print(f"\n📦 [{processed+1}/{len(racket_ids)}] {model_name}")

        # Resolver db_id: primero por slug, luego fallback por model_name
        db_id = slug_id_map.get(slug)
        if not db_id and supabase:
            # Búsqueda en bloque propio — no se ve afectada por errores de slug
            try:
                fb = supabase.table("rackets").select("id").eq("model", model_name).execute()
                if fb.data:
                    db_id = fb.data[0]["id"]
                    slug_id_map[slug] = db_id
                else:
                    print(f"  ⚠️  No encontrado en Supabase: '{model_name}'")
            except Exception as e:
                print(f"  ⚠️  Fallback lookup failed para '{model_name}': {e}")

            # Reparar el slug en Supabase en bloque separado para que una
            # colisión no anule el db_id ya obtenido
            if db_id and not dry_run:
                try:
                    supabase.table("rackets").update({"slug": slug}).eq("id", db_id).execute()
                    print(f"  🔧 Slug reparado en Supabase: '{slug}' → id={db_id}")
                except Exception:
                    # Colisión: el slug ya pertenece a otra fila.
                    # No es crítico — db_id está en caché para esta ejecución.
                    pass

        db_updates: dict = {}
        any_on_offer = False
        racket_changed = False

        for price_entry in racket.get("prices", []):
            store = price_entry.get("store")
            url = price_entry.get("url")

            if store not in scrapers or store not in target_stores:
                continue

            scraper = scrapers[store]
            print(f"  🔍 {store}...")

            try:
                product = await scraper.scrape_product(url)

                if product and product.price and product.price > 0:
                    new_price = product.price
                    original = product.original_price
                    old_price = price_entry.get("price")

                    # Actualizar JSON
                    price_entry["price"] = new_price
                    price_entry["original_price"] = original
                    price_entry["last_updated"] = now_utc()

                    # Preparar update de Supabase
                    discount = 0
                    if original and original > new_price:
                        discount = round((1 - new_price / original) * 100)
                        any_on_offer = True

                    db_updates[f"{store}_actual_price"]        = new_price
                    db_updates[f"{store}_original_price"]      = original
                    db_updates[f"{store}_discount_percentage"] = discount

                    # Comparar con precio en DB para decidir si registrar historial
                    old_db_price = current_db_prices.get(db_id or -1, {}).get(store)

                    if old_db_price is None or abs(float(old_db_price) - float(new_price)) > 0.01:
                        if old_price != new_price:
                            print(f"    💰 {old_price} → {new_price} €")
                            racket_changed = True

                        if db_id and supabase:
                            record_price_history(
                                supabase, db_id, store,
                                new_price, original, discount, dry_run
                            )
                        updated += 1
                    else:
                        print(f"    — Sin cambio: {new_price} €")

                else:
                    # URL devuelve sin precio → posible descatalogada o cambio de URL
                    print(f"    ⚠️  Sin precio en {store} (URL: {url})")
                    # Ponemos el precio a null para reflejar no disponibilidad
                    db_updates[f"{store}_actual_price"] = None
                    db_updates[f"{store}_link"] = url
                    errors += 1

            except Exception as e:
                print(f"    ❌ Error: {e}")
                errors += 1

        # --- Lógica de Comparison Only ---
        # Si TODAS las tiendas scrapeadas en este modo devolvieron Sin Precio,
        # y antes tenía precios, marcar como comparison_only
        all_prices_null = all(
            db_updates.get(f"{s}_actual_price") is None 
            for s in target_stores 
            if f"{s}_actual_price" in db_updates
        )
        
        if all_prices_null and db_id:
            # Verificar si realmente no queda ni un solo precio en ninguna tienda (incluyendo las no elegidas)
            current = current_db_prices.get(db_id, {})
            # Solo si los precios que NO estamos actualizando también son null
            other_stores_null = all(
                current.get(s) is None 
                for s in STORE_CONFIGS.keys() 
                if s not in target_stores
            )
            
            if other_stores_null:
                db_updates["comparison_only"] = True
                db_updates["on_offer"] = False
                print(f"  🚩 Marcada como 'Solo comparación' (sin stock en ninguna tienda).")
            else:
                # Si hay otra tienda que no hemos scrapeado hoy que TIENE precio, 
                # entonces la pala NO es solo_comparacion.
                db_updates["comparison_only"] = False
        elif db_id:
            # Si al menos una tienda tiene precio, nos aseguramos de quitar el flag
            db_updates["comparison_only"] = False

        # Actualizar Supabase
        if db_updates and supabase and not dry_run:
            db_updates["updated_at"] = now_utc()

            if db_id:
                try:
                    supabase.table("rackets").update(db_updates).eq("id", db_id).execute()
                    if racket_changed or db_updates.get("comparison_only"):
                        print(f"  ✨ Supabase actualizado.")
                except Exception as e:
                    print(f"  ❌ Supabase error: {e}")
            else:
                print(f"  ⚠️  No se encontró id de Supabase para slug '{slug}'.")

        processed += 1

        # Guardado periódico del JSON (cada 10 palas)
        if processed % 10 == 0 and not dry_run:
            with open(RACKETS_JSON, "w", encoding="utf-8") as f:
                json.dump(rackets_data, f, indent=4, ensure_ascii=False)

    # Guardado final del JSON
    if not dry_run:
        with open(RACKETS_JSON, "w", encoding="utf-8") as f:
            json.dump(rackets_data, f, indent=4, ensure_ascii=False)
        print(f"\n💾 rackets.json guardado.")

    # Cerrar scrapers
    for s in scrapers.values():
        if hasattr(s, "close"):
            await s.close()

    print(f"\n{'='*60}")
    print(f"🏁 PRICES SYNC completado.")
    print(f"   Procesadas: {processed}")
    print(f"   Actualizadas en price_history: {updated}")
    print(f"   Errores/sin precio:            {errors}")
    print(f"{'='*60}\n")


# ── Main ───────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Smashly — Sincronización de catálogo y precios.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument(
        "--mode",
        choices=["full", "prices"],
        required=True,
        help="'full': scraping completo semanal | 'prices': actualización diaria de precios",
    )
    parser.add_argument(
        "--stores",
        type=str,
        default=",".join(STORE_CONFIGS.keys()),
        help=f"Tiendas separadas por coma (default: todas). Opciones: {', '.join(STORE_CONFIGS.keys())}",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=None,
        help="Limitar el número de productos por tienda (útil para pruebas).",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Modo simulación: no guarda cambios en JSON ni en Supabase.",
    )

    args = parser.parse_args()
    target_stores = [s.strip() for s in args.stores.split(",")]

    if args.mode == "full":
        asyncio.run(run_full_sync(target_stores, args.limit, args.dry_run))
    else:
        asyncio.run(run_prices_sync(target_stores, args.limit, args.dry_run))
