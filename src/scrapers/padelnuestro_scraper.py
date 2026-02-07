import json
import re
from typing import Dict, List, Optional
from .base_scraper import BaseScraper, Product, clean_price, normalize_specs

class PadelNuestroScraper(BaseScraper):
    """Scraper for PadelNuestro online store."""

    async def scrape_product(self, url: str) -> Optional[Product]:
        """Scrape product data from PadelNuestro."""
        page = await self.get_page(url)

        # Check redirections to category
        if '/palas-padel/' in page.url or page.url.endswith('/dunlop') or page.url.endswith('/adidas') or '/palas' in page.url:
             # If we landed on a category page instead of a product, skip
             if page.url != url:
                  return None

        # Wait for key elements
        try:
             await page.wait_for_selector('h1.page-title', timeout=5000)
        except:
             print(f"Skipping {url}: page title not found")
             return None

        # Extract name
        name = await self.safe_get_text('h1.page-title span')
        if not name: return None

        # Extract price with fallbacks
        price = 0.0
        original_price = None

        # Use shared clean_price function from base_scraper

        # Current Price
        price_text = await self.safe_get_text('.product-info-main .price-box .special-price .price')
        if not price_text:
             price_text = await self.safe_get_text('.product-info-main .price-box .price-container .price')
        
        if price_text:
             price = clean_price(price_text)
        
        # Original Price
        old_price_text = await self.safe_get_text('.product-info-main .price-box .old-price .price')
        if old_price_text:
             original_price = clean_price(old_price_text)

        # Extract images
        image = ''
        images = []
        try:
            # 1. Check Fotorama
            # Wait for it briefly
            try:
                await page.wait_for_selector('.fotorama__stage__frame', timeout=2000)
            except:
                pass

            # Main images
            fotorama_imgs = await page.query_selector_all('.fotorama__stage__frame img')
            for img in fotorama_imgs:
                src = await img.get_attribute('src')
                if src: images.append(src)

            # Thumbnails if main missing
            if not images:
                 thumbs = await page.query_selector_all('.fotorama__nav__frame img')
                 for thumb in thumbs:
                    src = await thumb.get_attribute('src')
                    if src: images.append(src)
            
            # 2. JSON Fallback (Reliable for Magento)
            if not images:
                scripts = await page.query_selector_all('script[type="text/x-magento-init"]')
                for script in scripts:
                    content = await script.inner_text()
                    if 'mage/gallery/gallery' in content:
                        try:
                            data = json.loads(content)
                            for key in data:
                                if 'mage/gallery/gallery' in data[key]:
                                    g_data = data[key]['mage/gallery/gallery'].get('data')
                                    if g_data and isinstance(g_data, list):
                                        for item in g_data:
                                            if item.get('full'): images.append(item['full'])
                                            elif item.get('img'): images.append(item['img'])
                        except:
                            continue

            images = list(dict.fromkeys(images))
            if images: image = images[0]

        except Exception as e:
            pass

        # Extract specs and Brand
        specs: Dict[str, str] = {}
        brand = 'Unknown'

        # Specs table
        try:
            # Method 1: description-attributes
            rows = await page.query_selector_all('.description-attributes')
            for row in rows:
                k_el = await row.query_selector('.description-attributes-label')
                v_el = await row.query_selector('.description-attributes-value')
                if k_el and v_el:
                     k = (await k_el.inner_text()).strip().replace(':', '')
                     v = (await v_el.inner_text()).strip()
                     if k and v:
                          specs[k] = v
                          if k.lower() == 'marca': brand = v
            
            # Method 2: Standard table
            if not specs:
                 rows = await page.query_selector_all('#product-attribute-specs-table tr')
                 for row in rows:
                    th = await row.query_selector('th')
                    td = await row.query_selector('td')
                    if th and td:
                        k = (await th.inner_text()).strip()
                        v = (await td.inner_text()).strip()
                        specs[k] = v
                        if k.lower() == 'marca': brand = v

        except:
            pass

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
        """Scrape product URLs from a category page."""
        product_urls = []
        page = await self.get_page(url)
        
        # Handle cookie consent
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
                if len(product_urls) == 0: 
                     print("No products found on page. Check selectors.")
                break

            # Check for next page
            next_button = await page.query_selector('.pages-item-next a.next')
            if next_button:
                 href = await next_button.get_attribute('href')
                 if href:
                      await page.goto(href)
                      await page.wait_for_load_state('domcontentloaded')
                 else:
                      break
            else:
                break
        
        return list(set(product_urls))
