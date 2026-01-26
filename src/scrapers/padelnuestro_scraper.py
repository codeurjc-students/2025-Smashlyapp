import json
import re
from typing import Dict, List
from .base_scraper import BaseScraper, Product


class PadelNuestroScraper(BaseScraper):
    """Scraper for PadelNuestro online store."""

    async def scrape_product(self, url: str) -> Product:
        """Scrape product data from PadelNuestro."""
        page = await self.get_page(url)

        # Check if we've been redirected to a category page
        current_url = page.url
        if current_url != url:
            # Check if URL contains category patterns
            if '/palas-padel/' in current_url or current_url.endswith('/dunlop') or current_url.endswith('/adidas') or '/palas' in current_url:
                raise ValueError(f"Product URL redirected to category page: {current_url}")

        # Wait for key elements to ensure page is loaded
        await page.wait_for_selector('h1', timeout=10000)

        # Extract name
        name_element = await page.query_selector('h1')
        name = await name_element.inner_text() if name_element else ''

        # Extract price with fallbacks
        price = 0.0
        original_price = None
        try:
            price_element = await page.query_selector('[data-price-amount]')
            if price_element:
                price_text = await price_element.get_attribute('data-price-amount')
                price = float(price_text) if price_text else 0.0
            
            # Helper to clean price
            def clean_price(text):
                 return float(re.sub(r'[^\d.,]', '', text).replace(',', '.'))

            # Try to find original price (often struck through)
            old_price_element = await page.query_selector('.old-price .price')
            if old_price_element:
                original_price = clean_price(await old_price_element.inner_text())

        except Exception:
            # Fallback to .product-price
            try:
                price_element = await page.query_selector('.product-price')
                if price_element:
                     price = clean_price(await price_element.inner_text())
            except Exception as e:
                print(f'Error extracting price: {e}')

        # Extract brand
        brand = 'Unknown'
        try:
            brand_element = await page.query_selector('.manufacturer-logo')
            if brand_element:
                brand = await brand_element.get_attribute('alt') or 'Unknown'
        except Exception:
            pass

        # Extract images
        image = ''
        images = []
        try:
            # Try to find all thumbnails or gallery images
            # This selector might need adjustment based on specific PadelNuestro gallery implementation
            gallery_elements = await page.query_selector_all('.product-images-items .thumb-item img, .product-images-large img')
            
            seen_urls = set()
            for img in gallery_elements:
                src = await img.get_attribute('src') or await img.get_attribute('data-src') or ''
                if src and src not in seen_urls:
                    seen_urls.add(src)
                    images.append(src)
            
            if images:
                image = images[0]
            else:
                 # Fallback to single main image
                image_element = await page.query_selector('.product-images-large .active img, .product-images-large img')
                if image_element:
                    image = await image_element.get_attribute('src') or ''
                    images.append(image)

        except Exception:
            pass

        specs: Dict[str, str] = {}

        # Try JSON-LD fallback for brand and image
        try:
            json_ld_element = await page.query_selector('script[type="application/ld+json"]')
            if json_ld_element:
                json_ld_content = await json_ld_element.inner_text()
                if json_ld_content:
                    data = json.loads(json_ld_content)
                    if data.get('brand') and data['brand'].get('name') and brand == 'Unknown':
                        brand = data['brand']['name']
                    # Use JSON-LD images if we couldn't find any in DOM
                    if not images and data.get('image'):
                        ld_images = data['image'] if isinstance(data['image'], list) else [data['image']]
                        images.extend(ld_images)
                        image = images[0] if images else ''
        except Exception:
            pass

        # Extract specs from description attributes with fallbacks
        try:
            # Wait for specs to potentially load
            try:
                await page.wait_for_selector('.description-attributes, .product-attributes, #product-attribute-specs-table', timeout=3000)
            except Exception:
                pass

            # List of selectors to try for specs rows
            # 1. .description-attributes .row (Original)
            # 2. #product-attribute-specs-table tr (Standard Magento)
            # 3. .additional-attributes tr (Another Magento variation)
            # 4. .data.table.additional-attributes tr
            
            # Method 1: Look for specific description attributes container matches
            # Found in analysis: <div class="description-attributes"><span class="description-attributes-label">Marca</span>...
            attributes = await page.query_selector_all('.description-attributes')
            if attributes:
                for attr in attributes:
                    try:
                        label_el = await attr.query_selector('.description-attributes-label')
                        value_el = await attr.query_selector('.description-attributes-value')
                        
                        if label_el and value_el:
                            key = await label_el.inner_text()
                            value = await value_el.inner_text()
                            if key and value:
                                specs[key.strip().replace(':', '')] = value.strip()
                    except Exception:
                        continue

            # Method 2: Table-based fallback (existing logic adapted)
            if not specs:
                rows = await page.query_selector_all('table.data.table.additional-attributes tr, #product-attribute-specs-table tr')
                for row in rows:
                    try:
                        th = await row.query_selector('th')
                        td = await row.query_selector('td')
                        if th and td:
                            key = await th.inner_text()
                            value = await td.inner_text()
                            if key and value:
                                specs[key.strip()] = value.strip()
                    except Exception:
                        continue
                        
            # Method 3: List-based fallback (existing logic)
            if not specs:
                items = await page.query_selector_all('.product-attributes li, .attributes li')
                for item in items:
                    try:
                        text = await item.inner_text()
                        if ':' in text:
                            key, value = text.split(':', 1)
                            specs[key.strip()] = value.strip()
                    except Exception:
                        continue
                    
        except Exception as e:
            print(f'Error extracting specs: {e}')

        # Clean up brand name
        brand = brand.replace('Palas ', '').strip()

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
        
        # Accept cookies if present (PadelNuestro has annoying popups sometimes)
        try:
             await page.click('#onetrust-accept-btn-handler', timeout=2000)
        except Exception:
             pass

        while True:
            # Get product links
            # Selector varies, often .product-item-link
            links = await page.query_selector_all('.product-item-link')
            for link in links:
                href = await link.get_attribute('href')
                if href:
                     # PadelNuestro usually has full URLs
                    product_urls.append(href)
            
            print(f"Found {len(links)} products on current page. Total: {len(product_urls)}")

            # Check for next page
            next_button = await page.query_selector('.pages .next')
            if next_button:
                 # Check if disabled
                 if 'disabled' in (await next_button.get_attribute('class') or ''):
                     break
                 
                 # It might be a link
                 href = await next_button.get_attribute('href')
                 if href:
                      await page.goto(href)
                 else:
                      break
            else:
                break
        
        return list(set(product_urls))
