"""
Decathlon price finder.
Searches decathlon.es for padel rackets and extracts prices.
"""
from typing import Optional
from .base_store import BaseStorePriceFinder, PriceResult
from base_scraper import clean_price


class DecathlonPriceFinder(BaseStorePriceFinder):
    STORE_NAME = "decathlon"
    MIN_MATCH_SCORE = 70  # Decathlon names are often different/shorter
    SEARCH_URL = "https://www.decathlon.es/es/search?Ntt={query}"
    REQUEST_DELAY = (2.0, 4.0)  # Decathlon has aggressive anti-bot
    
    def _clean_search_query(self, model: str, brand: str) -> str:
        """Decathlon search works best with short, specific queries."""
        query = super()._clean_search_query(model, brand)
        # Remove year for broader search (Decathlon often doesn't include year)
        import re
        query = re.sub(r'\b202[3-7]\b', '', query).strip()
        return query
    
    async def search_price(self, model: str, brand: str) -> Optional[PriceResult]:
        """Search Decathlon for a racket price."""
        if not self.page:
            await self.init()
        
        await self._delay()
        
        query = self._clean_search_query(model, brand)
        url = self.SEARCH_URL.format(query=query.replace(' ', '+'))
        
        try:
            await self.page.goto(url, wait_until='domcontentloaded', timeout=30000)
            
            # Wait for search results to load
            try:
                await self.page.wait_for_selector('[data-qa-id="search-result-products"] .dpb-product-model-link, .product-card', timeout=8000)
            except:
                # No results or page didn't load
                return None
            
            # Try to accept cookies if popup appears
            try:
                cookie_btn = await self.page.query_selector('#onetrust-accept-btn-handler, [data-testid="TcfAccept"]')
                if cookie_btn:
                    await cookie_btn.click()
                    await self.page.wait_for_timeout(500)
            except:
                pass
            
            # Extract first product result
            products = await self.page.query_selector_all('.dpb-product-model-link, .product-card a[href*="/p/"]')
            
            if not products:
                return None
            
            # Try to find the best matching product from results
            best_result = None
            best_score = 0
            
            for product in products[:5]:  # Check top 5 results
                try:
                    # Get product name - try multiple selectors
                    name_el = await product.query_selector('.dpb-product-model-link__model, .product-card__title, h2, .vtmn-typo_text-2')
                    if not name_el:
                        # The product element itself might contain the name
                        product_name = (await product.inner_text()).strip().split('\n')[0]
                    else:
                        product_name = (await name_el.inner_text()).strip()
                    
                    if not product_name:
                        continue
                    
                    score = self._calculate_match_score(model, product_name)
                    
                    if score > best_score and score >= self.MIN_MATCH_SCORE:
                        # Get product URL
                        product_url = await product.get_attribute('href')
                        if product_url and not product_url.startswith('http'):
                            product_url = f"https://www.decathlon.es{product_url}"
                        
                        best_score = score
                        best_result = {
                            'name': product_name,
                            'url': product_url,
                            'score': score
                        }
                except:
                    continue
            
            if not best_result:
                return None
            
            # Navigate to product page to get exact price
            try:
                await self.page.goto(best_result['url'], wait_until='domcontentloaded', timeout=15000)
                await self.page.wait_for_timeout(1000)
                
                # Extract price
                price = 0.0
                original_price = None
                
                # Try various Decathlon price selectors
                for price_sel in [
                    '.prc__active-price span[aria-hidden="true"]',
                    '[data-qa-id="product-price"] .prc__active-price',
                    '.vtmn-price_variant--accent',
                    '.js-product-price',
                    '[itemprop="price"]',
                    '.product-price__current-price',
                ]:
                    price_el = await self.page.query_selector(price_sel)
                    if price_el:
                        price_text = await price_el.inner_text()
                        price = clean_price(price_text)
                        if price > 0:
                            break
                
                # Get original price if on sale
                for orig_sel in [
                    '.prc__old-price span[aria-hidden="true"]',
                    '.prc__old-price',
                    '.product-price__old-price',
                    'del',
                ]:
                    orig_el = await self.page.query_selector(orig_sel)
                    if orig_el:
                        orig_text = await orig_el.inner_text()
                        orig_price = clean_price(orig_text)
                        if orig_price > price:
                            original_price = orig_price
                            break
                
                if price > 0:
                    return PriceResult(
                        store=self.STORE_NAME,
                        price=price,
                        original_price=original_price,
                        url=best_result['url'],
                        product_name=best_result['name'],
                        match_score=best_result['score']
                    )
            except Exception as e:
                print(f"  [Decathlon] Error getting price for {model}: {e}")
                return None
            
        except Exception as e:
            print(f"  [Decathlon] Error searching {model}: {e}")
            return None
        
        return None
