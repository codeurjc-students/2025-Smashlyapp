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

        # Wait for key elements (Name is critical)
        await page.wait_for_selector('h1.page-title', timeout=10000)

        # Extract name
        name_element = await page.query_selector('h1.page-title span')
        name = await name_element.inner_text() if name_element else ''

        # Extract price with fallbacks
        price = 0.0
        original_price = None

        # Helper to clean price
        def clean_price(text):
            if not text:
                return 0.0
            # Remove currency symbols and non-breaking spaces
            text = text.replace('€', '').replace('&nbsp;', '').strip()
            # Handle European format: 1.234,56 -> 1234.56
            # First remove thousands separator (dot)
            text = text.replace('.', '')
            # Replace decimal separator (comma) with dot
            text = text.replace(',', '.')
            try:
                return float(re.sub(r'[^\d.]', '', text))
            except ValueError:
                return 0.0

        try:
            # Current Price (.product-info-main is the container for the main product info)
            # Selector: .product-info-main .price-box .special-price .price OR .product-info-main .price-box .price-container .price
            price_element = await page.query_selector('.product-info-main .price-box .special-price .price')
            if not price_element: # Fallback for non-discounted items
                 price_element = await page.query_selector('.product-info-main .price-box .price-container .price')
            
            if price_element:
                price = clean_price(await price_element.inner_text())
            
            # Original Price
            old_price_element = await page.query_selector('.product-info-main .price-box .old-price .price')
            if old_price_element:
                original_price = clean_price(await old_price_element.inner_text())

        except Exception as e:
            print(f'Error extracting price: {e}')

        # Extract images
        image = ''
        images = []
        try:
            # Method 1: Fotorama (Standard Magento 2 gallery)
            # Wait for Fotorama to load usually helps
            try:
                await page.wait_for_selector('.fotorama__stage__frame', timeout=3000)
            except:
                pass

            # Main images often in .fotorama__stage__frame or .fotorama__img
            fotorama_images = await page.query_selector_all('.fotorama__stage__frame img')
            for img in fotorama_images:
                src = await img.get_attribute('src')
                if src:
                    images.append(src)

            # Thumbnails often have the full image link or a distinct one
            if not images:
                 thumbs = await page.query_selector_all('.fotorama__nav__frame img')
                 for thumb in thumbs:
                    src = await thumb.get_attribute('src')
                    if src:
                        images.append(src)
            
            # Method 2: Magento Script Fallback (If Fotorama fails/not present)
            if not images:
                scripts = await page.query_selector_all('script[type="text/x-magento-init"]')
                for script in scripts:
                    content = await script.inner_text()
                    if 'mage/gallery/gallery' in content:
                        try:
                            data = json.loads(content)
                            for key in data:
                                if 'mage/gallery/gallery' in data[key]:
                                    gallery_data = data[key]['mage/gallery/gallery'].get('data')
                                    if gallery_data and isinstance(gallery_data, list):
                                        for item in gallery_data:
                                            if item.get('full'):
                                                images.append(item['full'])
                                            elif item.get('img'):
                                                images.append(item['img'])
                        except:
                            continue

            # Deduplicate
            images = list(dict.fromkeys(images))
            if images:
                image = images[0]

        except Exception as e:
            print(f'Error extracting images: {e}')

        # Extract specs and Brand
        specs: Dict[str, str] = {}
        brand = 'Unknown'

        try:
            # Specs are usually in .additional-attributes-wrapper table
            # Rows are .description-attributes
            attribute_rows = await page.query_selector_all('.description-attributes')
            
            for row in attribute_rows:
                try:
                    label_el = await row.query_selector('.description-attributes-label')
                    value_el = await row.query_selector('.description-attributes-value')
                    
                    if label_el and value_el:
                        key = (await label_el.inner_text()).strip().replace(':', '')
                        value = (await value_el.inner_text()).strip()
                        
                        if key and value:
                            specs[key] = value
                            
                            # Extract Brand from specs if found
                            if key.lower() == 'marca':
                                brand = value
                except:
                    continue
            
            # Fallback for specs
            if not specs:
                 rows = await page.query_selector_all('#product-attribute-specs-table tr')
                 for row in rows:
                    th = await row.query_selector('th')
                    td = await row.query_selector('td')
                    if th and td:
                        key = (await th.inner_text()).strip()
                        value = (await td.inner_text()).strip()
                        specs[key] = value
                        if key.lower() == 'marca':
                             brand = value

        except Exception as e:
            print(f'Error extracting specs: {e}')

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
        
        # Handle cookie consent if it appears
        try:
             await page.click('#onetrust-accept-btn-handler', timeout=3000)
        except:
             pass

        while True:
            # Get product links
            links = await page.query_selector_all('li.product-item a.product-item-link')
            current_page_count = 0
            for link in links:
                href = await link.get_attribute('href')
                if href and href not in product_urls:
                    product_urls.append(href)
                    current_page_count += 1
            
            print(f"Found {current_page_count} new products. Total: {len(product_urls)}")
            
            if current_page_count == 0:
                # If no products found, we might be blocked or done. 
                # Check if there are any products at all to distinguish
                if len(product_urls) > 0: 
                    pass # Just stopped finding new ones
                else: 
                     print("No products found on page. Check selectors.")
                break

            # Check for next page
            # Selector: .pages-item-next a.next
            next_button = await page.query_selector('.pages-item-next a.next')
            
            if next_button:
                 href = await next_button.get_attribute('href')
                 if href:
                      await page.goto(href)
                      await page.wait_for_load_state('domcontentloaded') # Wait for navigation
                 else:
                      break
            else:
                break
        
        return list(set(product_urls))
