import json
import re
import urllib.request
import asyncio
from typing import Dict, List, Optional
from .base_scraper import BaseScraper, Product, normalize_specs

class PadelMarketScraper(BaseScraper):
    """Scraper for PadelMarket online store."""

    async def scrape_product(self, url: str) -> Optional[Product]:
        # Force Spanish URL structure if not present
        if '/es-eu/' not in url and 'padelmarket.com' in url:
             url = url.replace('padelmarket.com/', 'padelmarket.com/es-eu/')
        
        page = await self.get_page(url)

        # Check redirections
        if '/collections/' in page.url and '/products/' not in page.url:
             return None

        # Extract name (more robust selectors)
        name = await self.safe_get_text('h1.product-title, .product-single__title, h1')
        if not name:
             print(f"Skipping {url}: No name found")
             return None

        # Handle Popups (simplified)
        try:
             # fast check for common popup close buttons
             await page.evaluate("""() => {
                const selectors = ['button[aria-label="Close"]', '.needsclick button', '#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll'];
                selectors.forEach(s => {
                    const el = document.querySelector(s);
                    if(el) el.click();
                });
             }""")
        except:
             pass

        # Extract price
        price = 0.0
        original_price = None
        
        # Try finding the price container first
        price_text = await self.safe_get_text('.price .price-item--sale')
        if not price_text:
             price_text = await self.safe_get_text('.price .price-item--regular')
        if not price_text:
             price_text = await self.safe_get_text('.price .amount')
        
        # Parse price
        if price_text:
            # Simple cleanup: remove all non-numeric except , and .
            clean_p = re.sub(r'[^\d.,]', '', price_text)
            # Standardize: 1.299,99 -> 1299.99
            if ',' in clean_p and '.' in clean_p:
                 # Assume dot is thousands, comma is decimal (EU standard)
                 clean_p = clean_p.replace('.', '').replace(',', '.')
            elif ',' in clean_p:
                 clean_p = clean_p.replace(',', '.')
            
            try:
                price = float(clean_p)
            except:
                price = 0.0

        # Original Price
        if await page.query_selector('.price .price-item--sale'):
             old_p_text = await self.safe_get_text('.price .price-item--regular')
             if old_p_text:
                clean_op = re.sub(r'[^\d.,]', '', old_p_text)
                clean_op = clean_op.replace('.', '').replace(',', '.')
                try:
                    original_price = float(clean_op)
                except:
                    pass

        # Extract Specs
        specs: Dict[str, str] = {}
        # Try to expand details
        try:
             await page.evaluate("""() => {
                 const summaries = document.querySelectorAll('summary');
                 summaries.forEach(s => {
                     if(s.innerText.includes('Detalles') || s.innerText.includes('Details')) s.click();
                 });
             }""")
             # Wait for content to appear instead of arbitrary timeout
             try:
                 await page.wait_for_selector('.product_custom_table .custom_row', timeout=2000)
             except:
                 pass  # Fallback will handle if not present
             
             # Extract from custom table rows
             rows = await page.query_selector_all('.product_custom_table .custom_row')
             if rows:
                 for row in rows:
                     # Need element-level extraction.
                     t_el = await row.query_selector('.row_title')
                     v_el = await row.query_selector('div:not(.row_title)')
                     if t_el and v_el:
                         k = (await t_el.inner_text()).strip()
                         v = (await v_el.inner_text()).strip()
                         if k and v: specs[k] = v
             else:
                 # Fallback table
                 rows = await page.query_selector_all('table tr')
                 for row in rows:
                     cols = await row.query_selector_all('td')
                     if len(cols) >= 2:
                         k = (await cols[0].inner_text()).strip()
                         v = (await cols[1].inner_text()).strip()
                         if k and v: specs[k] = v
        except Exception as e:
             pass

        # Normalize specs for consistency
        specs = normalize_specs(specs)

        # Extract brand
        brand = specs.get('Marca') or specs.get('Brand')
        if not brand:
             # Try JSON-LD
             try:
                json_ld = await self.safe_get_text('script[type="application/ld+json"]')
                if json_ld:
                     data = json.loads(json_ld)
                     if isinstance(data, dict) and 'brand' in data:
                          b = data['brand']
                          brand = b.get('name') if isinstance(b, dict) else b
             except:
                  pass
        if not brand:
             # Try vendor
             brand = await self.safe_get_text('.product-single__vendor')
        
        brand = brand if brand else "Unknown"

        # Extract images
        images = []
        try:
             # Zoom links
             links = await page.query_selector_all('a.product-single__media-zoom')
             for link in links:
                  href = await link.get_attribute('href')
                  if href:
                       if href.startswith('//'): href = f'https:{href}'
                       images.append(href)
             
             # Fallback simple images
             if not images:
                  imgs = await page.query_selector_all('.product-single__media img')
                  for img in imgs:
                       src = await img.get_attribute('src') or await img.get_attribute('data-src')
                       if src:
                            if src.startswith('//'): src = f'https:{src}'
                            images.append(src)
        except:
             pass
        
        images = list(dict.fromkeys(images)) # Dedupe unique
        image = images[0] if images else ""

        return Product(
            url=url,
            name=name,
            price=price,
            original_price=original_price,
            brand=brand,
            image=image,
            images=images,
            specs=specs
        )

    def _fetch_api_page(self, collection_path: str, page_num: int) -> list:
        """Fetch a single page of products from the Shopify JSON API (sync, run in executor)."""
        api_url = f"https://padelmarket.com{collection_path}/products.json?limit=250&page={page_num}"
        req = urllib.request.Request(api_url, headers={
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json',
        })
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode('utf-8'))
        return data.get('products', [])

    async def scrape_category(self, url: str) -> List[str]:
        """Scrape product URLs using the Shopify products.json API.
        
        Uses the public Shopify JSON API instead of Playwright-based
        'Load More' button clicks, which were unreliable.
        """
        
        # Determine the collection path from the URL
        # e.g. https://padelmarket.com/es-eu/collections/palas -> /es-eu/collections/palas
        if '/collections/' in url:
            from urllib.parse import urlparse
            parsed = urlparse(url)
            collection_path = parsed.path.rstrip('/')
        else:
            collection_path = '/es-eu/collections/palas'
        
        product_urls = []
        page_num = 1
        
        print(f"[PadelMarket] Using Shopify API for product discovery...")
        
        while True:
            # Safety limit
            if page_num > 20:
                print(f"[PadelMarket] Reached page limit (20). Stopping.")
                break
            
            print(f"[PadelMarket] Fetching API page {page_num}...")
            
            try:
                # Run sync HTTP request in thread executor to keep async
                loop = asyncio.get_event_loop()
                products = await loop.run_in_executor(
                    None, self._fetch_api_page, collection_path, page_num
                )
            except Exception as e:
                print(f"[PadelMarket] API error on page {page_num}: {e}")
                break
            
            if not products:
                print(f"[PadelMarket] No more products on page {page_num}. Done.")
                break
            
            for product in products:
                handle = product.get('handle')
                if handle:
                    product_url = f"https://padelmarket.com/es-eu/products/{handle}"
                    if product_url not in product_urls:
                        product_urls.append(product_url)
            
            print(f"[PadelMarket] Page {page_num}: {len(products)} products fetched. Total: {len(product_urls)}")
            page_num += 1
        
        print(f"[PadelMarket] Final count: {len(product_urls)} products from API")
        return product_urls

