import json
import re
from typing import Dict, List
from .base_scraper import BaseScraper, Product


class PadelProShopScraper(BaseScraper):
    """Scraper for PadelProShop online store."""

    async def scrape_product(self, url: str) -> Product:
        """Scrape product data from PadelProShop using Shopify JSON endpoint with HTML fallback."""
        
        # Ensure verified URL logic if needed
        page = await self.get_page(url)

        # Check for category redirect
        if page.url != url:
            if '/collections/' in page.url and '/products/' not in page.url:
                 # verify if it's just a param change
                 if page.url.split('?')[0] != url.split('?')[0]:
                     pass # raise ValueError(f"Redirected to category: {page.url}")

        product_data = {}
        
        # Strategy 1: JSON Endpoint
        try:
            # Construct JSON URL
            json_url = f"{url.split('?')[0]}.json"
            response = await page.goto(json_url)
            
            if response and response.status == 200:
                data = await response.json()
                product_data = data.get('product', {})
        except Exception as e:
            print(f"JSON endpoint failed: {e}")

        # Strategy 2: HTML Scraping (Fallback or Supplement)
        # We navigate back to product page if JSON failed or we need more data
        await page.goto(url)
        
        # Extract HTML Data
        title_el = await page.query_selector('h1.product-title')
        html_title = await title_el.inner_text() if title_el else ""
        
        price_el = await page.query_selector('.price__current span.money')
        html_price_text = await price_el.inner_text() if price_el else ""
        
        old_price_el = await page.query_selector('.price__was span.money')
        html_old_price_text = await old_price_el.inner_text() if old_price_el else ""
        
        # Helper for price cleaning
        def clean_price(text):
            if not text: return 0.0
            cleaned = text.replace('€', '').replace('EUR', '').strip()
            cleaned = cleaned.replace('.', '').replace(',', '.') # 1.200,50 -> 1200.50
            try:
                return float(re.sub(r'[^\d.]', '', cleaned))
            except:
                return 0.0

        # DATA MERGING
        
        # Name
        name = product_data.get('title') or html_title
        
        # Price
        price = 0.0
        if product_data.get('variants'):
            # JSON price is usually string "120.00"
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
                if op:
                    original_price = float(op)
            except:
                pass
        
        if not original_price and html_old_price_text:
             original_price = clean_price(html_old_price_text)

        # Brand
        brand = product_data.get('vendor')
        if not brand:
             # Try HTML fallback
             brand_el = await page.query_selector('.product-vendor a, .product-vendor')
             if brand_el:
                 brand = await brand_el.inner_text()
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
        # Selectors: product-media.cc-main-product__media img
        html_images = await page.query_selector_all('.cc-main-product__media img, .product-gallery__image')
        for img in html_images:
             src = await img.get_attribute('src') or await img.get_attribute('data-src')
             if src:
                  if src.startswith('//'): src = f'https:{src}'
                  images.append(src)
        
        # Deduplicate
        images = list(dict.fromkeys(images))
        if images:
             image = images[0]

        # Specs extraction
        specs: Dict[str, str] = {}
        
        # Method 1: HTML List parsing (ul.product-details) - verified in analysis
        try:
             # Check for the specific specs list structure first
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
        except:
             pass

        # Method 2: Parse body_html from JSON if Method 1 failed or incomplete
        if not specs and product_data.get('body_html'):
             body_html = product_data['body_html']
             # Regex for list items: <li><strong>Key:</strong> Value</li>
             matches = re.finditer(r'<li>\s*<strong>\s*([^<]+?)\s*:?\s*</strong>\s*([^<]+?)\s*</li>', body_html, re.IGNORECASE)
             for match in matches:
                 specs[match.group(1).strip()] = match.group(2).strip()

        # Method 3: Description Text Regex (Existing fallback)
        if not specs:
            desc_el = await page.query_selector('.product-description, .rte')
            if desc_el:
                text = await desc_el.inner_text()
                keys = ['Peso', 'Forma', 'Balance', 'Nivel', 'Marco', 'Núcleo', 'Cara']
                for key in keys:
                     match = re.search(fr'{key}\s*[:\.]?\s*([^\n]+)', text, re.IGNORECASE)
                     if match:
                          specs[key] = match.group(1).strip()

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
             await page.wait_for_timeout(2000)
             await page.keyboard.press('Escape')
        except:
             pass

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
                 print("No new products found after multiple scrolls.")
                 break
            if len(product_urls) >= 1000:
                 break
            
            # 2. Scroll to bottom (Infinite Scroll)
            await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            await page.wait_for_timeout(2000) # Wait for load
            
            # 3. Check for specific Load More button (Hybrid)
            try:
                 load_more = await page.query_selector('.js-load-more')
                 if load_more and await load_more.is_visible():
                      print("Clicking Load More button...")
                      await load_more.click()
                      await page.wait_for_timeout(2000)
            except:
                 pass
        
        return list(set(product_urls))
