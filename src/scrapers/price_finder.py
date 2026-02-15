"""
Multi-Store Price Finder
========================
Searches multiple online stores for prices of rackets already in rackets.json.
Does NOT create new rackets — only adds prices to existing ones.

Usage:
    python price_finder.py                          # Run all stores, all rackets
    python price_finder.py --store decathlon        # Run only Decathlon
    python price_finder.py --limit 10               # Test with first 10 rackets
    python price_finder.py --dry-run                # Don't save results
    python price_finder.py --resume                 # Resume from checkpoint
"""
import argparse
import asyncio
import json
import os
import sys
import time
import traceback
from datetime import datetime
from typing import Dict, List, Optional

# Add scrapers directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from racket_manager import RacketManager
from stores.base_store import PriceResult
from stores.decathlon import DecathlonPriceFinder
from stores.amazon import AmazonPriceFinder
from stores.padeliberico import PadelIbericoPriceFinder
from stores.padelpoint import PadelPointPriceFinder


CHECKPOINT_FILE = "price_finder_checkpoint.json"


def load_checkpoint() -> Dict:
    """Load progress checkpoint."""
    if os.path.exists(CHECKPOINT_FILE):
        with open(CHECKPOINT_FILE, 'r') as f:
            return json.load(f)
    return {"completed": {}, "stats": {}}


def save_checkpoint(checkpoint: Dict):
    """Save progress checkpoint."""
    with open(CHECKPOINT_FILE, 'w') as f:
        json.dump(checkpoint, f, indent=2)


def create_stores(store_filter: Optional[str] = None, amazon_tag: str = "") -> Dict:
    """Create store instances based on filter."""
    all_stores = {
        "decathlon": DecathlonPriceFinder(),
        "amazon": AmazonPriceFinder(affiliate_tag=amazon_tag),
        "padeliberico": PadelIbericoPriceFinder(),
        "padelpoint": PadelPointPriceFinder(),
    }
    
    if store_filter:
        if store_filter not in all_stores:
            print(f"Unknown store: {store_filter}")
            print(f"Available stores: {', '.join(all_stores.keys())}")
            sys.exit(1)
        return {store_filter: all_stores[store_filter]}
    
    return all_stores


async def run_price_finder(
    store_filter: Optional[str] = None,
    limit: Optional[int] = None,
    dry_run: bool = False,
    resume: bool = False,
    amazon_tag: str = "",
):
    """Main price finder logic."""
    
    # Load rackets database
    db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "rackets.json")
    manager = RacketManager(db_path=db_path)
    
    total_rackets = len(manager.data)
    print(f"\n{'='*60}")
    print(f"  Multi-Store Price Finder")
    print(f"  Rackets in database: {total_rackets}")
    print(f"  Mode: {'DRY RUN' if dry_run else 'LIVE'}")
    print(f"{'='*60}\n")
    
    # Load checkpoint for resume
    checkpoint = load_checkpoint() if resume else {"completed": {}, "stats": {}}
    
    # Create store instances
    stores = create_stores(store_filter, amazon_tag)
    print(f"Active stores: {', '.join(stores.keys())}\n")
    
    # Prepare racket list
    racket_items = list(manager.data.items())
    if limit:
        racket_items = racket_items[:limit]
    
    # Stats tracking
    stats = {store_name: {"found": 0, "not_found": 0, "errors": 0, "skipped": 0} 
             for store_name in stores}
    
    start_time = time.time()
    
    # Process each store sequentially (one browser at a time)
    for store_name, store in stores.items():
        print(f"\n{'-'*50}")
        print(f"  Store: {store_name.upper()}")
        print(f"{'-'*50}")
        
        try:
            async with store:
                for i, (slug, racket) in enumerate(racket_items):
                    # Skip if already processed (resume mode)
                    checkpoint_key = f"{store_name}:{slug}"
                    if resume and checkpoint_key in checkpoint.get("completed", {}):
                        stats[store_name]["skipped"] += 1
                        continue
                    
                    model = racket.get("model", "")
                    brand = racket.get("brand", "Unknown")
                    
                    # Skip if this store already has a price for this racket
                    existing_prices = racket.get("prices", [])
                    has_price = any(p.get("store") == store_name for p in existing_prices)
                    if has_price:
                        stats[store_name]["skipped"] += 1
                        checkpoint["completed"][checkpoint_key] = "skipped"
                        continue
                    
                    # Progress
                    progress = f"[{i+1}/{len(racket_items)}]"
                    # Display name logic
                    display_name = model
                    if not display_name.lower().startswith(brand.lower()):
                        display_name = f"{brand} {model}"
                    
                    print(f"  {progress} Searching: {display_name}...", end=" ", flush=True)
                    
                    try:
                        result = await store.search_price(model, brand)
                        
                        if result and result.price > 0:
                            print(f"[OK] {result.price}EUR (match: {result.match_score}%)")
                            stats[store_name]["found"] += 1
                            
                            if not dry_run:
                                manager.add_price_only(
                                    slug=slug,
                                    store_name=result.store,
                                    price=result.price,
                                    original_price=result.original_price,
                                    url=result.url,
                                    currency=result.currency
                                )
                            
                            checkpoint["completed"][checkpoint_key] = {
                                "price": result.price,
                                "url": result.url,
                                "match_score": result.match_score
                            }
                        else:
                            print(f"[NOT FOUND]")
                            stats[store_name]["not_found"] += 1
                            checkpoint["completed"][checkpoint_key] = "not_found"
                    
                    except Exception as e:
                        print(f"[ERROR] {e}")
                        traceback.print_exc()
                        stats[store_name]["errors"] += 1
                        checkpoint["completed"][checkpoint_key] = f"error: {str(e)}"
                    
                    # Save checkpoint every 10 rackets
                    if (i + 1) % 10 == 0:
                        save_checkpoint(checkpoint)
                        if not dry_run:
                            manager.save_db()
        
        except Exception as e:
            print(f"\n  [STORE ERROR] {store_name} failed: {e}")
            continue
    
    # Final save
    save_checkpoint(checkpoint)
    if not dry_run:
        manager.save_db()
    
    # Print summary
    elapsed = time.time() - start_time
    print(f"\n{'='*60}")
    print(f"  RESULTS SUMMARY")
    print(f"{'='*60}")
    for store_name, s in stats.items():
        total = s["found"] + s["not_found"] + s["errors"]
        rate = f"{s['found']/total*100:.1f}%" if total > 0 else "N/A"
        print(f"  {store_name:15s} | Found: {s['found']:4d} | Not Found: {s['not_found']:4d} | "
              f"Errors: {s['errors']:3d} | Skipped: {s['skipped']:4d} | Rate: {rate}")
    print(f"\n  Time elapsed: {elapsed:.1f}s")
    print(f"  {'DRY RUN - no changes saved' if dry_run else 'Changes saved to rackets.json'}")
    print(f"{'='*60}\n")


def main():
    parser = argparse.ArgumentParser(description="Multi-Store Price Finder for Padel Rackets")
    parser.add_argument("--store", type=str, default=None,
                        help="Run only a specific store (decathlon, amazon, padeliberico, padelpoint)")
    parser.add_argument("--limit", type=int, default=None,
                        help="Limit number of rackets to process (for testing)")
    parser.add_argument("--dry-run", action="store_true",
                        help="Don't save results to rackets.json")
    parser.add_argument("--resume", action="store_true",
                        help="Resume from last checkpoint")
    parser.add_argument("--amazon-tag", type=str, default="",
                        help="Amazon Associates affiliate tag (e.g., smashly-21)")
    
    args = parser.parse_args()
    
    asyncio.run(run_price_finder(
        store_filter=args.store,
        limit=args.limit,
        dry_run=args.dry_run,
        resume=args.resume,
        amazon_tag=args.amazon_tag,
    ))


if __name__ == "__main__":
    main()
