import json
import re
from typing import Dict, List
from .base_scraper import BaseScraper, Product


class PadelProShopScraper(BaseScraper):
    """Scraper for PadelProShop online store."""

    async def scrape_product(self, url: str) -> Product:
        """Scrape product data from PadelProShop using Shopify JSON endpoint."""
        # Use Shopify JSON endpoint directly
        product_data = {}
        # We need a page object to perform requests
        # Note: self.get_page(url) usually navigates to the URL.
        # But here we might want to go to the JSON URL first.
        # Let's use self.get_page() which likely handles browser context.
        # If get_page navigates, we can just navigate again.
        page = await self.get_page(url)

        # Check if we've been redirected to a category page
        current_url = page.url
        if current_url != url:
            # Check if URL contains category patterns (collections instead of products)
            if '/collections/' in current_url and '/products/' not in current_url:
                raise ValueError(f"Product URL redirected to category page: {current_url}") 

        try:
            # Try to get JSON data first
            response = await page.goto(f"{url.split('?')[0]}.json")
            if not response or response.status != 200:
                raise Exception(f"JSON endpoint failed with status {response.status if response else 'None'}")
                
            data = await response.json()
            product_data = data.get('product')
        except Exception as e:
            print(f"Error fetching/parsing JSON: {e}. Falling back to HTML scraping.")
            # Fallback: Load the actual URL
            await page.goto(url)
            
            title_el = await page.query_selector('h1')
            title = await title_el.inner_text() if title_el else "Unknown Product"
            
            price_el = await page.query_selector('.price, .current-price')
            price = await price_el.inner_text() if price_el else "0"
            
            description_el = await page.query_selector('.product-description, .rte, .description')
            body_html = await description_el.inner_html() if description_el else ""
            
            product_data = {
                'title': title,
                'body_html': body_html,
                'variants': [{'price': price.replace('€', '').replace(',', '.').strip()}]
            }

        p = product_data
        if not p:
            raise Exception('Product data could not be retrieved')

        # Extract basic product info
        name = p.get('title', '')
        price = 0.0
        if p.get('variants') and len(p['variants']) > 0:
            price_str = str(p['variants'][0].get('price', 0))
            price = float(price_str.replace(',', '.'))
            # Check for compare_at_price (original price)
            compare_price = p['variants'][0].get('compare_at_price')
            if compare_price:
                 try:
                     original_price = float(str(compare_price).replace(',', '.'))
                 except (ValueError, TypeError):
                     original_price = None
        else:
             original_price = None

        brand = p.get('vendor', 'Unknown')

        image = ''
        images = []
        
        # Shopify JSON usually has 'images' list
        if p.get('images'):
            for img_entry in p['images']:
                if isinstance(img_entry, dict) and img_entry.get('src'):
                    images.append(img_entry['src'])
                elif isinstance(img_entry, str):
                    images.append(img_entry)
            
            if images:
                image = images[0]
        
        # Fallback to single 'image'
        if not image and p.get('image'):
             if isinstance(p['image'], dict) and p['image'].get('src'):
                 image = p['image']['src']
             elif isinstance(p['image'], str):
                 image = p['image']
             
             if image and image not in images:
                 images.append(image)

        # Parse specs from body_html
        specs: Dict[str, str] = {}
        body_html = p.get('body_html', '')

        if body_html:
            # First try to clean HTML tags to get raw text
            text_content = re.sub(r'<[^>]+>', '\n', body_html)
            
            # Common spec keys to look for in Spanish
            spec_keys = [
                'Peso', 'Weight', 'Balance', 'Forma', 'Shape', 'Nucleo', 'Núcleo', 'Core',
                'Marco', 'Frame', 'Cara', 'Face', 'Caras', 'Faces', 'Grosor', 'Thickness',
                'Nivel', 'Level', 'Tipo de juego', 'Game type'
            ]
            
            # 1. Try list items first (existing logic but slightly more robust)
            pattern_li = r'<li>\s*<strong>\s*([^<]+?)\s*:?\s*</strong>\s*([^<]+?)\s*</li>'
            matches_li = re.finditer(pattern_li, body_html, re.IGNORECASE)
            
            found_specs = False
            for match in matches_li:
                key = match.group(1).strip().replace(':', '')
                value = match.group(2).strip()
                if key and value:
                    specs[key] = value
                    found_specs = True
            
            # 2. If no specs found in lists, try regex on text content
            if not found_specs:
                for key in spec_keys:
                    # Pattern: Key: Value (until newline or next key-like structure)
                    # We look for the key, optional colon, and then capture value until newline
                    pattern = fr'(?:^|\n|[\.\>])\s*({key})\s*[:\.]?\s*([^\n\<]+)'
                    match = re.search(pattern, text_content, re.IGNORECASE)
                    if match:
                        k = match.group(1).strip()
                        v = match.group(2).strip()
                        # Sanity check on value length
                        if len(v) < 100:
                             specs[k.title()] = v

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
        page = await self.get_page(url)
        
        while True:
            # Get product links (Shopify structure)
            links = await page.query_selector_all('a.js-prod-link')
            for link in links:
                href = await link.get_attribute('href')
                if href:
                    # Remove query params
                    href = href.split('?')[0]
                    if not href.startswith('http'):
                        href = f'https://padelproshop.com{href}'
                    product_urls.append(href)
            
            print(f"Found {len(links)} products on current page. Total: {len(product_urls)}")

            # Check for next page
            next_button = await page.query_selector('.pagination__next, a[rel="next"]')
            if next_button:
                 href = await next_button.get_attribute('href')
                 if href:
                      if not href.startswith('http'):
                          href = f'https://padelproshop.com{href}'
                      await page.goto(href)
                 else:
                      break
            else:
                break
        
        return list(set(product_urls))
