import json
import re
from typing import Dict, List, Optional
from .base_scraper import BaseScraper, Product, clean_price, normalize_specs

class PadelProShopScraper(BaseScraper):
    """Scraper for PadelProShop online store."""

    async def scrape_product(self, url: str) -> Optional[Product]:
        """Scrape product data from PadelProShop using Shopify JSON endpoint with HTML fallback."""
        
        page = await self.get_page(url)

        # Check for category redirect
        if '/collections/' in page.url and '/products/' not in page.url:
             if page.url.split('?')[0] != url.split('?')[0]:
                 # return None # Strict skip? PadelProShop often redirects out of stock
                 pass # Let it fail gracefully or return None if title missing

        product_data = {}
        
        # Strategy 1: JSON Endpoint
        try:
            # Construct JSON URL
            json_url = f"{url.split('?')[0]}.json"
            # We can't use page.goto for JSON easily if it downloads or renders raw.
            # But Playwright can fetch it via APIRequestContext, or just navigate.
            # Navigating to .json usually displays the JSON in browser.
            # Let's try fetching via evaluate fetch (cleaner/faster)
            json_str = await page.evaluate(f"""async () => {{
                const res = await fetch('{json_url}');
                if(res.ok) return await res.text();
                return null;
            }}""")
            
            if json_str:
                data = json.loads(json_str)
                product_data = data.get('product', {})
        except Exception as e:
            # print(f"JSON endpoint failed: {e}")
            pass

        # Strategy 2: HTML Scraping (Fallback/Supplement)
        # We are already on the page (or need to be)
        if page.url != url:
             await page.goto(url)
        
        html_title = await self.safe_get_text('h1.product-title')
        html_price_text = await self.safe_get_text('.price__current span.money')
        html_old_price_text = await self.safe_get_text('.price__was span.money')
        
        # Use shared clean_price function from base_scraper

        # DATA MERGING
        
        # Name
        name = product_data.get('title') or html_title
        if not name: return None # Essential
        
        # Price
        price = 0.0
        if product_data.get('variants'):
            try:
                price = float(product_data['variants'][0]['price'])
            except:
                price = 0.0
        
        if price == 0.0:
            price = clean_price(html_price_text)
            
        # Original Price
        original_price = None
        if product_data.get('variants'):
            try:
                op = product_data['variants'][0].get('compare_at_price')
                if op: original_price = float(op)
            except: pass
        
        if not original_price and html_old_price_text:
             original_price = clean_price(html_old_price_text)

        # Brand
        brand = product_data.get('vendor')
        if not brand:
             brand = await self.safe_get_text('.product-vendor a, .product-vendor')
        if not brand:
             brand = 'Unknown'

        # Images
        image = ''
        images = []
        
        # From JSON
        if product_data.get('images'):
            for img in product_data['images']:
                src = img.get('src') if isinstance(img, dict) else img
                if src: images.append(src)
        
        # From HTML (Fallback/Augment)
        try:
             # Selectors: product-media.cc-main-product__media img
             html_images = await page.query_selector_all('.cc-main-product__media img, .product-gallery__image')
             for img in html_images:
                  src = await img.get_attribute('src') or await img.get_attribute('data-src')
                  if src:
                       if src.startswith('//'): src = f'https:{src}'
                       images.append(src)
        except: pass
        
        # Deduplicate
        images = list(dict.fromkeys(images))
        if images: image = images[0]

        # Specs extraction
        specs: Dict[str, str] = {}
        
        # Method 1: HTML List parsing (ul.product-details)
        try:
             spec_rows = await page.query_selector_all('ul.product-details li, .product-specifications li')
             for row in spec_rows:
                 # Usually <p>Label</p> <span>Value</span>
                 label_el = await row.query_selector('p, strong')
                 value_el = await row.query_selector('span')
                 
                 if label_el and value_el:
                      key = await label_el.inner_text()
                      value = await value_el.inner_text()
                      if key and value:
                           specs[key.strip().replace(':', '')] = value.strip()
        except: pass

        # Method 2: Parse body_html from JSON
        if not specs and product_data.get('body_html'):
             body_html = product_data['body_html']
             matches = re.finditer(r'<li>\s*<strong>\s*([^<]+?)\s*:?\s*</strong>\s*([^<]+?)\s*</li>', body_html, re.IGNORECASE)
             for match in matches:
                 specs[match.group(1).strip()] = match.group(2).strip()

        # Method 3: Description Text Regex
        if not specs:
            desc_el = await page.query_selector('.product-description, .rte')
            if desc_el:
                text = await desc_el.inner_text()
                keys = ['Peso', 'Forma', 'Balance', 'Nivel', 'Marco', 'Núcleo', 'Cara']
                for key in keys:
                     match = re.search(fr'{key}\s*[:\.]?\s*([^\n]+)', text, re.IGNORECASE)
                     if match: specs[key] = match.group(1).strip()

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
        """Scrape product URLs from a category page using Infinite Scroll."""
        product_urls = []
        page = await self.get_page(url)
        
        # Handle Cookies/Popups
        try:
             await page.keyboard.press('Escape')
        except: pass

        last_count = 0
        scroll_attempts = 0

        while True:
            # 1. Collect products (Verified selector: li.js-pagination-result a.js-prod-link)
            links = await page.query_selector_all('li.js-pagination-result a.js-prod-link, .card__title a')
            for link in links:
                href = await link.get_attribute('href')
                if href:
                     # Clean URL
                     href = href.split('?')[0]
                     if not href.startswith('http'):
                          href = f'https://www.padelproshop.com{href}'
                     if href not in product_urls:
                          product_urls.append(href)
            
            print(f"Products found: {len(product_urls)}")
            
            # Check success of scroll
            if len(product_urls) > last_count:
                 last_count = len(product_urls)
                 scroll_attempts = 0
            else:
                 scroll_attempts += 1
            
            # Safety checks
            if scroll_attempts >= 3:
                 # print("No new products found after multiple scrolls.")
                 break
            if len(product_urls) >= 1000:
                 break
            
            # 2. Scroll to bottom (Infinite Scroll)
            await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            # Wait for network idle instead of arbitrary timeout
            try:
                await page.wait_for_load_state('networkidle', timeout=3000)
            except:
                pass  # Continue even if timeout
            
            # 3. Check for specific Load More button (Hybrid)
            try:
                 load_more = await page.query_selector('.js-load-more')
                 if load_more and await load_more.is_visible():
                      await load_more.click()
                      await page.wait_for_load_state('networkidle', timeout=3000)
            except: pass
        
        return list(set(product_urls))
