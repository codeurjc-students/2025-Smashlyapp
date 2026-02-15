"""
Base class for store-specific price finders.
Each store implements search_price() to find a racket by name and return price + URL.
"""
import asyncio
import random
from dataclasses import dataclass
from typing import Optional
from playwright.async_api import async_playwright, Browser, Page, BrowserContext
from thefuzz import fuzz


@dataclass
class PriceResult:
    """Result of a price search in a store."""
    store: str
    price: float
    original_price: Optional[float]
    url: str
    product_name: str  # Name as found in the store (for match verification)
    match_score: int   # Fuzzy match score (0-100)
    currency: str = "EUR"


class BaseStorePriceFinder:
    """Base class for store price finders using Playwright."""
    
    STORE_NAME = "base"
    MIN_MATCH_SCORE = 75  # Minimum fuzzy match score to accept a result
    REQUEST_DELAY = (1.5, 3.0)  # Random delay range between requests (seconds)
    
    # User agents rotation
    USER_AGENTS = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
    ]
    
    def __init__(self):
        self.browser: Optional[Browser] = None
        self.context: Optional[BrowserContext] = None
        self.page: Optional[Page] = None
        self.playwright = None
        self._request_count = 0
    
    async def init(self):
        """Initialize browser with stealth settings."""
        if not self.browser:
            self.playwright = await async_playwright().start()
            self.browser = await self.playwright.chromium.launch(
                headless=True,
                args=["--disable-blink-features=AutomationControlled"]
            )
            self.context = await self.browser.new_context(
                user_agent=random.choice(self.USER_AGENTS),
                viewport={'width': 1920, 'height': 1080},
                locale='es-ES',
                java_script_enabled=True,
            )
            # Block images/fonts for speed
            await self.context.route("**/*.{png,jpg,jpeg,gif,svg,webp,woff,woff2,ttf}", 
                                     lambda route: route.abort())
            self.page = await self.context.new_page()
    
    async def close(self):
        """Clean up browser resources."""
        if self.browser:
            await self.browser.close()
            self.browser = None
            self.context = None
            self.page = None
        if self.playwright:
            await self.playwright.stop()
            self.playwright = None
    
    async def _delay(self):
        """Add random delay between requests to avoid detection."""
        delay = random.uniform(*self.REQUEST_DELAY)
        await asyncio.sleep(delay)
    
    def _clean_search_query(self, model: str, brand: str) -> str:
        """Clean racket name for search query. Override per store if needed."""
        # 1. Remove brand from start of model if repeated
        # Handle cases like "Nox Nox AT10..." -> "Nox AT10..." -> "AT10..."
        # First ensure we have a clean start
        query = model.strip()
        
        if brand and brand.lower() != "unknown":
            # Remove brand if it appears at the start (case insensitive)
            if query.lower().startswith(brand.lower()):
                query = query[len(brand):].strip()
            # Also handle if it's repeated twice e.g. "Nox Nox..."
            if query.lower().startswith(brand.lower()):
                query = query[len(brand):].strip()
        
        # 2. Remove common noise words
        for noise in ['Pala', 'pala', 'PALA', 'Padel', 'padel', 'PADEL', 'de pádel', 'de padel', 'De Pádel', 'Racket', 'racket']:
            query = query.replace(noise, '')
            
        # 3. Clean extra whitespace and punctuation
        query = query.replace('-', ' ').replace('/', ' ').replace('  ', ' ')
        
        # 4. Remove year only if it's 202X (optional, but keep for now as year is good for specific search)
        # Some stores prefer "Metalbone 3.2" over "Metalbone 3.2 2023"
        
        return query.strip()
    
    def _parse_price(self, price_text: str) -> Optional[float]:
        """Extract numeric price from text."""
        if not price_text:
            return None
        
        import re
        # Find price pattern (e.g., "199,95 €", "199.95", "199€")
        match = re.search(r'(\d{1,3}(?:[\.,]\d{2})?)', price_text.replace(' ', ''))
        if match:
            price_str = match.group(1).replace(',', '.')
            try:
                return float(price_str)
            except ValueError:
                return None
        return None

    def _calculate_match_score(self, search_name: str, found_name: str) -> int:
        """Calculate fuzzy match score between expected and found product names."""
        # Normalize both names for comparison
        def normalize(s):
            s = s.lower().strip()
            for noise in ['pala', 'padel', 'pádel', 'de', 'para', 'la', 'el', '-']:
                s = s.replace(noise, ' ')
            return ' '.join(s.split())
        
        norm_search = normalize(search_name)
        norm_found = normalize(found_name)
        
        # Use token_sort_ratio for best matching regardless of word order
        score = fuzz.token_sort_ratio(norm_search, norm_found)
        
        # Extract numbers from both
        # Refined logic: mismatching 12K vs 18K is fatal, but 2025 vs 2026 is minor
        import re
        nums1 = re.findall(r'\d+', search_name)
        nums2 = re.findall(r'\d+', found_name)
        
        specs1 = set()
        years1 = set()
        for n in nums1:
            if 2000 <= int(n) <= 2030:
                years1.add(n)
            else:
                specs1.add(n)
                
        specs2 = set()
        years2 = set()
        for n in nums2:
            if 2000 <= int(n) <= 2030:
                years2.add(n)
            else:
                specs2.add(n)
        
        # Penalize strict spec mismatch (e.g. 12 vs 18)
        # If a spec number is in search but NOT in result -> strict penalty
        for n in specs1:
            if n not in specs2:
                score -= 25  # Big penalty for missing spec (e.g. searching 18K, result is 12K)
                
        # Penalize year mismatch slightly (e.g. searching 2025, result is 2026)
        # If a year is in search but NOT in result -> small penalty
        for n in years1:
            if n not in years2:
                score -= 5   # Small penalty for year mismatch
                
        return max(0, score)
    
    async def search_price(self, model: str, brand: str) -> Optional[PriceResult]:
        """
        Search for a racket in this store and return price info.
        Must be implemented by each store.
        
        Args:
            model: The racket model name (e.g., "Adidas Metalbone Team 2026")
            brand: The brand name (e.g., "Adidas")
        
        Returns:
            PriceResult if found with acceptable match score, None otherwise
        """
        raise NotImplementedError
    
    async def __aenter__(self):
        await self.init()
        return self
    
    async def __aexit__(self, *args):
        await self.close()
