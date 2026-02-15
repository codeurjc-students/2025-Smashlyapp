"""
Padel Ibérico price finder.
Searches padeliberico.es for padel rackets and extracts prices.
"""
from typing import Optional
from .base_store import BaseStorePriceFinder, PriceResult
from base_scraper import clean_price


class PadelIbericoPriceFinder(BaseStorePriceFinder):
    STORE_NAME = "padeliberico"
    MIN_MATCH_SCORE = 72
    SEARCH_URL = "https://padeliberico.es/buscar?controller=search&s={query}"
    REQUEST_DELAY = (1.5, 3.0)
    
    async def search_price(self, model: str, brand: str) -> Optional[PriceResult]:
        """Search Padel Ibérico for a racket price."""
        if not self.page:
            await self.init()
        
        await self._delay()
        
        query = self._clean_search_query(model, brand)
        url = self.SEARCH_URL.format(query=query.replace(' ', '+'))
        
        try:
            await self.page.goto(url, wait_until='domcontentloaded', timeout=30000)
            
            # Wait for product results (PrestaShop typical selectors)
            try:
                await self.page.wait_for_selector('.product-miniature, .product_list .product-container, #js-product-list .product', timeout=8000)
            except:
                return None
            
            # Accept cookies if present
            try:
                cookie_btn = await self.page.query_selector('.accept-cookie, #cookie_accept, [class*="cookie"] button')
                if cookie_btn:
                    await cookie_btn.click()
                    await self.page.wait_for_timeout(500)
            except:
                pass
            
            # Get product cards
            products = await self.page.query_selector_all('.product-miniature, .product-container, #js-product-list .product')
            
            if not products:
                return None
            
            best_result = None
            best_score = 0
            
            for product in products[:6]:  # Check top 6 results
                try:
                    # Get product name
                    name_el = await product.query_selector('.product-title a, h3 a, h2 a, .product-name a')
                    if not name_el:
                        continue
                    product_name = (await name_el.inner_text()).strip()
                    
                    if not product_name:
                        continue
                    
                    # Skip accessories
                    name_lower = product_name.lower()
                    if any(x in name_lower for x in ['funda', 'grip', 'protector', 'mochila', 'paletero']):
                        continue
                    
                    score = self._calculate_match_score(model, product_name)
                    
                    if score > best_score and score >= self.MIN_MATCH_SCORE:
                        product_url = await name_el.get_attribute('href')
                        
                        # Get price
                        price = 0.0
                        for price_sel in [
                            '.product-price-and-shipping .price, .price',
                            '.regular-price',
                            '[itemprop="price"]',
                            '.current-price span',
                        ]:
                            price_el = await product.query_selector(price_sel)
                            if price_el:
                                price_text = await price_el.inner_text()
                                price = clean_price(price_text)
                                if price > 0:
                                    break
                        
                        # Also try price from attribute
                        if price == 0:
                            price_attr_el = await product.query_selector('[itemprop="price"], [content]')
                            if price_attr_el:
                                price_content = await price_attr_el.get_attribute('content')
                                if price_content:
                                    try:
                                        price = float(price_content)
                                    except:
                                        pass
                        
                        # Get original price
                        original_price = None
                        for orig_sel in ['.regular-price', '.old-price', 'del .price', '.product-price .price-old']:
                            orig_el = await product.query_selector(orig_sel)
                            if orig_el:
                                orig_text = await orig_el.inner_text()
                                orig_price = clean_price(orig_text)
                                if orig_price > price:
                                    original_price = orig_price
                                    break
                        
                        if price > 0:
                            best_score = score
                            best_result = PriceResult(
                                store=self.STORE_NAME,
                                price=price,
                                original_price=original_price,
                                url=product_url or '',
                                product_name=product_name,
                                match_score=score
                            )
                except Exception:
                    continue
            
            return best_result
            
        except Exception as e:
            print(f"  [PadelIbérico] Error searching {model}: {e}")
            return None
