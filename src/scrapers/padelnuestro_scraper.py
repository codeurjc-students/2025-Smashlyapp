import json
import re
from typing import Dict, List
from .base_scraper import BaseScraper, Product


class PadelNuestroScraper(BaseScraper):
    """Scraper for PadelNuestro online store."""

    async def scrape_product(self, url: str) -> Product:
        """Scrape product data from PadelNuestro."""
        page = await self.get_page(url)

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

        # Extract specs from description attributes
        try:
            # Wait for specs to load
            try:
                await page.wait_for_selector('.description-attributes', timeout=3000)
            except Exception:
                pass

            rows = await page.query_selector_all('.description-attributes .row, .attribute-row')
            for row in rows:
                try:
                    label_element = await row.query_selector('.description-attributes-label, .attribute-label')
                    value_element = await row.query_selector('.description-attributes-value, .attribute-value')

                    if label_element and value_element:
                        label = await label_element.inner_text()
                        value = await value_element.inner_text()
                        label = label.strip().replace(':', '')
                        value = value.strip()

                        if label and value:
                            specs[label] = value
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
