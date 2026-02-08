from abc import ABC, abstractmethod
from typing import Dict, Optional, List
from playwright.async_api import async_playwright, Browser, Page, BrowserContext
import asyncio
import re


# ============================================================================
# Shared Utility Functions for Consistent Data Parsing
# ============================================================================

def clean_price(text: str) -> float:
    """
    Parse price from text with automatic format detection.
    
    Supports multiple formats:
    - 119.95 (US/UK format)
    - 119,95 (EU format)
    - 1.234,56 (EU with thousands separator)
    - "€119.95" (with currency symbols)
    - 14995 (cents format - will be converted to 149.95)
    
    Args:
        text: Price string to parse
        
    Returns:
        Float price value, or 0.0 if parsing fails
    """
    if not text: 
        return 0.0
    
    # Remove currency symbols and extra whitespace
    text = text.replace('€', '').replace('EUR', '').replace('&nbsp;', '').replace(' ', '').strip()
    
    # Auto-detect decimal format
    if ',' in text and '.' in text:
        # Format: 1.234,56 → 1234.56 (EU with thousands)
        text = text.replace('.', '').replace(',', '.')
    elif ',' in text:
        # Format: 119,95 → 119.95 (EU simple)
        text = text.replace(',', '.')
    # If only has dot, assume it IS the decimal point (119.95)
    
    try:
        match = re.search(r'[\d.]+', text)
        if match:
            price = float(match.group(0))
            
            # CRITICAL FIX: Detect prices formatted as cents (e.g., "14995" = 149.95€)
            # If price is integer >= 1000 with no decimal point in original text
            if '.' not in text and ',' not in text:
                # Prices like 14995, 27795 are likely in cents
                if price >= 1000 and price < 100000:  # Reasonable range for cent-formatted prices
                    price = price / 100.0
            
            return price
        return 0.0
    except ValueError:
        return 0.0



# Spec name normalization mapping (Spanish standard)
SPEC_NAME_MAP = {
    # Forma variations
    'forma': 'Forma',
    'format': 'Forma',
    'shape': 'Forma',
    'formato': 'Forma',
    
    # Peso variations
    'peso': 'Peso',
    'weight': 'Peso',
    'talla-peso': 'Peso',
    
    # Balance variations
    'balance': 'Balance',
    'balanceo': 'Balance',
    
    # Núcleo variations
    'núcleo': 'Núcleo',
    'nucleo': 'Núcleo',
    'goma': 'Núcleo',
    'foam': 'Núcleo',
    'core': 'Núcleo',
    
    # Cara variations
    'cara': 'Cara',
    'caras': 'Cara',
    'material': 'Cara',
    'fibra': 'Cara',
    'surface': 'Cara',
    'material cara': 'Cara',
    
    # Marco variations
    'marco': 'Marco',
    'frame': 'Marco',
    
    # Nivel variations
    'nivel': 'Nivel',
    'level': 'Nivel',
    'nivel de juego': 'Nivel',
    
    # Perfil variations
    'perfil': 'Perfil',
    'grosor': 'Perfil',
    'espesor': 'Perfil',
    
    # Additional common fields
    'rugosidad': 'Rugosidad',
    'superficie': 'Rugosidad',
    'acabado': 'Rugosidad',
    'colores': 'Colores',
    'color': 'Colores',
    'género': 'Género',
    'genero': 'Género',
    'sexo': 'Género',
}


def normalize_spec_name(key: str) -> str:
    """
    Normalize spec key to standard Spanish name.
    
    Args:
        key: Original spec key from scraper
        
    Returns:
        Standardized spec key name
    """
    key_lower = key.lower().strip().replace(':', '')
    return SPEC_NAME_MAP.get(key_lower, key.strip())


def normalize_spec_value(key: str, value: str) -> str:
    """
    Normalize spec values for consistency.
    
    Args:
        key: Spec key (normalized)
        value: Original value
        
    Returns:
        Normalized value
    """
    if not value: 
        return value
    
    value = value.strip()
    key_lower = key.lower()
    
    # Forma normalization
    if 'forma' in key_lower:
        value_lower = value.lower()
        if 'lagrima' in value_lower or 'lágrima' in value_lower or 'tear' in value_lower or 'gota' in value_lower:
            return 'Lágrima'
        elif 'redonda' in value_lower or 'round' in value_lower:
            return 'Redonda'
        elif 'diamante' in value_lower or 'diamond' in value_lower:
            return 'Diamante'
        elif 'híbrida' in value_lower or 'hibrida' in value_lower:
            return 'Híbrida'
    
    # Balance normalization
    if 'balance' in key_lower:
        value_lower = value.lower()
        if 'alto' in value_lower or 'high' in value_lower:
            return 'Alto'
        elif 'medio' in value_lower or 'medium' in value_lower:
            return 'Medio'
        elif 'bajo' in value_lower or 'low' in value_lower:
            return 'Bajo'
    
    # Núcleo normalization
    if 'núcleo' in key_lower or 'goma' in key_lower:
        # Standardize EVA capitalization
        if 'eva' in value.lower():
            return value.replace('eva', 'EVA').replace('Eva', 'EVA')
        elif 'foam' in value.lower():
            return value.replace('foam', 'Foam').replace('FOAM', 'Foam')
    
    return value


def normalize_specs(specs: Dict[str, str]) -> Dict[str, str]:
    """
    Normalize all specs in a dictionary.
    
    Args:
        specs: Original specs dictionary
        
    Returns:
        Normalized specs dictionary with standard keys and values
    """
    normalized = {}
    for key, value in specs.items():
        norm_key = normalize_spec_name(key)
        norm_value = normalize_spec_value(norm_key, value)
        # Skip 'Marca' as it's a separate field
        if norm_key.lower() != 'marca':
            normalized[norm_key] = norm_value
    return normalized


# ============================================================================
# End of Shared Utilities
# ============================================================================


class Product:
    """Represents a scraped product with all its attributes."""

    def __init__(
        self,
        url: str,
        name: str,
        price: float,
        brand: str,
        image: str,
        specs: Dict[str, str],
        original_price: Optional[float] = None,
        description: Optional[str] = None,
        images: Optional[List[str]] = None
    ):
        self.url = url
        self.name = name
        self.price = price
        self.original_price = original_price
        self.brand = brand
        self.image = image
        self.images = images or [image] if image else []
        self.specs = specs
        self.description = description

    def to_dict(self) -> dict:
        """Convert product to dictionary."""
        return {
            "url": self.url,
            "name": self.name,
            "price": self.price,
            "originalPrice": self.original_price,
            "brand": self.brand,
            "brand": self.brand,
            "image": self.image,
            "images": self.images,
            "specs": self.specs,
            "description": self.description
        }


class BaseScraper(ABC):
    """Abstract base class for all scrapers."""

    def __init__(self):
        self.browser: Optional[Browser] = None
        self.context: Optional[BrowserContext] = None
        self.page: Optional[Page] = None
        self.playwright = None

    async def init(self):
        """Initialize the browser with Spanish locale settings."""
        if not self.browser:
            self.playwright = await async_playwright().start()
            self.browser = await self.playwright.chromium.launch(headless=True)
            self.context = await self.browser.new_context(
                user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                viewport={'width': 1920, 'height': 1080},
                locale='es-ES'
            )
            self.page = await self.context.new_page()

    async def close(self):
        """Close the browser and cleanup resources."""
        if self.browser:
            await self.browser.close()
            self.browser = None
            self.context = None
            self.page = None
        if self.playwright:
            await self.playwright.stop()
            self.playwright = None

    async def get_page(self, url: str) -> Page:
        """Get or navigate to a specific page."""
        if not self.page:
            await self.init()

        if self.page.url != url:
            await self.page.goto(url, wait_until='domcontentloaded', timeout=30000)

        return self.page

    async def safe_get_text(self, selector: str, timeout: int = 1000) -> str:
        """Safely extract text from an element."""
        if not self.page: return ""
        try:
            element = await self.page.query_selector(selector)
            if element:
                return (await element.inner_text()).strip()
        except:
            pass
        return ""

    async def safe_get_attribute(self, selector: str, attr: str, timeout: int = 1000) -> str:
        """Safely extract an attribute from an element."""
        if not self.page: return ""
        try:
            element = await self.page.query_selector(selector)
            if element:
                val = await element.get_attribute(attr)
                return val.strip() if val else ""
        except:
            pass
        return ""

    @abstractmethod
    async def scrape_product(self, url: str) -> Product:
        """Scrape a product from the given URL. Must be implemented by subclasses."""
        pass

    @abstractmethod
    async def scrape_category(self, url: str) -> List[str]:
        """Scrape product URLs from a category page. Must be implemented by subclasses."""
        pass
