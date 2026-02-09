
import asyncio
import argparse
import sys
import os
from typing import List, Type

# Allow running as a script by setting the package if not set
if __name__ == "__main__" and __package__ is None:
    # Add project root to sys.path
    project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    sys.path.append(project_root)
    __package__ = "src.scrapers"

from .base_scraper import BaseScraper
from .padelmarket_scraper import PadelMarketScraper
from .padelnuestro_scraper import PadelNuestroScraper
from .padelproshop_scraper import PadelProShopScraper
from .racket_manager import RacketManager

async def run_scraper(scraper_cls: Type[BaseScraper], name: str, category_url: str, manager: RacketManager, limit: int = None):
    print(f"Starting scraper: {name} on {category_url}")
    scraper = scraper_cls()
    await scraper.init()
    
    try:
        # 1. Scrape Category
        print(f"[{name}] Crawling category...")
        product_urls = await scraper.scrape_category(category_url)
        print(f"[{name}] Found {len(product_urls)} products.")
        
        if limit:
            product_urls = product_urls[:limit]
            print(f"[{name}] Limited to {limit} products.")

        # 2. Scrape Products
        for i, url in enumerate(product_urls):
            print(f"[{name}] Scraping {i+1}/{len(product_urls)}: {url}")
            try:
                product = await scraper.scrape_product(url)
                if product:
                    manager.merge_product(product, name)
                    print(f"[{name}] Saved: {product.name}")
            except Exception as e:
                print(f"[{name}] Error scraping {url}: {e}")
            
            # Small delay to be polite
            await asyncio.sleep(1)

    except Exception as e:
        print(f"[{name}] Critical error: {e}")
    finally:
        await scraper.close()
        print(f"[{name}] Finished.")

async def main():
    parser = argparse.ArgumentParser(description='Run Padel Scrapers')
    parser.add_argument('--limit', type=int, help='Limit number of products per store')
    parser.add_argument('--stores', type=str, help='Comma separated list of stores to run (default: all)')
    args = parser.parse_args()

    manager = RacketManager()
    
    scrapers = {
        'padelmarket': (PadelMarketScraper, 'https://padelmarket.com/collections/palas'),
        'padelnuestro': (PadelNuestroScraper, 'https://www.padelnuestro.com/palas-padel'),
        'padelproshop': (PadelProShopScraper, 'https://padelproshop.com/collections/palas-padel')
    }
    
    target_stores = args.stores.split(',') if args.stores else scrapers.keys()
    
    # Run sequentially
    print("Starting sequential scrape...")
    for store_name in target_stores:
        if store_name in scrapers:
            cls, url = scrapers[store_name]
            await run_scraper(cls, store_name, url, manager, args.limit)
        else:
            print(f"Unknown store: {store_name}")
    print("All scrapers finished.")

if __name__ == "__main__":
    asyncio.run(main())
