import re
from typing import Dict, List
from .base_scraper import BaseScraper, Product


class PadelMarketScraper(BaseScraper):
    """Scraper for PadelMarket online store."""

    async def scrape_product(self, url: str) -> Product:
        """Scrape product data from PadelMarket."""
        page = await self.get_page(url)

        # Check if we've been redirected to a category page
        current_url = page.url
        if current_url != url:
            # Check if URL contains category patterns (collections instead of products)
            if '/collections/' in current_url and '/products/' not in current_url:
                raise ValueError(f"Product URL redirected to category page: {current_url}")

        # Extract name
        name_element = await page.query_selector('h1')
        name = await name_element.inner_text() if name_element else ''

        # Extract price with multiple fallback selectors
        price = 0.0
        original_price = None
        try:
            # Try to find current price
            # .price-item--sale (current sale price) or .price-item--regular (normal price)
            price_element = await page.query_selector('.price-item--sale') or \
                           await page.query_selector('.price-item--regular') or \
                           await page.query_selector('.product-price')

            if price_element:
                price_text = await price_element.inner_text()
                price_text = re.sub(r'[^\d.,]', '', price_text).replace(',', '.')
                price = float(price_text)
            
            # Try to find original price (compare price)
            # usually .price-item--regular inside a .price--on-sale container? 
            # Or distinct element.
            compare_element = await page.query_selector('.price__compare .price-item--regular')
            if compare_element:
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
            image_elements = await page.query_selector_all('.product-single__media img, .product__media img')
            seen_urls = set()
            
            for img in image_elements:
                src = await img.get_attribute('src') or \
                      await img.get_attribute('data-src') or \
                      await img.get_attribute('srcset')
                
                if src:
                    if src.startswith('//'):
                        src = f'https:{src}'
                    if src not in seen_urls:
                        seen_urls.add(src)
                        images.append(src)
                        
            image = images[0] if images else ''
            
        except Exception:
            image = ''
            pass

        specs: Dict[str, str] = {}

        # Extract specs
        try:
            # Click "Detalles del producto" if it's collapsed
            summary = await page.query_selector('summary:has-text("Detalles del producto")')
            content_element = None
            
            if summary:
                # Check if open
                is_open = await summary.evaluate('el => el.parentElement.hasAttribute("open")')
                if not is_open:
                    await summary.click(force=True)
                    await page.wait_for_timeout(500)  # Wait for animation

                # The content is usually in the sibling or child div
                # .collapsible-content__inner
                details_element = await summary.evaluate_handle('el => el.parentElement')
                content_element = await details_element.query_selector('.collapsible-content__inner')

            if content_element:
                # Parse text content line by line or p by p
                # It might be <p>Key: Value</p> or <ul><li>Key: Value</li></ul>
                text_content = await content_element.inner_text()
                lines = text_content.split('\n')
                for line in lines:
                    if ':' in line:
                        parts = line.split(':', 1)
                        if len(parts) == 2:
                            key = parts[0].strip()
                            value = parts[1].strip()
                            # Basic cleanup
                            key = re.sub(r'[^\w\s]', '', key)
                            if key and value and len(key) < 30: # Avoid long text as keys
                                specs[key] = value

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

    async def scrape_category(self, url: str) -> Product:
        """Scrape product URLs from a category page."""
        product_urls = []
        page = await self.get_page(url)
        
        # Handle potential language/region selector modal
        try:
            # Wait for any potential modal overlay to appear
            await page.wait_for_timeout(2000)
            
            # Force remove the obstructing language selector overlay
            await page.evaluate("""
                () => {
                    const selectors = [
                        '.md-form__select__language__list-link-wrapper',
                        '.md-app-embed',
                        '#CybotCookiebotDialog' 
                    ];
                    selectors.forEach(sel => {
                        const els = document.querySelectorAll(sel);
                        els.forEach(el => el.remove());
                    });
                }
            """)
            print("Removed potential overlay elements.")
            
        except Exception as e:
            print(f"Warning removing overlays: {e}")

        # Accept Cookies (Cookiebot) - keeping this just in case, but removal above might handle it
        try:
             # Wait a bit for the banner if it wasn't removed
             if await page.query_selector('#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll'):
                 await page.click('#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll', force=True)
                 await page.wait_for_selector('#CybotCookiebotDialog', state='hidden', timeout=5000)
        except Exception:
             print("Cookie banner not found or already accepted/removed.")

        while True:
            # Wait for products to load
            try:
                await page.wait_for_selector('.product-featured-image-link', timeout=10000)
            except Exception:
                print("Timeout waiting for products")
                break

            # Get product links (Generic safer selector)
            links = await page.query_selector_all('a[href*="/products/"]')
            
            for link in links:
                href = await link.get_attribute('href')
                if href and '/products/' in href:
                    if not href.startswith('http'):
                        href = f'https://padelmarket.com{href}'
                    # clean up params
                    href = href.split('?')[0]
                    product_urls.append(href)
            
            print(f"Found {len(links)} links. Total unique products: {len(set(product_urls))}")

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
