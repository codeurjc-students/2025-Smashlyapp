import re
from typing import Dict, List
from .base_scraper import BaseScraper, Product


class TiendaPadelPointScraper(BaseScraper):
    """Scraper for TiendaPadelPoint online store."""

    async def scrape_product(self, url: str) -> Product:
        """Scrape product data from TiendaPadelPoint."""
        page = await self.get_page(url)

        # Check if we've been redirected to a category page
        current_url = page.url
        if current_url != url:
            # Check if URL contains category patterns
            if '/palas-de-padel/' in current_url or '/categoria/' in current_url:
                raise ValueError(f"Product URL redirected to category page: {current_url}")

        # Extract name
        # Selector: h1.journal-header-center (Verified) or h1.heading-title
        name_element = await page.query_selector('h1.journal-header-center, h1.heading-title, h1')
        name = await name_element.inner_text() if name_element else ''

        # Clean name: Remove "Pala" or "Pack" from the start
        # Case insensitive
        clean_name_match = re.match(r'^(?:Pala|Pack)\s+(.*)', name, re.IGNORECASE)
        if clean_name_match:
             name = clean_name_match.group(1).strip()

        # Extract price with special price handling
        # Selector analysis: .product-info .price-new (current), .product-info .price-old (original)
        price = 0.0
        original_price = None

        try:
             # Scope to product info to avoid related products
             product_info = await page.query_selector('.product-info') or await page.query_selector('#content')
             
             if product_info:
                 # Try new/old structure first
                 new_price_el = await product_info.query_selector('.price-new')
                 if new_price_el:
                     price_text = await new_price_el.inner_text()
                     price = float(re.sub(r'[^\d.,]', '', price_text).replace(',', '.'))
                     
                     old_price_el = await product_info.query_selector('.price-old')
                     if old_price_el:
                          old_price_text = await old_price_el.inner_text()
                          original_price = float(re.sub(r'[^\d.,]', '', old_price_text).replace(',', '.'))
                 else:
                     # Fallback to standard .price or .product-price within scoped area
                     # Avoid generic .price if possible, stick to .product-price or look for h2/span structure
                     price_element = await product_info.query_selector('.product-price') or await product_info.query_selector('li h2, div.price')
                     if price_element:
                         text = await price_element.inner_text()
                         # Clean and parse (extract first number found)
                         # Often "119.95€ Ex Tax: ..."
                         matches = re.search(r'([\d.,]+)', text)
                         if matches:
                            price = float(matches.group(1).replace(',', '.'))
        except Exception:
            pass

        # Extract brand
        brand = 'Unknown'
        try:
            # Look for specific brand link in list
            # Selector: ul.list-unstyled li a (text contains Marca)
            brand_el = await page.query_selector("ul.list-unstyled li a[href*='manufacturer']")
            if brand_el:
                 brand = await brand_el.inner_text()
            
            if brand == 'Unknown':
                 # Fallback text search in body or metadata
                 content = await page.content()
                 # Try JSON-LD
                 match_json = re.search(r'"brand"\s*:\s*\{[^}]*"name"\s*:\s*"([^"]+)"', content)
                 if match_json:
                      brand = match_json.group(1)
                 else:
                      match = re.search(r'Marca:\s*<a[^>]*>([^<]+)</a>', content)
                      if match:
                          brand = match.group(1)
            
            # Fallback: Infer from original title (before cleaning or check cleaned name)
            # Typically "Pala [Brand] Model..."
            if brand == 'Unknown':
                 # Re-fetch raw name for safety
                 raw_name = await name_element.inner_text() if name_element else ''
                 match_brand_title = re.search(r'Pala\s+([\w\.]+)', raw_name, re.IGNORECASE)
                 if match_brand_title:
                      possible_brand = match_brand_title.group(1)
                      # Filter out common non-brand words just in case
                      if possible_brand.lower() not in ['de', 'en', 'para']:
                           brand = possible_brand
        except Exception:
            pass

        # Extract images
        image = ''
        images = []
        try:
            # Method 1: Get high-res links from anchors
            # Verified: .image-additional a (Gallery), #image (Main)
            
            # Main Image
            main_img = await page.query_selector('#image')
            if main_img:
                 src = await main_img.get_attribute('src') or await main_img.get_attribute('data-src')
                 if src: images.append(src)

            # Gallery
            image_links = await page.query_selector_all('.image-additional a')
            for link in image_links:
                href = await link.get_attribute('href')
                if href and any(ext in href.lower() for ext in ['.jpg', '.jpeg', '.png', '.webp']):
                     images.append(href)
            
            # Deduplicate
            images = list(dict.fromkeys(images))
            if images:
                image = images[0]

        except Exception:
            pass

        specs: Dict[str, str] = {}

        # Extract specs from description (Regex approach)
        try:
            description_element = await page.query_selector('#tab-description')
            if description_element:
                description_text = await description_element.inner_text()
                
                # Regex patterns for common specs
                patterns = {
                    'Peso': [r'(?:Peso|Talla-Peso)[:\s]+([-]?[\d\s-]+g?)', r'Peso\s*approx\.?[:\s]*([\d-]+)'],
                    'Forma': [r'(?:Forma|Formato)[:\s]+([^.\n]+)', r'Forma\s*Geométrica[:\s]+([^.\n]+)'],
                    'Balance': [r'Balance[:\s]+([^.\n]+)'],
                    'Perfil': [r'Perfil[:\s]+([\d\s]+mm)'],
                    'Núcleo': [r'(?:Núcleo|Goma)[:\s]+([^.\n]+)'],
                    'Cara': [r'(?:Cara|Caras|Material|Fibra)[:\s]+([^.\n]+)'],
                    'Nivel': [r'Nivel[:\s]+([^.\n]+)'],
                    'Potencia/Control': [r'Potencia/Control[:\s]+([^.\n]+)']
                }

                for key, regex_list in patterns.items():
                    for regex in regex_list:
                        match = re.search(regex, description_text, re.IGNORECASE)
                        if match:
                            value = match.group(1).strip()
                            # Cleanup value
                            value = re.sub(r'\s+', ' ', value) # Remove extra spaces
                            if len(value) < 50: # Sanity check for length
                                specs[key] = value
                                break
        except Exception as e:
            print(f'Error extracting specs: {e}')
            
        # Fallback to table if description failed or empty
        if not specs:
             try:
                rows = await page.query_selector_all('table.attribute tbody tr')
                for row in rows:
                    tds = await row.query_selector_all('td')
                    if len(tds) >= 2:
                        key = await tds[0].inner_text()
                        value = await tds[1].inner_text()
                        if key and value:
                            specs[key.strip()] = value.strip()
             except:
                 pass

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
        
        # Ensure we start with the base URL
        current_page_url = url
        
        page = await self.get_page(current_page_url)
        
        while True:
            # Track current page to detect loops
            normalized_url = page.url.split('?')[0] + '?' + (page.url.split('?')[1] if '?' in page.url else '')
            # Remove potential random parameters if any, but usually page param is key
            # For simplicity, check if we've seen this exact URL before
            if page.url in visited_pages:
                print(f"DEBUG: Detected loop or duplicate page {page.url}. Stopping.")
                break
            visited_pages.add(page.url)

            # Get product links (Verified: .product-grid-item .name a)
            links = await page.query_selector_all('.product-grid-item .name a')
            for link in links:
                href = await link.get_attribute('href')
                name_text = await link.inner_text()
                
                # Strict Filter: Must contain "pala" (case-insensitive) as per user observation
                # Also exclude common non-racket items explicitly
                exclusion_terms = [
                    'zapatillas', 'paletero', 'camiseta', 'protector', 'mochila', 'falda', 
                    'pantalon', 'calcetines', 'grips', 'overgrips', 'muñequera', 
                    'vestido', 'chaqueta', 'gorra', 'visera', 'toalla', 'bote', 'cajon'
                ]
                
                is_pala = 'pala' in name_text.lower()
                has_exclusion = any(term in name_text.lower() for term in exclusion_terms)
                
                if href and is_pala and not has_exclusion:
                     # Remove query params
                    href = href.split('?')[0]
                    if href not in product_urls:
                         product_urls.append(href)
            
            print(f"Found {len(links)} products on current page. Total: {len(product_urls)}")

            # Check for next page (Verified: div.pagination .links)
            # Look for active page, then the next li
            next_link = None
            
            # Method 1: '>', '&gt;' text inside div.pagination
            # Use exact match for '>' to avoid capturing '>|' (Last)
            next_link = await page.query_selector('.pagination .links a:text-is(">")')
            
            if not next_link:
                 # Fallback: Check if there is an anchor with has-text(">") but ensure it's not the last page double arrow
                 # Sometimes text-is might be strict about whitespace. 
                 # Let's try finding all 'a' in links and checking text content in python for safety
                 pagination_links = await page.query_selector_all('.pagination .links a')
                 for pl in pagination_links:
                     txt = await pl.inner_text()
                     if txt.strip() == '>':
                         next_link = pl
                         break
            
            if not next_link:
                 # Method 2: b (current) + a (next)
                 # In OpenCart div.pagination: <b>1</b> <a href="...">2</a>
                 next_link = await page.query_selector('.pagination .links b + a')
            
            if next_link:
                 href = await next_link.get_attribute('href')
                 if href and href not in visited_pages:
                      await page.goto(href)
                      await page.wait_for_load_state('domcontentloaded') # Ensure load
                 else:
                      print("DEBUG: Next link is empty or visited. Stopping.")
                      break
            else:
                print("DEBUG: No next link found. Stopping.")
                break
        
        return list(set(product_urls))
