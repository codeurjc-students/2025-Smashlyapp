import re
from typing import Dict, List
from .base_scraper import BaseScraper, Product


class TiendaPadelPointScraper(BaseScraper):
    """Scraper for TiendaPadelPoint online store."""

    async def scrape_product(self, url: str) -> Product:
        """Scrape product data from TiendaPadelPoint."""
        page = await self.get_page(url)

        # Extract name
        name_element = await page.query_selector('h1.product-title')
        name = await name_element.inner_text() if name_element else ''

        # Extract price with special price handling
        price = 0.0
        original_price = None
        
        try:
            # Check for special/discount price first
            special_price_element = await page.query_selector('.product-price-new')

            if special_price_element:
                price_text = await special_price_element.inner_text()
                price_text = re.sub(r'[^\d.,]', '', price_text).replace(',', '.')
                price = float(price_text)
                
                # Check old price
                old_price_element = await page.query_selector('.product-price-old')
                if old_price_element:
                    old_text = await old_price_element.inner_text()
                    old_text = re.sub(r'[^\d.,]', '', old_text).replace(',', '.')
                    original_price = float(old_text)
            else:
                # Fallback to regular price
                price_element = await page.query_selector('.product-price')
                if price_element:
                    price_text = await price_element.inner_text()
                    price_text = re.sub(r'[^\d.,]', '', price_text).replace(',', '.')
                    price = float(price_text)
        except Exception as e:
            print(f'Error extracting price: {e}')

        # Extract brand
        brand = 'Unknown'
        try:
            brand_element = await page.query_selector('.product-manufacturer img')
            if brand_element:
                brand = await brand_element.get_attribute('alt') or 'Unknown'
        except Exception:
            pass

        # Extract images
        image = ''
        images = []
        try:
            # Main image
            image_element = await page.query_selector('#image')
            if image_element:
                main_src = await image_element.get_attribute('src') or \
                           await image_element.get_attribute('data-src') or ''
                if main_src:
                     image = main_src
                     images.append(main_src)
            
            # Gallery
            gallery_items = await page.query_selector_all('#product-image-carousel .item img')
            for item in gallery_items:
                 src = await item.get_attribute('src') or await item.get_attribute('data-src') or ''
                 # Clean up src (sometimes it's a thumbnail, we want full size if possible, relies on TPP structure)
                 # Usually they just resize via query params or have related structure
                 if src and src not in images:
                     images.append(src)

        except Exception:
            pass

        specs: Dict[str, str] = {}

        # Extract specs from attribute table
        try:
            # Click specification tab if exists
            spec_tab = await page.query_selector('a[href="#tab-specification"]')
            if spec_tab:
                await spec_tab.click()
                await page.wait_for_timeout(500)

            rows = await page.query_selector_all('table.attribute tbody tr')

            for row in rows:
                try:
                    tds = await row.query_selector_all('td')
                    if len(tds) >= 2:
                        key = await tds[0].inner_text()
                        value = await tds[1].inner_text()
                        key = key.strip()
                        value = value.strip()

                        if key and value:
                            specs[key] = value
                except Exception:
                    continue
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
        
        while True:
            # Get product links
            links = await page.query_selector_all('.product-thumb .image a')
            for link in links:
                href = await link.get_attribute('href')
                if href:
                     # Remove query params
                    href = href.split('?')[0]
                    product_urls.append(href)
            
            print(f"Found {len(links)} products on current page. Total: {len(product_urls)}")

            # Check for next page
            next_button = await page.query_selector('ul.pagination li a:has-text(">")') or \
                          await page.query_selector('ul.pagination li.active + li a')
            
            # Simple check if current page is last
            # Or try to find "next" class
            if not next_button:
                 # Try finding link with rel="next"
                 next_button = await page.query_selector('a[rel="next"]')

            if next_button:
                 href = await next_button.get_attribute('href')
                 if href:
                      await page.goto(href)
                 else:
                      break
            else:
                break
        
        return list(set(product_urls))
