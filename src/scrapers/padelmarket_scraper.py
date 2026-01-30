import json
import re
from typing import Dict, List, Optional
from .base_scraper import BaseScraper, Product

class PadelMarketScraper(BaseScraper):
    """Scraper for PadelMarket online store."""

    async def scrape_product(self, url: str) -> Optional[Product]:
        # Force Spanish URL structure if not present
        if '/es-eu/' not in url and 'padelmarket.com' in url:
             url = url.replace('padelmarket.com/', 'padelmarket.com/es-eu/')
        
        page = await self.get_page(url)

        # Check redirections
        if '/collections/' in page.url and '/products/' not in page.url:
             return None

        # Extract name (more robust selectors)
        name = await self.safe_get_text('h1.product-title, .product-single__title, h1')
        if not name:
             print(f"Skipping {url}: No name found")
             return None

        # Handle Popups (simplified)
        try:
             # fast check for common popup close buttons
             await page.evaluate("""() => {
                const selectors = ['button[aria-label="Close"]', '.needsclick button', '#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll'];
                selectors.forEach(s => {
                    const el = document.querySelector(s);
                    if(el) el.click();
                });
             }""")
        except:
             pass

        # Extract price
        price = 0.0
        original_price = None
        
        # Try finding the price container first
        price_text = await self.safe_get_text('.price .price-item--sale')
        if not price_text:
             price_text = await self.safe_get_text('.price .price-item--regular')
        if not price_text:
             price_text = await self.safe_get_text('.price .amount')
        
        # Parse price
        if price_text:
            # Simple cleanup: remove all non-numeric except , and .
            clean_p = re.sub(r'[^\d.,]', '', price_text)
            # Standardize: 1.299,99 -> 1299.99
            if ',' in clean_p and '.' in clean_p:
                 # Assume dot is thousands, comma is decimal (EU standard)
                 clean_p = clean_p.replace('.', '').replace(',', '.')
            elif ',' in clean_p:
                 clean_p = clean_p.replace(',', '.')
            
            try:
                price = float(clean_p)
            except:
                price = 0.0

        # Original Price
        if await page.query_selector('.price .price-item--sale'):
             old_p_text = await self.safe_get_text('.price .price-item--regular')
             if old_p_text:
                clean_op = re.sub(r'[^\d.,]', '', old_p_text)
                clean_op = clean_op.replace('.', '').replace(',', '.')
                try:
                    original_price = float(clean_op)
                except:
                    pass

        # Extract Specs
        specs: Dict[str, str] = {}
        # Try to expand details
        try:
             await page.evaluate("""() => {
                 const summaries = document.querySelectorAll('summary');
                 summaries.forEach(s => {
                     if(s.innerText.includes('Detalles') || s.innerText.includes('Details')) s.click();
                 });
             }""")
             await page.wait_for_timeout(500) # Wait for animation
             
             # Extract from custom table rows
             rows = await page.query_selector_all('.product_custom_table .custom_row')
             if rows:
                 for row in rows:
                     # Need element-level extraction.
                     t_el = await row.query_selector('.row_title')
                     v_el = await row.query_selector('div:not(.row_title)')
                     if t_el and v_el:
                         k = (await t_el.inner_text()).strip()
                         v = (await v_el.inner_text()).strip()
                         if k and v: specs[k] = v
             else:
                 # Fallback table
                 rows = await page.query_selector_all('table tr')
                 for row in rows:
                     cols = await row.query_selector_all('td')
                     if len(cols) >= 2:
                         k = (await cols[0].inner_text()).strip()
                         v = (await cols[1].inner_text()).strip()
                         if k and v: specs[k] = v
        except Exception as e:
             pass

        # Extract brand
        brand = specs.get('Marca') or specs.get('Brand')
        if not brand:
             # Try JSON-LD
             try:
                json_ld = await self.safe_get_text('script[type="application/ld+json"]')
                if json_ld:
                     data = json.loads(json_ld)
                     if isinstance(data, dict) and 'brand' in data:
                          b = data['brand']
                          brand = b.get('name') if isinstance(b, dict) else b
             except:
                  pass
        if not brand:
             # Try vendor
             brand = await self.safe_get_text('.product-single__vendor')
        
        brand = brand if brand else "Unknown"

        # Extract images
        images = []
        try:
             # Zoom links
             links = await page.query_selector_all('a.product-single__media-zoom')
             for link in links:
                  href = await link.get_attribute('href')
                  if href:
                       if href.startswith('//'): href = f'https:{href}'
                       images.append(href)
             
             # Fallback simple images
             if not images:
                  imgs = await page.query_selector_all('.product-single__media img')
                  for img in imgs:
                       src = await img.get_attribute('src') or await img.get_attribute('data-src')
                       if src:
                            if src.startswith('//'): src = f'https:{src}'
                            images.append(src)
        except:
             pass
        
        images = list(dict.fromkeys(images)) # Dedupe unique
        image = images[0] if images else ""

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
        
        # Force correct collection URL if needed
        # User requested Spain store: es-eu
        if '/products/' not in url and '/collections/' not in url:
             # Likely a base URL, default to palas
             url = "https://padelmarket.com/es-eu/collections/palas"
        
        product_urls = []
        page = await self.get_page(url)
        
        # Handle Popups
        try:
             await page.wait_for_timeout(2000)
             await page.keyboard.press('Escape') # Close welcome popup
        except:
             pass
        
        # Simple loop for 'Load More'
        while True:
            # 1. Collect products currently visible
            links = await page.query_selector_all('a[href*="/products/"]')
            current_count = len(product_urls)
            
            for link in links:
                href = await link.get_attribute('href')
                if href and '/products/' in href:
                    # Generic cleaner
                    if not href.startswith('http'):
                         href = f'https://padelmarket.com{href}'
                    # Ensure /es-eu/ is in URL if it's the ES store
                    if 'padelmarket.com/products/' in href:
                         href = href.replace('padelmarket.com/products/', 'padelmarket.com/es-eu/products/')
                    
                    clean_href = href.split('?')[0]
                    if clean_href not in product_urls:
                         product_urls.append(clean_href)
            
            new_count = len(product_urls)
            print(f"Products found: {new_count} (+{new_count - current_count})")
            
            # Safety limit
            if new_count >= 1000: # Practical limit
                 break

            # 2. Click Load More
            # Selector: button.load-more.button
            try:
                load_more = await page.query_selector('button.load-more.button')
                if load_more and await load_more.is_visible():
                     print("Clicking Load More...")
                     # Scroll to it
                     await load_more.scroll_into_view_if_needed()
                     # Click
                     await load_more.click()
                     # Wait for loading spin or new products
                     await page.wait_for_timeout(3000)
                else:
                     print("No more 'Load More' button found/visible.")
                     break
            except Exception as e:
                 print(f"Error clicking Load More: {e}")
                 break
        
        return list(set(product_urls))
