
import asyncio
import argparse
from typing import List, Type
from .base_scraper import BaseScraper
from .padelmarket_scraper import PadelMarketScraper
from .padelnuestro_scraper import PadelNuestroScraper
from .padelproshop_scraper import PadelProShopScraper
from .tiendapadelpoint_scraper import TiendaPadelPointScraper
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
        'padelmarket': (PadelMarketScraper, 'https://padelmarket.com/collections/palas-padel'),
        'padelnuestro': (PadelNuestroScraper, 'https://www.padelnuestro.com/palas-de-padel'),
        'padelproshop': (PadelProShopScraper, 'https://padelproshop.com/collections/palas'),
        'tiendapadelpoint': (TiendaPadelPointScraper, 'https://www.tiendapadelpoint.com/palas-padel')
    }
    
    target_stores = args.stores.split(',') if args.stores else scrapers.keys()
    
    tasks = []
    for store_name in target_stores:
        if store_name in scrapers:
            cls, url = scrapers[store_name]
            tasks.append(run_scraper(cls, store_name, url, manager, args.limit))
        else:
            print(f"Unknown store: {store_name}")

    # Run sequentially or parallel?
    # Parallel might be too heavy on resources if using 4 browsers.
    # But Playwright is async. Let's try gathering, but maybe with a semaphore if needed.
    # For now, gather all.
    await asyncio.gather(*tasks)

if __name__ == "__main__":
    asyncio.run(main())
