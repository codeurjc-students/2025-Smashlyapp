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
                # IMPORTANTE: 'es' suele ser la tienda pública de España. 
                # 'default' a veces devuelve URLs internas o sin prefijos correctos.
                "Store": "es", 
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            }
        )
        
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
        """Scrape product data using GraphQL."""
        try:
            # Estrategia de recuperación de URL KEY:
            # 1. Parsear la URL para obtener el slug limpio
            parsed = urlparse(url)
            path = parsed.path
            if path.endswith('.html'):
                path = path[:-5]
            
            # Limpiar prefijos de idioma si existen (ej: /es/)
            parts = path.strip('/').split('/')
            url_key = parts[-1] # Nos quedamos con la última parte
            
            # Query ajustada: buscamos por url_key
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
                }}
              }}
            }}
            """
            
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(None, self._fetch_graphql, query)
            items = response.get('data', {}).get('products', {}).get('items', [])
            
            if not items:
                print(f"[PadelNuestro] API could not find product by key: {url_key}")
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
            
            # Brand (heuristic improved)
            brand = "Unknown"
            if name:
                # Intentar detectar marcas comunes primero
                common_brands = ['Nox', 'Bullpadel', 'Adidas', 'Siux', 'Head', 'Babolat', 'StarVie', 'Varlion', 'Kuikma', 'Wilson']
                name_upper = name.upper()
                for b in common_brands:
                    if b.upper() in name_upper:
                        brand = b
                        break
                if brand == "Unknown":
                    brand = name.split(' ')[0].title()
                
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
        """Scrape product URLs using GraphQL with URL REWRITES (Fixes 404s)."""
        product_urls = []
        page_num = 1
        page_size = 50
        category_id = "6" # Palas
        
        exclude_terms = ['zapatilla', 'paletero', 'mochila', 'camiseta', 'pantalon', 'falda', 'gorra', 'calcetin', 'funda', 'overgrip', 'protector']
        
        print(f"[PadelNuestro] Using GraphQL Category {category_id}...")
        
        while True:
            if page_num > 40: break 
            
            # SOLUCIÓN: Pedimos 'url_rewrites' para obtener la URL pública real
            query = f"""
            {{
              products(filter: {{category_id: {{eq: "{category_id}"}}}}, pageSize: {page_size}, currentPage: {page_num}) {{
                total_count
                items {{
                  name
                  url_key
                  url_suffix
                  url_rewrites {{
                    url
                  }}
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
                    if any(term in name for term in exclude_terms):
                        continue
                        
                    # LÓGICA DE CONSTRUCCIÓN DE URL CORREGIDA
                    full_url = None
                    
                    # 1. Preferencia: Usar url_rewrites (URL pública real)
                    rewrites = item.get('url_rewrites')
                    if rewrites and len(rewrites) > 0:
                        # Usamos la primera rewrite disponible
                        slug = rewrites[0].get('url')
                        if slug:
                            # Aseguramos que no tenga doble .html si la API ya lo trae
                            if not slug.endswith('.html'):
                                slug += '.html'
                            full_url = f"https://www.padelnuestro.com/{slug}"
                    
                    # 2. Fallback: Construir manualmente si no hay rewrites (menos fiable)
                    if not full_url and item.get('url_key'):
                        slug = item['url_key']
                        suffix = item.get('url_suffix') or '.html'
                        full_url = f"https://www.padelnuestro.com/{slug}{suffix}"

                    if full_url and full_url not in product_urls:
                        product_urls.append(full_url)
                
                print(f"[PadelNuestro] Page {page_num}: Found {len(items)} items. Total Saved: {len(product_urls)}/{total_count}")
                
                if page_num * page_size >= total_count:
                    break
                    
                page_num += 1
                
            except Exception as e:
                print(f"[PadelNuestro] Error on page {page_num}: {e}")
                break
        
        return product_urls