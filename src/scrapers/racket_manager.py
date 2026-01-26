
import json
import os
import re
import unicodedata
from datetime import datetime
from typing import Dict, List, Optional, Any
from .base_scraper import Product

class RacketManager:
    """Manages the centralized rackets database."""

    def __init__(self, db_path: str = "rackets.json"):
        self.db_path = db_path
        self.data: Dict[str, Any] = self._load_db()

    def _load_db(self) -> Dict[str, Any]:
        """Load the database from disk."""
        if os.path.exists(self.db_path):
            try:
                with open(self.db_path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except json.JSONDecodeError:
                print(f"Error reading {self.db_path}, starting fresh.")
                return {}
        return {}

    def save_db(self):
        """Save the database to disk."""
        with open(self.db_path, "w", encoding="utf-8") as f:
            json.dump(self.data, f, indent=4, ensure_ascii=False)

    def _slugify(self, text: str) -> str:
        """Create a slug from text."""
        text = str(text).lower()
        text = unicodedata.normalize('NFKD', text).encode('ascii', 'ignore').decode('utf-8')
        text = re.sub(r'[^\w\s-]', '', text)
        text = re.sub(r'[-\s]+', '-', text).strip('-')
        return text

    def merge_product(self, product: Product, store_name: str):
        """Merge a scraped product into the database."""
        
        # Normalize name to generate slug (ID)
        # Try to find existing match by fuzzy name or exact slug
        slug = self._slugify(f"{product.brand}-{product.name}")
        
        # Check if exists (could improve matching logic here)
        if slug not in self.data:
            print(f"New racket found: {product.name}")
            self.data[slug] = {
                "id": slug,
                "brand": product.brand,
                "model": product.name,
                "description": product.description or "",
                "specs": {},
                "images": [],
                "prices": []
            }
        
        racket_entry = self.data[slug]
        
        # 1. Update Specs (Merge new keys, overwrite if better? For now just fill missing)
        for key, value in product.specs.items():
            # Normalize keys if needed (e.g. 'Peso' -> 'weight')
            # For now, keep as scraped
            if key not in racket_entry["specs"] or not racket_entry["specs"][key]:
                racket_entry["specs"][key] = value

        # 2. Handle Images
        # "Que extraiga todas las imágenes disponibles de la primera tienda que este extrayendo dicha pala por primera vez" "Si la pala ya esta extraida lo unico que tiene que hacer es actualizar los campos faltantes"
        # Logic: If we have no images, take them all. If we have images, do nothing (preserve first store's images).
        # Note: product.image in base_scraper is a single string. We should update base_scraper to support list of images.
        # Check if product has 'images' attribute (list) or just 'image'
        new_images = getattr(product, 'images', [])
        if not new_images and product.image:
             new_images = [product.image]
             
        if not racket_entry["images"] and new_images:
            racket_entry["images"] = new_images
            print(f"Added {len(new_images)} images for {slug}")

        # 3. Update Price / Store Info
        # Check if store entry exists
        store_entry = next((item for item in racket_entry["prices"] if item["store"] == store_name), None)
        
        now = datetime.now().isoformat()
        
        if store_entry:
            store_entry["price"] = product.price
            store_entry["url"] = product.url
            store_entry["last_updated"] = now
            # Update original price if available
            if product.original_price:
                 store_entry["original_price"] = product.original_price
        else:
            racket_entry["prices"].append({
                "store": store_name,
                "price": product.price,
                "original_price": product.original_price,
                "url": product.url,
                "currency": "EUR", # Assumption
                "last_updated": now
            })

        self.save_db()
