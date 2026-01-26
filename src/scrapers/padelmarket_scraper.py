import re
from typing import Dict, List
from .base_scraper import BaseScraper, Product


class PadelMarketScraper(BaseScraper):
    """Scraper for PadelMarket online store."""

    async def scrape_product(self, url: str) -> Product:
        """Scrape product data from PadelMarket."""
        page = await self.get_page(url)

        # Extract name
        name_element = await page.query_selector('h1')
        name = await name_element.inner_text() if name_element else ''

        # Extract price with multiple fallback selectors
        price = 0.0
        original_price = None
        try:
            # Try to find current price
            price_element = await page.query_selector('.price__current') or \
                           await page.query_selector('.price-item--sale') or \
                           await page.query_selector('.price-item--regular')

            if price_element:
                price_text = await price_element.inner_text()
                price_text = re.sub(r'[^\d.,]', '', price_text).replace(',', '.')
                price = float(price_text)
            
            # Try to find original price (compare price)
            compare_element = await page.query_selector('.price__compare') or \
                             await page.query_selector('.price-item--regular')
            # If we found a sale price above, the regular price might be the original
            # Logic depends on specific DOM structure, keeping it simple for now:
            if compare_element and compare_element != price_element:
                 compare_text = await compare_element.inner_text()
                 compare_text = re.sub(r'[^\d.,]', '', compare_text).replace(',', '.')
                 try:
                     original_price = float(compare_text)
                 except ValueError:
                     pass

        except Exception as e:
            print(f'Error extracting price: {e}')

        # Extract brand
        brand = 'Unknown'
        try:
            brand_element = await page.query_selector('.product__vendor')
            if brand_element:
                brand = await brand_element.inner_text()
                brand = brand.strip() if brand else 'Unknown'
        except Exception:
            pass

        # Extract images (List)
        images = []
        try:
            # Look for all product media items
            image_elements = await page.query_selector_all('.product__media img')
            seen_urls = set()
            
            for img in image_elements:
                src = await img.get_attribute('src') or \
                      await img.get_attribute('data-src') or \
                      await img.get_attribute('srcset')
                
                if src:
                    # Cleanup URL
                    if src.startswith('//'):
                        src = f'https:{src}'
                    
                    # Remove query params for uniqueness checks if needed, but sometimes they are needed for resizing
                    # For now, just add distinct URLs
                    if src not in seen_urls:
                        seen_urls.add(src)
                        images.append(src)
                        
            # Fallback if list empty but single image loop above worked (unlikely)
            image = images[0] if images else ''
            
        except Exception:
            image = ''
            pass

        specs: Dict[str, str] = {}

        # Extract specs from custom table
        try:
            # Click "Detalles del producto" if it's collapsed
            summary = await page.query_selector('summary:has-text("Detalles del producto")')
            if summary:
                # Check if open
                is_open = await summary.get_attribute('aria-expanded') == 'true' or \
                          await summary.evaluate('el => el.parentElement.hasAttribute("open")')
                
                if not is_open:
                    await summary.click(force=True)
                    await page.wait_for_timeout(500)  # Wait for animation

            rows = await page.query_selector_all('.product_custom_table .custom_row')
            for row in rows:
                try:
                    title_element = await row.query_selector('.row_title')
                    if title_element:
                        key = await title_element.inner_text()
                        key = key.strip()

                        # Get full text and remove key to get value
                        full_text = await row.inner_text()
                        value = full_text.replace(key, '').strip()

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
            # Wait for products to load
            try:
                await page.wait_for_selector('.product-featured-image-link', timeout=10000)
            except Exception:
                print("Timeout waiting for products")
                break

            # Get product links (Using functional selector from analysis)
            links = await page.query_selector_all('.product-featured-image-link')
            
            # If no image links, try title links
            if not links:
                 links = await page.query_selector_all('.product-card-title')

            for link in links:
                href = await link.get_attribute('href')
                if href:
                    if not href.startswith('http'):
                        href = f'https://padelmarket.com{href}'
                    product_urls.append(href)
            
            print(f"Found {len(links)} products on current page. Total: {len(product_urls)}")

            # Check for "Load more" button
            load_more = await page.query_selector('.load-more.button')
            if load_more:
                # Check if visible/enabled
                if await load_more.is_visible():
                    await load_more.click()
                    # Wait for more products to load (network idle or count increase)
                    await page.wait_for_timeout(2000) 
                else:
                    break
            else:
                # Fallback to pagination next if structure changes back
                next_button = await page.query_selector('.pagination__item--next')
                if next_button and await next_button.get_attribute('href'):
                     next_url = f"https://padelmarket.com{await next_button.get_attribute('href')}"
                     await page.goto(next_url)
                else:
                    break
        
        return list(set(product_urls))
