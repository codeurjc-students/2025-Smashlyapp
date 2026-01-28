import asyncio
import sys
import argparse
from typing import Optional

# Adjust path if necessary to find your modules
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

from src.scrapers.padelnuestro_scraper import PadelNuestroScraper
from src.scrapers.padelproshop_scraper import PadelProShopScraper
from src.scrapers.tiendapadelpoint_scraper import TiendaPadelPointScraper
from src.scrapers.padelmarket_scraper import PadelMarketScraper

async def run_debug(scraper_name: str, url: str):
    scraper_classes = {
        'padelmarket': PadelMarketScraper,
        'padelnuestro': PadelNuestroScraper,
        'padelproshop': PadelProShopScraper,
        'tiendapadelpoint': TiendaPadelPointScraper
    }

    scraper_class = scraper_classes.get(scraper_name.lower())
    if not scraper_class:
        print(f"Unknown scraper: {scraper_name}")
        return

    scraper = scraper_class()
    print(f"Initializing {scraper_name} scraper...")
    await scraper.init()
    
    try:
        print(f"Scraping URL: {url}")
        product = await scraper.scrape_product(url)
        
        print("\n--- SCRAPED PRODUCT ---")
        print(f"Name: {product.name}")
        print(f"Brand: {product.brand}")
        print(f"Price: {product.price}")
        print(f"Original Price: {product.original_price}")
        print(f"Specs: {product.specs}")
        print(f"Images: {product.images}")
        print("-----------------------")
        
    except Exception as e:
        print(f"Error during scraping: {e}")
        import traceback
        traceback.print_exc()
    finally:
        await scraper.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Debug a single scraper')
    parser.add_argument('scraper', help='Name of the scraper (padelnuestro, padelproshop, tiendapadelpoint)')
    parser.add_argument('url', help='URL of the product to scrape')
    
    args = parser.parse_args()
    
    asyncio.run(run_debug(args.scraper, args.url))
