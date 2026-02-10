import json
import re
import urllib.request
import ssl
import asyncio
from typing import Dict, List, Optional
from urllib.parse import urlparse
from .base_scraper import BaseScraper, Product, clean_price, normalize_specs

class PadelNuestroScraper(BaseScraper):
    """Scraper for PadelNuestro online store using GraphQL API."""

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
        
        # Create unverified context to avoid SSL issues in some envs
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE

        try:
            with urllib.request.urlopen(req, timeout=30, context=ctx) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                return data if data is not None else {}
        except Exception as e:
            print(f"[PadelNuestro] GraphQL Error: {e}")
            return {}

    def _parse_specs_from_html(self, body_html: str) -> Dict[str, str]:
        """Parse specs from description HTML using regex."""
        specs: Dict[str, str] = {}
        if not body_html:
            return specs
            
        # Clean text
        text = body_html.replace('&nbsp;', ' ').replace('<br>', ' ').replace('</p>', ' ').replace('<p>', ' ')
        text = re.sub(r'<[^>]+>', '', text)
        text = re.sub(r'\s+', ' ', text).strip()
        
        # 1. Forma
        match = re.search(r'(?:forma|formato)\s+(?:de\s+)?([a-zA-ZáéíóúÁÉÍÓÚñÑ]+)', text, re.IGNORECASE)
        if match: specs['Forma'] = match.group(1).title()
            
        # 2. Balance
        match = re.search(r'balance\s+([a-zA-ZáéíóúÁÉÍÓÚñÑ]+)', text, re.IGNORECASE)
        if match: specs['Balance'] = match.group(1).title()
            
        # 3. Peso
        match = re.search(r'(\d{3}\s*[-–]\s*\d{3})\s*(?:gr|gramos|g)', text, re.IGNORECASE)
        if not match:
             match = re.search(r'peso\s+(?:aproximado\s+)?(?:de\s+)?(\d{3}(?:[-–]\d{3})?)', text, re.IGNORECASE)
        if match: specs['Peso'] = match.group(1) + " g"
            
        # 4. Núcleo/Goma
        match = re.search(r'(?:goma|núcleo|core)\s+(?:de\s+)?([a-zA-Z0-9\s]+?)(?:(?=\.|,)|$)', text, re.IGNORECASE)
        if match:
             val = match.group(1).strip()
             if len(val) < 40: specs['Núcleo'] = val.title()

        # 5. Cara/Material
        match = re.search(r'(?:caras|superficie|fabricad[ao]s?)\s+(?:de\s+|con\s+)?(carbono\s+[0-9]+[kK]|fibra de vidrio|carbono)', text, re.IGNORECASE)
        if match: specs['Cara'] = match.group(1).title()
            
        # 6. Nivel
        match = re.search(r'jugador(?:es)?\s+(?:de\s+)?(?:nivel\s+)?([a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+)', text, re.IGNORECASE)
        if match:
             val = match.group(1).strip()
             if 'avanzado' in val.lower(): specs['Nivel'] = 'Avanzado'
             elif 'intermedio' in val.lower(): specs['Nivel'] = 'Intermedio'
             elif 'profesional' in val.lower(): specs['Nivel'] = 'Profesional/Avanzado'
             elif 'iniciación' in val.lower(): specs['Nivel'] = 'Iniciación'
             
        return specs

    async def scrape_product(self, url: str) -> Optional[Product]:
        """Scrape product data using GraphQL (bypassing Playwright/Cloudflare)."""
        # Extract url_key from URL
        # Format: https://padelnuestro.com/something-c-123-p.html or /brand-model-sku.html
        # Usually query by url_key. url_key is the last part before .html or params?
        # Actually PadelNuestro URLs: https://www.padelnuestro.com/siux-diablo...html
        # The url_key is the filename without .html
        
        try:
            parsed = urlparse(url)
            path = parsed.path
            if path.endswith('.html'):
                path = path[:-5]
            url_key = path.strip('/')
            
            # Should handle case where URL has prefix? usually just /key
            # But the search loop returns full URL constructed from url_key.
            
            query = f"""
            {{
              products(filter: {{url_key: {{eq: "{url_key}"}}}}) {{
                items {{
                  name
                  sku
                  price_range {{
                    minimum_price {{
                      final_price {{ value }}
                      regular_price {{ value }}
                    }}
                  }}
                  media_gallery {{ url }}
                  description {{ html }}
                  ... on ConfigurableProduct {{
                    variants {{
                      attributes {{
                        code
                        label
                        value_index
                      }}
                    }}
                  }}
                }}
              }}
            }}
            """
            
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(None, self._fetch_graphql, query)
            items = response.get('data', {}).get('products', {}).get('items', [])
            
            if not items:
                # Fallback: maybe failed to parse key? try Playwright as last resort? 
                # No, avoiding Playwright is the goal. Return None.
                print(f"[PadelNuestro] API could not find product: {url_key}")
                return None
                
            item = items[0]
            name = item.get('name')
            
            # Price
            price_info = item.get('price_range', {}).get('minimum_price', {})
            price = price_info.get('final_price', {}).get('value', 0.0)
            regular = price_info.get('regular_price', {}).get('value')
            original_price = regular if regular and regular > price else None
            
            # Images
            gallery = item.get('media_gallery', [])
            images = [img.get('url') for img in gallery if img.get('url')]
            image = images[0] if images else ''
            
            # Specs
            description_html = item.get('description', {}).get('html', '')
            specs = self._parse_specs_from_html(description_html)
            
            # Brand (heuristic)
            brand = "Unknown"
            # Try to extract from name
            first_word = name.split(' ')[0]
            if len(first_word) > 2:
                brand = first_word.title()
                
            specs = normalize_specs(specs)
            
            return Product(
                url=url,
                name=name,
                price=float(price),
                original_price=float(original_price) if original_price else None,
                brand=brand,
                image=image,
                images=images,
                specs=specs,
                description=description_html
            )
            
        except Exception as e:
            print(f"[PadelNuestro] Error scraping product {url}: {e}")
            return None

    async def scrape_category(self, url: str) -> List[str]:
        """Scrape product URLs using GraphQL search 'palas'."""
        product_urls = []
        page_num = 1
        page_size = 50
        
        # We use strict filtering to avoid shoes/bags
        exclude_terms = ['zapatilla', 'paletero', 'mochila', 'camiseta', 'pantalon', 'falda', 'gorra', 'calcetin', 'funda', 'overgrip', 'protector']
        
        print(f"[PadelNuestro] Using GraphQL Search for 'palas'...")
        
        while True:
            if page_num > 20: break # Safety limit
            
            query = f"""
            {{
              products(search: "palas", pageSize: {page_size}, currentPage: {page_num}) {{
                total_count
                items {{
                  name
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
                    break
                
                for item in items:
                    name = item.get('name', '').lower()
                    
                    # Strict Filter: Must have 'pala' in name/url OR be a known racket brand
                    # And must NOT be in exclude list
                    if any(term in name for term in exclude_terms):
                        continue
                        
                    # Must usually be a "Pala"
                    if 'pala' not in name and 'racket' not in name:
                        # Extra check: some rackets might just be "Nox AT10 Genius"
                        # But valid rackets usually have "Pala" in title on PN.
                        # We skip to be safe from shoes.
                        continue
                    
                    url_key = item.get('url_key')
                    suffix = item.get('url_suffix') or '.html'
                    if url_key:
                        full_url = f"https://www.padelnuestro.com/{url_key}{suffix}"
                        if full_url not in product_urls:
                            product_urls.append(full_url)
                
                print(f"[PadelNuestro] Page {page_num}: Found {len(items)} items. Saved {len(product_urls)} (after filtering).")
                
                if page_num * page_size >= total_count:
                    break
                    
                page_num += 1
                
            except Exception as e:
                print(f"[PadelNuestro] Error on page {page_num}: {e}")
                break
        
        return product_urls
