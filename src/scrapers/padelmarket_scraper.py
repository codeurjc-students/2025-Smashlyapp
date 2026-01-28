import json
import re
from typing import Dict, List
from .base_scraper import BaseScraper, Product


class PadelMarketScraper(BaseScraper):
    """Scraper for PadelMarket online store."""

    async def scrape_product(self, url: str) -> Product:
        # Force Spanish URL structure if not present
        if '/es-eu/' not in url and 'padelmarket.com' in url:
             url = url.replace('padelmarket.com/', 'padelmarket.com/es-eu/')
        
        page = await self.get_page(url)

        # Check if we've been redirected to a category page
        current_url = page.url
        if current_url != url:
            # Check if URL contains category patterns (collections instead of products)
            if '/collections/' in current_url and '/products/' not in current_url:
                # raise ValueError(f"Product URL redirected to category page: {current_url}")
                pass # Padelmarket sometimes redirects slightly but stays on product, relax this check

        # Extract name
        # Selector: h1.product-title or .product-single__title
        name_element = await page.query_selector('h1.product-title, .product-single__title, h1')
        name = await name_element.inner_text() if name_element else ''

        # Init variables
        image = ''
        images = []
        
        # Handle Popups (Discount/Cookie)
        try:
             # Wait a moment
             await page.wait_for_timeout(1000)
             # Common selectors
             close_buttons = [
                 'button[aria-label="Close"]',
                 'button.kl-private-reset-css-Xuajs1',
                 '.needsclick button',
                 '#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll' # Cookiebot
             ]
             for sel in close_buttons:
                 btn = await page.query_selector(sel)
                 if btn and await btn.is_visible():
                     await btn.click(force=True)
                     await page.wait_for_timeout(200)
                     
             # Also check specifically for the welcome popup via Escape key
             await page.keyboard.press('Escape')
        except:
             pass


        # Extract price
        price = 0.0
        original_price = None
        
        # Helper string cleaner
        def clean_price_text(text):
            if not text: return 0.0
            # Remove symbols
            cleaned = re.sub(r'[^\d.,]', '', text)
            # 1.250,95 -> 1250.95
            cleaned = cleaned.replace('.', '').replace(',', '.')
            try:
                return float(cleaned)
            except:
                return 0.0

        try:
            # Current Price
            # Selectors: .price-item--sale (if on sale), .price-item--regular (if not), .price .amount
            price_element = await page.query_selector('.price .price-item--sale')
            if not price_element:
                 price_element = await page.query_selector('.price .price-item--regular')
            if not price_element:
                 price_element = await page.query_selector('.price .amount')

            if price_element:
                price = clean_price_text(await price_element.inner_text())
            
            # Original Price
            # Selector: .price .price-item--regular (when sale price exists and is different)
            # Or inside .price .del or .old-price
            if await page.query_selector('.price .price-item--sale'):
                 old_price_element = await page.query_selector('.price .price-item--regular')
                 if old_price_element:
                      original_price = clean_price_text(await old_price_element.inner_text())
            
        except Exception as e:
            print(f'Error extracting price: {e}')

        # Extract Specs
        specs: Dict[str, str] = {}
        try:
            # PadelMarket ES specs are in a <details> accordion "Detalles del producto"
            # Or a summary containing that text
            
            # Find the correct details element
            target_details = None
            summaries = await page.query_selector_all('summary')
            for summary in summaries:
                text = await summary.inner_text()
                if 'Detalles' in text or 'Details' in text:
                    target_details = await summary.evaluate_handle('el => el.parentElement')
                    break
            
            if target_details:
                # Open it
                is_open = await target_details.get_attribute('open')
                if not is_open:
                     summary = await target_details.query_selector('summary')
                     if summary:
                         await summary.click()
                         await page.wait_for_timeout(500)

                # Extract from .product_custom_table .custom_row (Verified Selector)
                rows = await target_details.query_selector_all('.product_custom_table .custom_row')
                for row in rows:
                    title_el = await row.query_selector('.row_title')
                    # The value is the second div (sibling of title)
                    # We can use :scope > div:not(.row_title) or nth-child
                    value_el = await row.query_selector('div:not(.row_title)')
                    
                    if title_el and value_el:
                         key = await title_el.inner_text()
                         value = await value_el.inner_text()
                         if key and value:
                              specs[key.strip()] = value.strip()
                
                # Fallback: Standard table if custom table missing
                if not specs:
                     rows = await target_details.query_selector_all('table tr')
                     for row in rows:
                         cols = await row.query_selector_all('td')
                         if len(cols) >= 2:
                             key = await cols[0].inner_text()
                             value = await cols[1].inner_text()
                             specs[key.strip()] = value.strip()

        except Exception as e:
            print(f'Error extracting specs: {e}')

        # Extract brand
        brand = 'Unknown'
        # 1. Try from Specs
        if 'Marca' in specs:
            brand = specs['Marca']
        elif 'Brand' in specs:
            brand = specs['Brand']
        
        # 2. Try JSON-LD
        if brand == 'Unknown':
             try:
                json_ld_element = await page.query_selector('script[type="application/ld+json"]')
                if json_ld_element:
                    content = await json_ld_element.inner_text()
                    data = json.loads(content)
                    # Often root object or list
                    if isinstance(data, dict) and data.get('@type') == 'Product':
                         b = data.get('brand')
                         if isinstance(b, dict):
                              brand = b.get('name', 'Unknown')
                         elif isinstance(b, str):
                              brand = b
             except:
                  pass
        
        if brand == 'Unknown':
             # 3. Fallback to vendor class
             try:
                  vendor_el = await page.query_selector('.product-single__vendor')
                  if vendor_el:
                       brand = await vendor_el.inner_text()
             except:
                  pass
        
        brand = brand.strip()

        # Extract images
        try:
            # Selector for High-Res zoom link: a.product-single__media-zoom
            # This is the most reliable way to get high res on Shopify
            zoom_links = await page.query_selector_all('a.product-single__media-zoom')
            for link in zoom_links:
                href = await link.get_attribute('href')
                if href:
                     if href.startswith('//'):
                          href = f'https:{href}'
                     images.append(href)
            
            # Fallback if no zoom links
            if not images:
                 imgs = await page.query_selector_all('.product-single__media img')
                 for img in imgs:
                      src = await img.get_attribute('src') or await img.get_attribute('data-src')
                      if src:
                           if src.startswith('//'):
                                src = f'https:{src}'
                           images.append(src)
            
            # Deduplicate
            images = list(dict.fromkeys(images))
            if images:
                image = images[0]
        except Exception as e:
             print(f"Error extracting images: {e}")

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
