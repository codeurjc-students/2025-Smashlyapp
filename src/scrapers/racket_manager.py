
import json
import os
import re
import unicodedata
from datetime import datetime
from typing import Dict, List, Optional, Any
from .base_scraper import Product
from thefuzz import fuzz

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

    def _normalize_name_for_comparison(self, name: str) -> str:
        """
        Normalize name for fuzzy comparison:
        - Remove year (2023, 2024)
        - Remove generic words
        - Lowercase
        """
        name = name.lower()
        # Remove years
        name = re.sub(r'\b202[0-9]\b', '', name)
        # Remove common words
        ignore = ['pala', 'padel', 'racket', 'pro', 'ultra', 'team'] 
        # (Be careful with removing 'pro', 'team' as they distinguish models... 
        # actually let's keep them, just remove 'pala', 'padel', 'racket')
        ignore = ['pala', 'padel', 'racket']
        for word in ignore:
            name = name.replace(word, '')
        
        # Remove special chars
        name = re.sub(r'[^\w\s]', '', name)
        return name.strip()

    def merge_product(self, product: Any, store_name: str):
        """
        Merge a scraped product into the database with fuzzy duplication check.
        accepts Product or RacketProduct
        """
        # Convert to dictionary if it's a model
        if hasattr(product, 'model_dump'):
            p_dict = product.model_dump()
        else:
             # Fallback for legacy Product object
             p_dict = product.to_dict()

        # Simplify access
        p_url = p_dict.get('url')
        p_name = p_dict.get('name')
        p_brand = p_dict.get('brand')
        p_price = p_dict.get('price')
        p_original_price = p_dict.get('original_price')
        p_description = p_dict.get('description')
        p_specs = p_dict.get('specs') or {}
        p_images = p_dict.get('images') or []
        if p_dict.get('image') and p_dict.get('image') not in p_images:
            p_images.insert(0, p_dict.get('image'))

        slug = None
        
        # 1. Exact URL Match
        if p_url in self.url_map:
            slug = self.url_map[p_url]
            # print(f"Found existing racket by URL: {slug}")
        
        # 2. Fuzzy Name Match (only if brand matches)
        if not slug:
            best_score = 0
            best_match_slug = None
            
            normalized_input_name = self._normalize_name_for_comparison(p_name)
            
            for existing_slug, data in self.data.items():
                # Check Brand First (Strict)
                if data.get('brand', '').lower() != p_brand.lower():
                    continue
                
                existing_name = data.get('model', '')
                normalized_existing_name = self._normalize_name_for_comparison(existing_name)
                
                # Use token_sort_ratio to handle word order ("Pro Gravity" vs "Gravity Pro")
                score = fuzz.token_sort_ratio(normalized_input_name, normalized_existing_name)
                
                if score > 85: # Threshold
                    if score > best_score:
                        best_score = score
                        best_match_slug = existing_slug
            
            if best_match_slug:
                print(f"Fuzzy match! '{p_name}' -> '{self.data[best_match_slug]['model']}' (Score: {best_score})")
                slug = best_match_slug

        # 3. Create New if no match
        if not slug:
            slug = self._slugify(f"{p_brand}-{p_name}")
            # Ensure unique slug
            base_slug = slug
            counter = 1
            while slug in self.data:
                slug = f"{base_slug}-{counter}"
                counter += 1
            
            print(f"New racket found: {p_name} (ID: {slug})")
            self.data[slug] = {
                "id": slug,
                "brand": p_brand,
                "model": p_name,
                "description": p_description or "",
                "specs": {},
                "images": [],
                "prices": []
            }
        
        racket_entry = self.data[slug]
        
        # Update URL map
        self.url_map[p_url] = slug

        # 4. Merge Specs
        for key, value in p_specs.items():
            # Only update if missing or empty
            # Normalize keys if needed? For now assume scraper does partial norm
            curr_val = racket_entry["specs"].get(key)
            if not curr_val or (curr_val == "Desconocido" and value != "Desconocido"):
                racket_entry["specs"][key] = value

        # 5. Merge Images
        # Add any new images not present
        current_images = set(racket_entry["images"])
        for img in p_images:
            if img and img not in current_images:
                racket_entry["images"].append(img)
                current_images.add(img)

        # 6. Update Price / Store Info
        store_entry = next((item for item in racket_entry["prices"] if item["store"] == store_name), None)
        
        now = datetime.now().isoformat()
        
        if store_entry:
            store_entry["price"] = p_price
            store_entry["url"] = p_url
            store_entry["last_updated"] = now
            if p_original_price:
                 store_entry["original_price"] = p_original_price
        else:
            racket_entry["prices"].append({
                "store": store_name,
                "price": p_price,
                "original_price": p_original_price,
                "url": p_url,
                "currency": "EUR",
                "last_updated": now
            })

        self.save_db()
