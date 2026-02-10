import json
import re
import urllib.request
import asyncio
from typing import Dict, List, Optional
from .base_scraper import BaseScraper, Product, clean_price, normalize_specs

class PadelNuestroScraper(BaseScraper):
    """Scraper for PadelNuestro online store."""

    def _fetch_graphql(self, query: str) -> dict:
        """Execute a GraphQL query against PadelNuestro API (sync)."""
        data = json.dumps({"query": query}).encode("utf-8")
        req = urllib.request.Request(
            "https://www.padelnuestro.com/graphql",
            data=data,
            headers={
                "Content-Type": "application/json",
                "Store": "default",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            }
        )
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                return data if data is not None else {}
        except Exception as e:
            print(f"[PadelNuestro] GraphQL Error: {e}")
            return {}

    async def scrape_product(self, url: str) -> Optional[Product]:
        """Scrape product data from PadelNuestro."""
        page = await self.get_page(url)

        # Check redirections to category
        if '/palas-padel/' in page.url or page.url.endswith('/dunlop') or page.url.endswith('/adidas') or '/palas' in page.url:
             # If we landed on a category page instead of a product, skip
             if page.url != url:
                  return None

        # Wait for key elements
        try:
             await page.wait_for_selector('h1.page-title', timeout=5000)
        except:
             print(f"Skipping {url}: page title not found")
             return None

        # Extract name
        name = await self.safe_get_text('h1.page-title span')
        if not name: return None

        # Extract price with fallbacks
        price = 0.0
        original_price = None

        # Use shared clean_price function from base_scraper

        # Current Price
        price_text = await self.safe_get_text('.product-info-main .price-box .special-price .price')
        if not price_text:
             price_text = await self.safe_get_text('.product-info-main .price-box .price-container .price')
        
        if price_text:
             price = clean_price(price_text)
        
        # Original Price
        old_price_text = await self.safe_get_text('.product-info-main .price-box .old-price .price')
        if old_price_text:
             original_price = clean_price(old_price_text)

        # Extract images
        image = ''
        images = []
        try:
            # 1. Check Fotorama
            # Wait for it briefly
            try:
                await page.wait_for_selector('.fotorama__stage__frame', timeout=2000)
            except:
                pass

            # Main images
            fotorama_imgs = await page.query_selector_all('.fotorama__stage__frame img')
            for img in fotorama_imgs:
                src = await img.get_attribute('src')
                if src: images.append(src)

            # Thumbnails if main missing
            if not images:
                 thumbs = await page.query_selector_all('.fotorama__nav__frame img')
                 for thumb in thumbs:
                    src = await thumb.get_attribute('src')
                    if src: images.append(src)
            
            # 2. JSON Fallback (Reliable for Magento)
            if not images:
                scripts = await page.query_selector_all('script[type="text/x-magento-init"]')
                for script in scripts:
                    content = await script.inner_text()
                    if 'mage/gallery/gallery' in content:
                        try:
                            data = json.loads(content)
                            for key in data:
                                if 'mage/gallery/gallery' in data[key]:
                                    g_data = data[key]['mage/gallery/gallery'].get('data')
                                    if g_data and isinstance(g_data, list):
                                        for item in g_data:
                                            if item.get('full'): images.append(item['full'])
                                            elif item.get('img'): images.append(item['img'])
                        except:
                            continue

            images = list(dict.fromkeys(images))
            if images: image = images[0]

        except Exception as e:
            pass

        # Extract specs and Brand
        specs: Dict[str, str] = {}
        brand = 'Unknown'

        # Specs table
        try:
            # Method 1: description-attributes
            rows = await page.query_selector_all('.description-attributes')
            for row in rows:
                k_el = await row.query_selector('.description-attributes-label')
                v_el = await row.query_selector('.description-attributes-value')
                if k_el and v_el:
                     k = (await k_el.inner_text()).strip().replace(':', '')
                     v = (await v_el.inner_text()).strip()
                     if k and v:
                          specs[k] = v
                          if k.lower() == 'marca': brand = v
            
            # Method 2: Standard table
            if not specs:
                 rows = await page.query_selector_all('#product-attribute-specs-table tr')
                 for row in rows:
                    th = await row.query_selector('th')
                    td = await row.query_selector('td')
                    if th and td:
                        k = (await th.inner_text()).strip()
                        v = (await td.inner_text()).strip()
                        specs[k] = v
                        if k.lower() == 'marca': brand = v

        except:
            pass

        # Normalize specs for consistency
        specs = normalize_specs(specs)

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

    async def scrape_category(self, url: str) -> List[str]:
        """Scrape product URLs using PadelNuestro GraphQL API.
        
        Targets category ID 31 (Palas) explicitly or infers from URL.
        """
        # Default to Palas category (ID 31)
        category_id = "31"
        
        # If user provides a specific category URL, we might want to resolve it,
        # but for now we prioritize the "Palas" category as that's the main goal.
        # Logic: If URL contains "palas", assume ID 31.
        
        product_urls = []
        page_num = 1
        page_size = 50
        
        print(f"[PadelNuestro] Using GraphQL API for products (Category {category_id})...")
        
        while True:
            # Safety break
            if page_num > 20: 
                break
                
            query = f"""
            {{
              products(filter: {{category_id: {{eq: "{category_id}"}}}}, pageSize: {page_size}, currentPage: {page_num}, sort: {{position: ASC}}) {{
                total_count
                items {{
                  url_key
                  url_suffix
                }}
              }}
            }}
            """
            
            try:
                loop = asyncio.get_event_loop()
                response = await loop.run_in_executor(None, self._fetch_graphql, query)
                
                data = response.get('data', {}).get('products', {})
                items = data.get('items', [])
                total_count = data.get('total_count', 0)
                
                if not items:
                    print(f"[PadelNuestro] No items returned on page {page_num}. Ending.")
                    break
                
                for item in items:
                    url_key = item.get('url_key')
                    suffix = item.get('url_suffix') or '.html'
                    # Some items might have suffix, some might not. Usually .html
                    if url_key:
                        full_url = f"https://www.padelnuestro.com/{url_key}{suffix}"
                        if full_url not in product_urls:
                            product_urls.append(full_url)
                
                print(f"[PadelNuestro] Page {page_num}: Found {len(items)} items. Total: {len(product_urls)}/{total_count}")
                
                if len(product_urls) >= total_count:
                    break
                    
                page_num += 1
                
            except Exception as e:
                print(f"[PadelNuestro] Error on page {page_num}: {e}")
                break
        
        return product_urls
