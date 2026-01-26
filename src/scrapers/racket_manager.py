
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
        self.url_map: Dict[str, str] = self._build_url_map()

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
    
    def _build_url_map(self) -> Dict[str, str]:
        """Build a map of URL -> slug for fast lookups."""
        mapping = {}
        for slug, racket in self.data.items():
            for price_entry in racket.get("prices", []):
                if "url" in price_entry:
                     mapping[price_entry["url"]] = slug
        return mapping

    def save_db(self):
        """Save the database to disk."""
        with open(self.db_path, "w", encoding="utf-8") as f:
            json.dump(self.data, f, indent=4, ensure_ascii=False)
        # Rebuild map after save to ensure sync (optional but safe)
        self.url_map = self._build_url_map()

    def _slugify(self, text: str) -> str:
        """Create a slug from text."""
        text = str(text).lower()
        text = unicodedata.normalize('NFKD', text).encode('ascii', 'ignore').decode('utf-8')
        text = re.sub(r'[^\w\s-]', '', text)
        text = re.sub(r'[-\s]+', '-', text).strip('-')
        return text

    def merge_product(self, product: Product, store_name: str):
        """Merge a scraped product into the database."""
        
        slug = None
        
        # 1. Try to find by URL first (Best match)
        if product.url in self.url_map:
            slug = self.url_map[product.url]
            # print(f"Found existing racket by URL: {slug}")
        
        # 2. If not found by URL, try slug generation (Fallback or New)
        if not slug:
             slug = self._slugify(f"{product.brand}-{product.name}")
        
        # 3. Check if exists in data (could correspond to slug generated above)
        if slug not in self.data:
            print(f"New racket found: {product.name} (ID: {slug})")
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
        
        # Update URL map for this product
        self.url_map[product.url] = slug

        # 4. Update Specs (Merge new keys)
        for key, value in product.specs.items():
            if key not in racket_entry["specs"] or not racket_entry["specs"][key]:
                racket_entry["specs"][key] = value

        # 5. Handle Images (Keep existing logic: prioritize first found, but could be improved)
        new_images = getattr(product, 'images', [])
        if not new_images and product.image:
             new_images = [product.image]
             
        if not racket_entry["images"] and new_images:
            racket_entry["images"] = new_images
            # print(f"Added {len(new_images)} images for {slug}")

        # 6. Update Price / Store Info
        store_entry = next((item for item in racket_entry["prices"] if item["store"] == store_name), None)
        
        now = datetime.now().isoformat()
        
        if store_entry:
            store_entry["price"] = product.price
            store_entry["url"] = product.url # Setup/Ensure URL is current
            store_entry["last_updated"] = now
            if product.original_price:
                 store_entry["original_price"] = product.original_price
        else:
            racket_entry["prices"].append({
                "store": store_name,
                "price": product.price,
                "original_price": product.original_price,
                "url": product.url,
                "currency": "EUR",
                "last_updated": now
            })

        self.save_db()
