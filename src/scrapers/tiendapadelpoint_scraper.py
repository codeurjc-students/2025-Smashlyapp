import re
from typing import Dict, List, Optional
from .base_scraper import BaseScraper, Product, clean_price, normalize_specs

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

        # Use shared clean_price function from base_scraper

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

        # Brand - IMPROVED extraction
        brand = 'Unknown'
        
        # 1. Try from attribute table (most reliable)
        try:
            rows = await page.query_selector_all('#tab-attribute table tr, table.attribute tbody tr')
            for row in rows:
                tds = await row.query_selector_all('td')
                if len(tds) >= 2:
                    key = (await tds[0].inner_text()).strip()
                    if 'marca' in key.lower() or 'brand' in key.lower():
                        brand = (await tds[1].inner_text()).strip()
                        if brand and brand != 'Unknown':
                            break
        except: pass
        
        # 2. Fallback: known brands in product name (case-insensitive)
        if brand == 'Unknown':
            known_brands = ['Bullpadel', 'Nox', 'Head', 'Babolat', 'Adidas', 'Wilson', 
                           'Siux', 'Dunlop', 'Varlion', 'StarVie', 'Black Crown', 'Drop Shot',
                           'Royal Padel', 'Vibor-A', 'Enebe', 'Kuikma']
            name_lower = name.lower()
            for b in known_brands:
                # Use word boundaries to avoid partial matches
                if re.search(rf'\b{re.escape(b.lower())}\b', name_lower):
                    brand = b
                    break
        
        # 3. Fallback: extract first capitalized word from name
        if brand == 'Unknown':
            # Split name and find first word that looks like a brand (capitalized, not common word)
            words = name.split()
            skip_words = {'pala', 'de', 'en', 'para', 'pack', 'y', 'el', 'la'}
            for word in words:
                clean_word = re.sub(r'[^\w]', '', word)  # Remove punctuation
                if clean_word and clean_word.lower() not in skip_words:
                    if clean_word[0].isupper() and len(clean_word) > 2:
                        brand = clean_word
                        break


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

        # Specs - IMPROVED to prioritize structured table
        specs: Dict[str, str] = {}
        
        # 1. Try structured attribute table FIRST (most reliable)
        try:
            rows = await page.query_selector_all('#tab-attribute table tr, table.attribute tbody tr')
            for row in rows:
                tds = await row.query_selector_all('td')
                if len(tds) >= 2:
                    k = (await tds[0].inner_text()).strip()
                    v = (await tds[1].inner_text()).strip()
                    # Skip marca as we already extracted it
                    if k and v and k.lower() not in ['marca', 'brand']:
                        specs[k] = v
        except: pass

        # Normalize specs for consistency
        specs = normalize_specs(specs)

        # 2. Fallback to regex in description if table extraction failed
        if not specs:
            desc_text = await self.safe_get_text('#tab-description')
            if desc_text:
                # Enhanced patterns with multiple variations
                patterns = {
                    'Peso': [
                        r'(?:Peso|Weight|Talla-Peso)[:\s]+([-]?[\d\s-]+\s*(?:gr?|gramos?|g)?)',
                        r'(\d{3})\s*[-–]\s*(\d{3})\s*(?:gr?|gramos?|g)',  # Range format: 355-365g
                        r'(\d{3})\s*(?:gr?|gramos?|g)'  # Simple: 360g
                    ],
                    'Forma': [
                        r'(?:Forma|Formato|Shape)[:\s]+([^.\n,]+?)(?:\.|,|\n|$)',
                        r'(?:Redonda|Lágrima|Diamante|Híbrida)'  # Direct match
                    ],
                    'Balance': [
                        r'(?:Balance|Balanceo)[:\s]+([^.\n,]+?)(?:\.|,|\n|$)',
                        r'(?:Alto|Medio|Bajo|High|Medium|Low)'  # Direct match
                    ],
                    'Perfil': [
                        r'(?:Perfil|Grosor|Espesor)[:\s]+([\d\s]+\s*mm)',
                        r'(\d{2})\s*mm'  # Simple: 38mm
                    ],
                    'Núcleo': [
                        r'(?:Núcleo|Goma|Foam|Core)[:\s]+([^.\n,]+?)(?:\.|,|\n|$)',
                        r'(?:EVA|FOAM|Soft|Hard|Medium)'  # Direct match
                    ],
                    'Cara': [
                        r'(?:Cara|Caras|Material|Fibra|Surface)[:\s]+([^.\n,]+?)(?:\.|,|\n|$)',
                        r'(?:Carbono|Carbon|Fibra de Vidrio|Fiberglass)'  # Direct match
                    ],
                    'Nivel': [
                        r'(?:Nivel|Level)[:\s]+([^.\n,]+?)(?:\.|,|\n|$)',
                        r'(?:Principiante|Iniciación|Intermedio|Avanzado|Profesional|Professional)'  # Direct match
                    ],
                    'Marco': [
                        r'(?:Marco|Frame)[:\s]+([^.\n,]+?)(?:\.|,|\n|$)'
                    ]
                }
                
                for k, regexes in patterns.items():
                    for r in regexes:
                        m = re.search(r, desc_text, re.IGNORECASE)
                        if m:
                            # Handle different match groups
                            if m.lastindex == 2:  # Range format (355-365)
                                val = f"{m.group(1)}-{m.group(2)}g"
                            else:
                                val = m.group(1).strip() if m.lastindex else m.group(0)
                            
                            # Normalize value
                            val = val.strip()
                            # Remove trailing punctuation
                            val = re.sub(r'[.,;:]+$', '', val)
                            
                            if val and len(val) < 50 and val not in ['-', '', ' ']: 
                                specs[k] = val
                                break

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
        
        # FIXED: Use search endpoint with category filter instead of main category page
        # Main /palas-de-padel shows only subcategory icons, not products
        # This search URL returns ~966 products directly with clean layout
        url = "https://www.tiendapadelpoint.com/index.php?route=product/search&search=pala&category_id=60&limit=100"
        
        page = await self.get_page(url)
        await page.wait_for_timeout(2000)

        while True:
            if page.url in visited_pages: break
            visited_pages.add(page.url)

            # Scroll to load lazy content
            try:
                await page.evaluate('window.scrollTo(0, document.body.scrollHeight)')
                await page.wait_for_timeout(1000)
            except: pass

            # Collect products - Updated selector for search results
            # Use .product-grid-item which appears in search results
            links = await page.query_selector_all('.product-grid-item .name a, .product-thumb .name a')
            count = 0
            for link in links:
                 href = await link.get_attribute('href')
                 name_text = await link.inner_text()
                 
                 # Only exclusion filter
                 exclusion = ['zapatillas', 'paletero', 'camiseta', 'protector', 'mochila', 'falda', 'pantalon', 'short']
                 if any(e in name_text.lower() for e in exclusion): continue

                 if href:
                      href = href.split('?')[0]
                      if not href.startswith('http'): href = f'https://www.tiendapadelpoint.com{href}'
                      if href not in product_urls:
                           product_urls.append(href)
                           count += 1
            
            print(f"Products found: {len(product_urls)} (+{count})")
            
            # Next Page via Pagination
            next_link = None
            try:
                links = await page.query_selector_all('.pagination .links a, .pagination a')
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
                      await page.wait_for_timeout(2000)
                 else: break
            else:
                 break
        
        return list(set(product_urls))

