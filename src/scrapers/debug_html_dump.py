import asyncio
import sys
import os
import argparse
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

from src.scrapers.padelnuestro_scraper import PadelNuestroScraper
from src.scrapers.padelproshop_scraper import PadelProShopScraper

async def dump_html(scraper_name, url, output_file):
    scraper = None
    if scraper_name.lower() == 'padelnuestro':
        scraper = PadelNuestroScraper()
    elif scraper_name.lower() == 'padelproshop':
        scraper = PadelProShopScraper()
    
    if not scraper:
        print("Invalid scraper")
        return

    await scraper.init()
    try:
        if scraper_name.lower() == 'padelproshop':
             # PadelProShop uses JSON endpoint normally, but we want to see the HTML structure of the description if possible
             # Or just see what the JSON returns exactly for body_html
             json_url = f"{url.split('?')[0]}.json"
             page = await scraper.get_page(json_url)
             content = await page.query_selector('body')
             text = await content.inner_text()
             with open(output_file, 'w', encoding='utf-8') as f:
                 f.write(text)
        else:
            page = await scraper.get_page(url)
            # Dump main parts
            content = await page.content()
            with open(output_file, 'w', encoding='utf-8') as f:
                f.write(content)
                
        print(f"Dumped content to {output_file}")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        await scraper.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('scraper')
    parser.add_argument('url')
    parser.add_argument('output')
    args = parser.parse_args()
    
    asyncio.run(dump_html(args.scraper, args.url, args.output))
