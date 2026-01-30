from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field, HttpUrl, validator, field_validator
import re

class RacketProduct(BaseModel):
    """
    Strict validation model for a scraped racket.
    Ensures that only high-quality data enters the system.
    """
    url: str
    name: str = Field(..., min_length=3, description="Full name of the racket")
    brand: str = Field(..., min_length=2, description="Brand name")
    price: float = Field(..., gt=0, description="Current price")
    original_price: Optional[float] = None
    image: str = Field(..., description="Main image URL")
    images: List[str] = Field(default_factory=list)
    specs: Dict[str, str] = Field(default_factory=dict)
    description: Optional[str] = None
    
    @field_validator('name')
    def name_must_be_meaningful(cls, v):
        if not v or v.strip() == "":
             raise ValueError("Name cannot be empty")
        return v.strip()

    @field_validator('brand')
    def normalize_brand(cls, v):
        # Basic normalization
        v = v.strip().title()
        # Common fixes
        replacements = {
            "Head Padel": "Head",
            "Nox Padel": "Nox",
            "Adidas Padel": "Adidas",
            "Bullpadel 2024": "Bullpadel",
            "Bullpadel 2025": "Bullpadel"
        }
        return replacements.get(v, v)

    @field_validator('price', 'original_price', mode='before')
    def parse_price(cls, v):
        if isinstance(v, str):
            # Remove currency symbols and standardize decimal
            clean_token = re.sub(r'[^\d.,]', '', v)
            clean_token = clean_token.replace('.', '').replace(',', '.')
            try:
                return float(clean_token)
            except ValueError:
                return 0.0
        return v
    
    @field_validator('images', mode='before')
    def ensure_list(cls, v):
        if v is None:
            return []
        return v

    def to_dict(self) -> dict:
        return self.model_dump()
