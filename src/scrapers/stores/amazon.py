"""
Amazon price finder.
Searches amazon.es for padel rackets, extracts prices, and constructs affiliate URLs.
"""
import re
from typing import Optional
from .base_store import BaseStorePriceFinder, PriceResult
from base_scraper import clean_price


class AmazonPriceFinder(BaseStorePriceFinder):
    STORE_NAME = "amazon"
    MIN_MATCH_SCORE = 55  # Lower threshold for Amazon due to naming variations
    SEARCH_URL = "https://www.amazon.es/s?k={query}&i=sporting"
    REQUEST_DELAY = (2.5, 5.0)  # Amazon is very aggressive on bot detection
    
    def __init__(self, affiliate_tag: str = ""):
        super().__init__()
        self.affiliate_tag = affiliate_tag
    
    def _clean_search_query(self, model: str, brand: str) -> str:
        """Amazon search: include 'pala padel' for better results."""
        query = super()._clean_search_query(model, brand)
        return f"{query} pala padel"
    
    def _build_affiliate_url(self, url: str, asin: str = "") -> str:
        """Construct affiliate URL with tag."""
        if asin and self.affiliate_tag:
            return f"https://www.amazon.es/dp/{asin}?tag={self.affiliate_tag}"
        elif self.affiliate_tag:
            separator = '&' if '?' in url else '?'
            return f"{url}{separator}tag={self.affiliate_tag}"
        return url
    
    async def search_price(self, model: str, brand: str) -> Optional[PriceResult]:
        """Search Amazon for a racket price."""
        if not self.page:
            await self.init()
        
        await self._delay()
        
        query = self._clean_search_query(model, brand)
        url = self.SEARCH_URL.format(query=query.replace(' ', '+'))
        
        try:
            await self.page.goto(url, wait_until='domcontentloaded', timeout=30000)
            
            # Handle CAPTCHA detection
            captcha = await self.page.query_selector('#captchacharacters, .a-box-inner form[action="/errors/validateCaptcha"]')
            if captcha:
                print(f"  [Amazon] CAPTCHA detected, skipping {model}")
                return None
            
            # Wait for results
            try:
                await self.page.wait_for_selector('[data-component-type="s-search-result"], .s-result-item', timeout=8000)
            except:
                return None
            
            # Extract search results
            results = await self.page.query_selector_all('[data-component-type="s-search-result"]')
            
            if not results:
                return None
            
            best_result = None
            best_score = 0
            
            for result in results[:8]:  # Check top 8 results
                try:
                    # Skip sponsored results if possible
                    sponsored = await result.query_selector('.puis-sponsored-label-text, [data-component-type="sp-sponsored-result"]')
                    
                    # Get product name
                    name_el = await result.query_selector('h2 a span, h2 span.a-text-normal, .a-size-base-plus')
                    if not name_el:
                        continue
                    product_name = (await name_el.inner_text()).strip()
                    
                    if not product_name:
                        continue
                    
                    # Skip if clearly not a padel racket
                    name_lower = product_name.lower()
                    if any(x in name_lower for x in ['funda', 'grip', 'overgrip', 'protector', 'bolsa', 
                                                      'mochila', 'pelota', 'camiseta', 'zapatilla']):
                        continue
                    
                    # Clean names for better matching
                    # Remove marketing terms that differ between stores
                    clean_model = model.lower()
                    clean_product = product_name.lower()
                    
                    for term in ['limited edition', ' pala', ' de padel', ' de pádel', 'padel ', 'pádel ']:
                        clean_model = clean_model.replace(term, '')
                    
                    for term in ['pala de pádel', 'pala de padel', 'pádel', 'padel', 'luxury']:
                        clean_product = clean_product.replace(term, '')
                    
                    score = self._calculate_match_score(clean_model, clean_product)
                    
                    # Penalize sponsored results slightly
                    if sponsored:
                        score -= 5
                    
                    if score > best_score and score >= self.MIN_MATCH_SCORE:
                        # Get ASIN
                        asin = await result.get_attribute('data-asin')
                        
                        # Get product URL
                        link_el = await result.query_selector('h2 a')
                        product_url = await link_el.get_attribute('href') if link_el else None
                        if product_url and not product_url.startswith('http'):
                            product_url = f"https://www.amazon.es{product_url}"
                        
                        # Get price from search results
                        price = 0.0
                        price_el = await result.query_selector('.a-price .a-offscreen')
                        if price_el:
                            price_text = await price_el.inner_text()
                            price = clean_price(price_text)
                        
                        # Get original price
                        original_price = None
                        orig_el = await result.query_selector('.a-price[data-a-strike="true"] .a-offscreen, .a-text-price .a-offscreen')
                        if orig_el:
                            orig_text = await orig_el.inner_text()
                            orig_price = clean_price(orig_text)
                            if orig_price > price:
                                original_price = orig_price
                        
                        if price > 0:
                            affiliate_url = self._build_affiliate_url(product_url or '', asin or '')
                            
                            best_score = score
                            best_result = PriceResult(
                                store=self.STORE_NAME,
                                price=price,
                                original_price=original_price,
                                url=affiliate_url,
                                product_name=product_name,
                                match_score=score
                            )
                except Exception:
                    continue
            
            return best_result
            
        except Exception as e:
            print(f"  [Amazon] Error searching {model}: {e}")
            return None
