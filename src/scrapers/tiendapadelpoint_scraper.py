import re
from typing import Dict, List, Optional
from .base_scraper import BaseScraper, Product

class TiendaPadelPointScraper(BaseScraper):
    """Scraper for TiendaPadelPoint online store."""

    async def scrape_product(self, url: str) -> Optional[Product]:
        """Scrape product data from TiendaPadelPoint."""
        # Force Spanish/ES if needed? Not enforced here, just scrape what's given.
        page = await self.get_page(url)

        # Check category redirect
        if '/palas-de-padel/' in page.url or '/categoria/' in page.url:
             if page.url != url: return None

        # Extract name (Verified)
        # h1.journal-header-center or h1.heading-title
        name = await self.safe_get_text('h1.journal-header-center, h1.heading-title, h1')
        if not name: return None
        
        # Clean name
        clean_match = re.match(r'^(?:Pala|Pack)\s+(.*)', name, re.IGNORECASE)
        if clean_match:
             name = clean_match.group(1).strip()

        # Helper to clean price
        def clean_price(text):
            if not text: return 0.0
            # Often "119.95€ Ex Tax: ..."
            # We want the first number found usually.
            # Or remove everything after Ex Tax
            if 'Ex Tax' in text:
                 text = text.split('Ex Tax')[0]
            
            text = text.replace('€', '').replace('&nbsp;', '').strip()
            # 1.234,56 -> 1234.56
            text = text.replace('.', '').replace(',', '.')
            try:
                # Use regex to find first float-like pattern
                match = re.search(r'[\d.]+', text)
                if match:
                    return float(match.group(0))
                return 0.0
            except ValueError:
                return 0.0

        price = 0.0
        original_price = None

        # Price Extraction
        # Try .price-new / .price-old
        new_p_text = await self.safe_get_text('.product-info .price-new')
        if new_p_text:
             price = clean_price(new_p_text)
             old_p_text = await self.safe_get_text('.product-info .price-old')
             if old_p_text: original_price = clean_price(old_p_text)
        else:
             # Standard price
             p_text = await self.safe_get_text('.product-info .product-price, .product-info li h2, .product-info .price')
             if p_text:
                  price = clean_price(p_text)

        # Brand
        brand = 'Unknown'
        # 1. From link
        brand_el = await page.query_selector("ul.list-unstyled li a[href*='manufacturer']")
        if brand_el:
             brand = await brand_el.inner_text()
        
        if brand == 'Unknown':
             # Fallback regex in content
             try:
                 content = await page.content()
                 match = re.search(r'Marca:\s*<a[^>]*>([^<]+)</a>', content)
                 if match: brand = match.group(1)
             except: pass
        
        # Fallback Name inference
        if brand == 'Unknown':
             match_b = re.search(r'Pala\s+([\w\.]+)', name, re.IGNORECASE)
             if match_b:
                  b = match_b.group(1)
                  if b.lower() not in ['de', 'en', 'para']: brand = b

        # Images
        image = ''
        images = []
        try:
             # Main
             main_img = await page.query_selector('#image')
             if main_img:
                  src = await main_img.get_attribute('src') or await main_img.get_attribute('data-src')
                  if src: images.append(src)
             
             # Gallery
             g_links = await page.query_selector_all('.image-additional a')
             for l in g_links:
                  href = await l.get_attribute('href')
                  if href and any(x in href.lower() for x in ['.jpg', 'png', 'webp']):
                       images.append(href)
        except:
             pass
        
        images = list(dict.fromkeys(images))
        if images: image = images[0]

        # Specs
        specs: Dict[str, str] = {}
        # 1. Description Regex
        desc_text = await self.safe_get_text('#tab-description')
        if desc_text:
            patterns = {
                'Peso': [r'(?:Peso|Talla-Peso)[:\s]+([-]?[\d\s-]+g?)'],
                'Forma': [r'(?:Forma|Formato)[:\s]+([^.\n]+)'],
                'Balance': [r'Balance[:\s]+([^.\n]+)'],
                'Perfil': [r'Perfil[:\s]+([\d\s]+mm)'],
                'Núcleo': [r'(?:Núcleo|Goma)[:\s]+([^.\n]+)'],
                'Cara': [r'(?:Cara|Caras|Material|Fibra)[:\s]+([^.\n]+)'],
                'Nivel': [r'Nivel[:\s]+([^.\n]+)']
            }
            for k, regexes in patterns.items():
                for r in regexes:
                    m = re.search(r, desc_text, re.IGNORECASE)
                    if m:
                        val = m.group(1).strip()
                        if len(val) < 50: specs[k] = val; break
        
        # 2. Table Fallback
        if not specs:
             try:
                rows = await page.query_selector_all('table.attribute tbody tr')
                for row in rows:
                    tds = await row.query_selector_all('td')
                    if len(tds) >= 2:
                        k = await tds[0].inner_text()
                        v = await tds[1].inner_text()
                        if k and v: specs[k.strip()] = v.strip()
             except: pass

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
        """Scrape product URLs from a category page."""
        product_urls = []
        visited_pages = set()
        
        page = await self.get_page(url)

        while True:
            if page.url in visited_pages: break
            visited_pages.add(page.url)

            # Collect products
            # .product-grid-item .name a
            links = await page.query_selector_all('.product-grid-item .name a')
            count = 0
            for link in links:
                 href = await link.get_attribute('href')
                 name_text = await link.inner_text()
                 
                 # Strict 'pala' filter + exclusion
                 if 'pala' not in name_text.lower(): continue
                 exclusion = ['zapatillas', 'paletero', 'camiseta', 'protector', 'mochila', 'falda']
                 if any(e in name_text.lower() for e in exclusion): continue

                 if href:
                      href = href.split('?')[0]
                      if not href.startswith('http'): href = f'https://www.tiendapadelpoint.com{href}'
                      if href not in product_urls:
                           product_urls.append(href)
                           count += 1
            
            print(f"Products found: {len(product_urls)} (+{count})")
            if count == 0 and len(product_urls) > 0:
                 # No new products on this page? check if empty
                 pass
            
            # Next Page via Pagination
            # .pagination .links a containing '>'
            next_link = None
            
            # Try finding '>' text
            try:
                # evaluate Xpath or loop
                links = await page.query_selector_all('.pagination .links a')
                for l in links:
                    t = await l.inner_text()
                    if t.strip() == '>':
                        next_link = l
                        break
            except: pass

            if next_link:
                 href = await next_link.get_attribute('href')
                 if href and href not in visited_pages:
                      await page.goto(href)
                      await page.wait_for_load_state('domcontentloaded')
                 else: break
            else:
                 break
        
        return list(set(product_urls))
