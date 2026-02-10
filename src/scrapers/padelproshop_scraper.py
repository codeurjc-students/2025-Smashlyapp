import json
import re
import urllib.request
import asyncio
from typing import Dict, List, Optional
from .base_scraper import BaseScraper, Product, clean_price, normalize_specs

class PadelProShopScraper(BaseScraper):
    """Scraper for PadelProShop online store.
    
    Uses the Shopify JSON API for both category and product scraping,
    eliminating the need for Playwright browser automation entirely.
    """

    def _fetch_api_page(self, collection_path: str, page_num: int) -> list:
        """Fetch a single page of products from the Shopify JSON API (sync)."""
        api_url = f"https://padelproshop.com{collection_path}/products.json?limit=250&page={page_num}"
        req = urllib.request.Request(api_url, headers={
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json',
        })
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode('utf-8'))
        return data.get('products', [])

    def _fetch_product_json(self, handle: str) -> dict:
        """Fetch a single product's full data from the Shopify JSON API (sync)."""
        api_url = f"https://padelproshop.com/products/{handle}.json"
        req = urllib.request.Request(api_url, headers={
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json',
        })
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode('utf-8'))
        return data.get('product', {})

    def _parse_specs_from_html(self, body_html: str) -> Dict[str, str]:
        """Parse specs from Shopify body_html field using regex for natural language."""
        specs: Dict[str, str] = {}
        if not body_html:
            return specs

        # specific cleaning
        text = body_html.replace('&nbsp;', ' ').replace('<br>', ' ').replace('</p>', ' ').replace('<p>', ' ')
        text = re.sub(r'<[^>]+>', '', text) # Strip HTML tags
        text = re.sub(r'\s+', ' ', text).strip() # Normalize whitespace

        # 1. Forma
        # "formato lágrima", "forma de diamante", "forma redonda"
        match = re.search(r'(?:forma|formato)\s+(?:de\s+)?([a-zA-ZáéíóúÁÉÍÓÚñÑ]+)', text, re.IGNORECASE)
        if match:
            specs['Forma'] = match.group(1).title()

        # 2. Balance
        # "balance medio", "balance alto", "balance bajo"
        match = re.search(r'balance\s+([a-zA-ZáéíóúÁÉÍÓÚñÑ]+)', text, re.IGNORECASE)
        if match:
            specs['Balance'] = match.group(1).title()

        # 3. Peso
        # "peso entre 355 y 375 gramos", "360-375 gr"
        match = re.search(r'(\d{3}\s*[-–]\s*\d{3})\s*(?:gr|gramos|g)', text, re.IGNORECASE)
        if not match:
             match = re.search(r'peso\s+(?:aproximado\s+)?(?:de\s+)?(\d{3}(?:[-–]\d{3})?)', text, re.IGNORECASE)
        if match:
            specs['Peso'] = match.group(1) + " g"

        # 4. Goma / Núcleo
        # "goma HR3", "goma EVA Soft", "núcleo de EVA"
        match = re.search(r'(?:goma|núcleo)\s+(?:de\s+)?([a-zA-Z0-9\s]+?)(?:(?=\.|,)|$)', text, re.IGNORECASE)
        if match:
            val = match.group(1).strip()
            if len(val) < 40 and 'contiene' not in val.lower():
                 specs['Núcleo'] = val

        # 5. Material / Caras
        # "caras de carbono 18K", "fabricadas con carbono 12K"
        match = re.search(r'(?:caras|superficie|fabricad[ao]s?)\s+(?:de\s+|con\s+)?(carbono\s+[0-9]+[kK]|fibra de vidrio|carbono)', text, re.IGNORECASE)
        if match:
            specs['Cara'] = match.group(1).title()

        # 6. Nivel
        match = re.search(r'jugador(?:es)?\s+(?:de\s+)?(?:nivel\s+)?([a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+)', text, re.IGNORECASE)
        if match:
             val = match.group(1).strip()
             if 'avanzado' in val.lower(): specs['Nivel'] = 'Avanzado'
             elif 'intermedio' in val.lower(): specs['Nivel'] = 'Intermedio'
             elif 'profesional' in val.lower(): specs['Nivel'] = 'Profesional/Avanzado'
             elif 'iniciación' in val.lower(): specs['Nivel'] = 'Iniciación'

        # Fallback for structured list items if present
        if not specs:
             matches = re.finditer(r'<li>\s*<strong>\s*([^<]+?)\s*:?\s*</strong>\s*([^<]+?)\s*</li>', body_html, re.IGNORECASE)
             for m in matches:
                 specs[m.group(1).strip().rstrip(':')] = m.group(2).strip()

        return specs

    async def scrape_product(self, url: str) -> Optional[Product]:
        """Scrape product data from PadelProShop using Shopify JSON API only."""
        
        # Extract handle from URL: /products/pala-xyz -> pala-xyz
        handle = url.rstrip('/').split('/products/')[-1].split('?')[0]
        if not handle:
            return None
        
        try:
            loop = asyncio.get_event_loop()
            product_data = await loop.run_in_executor(
                None, self._fetch_product_json, handle
            )
        except Exception as e:
            print(f"[PadelProShop] API error for {handle}: {e}")
            return None

        if not product_data:
            return None
        
        # Name
        name = product_data.get('title')
        if not name:
            return None

        # Price
        price = 0.0
        if product_data.get('variants'):
            try:
                price = float(product_data['variants'][0]['price'])
            except (ValueError, TypeError, IndexError):
                pass

        # Original Price
        original_price = None
        if product_data.get('variants'):
            try:
                op = product_data['variants'][0].get('compare_at_price')
                if op:
                    original_price = float(op)
            except (ValueError, TypeError):
                pass

        # Brand
        brand = product_data.get('vendor') or 'Unknown'

        # Images
        images = []
        if product_data.get('images'):
            for img in product_data['images']:
                src = img.get('src') if isinstance(img, dict) else img
                if src:
                    images.append(src)
        
        image = images[0] if images else ''

        # Specs from body_html
        specs = self._parse_specs_from_html(product_data.get('body_html', ''))
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
        """Scrape product URLs using the Shopify products.json API.
        
        Uses the public Shopify JSON API instead of Playwright-based
        infinite scroll, which was unreliable.
        """
        
        # Determine the collection path from the URL
        if '/collections/' in url:
            from urllib.parse import urlparse
            parsed = urlparse(url)
            collection_path = parsed.path.rstrip('/')
        else:
            collection_path = '/collections/palas-padel'
        
        product_urls = []
        page_num = 1
        
        print(f"[PadelProShop] Using Shopify API for product discovery...")
        
        while True:
            if page_num > 20:
                print(f"[PadelProShop] Reached page limit (20). Stopping.")
                break
            
            print(f"[PadelProShop] Fetching API page {page_num}...")
            
            try:
                loop = asyncio.get_event_loop()
                products = await loop.run_in_executor(
                    None, self._fetch_api_page, collection_path, page_num
                )
            except Exception as e:
                print(f"[PadelProShop] API error on page {page_num}: {e}")
                break
            
            if not products:
                print(f"[PadelProShop] No more products on page {page_num}. Done.")
                break
            
            for product in products:
                handle = product.get('handle')
                if handle:
                    product_url = f"https://padelproshop.com/products/{handle}"
                    if product_url not in product_urls:
                        product_urls.append(product_url)
            
            print(f"[PadelProShop] Page {page_num}: {len(products)} products fetched. Total: {len(product_urls)}")
            page_num += 1
        
        print(f"[PadelProShop] Final count: {len(product_urls)} products from API")
        return product_urls
