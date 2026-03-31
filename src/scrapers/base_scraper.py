from abc import ABC, abstractmethod
from typing import Dict, Optional, List
import re
import urllib.request
import ssl

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
        val_l = value.lower().strip()
        if any(x in val_l for x in ['lagrima', 'lágrima', 'tear', 'gota']): return 'Lágrima'
        if any(x in val_l for x in ['diamante', 'diamond']):                  return 'Diamante'
        if any(x in val_l for x in ['redonda', 'redondo', 'round']):          return 'Redonda'
        if any(x in val_l for x in ['híbrida', 'hibrida', 'hibrido', 'hybrid']): return 'Híbrida'
        # Rechazar valores claramente inválidos para Forma
        invalid = {'rugoso', 'rugosa', 'mate', 'brillo', 'relieve', 'arenoso'}
        if val_l in invalid or len(val_l) <= 2:
            return ''   # Se descartará en normalize_specs si está vacío
        return value.strip()

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
        # Descartar entradas inválidas: vacías, demasiado cortas (≤2 chars), o clave 'Marca'
        if norm_key.lower() == 'marca':
            continue
        if not norm_value or len(norm_value.strip()) <= 2:
            continue
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
    """
    Base class for all scrapers. 
    Removed Playwright dependency as current scrapers use HTTP/urllib.
    """
    def __init__(self):
        self.user_agent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'

    async def init(self):
        """No-op for compatibility."""
        pass

    async def close(self):
        """No-op for compatibility."""
        pass

    @abstractmethod
    async def scrape_product(self, url: str) -> Optional[Product]: 
        pass

    @abstractmethod
    async def scrape_category(self, url: str) -> List[str]: 
        pass