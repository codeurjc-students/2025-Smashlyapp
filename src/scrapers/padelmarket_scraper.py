import json
import re
import urllib.request
import asyncio
from typing import Dict, List, Optional
from .base_scraper import BaseScraper, Product, normalize_specs, normalize_spec_name

class PadelMarketScraper(BaseScraper):
    """Scraper for PadelMarket online store."""

    # Palabras clave de forma y su valor normalizado
    _SHAPE_KEYWORDS = [
        (['lagrima', 'lágrima', 'tear', 'gota'], 'Lágrima'),
        (['diamante', 'diamond'], 'Diamante'),
        (['redonda', 'round', 'redondo'], 'Redonda'),
        (['hibrida', 'híbrida', 'hybrid'], 'Híbrida'),
    ]

    def _infer_shape_from_text(self, text: str) -> Optional[str]:
        """Intenta deducir la forma de la pala buscando palabras clave."""
        text_l = text.lower()
        for keywords, label in self._SHAPE_KEYWORDS:
            for kw in keywords:
                if re.search(r'\b' + re.escape(kw) + r'\b', text_l):
                    return label
        return None

    def _parse_specs_from_html(self, html: str) -> Dict[str, str]:
        """Parse specs from Shopify body_html OR product HTML."""
        specs: Dict[str, str] = {}
        if not html:
            return specs

        # Extract structured list items (Theme-specific)
        matches = re.finditer(
            r'<(?:li|tr|td)[^>]*>\s*<strong[^>]*>\s*([^<]+?)\s*:?\s*</strong>\s*([^<]+?)\s*</(?:li|tr|td)>',
            html,
            re.IGNORECASE | re.DOTALL
        )
        for m in matches:
            key = m.group(1).strip().rstrip(':')
            val = m.group(2).strip()
            if key and val:
                specs[normalize_spec_name(key)] = val

        # Weight regex
        match = re.search(r'(\d{3}\s*[-–]\s*\d{3})\s*(?:gr|gramos|g)', html, re.IGNORECASE)
        if match:
            specs['Peso'] = match.group(1) + " g"

        return specs

    def _fetch_product_json(self, handle: str) -> dict:
        """Fetch a single product's full data from the Shopify JSON API (sync)."""
        api_url = f"https://padelmarket.com/es-eu/products/{handle}.json"
        req = urllib.request.Request(api_url, headers={
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json',
        })
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode('utf-8'))
        return data.get('product', {})

    async def scrape_product(self, url: str) -> Optional[Product]:
        """Scrape product data using the Shopify JSON API."""
        
        # Extract handle: /products/pala-xyz -> pala-xyz
        handle = url.rstrip('/').split('/products/')[-1].split('?')[0]
        if not handle:
            return None
        
        try:
            loop = asyncio.get_event_loop()
            product_data = await loop.run_in_executor(
                None, self._fetch_product_json, handle
            )
        except Exception as e:
            print(f"[PadelMarket] API error for {handle}: {e}")
            return None

        if not product_data:
            return None
        if not isinstance(product_data, dict):
            return None
        
        # Basic fields
        name = product_data.get('title')
        if not name:
            return None

        variants = product_data.get('variants') if isinstance(product_data.get('variants'), list) else []
        first_variant = variants[0] if variants and isinstance(variants[0], dict) else {}

        # Price parsing
        price = 0.0
        if first_variant:
            try:
                price = float(first_variant.get('price'))
            except (ValueError, TypeError):
                pass

        # Original Price
        original_price = None
        if first_variant:
            try:
                op = first_variant.get('compare_at_price')
                if op:
                    original_price = float(op)
            except (ValueError, TypeError, AttributeError):
                pass

        # Brand
        brand = product_data.get('vendor') or 'Unknown'

        # Images
        images = []
        raw_images = product_data.get('images')
        if isinstance(raw_images, list):
            for img in raw_images:
                src = img.get('src') if isinstance(img, dict) else img
                if src:
                    images.append(src)
        
        image = images[0] if images else ''

        # Specs from body_html
        specs = self._parse_specs_from_html(product_data.get('body_html', ''))

        # Fallback to full HTML if Forma or other key specs are missing
        if 'Forma' not in specs:
            try:
                loop = asyncio.get_event_loop()
                req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
                with urllib.request.urlopen(req, timeout=15) as resp:
                    full_html = resp.read().decode('utf-8')
                
                more_specs = self._parse_specs_from_html(full_html)
                specs.update(more_specs)
            except:
                pass

        # Final shape inference from cumulative text if still missing
        if 'Forma' not in specs:
            text_context = (product_data.get('body_html', '') + " " + product_data.get('title', '')).lower()
            inferred = self._infer_shape_from_text(text_context)
            if inferred:
                specs['Forma'] = inferred

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

