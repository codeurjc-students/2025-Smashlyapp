#!/usr/bin/env python3
import json
import os
import sys
import asyncio
from datetime import datetime
from dotenv import load_dotenv
from supabase import create_client, Client

# Allow running as a script by setting the package if not set
if __name__ == "__main__" and __package__ is None:
    # Add project root to sys.path
    project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    if project_root not in sys.path:
        sys.path.insert(0, project_root)
    __package__ = "src.scrapers"

# Import scrapers using relative imports to match the package structure
from .padelnuestro_scraper import PadelNuestroScraper
from .padelproshop_scraper import PadelProShopScraper
from .padelmarket_scraper import PadelMarketScraper

def load_env_vars():
    """Load environment variables from multiple possible locations."""
    # Try parent directory's backend/api/.env (relative to script)
    script_dir = os.path.dirname(os.path.abspath(__file__))
    backend_env = os.path.join(script_dir, "../../backend/api/.env")
    root_env = os.path.join(script_dir, "../../.env")
    local_env = os.path.join(script_dir, ".env")
    
    load_dotenv(backend_env)
    load_dotenv(root_env)
    load_dotenv(local_env)

# Initialize Supabase
load_env_vars()
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

supabase = None
if SUPABASE_URL and SUPABASE_SERVICE_KEY:
    try:
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
        print(f"✅ Supabase client initialized.")
    except Exception as e:
        print(f"⚠️  Failed to initialize Supabase client: {e}")
else:
    print("⚠️  Supabase credentials not found. Database sync will be skipped.")

# Map store names from JSON to Scraper Classes
SCRAPER_CLASSES = {
    "padelnuestro": PadelNuestroScraper,
    "padelproshop": PadelProShopScraper,
    "padelmarket": PadelMarketScraper
}

async def update_racket_prices(limit=None, dry_run=False, store_filter=None):
    rackets_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'rackets.json')
    if not os.path.exists(rackets_file):
        print(f"❌ Error: {rackets_file} not found.")
        return

    with open(rackets_file, 'r', encoding='utf-8') as f:
        rackets_data = json.load(f)

    # Initialize scrapers
    scrapers = {}
    for key, cls in SCRAPER_CLASSES.items():
        if store_filter and key != store_filter:
            continue
        scrapers[key] = cls()
        # Some scrapers (like PadelMarket) use Playwright and need lazy init via get_page()
    
    racket_ids = list(rackets_data.keys())
    if limit:
        racket_ids = racket_ids[:limit]

    print(f"🚀 Starting price update for {len(racket_ids)} rackets...")
    if dry_run:
        print("🧪 RUNNING IN DRY-RUN MODE (No changes will be saved)")

    processed_count = 0
    updated_count = 0
    errors_count = 0

    for rid in racket_ids:
        racket = rackets_data[rid]
        model_name = racket.get('model', 'Unknown')
        print(f"\n📦 [{processed_count+1}/{len(racket_ids)}] {model_name}")
        
        has_racket_changes = False
        db_updates = {}
        any_on_offer = False

        for price_entry in racket.get('prices', []):
            store = price_entry.get('store')
            url = price_entry.get('url')
            
            if store in scrapers:
                scraper = scrapers[store]
                print(f"  🔍 Fetching {store} price...")
                
                try:
                    product = await scraper.scrape_product(url)
                    if product and product.price > 0:
                        old_price = price_entry.get('price')
                        new_price = product.price
                        original_price = product.original_price
                        
                        # Update local entry
                        price_entry['price'] = new_price
                        price_entry['original_price'] = original_price
                        price_entry['last_updated'] = datetime.now().isoformat()
                        
                        # Prepare DB update mapping
                        col_prefix = store.lower()
                        db_updates[f"{col_prefix}_actual_price"] = new_price
                        db_updates[f"{col_prefix}_original_price"] = original_price
                        
                        # Calculate discount percentage
                        discount = 0
                        if original_price and original_price > new_price:
                            discount = round((1 - (new_price / original_price)) * 100)
                            any_on_offer = True
                        
                        db_updates[f"{col_prefix}_discount_percentage"] = discount
                        
                        if old_price != new_price:
                            print(f"    ✅ Price updated: {old_price} -> {new_price} €")
                            has_racket_changes = True
                        else:
                            print(f"    Price unchanged: {new_price} €")
                    else:
                        print(f"    ⚠️  Could not extract price from {store} (URL: {url})")
                        errors_count += 1
                except Exception as e:
                    print(f"    ❌ Error scraping {store}: {e}")
                    errors_count += 1

        # Finalize DB updates
        if db_updates:
            db_updates['on_offer'] = any_on_offer
            db_updates['updated_at'] = datetime.now().isoformat()

        if has_racket_changes:
            updated_count += 1
            if not dry_run:
                # Sync with Supabase if available
                if supabase:
                    try:
                        # Find by model to update the specific row
                        # Using 'model' column which was populated from racket['model'] during migration
                        result = supabase.table('rackets').update(db_updates).eq('model', model_name).execute()
                        if result.data:
                            print(f"    ✨ Supabase sync successful.")
                        else:
                            print(f"    ⚠️  Supabase update returned 0 rows. Check if model name matches.")
                    except Exception as e:
                        print(f"    ❌ Supabase error: {e}")

        processed_count += 1
        
        # Periodic save to local JSON to prevent data loss (every 10 rackets)
        if processed_count % 10 == 0 and not dry_run:
            with open(rackets_file, 'w', encoding='utf-8') as f:
                json.dump(rackets_data, f, indent=4, ensure_ascii=False)

    # Final save
    if not dry_run:
        with open(rackets_file, 'w', encoding='utf-8') as f:
            json.dump(rackets_data, f, indent=4, ensure_ascii=False)
        print(f"\n💾 Saved all changes to {rackets_file}")

    # Cleanup browsers
    for s in scrapers.values():
        if hasattr(s, 'close'):
            await s.close()

    print(f"\n🏁 Finished!")
    print(f"   Processed: {processed_count}")
    print(f"   Updated:   {updated_count}")
    print(f"   Errors:    {errors_count}")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Update racket prices from store URLs.")
    parser.add_argument("--limit", type=int, help="Limit the number of rackets to process.")
    parser.add_argument("--dry-run", action="store_true", help="Don't save changes or sync with Supabase.")
    parser.add_argument("--store", type=str, help="Filter by specific store (padelnuestro, padelproshop, padelmarket).")
    
    args = parser.parse_args()
    
    asyncio.run(update_racket_prices(limit=args.limit, dry_run=args.dry_run, store_filter=args.store))
