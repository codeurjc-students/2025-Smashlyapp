import json
import re
from typing import Dict, List
from .base_scraper import BaseScraper, Product


class PadelProShopScraper(BaseScraper):
    """Scraper for PadelProShop online store."""

    async def scrape_product(self, url: str) -> Product:
        """Scrape product data from PadelProShop using Shopify JSON endpoint."""
        # Use Shopify JSON endpoint directly
        json_url = f"{url.split('?')[0]}.json"
        page = await self.get_page(json_url)

        # Get JSON content from page body
        body_element = await page.query_selector('body')
        content = await body_element.inner_text() if body_element else '{}'

        try:
            product_data = json.loads(content)
        except json.JSONDecodeError as e:
            print(f'Failed to parse JSON from PadelProShop: {e}')
            raise Exception('Invalid JSON response')

        p = product_data.get('product')
        if not p:
            raise Exception('Product not found in JSON')

        # Extract basic product info
        name = p.get('title', '')
        price = 0.0
        if p.get('variants') and len(p['variants']) > 0:
            price = float(p['variants'][0].get('price', 0))
            # Check for compare_at_price (original price)
            compare_price = p['variants'][0].get('compare_at_price')
            if compare_price:
                 try:
                     original_price = float(compare_price)
                 except (ValueError, TypeError):
                     original_price = None
        else:
             original_price = None

        brand = p.get('vendor', 'Unknown')

        image = ''
        images = []
        
        # Shopify JSON usually has 'images' list
        if p.get('images'):
            for img_entry in p['images']:
                if isinstance(img_entry, dict) and img_entry.get('src'):
                    images.append(img_entry['src'])
                elif isinstance(img_entry, str):
                    images.append(img_entry)
            
            if images:
                image = images[0]
        
        # Fallback to single 'image'
        if not image and p.get('image'):
             if isinstance(p['image'], dict) and p['image'].get('src'):
                 image = p['image']['src']
             elif isinstance(p['image'], str):
                 image = p['image']
             
             if image and image not in images:
                 images.append(image)

        # Parse specs from body_html
        specs: Dict[str, str] = {}
        body_html = p.get('body_html', '')

        if body_html:
            # Pattern: <li><strong>Key:</strong> Value</li>
            pattern = r'<li>\s*<strong>\s*([^<]+?)\s*:?\s*</strong>\s*([^<]+?)\s*</li>'
            matches = re.finditer(pattern, body_html, re.IGNORECASE)

            for match in matches:
                key = match.group(1).strip().replace(':', '')
                value = match.group(2).strip()

                if key and value:
                    specs[key] = value

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
            # Get product links (Shopify structure)
            links = await page.query_selector_all('.product-card a.product-card__link, .grid-view-item__link, a.product-item__title')
            for link in links:
                href = await link.get_attribute('href')
                if href:
                    # Remove query params
                    href = href.split('?')[0]
                    if not href.startswith('http'):
                        href = f'https://padelproshop.com{href}'
                    product_urls.append(href)
            
            print(f"Found {len(links)} products on current page. Total: {len(product_urls)}")

            # Check for next page
            next_button = await page.query_selector('.pagination__next, a[rel="next"]')
            if next_button:
                 href = await next_button.get_attribute('href')
                 if href:
                      if not href.startswith('http'):
                          href = f'https://padelproshop.com{href}'
                      await page.goto(href)
                 else:
                      break
            else:
                break
        
        return list(set(product_urls))
