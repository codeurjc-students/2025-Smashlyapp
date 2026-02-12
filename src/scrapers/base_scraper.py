from abc import ABC, abstractmethod
from typing import Dict, Optional, List
from playwright.async_api import async_playwright, Browser, Page, BrowserContext
import asyncio
import re


# ============================================================================
# Shared Utility Functions
# ============================================================================

def clean_price(text: str) -> float:
    """Parse price from text with automatic format detection."""
    if not text: 
        return 0.0
    
    text = text.replace('€', '').replace('EUR', '').replace('&nbsp;', '').replace(' ', '').strip()
    
    if ',' in text and '.' in text:
        text = text.replace('.', '').replace(',', '.')
    elif ',' in text:
        text = text.replace(',', '.')
    
    try:
        match = re.search(r'[\d.]+', text)
        if match:
            price = float(match.group(0))
            # Fix cents format (e.g., 14995 -> 149.95)
            if '.' not in text and ',' not in text:
                if 1000 <= price < 100000:
                    price = price / 100.0
            return price
        return 0.0
    except ValueError:
        return 0.0

SPEC_NAME_MAP = {
    'forma': 'Forma', 'format': 'Forma', 'shape': 'Forma', 'formato': 'Forma',
    'peso': 'Peso', 'weight': 'Peso', 'talla-peso': 'Peso',
    'balance': 'Balance', 'balanceo': 'Balance',
    'núcleo': 'Núcleo', 'nucleo': 'Núcleo', 'goma': 'Núcleo', 'foam': 'Núcleo', 'core': 'Núcleo',
    'cara': 'Cara', 'caras': 'Cara', 'material': 'Cara', 'fibra': 'Cara', 'surface': 'Cara', 'material cara': 'Cara',
    'marco': 'Marco', 'frame': 'Marco',
    'nivel': 'Nivel', 'level': 'Nivel', 'nivel de juego': 'Nivel',
    'perfil': 'Perfil', 'grosor': 'Perfil', 'espesor': 'Perfil',
    'rugosidad': 'Rugosidad', 'superficie': 'Rugosidad', 'acabado': 'Rugosidad',
    'colores': 'Colores', 'color': 'Colores',
    'género': 'Género', 'genero': 'Género', 'sexo': 'Género',
}

def normalize_spec_name(key: str) -> str:
    key_lower = key.lower().strip().replace(':', '')
    return SPEC_NAME_MAP.get(key_lower, key.strip())

def normalize_spec_value(key: str, value: str) -> str:
    if not value: return value
    value = value.strip()
    key_lower = key.lower()
    
    # Normalización de Forma
    if 'forma' in key_lower:
        val_l = value.lower()
        if any(x in val_l for x in ['lagrima', 'lágrima', 'tear', 'gota']): return 'Lágrima'
        if any(x in val_l for x in ['redonda', 'round']): return 'Redonda'
        if any(x in val_l for x in ['diamante', 'diamond']): return 'Diamante'
        if any(x in val_l for x in ['híbrida', 'hibrida']): return 'Híbrida'
    
    # Normalización de Balance
    if 'balance' in key_lower:
        val_l = value.lower()
        if any(x in val_l for x in ['alto', 'high']): return 'Alto'
        if any(x in val_l for x in ['medio', 'medium']): return 'Medio'
        if any(x in val_l for x in ['bajo', 'low']): return 'Bajo'

    # Normalización de Peso (Estricta numérica)
    if 'peso' in key_lower:
        # Extraer todos los grupos de 3 dígitos
        nums = re.findall(r'\b\d{3}\b', value)
        if len(nums) >= 2:
            # Ordenar para asegurar min-max
            nums = sorted([int(n) for n in nums])
            return f"{nums[0]}-{nums[-1]} g"
        elif len(nums) == 1:
            return f"{nums[0]} g"
        # Si no hay números claros, devolver original limpio
        return value

    if 'núcleo' in key_lower or 'goma' in key_lower:
        if 'eva' in value.lower(): return value.replace('eva', 'EVA').replace('Eva', 'EVA')
        if 'foam' in value.lower(): return value.replace('foam', 'Foam').replace('FOAM', 'Foam')
    
    return value

def normalize_specs(specs: Dict[str, str]) -> Dict[str, str]:
    normalized = {}
    for key, value in specs.items():
        norm_key = normalize_spec_name(key)
        norm_value = normalize_spec_value(norm_key, value)
        if norm_key.lower() != 'marca':
            normalized[norm_key] = norm_value
    return normalized


# ============================================================================
# Product & BaseScraper
# ============================================================================

class Product:
    def __init__(self, url: str, name: str, price: float, brand: str, image: str, 
                 specs: Dict[str, str], original_price: Optional[float] = None, 
                 description: Optional[str] = None, images: Optional[List[str]] = None):
        self.url = url
        self.name = name
        self.price = price
        self.original_price = original_price
        self.brand = brand
        self.image = image
        self.images = images or ([image] if image else [])
        self.specs = specs
        self.description = description

    def to_dict(self) -> dict:
        return {
            "url": self.url, "name": self.name, "price": self.price,
            "original_price": self.original_price, "brand": self.brand,
            "image": self.image, "images": self.images, "specs": self.specs,
            "description": self.description
        }

class BaseScraper(ABC):
    def __init__(self):
        self.browser: Optional[Browser] = None
        self.context: Optional[BrowserContext] = None
        self.page: Optional[Page] = None
        self.playwright = None

    async def init(self):
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
        if self.browser:
            await self.browser.close()
            self.browser = None
            self.context = None
            self.page = None
        if self.playwright:
            await self.playwright.stop()
            self.playwright = None

    async def get_page(self, url: str) -> Page:
        if not self.page: await self.init()
        if self.page.url != url:
            await self.page.goto(url, wait_until='domcontentloaded', timeout=30000)
        return self.page

    async def safe_get_text(self, selector: str, timeout: int = 1000) -> str:
        if not self.page: return ""
        try:
            element = await self.page.query_selector(selector)
            return (await element.inner_text()).strip() if element else ""
        except: return ""

    async def safe_get_attribute(self, selector: str, attr: str, timeout: int = 1000) -> str:
        if not self.page: return ""
        try:
            element = await self.page.query_selector(selector)
            val = await element.get_attribute(attr)
            return val.strip() if val else ""
        except: return ""

    @abstractmethod
    async def scrape_product(self, url: str) -> Product: pass

    @abstractmethod
    async def scrape_category(self, url: str) -> List[str]: pass