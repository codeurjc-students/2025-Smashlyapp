import json
import os
import re
import unicodedata
from datetime import datetime
from urllib.parse import urlparse, parse_qs, urlencode, urlunparse
from typing import Dict, List, Optional, Any
from thefuzz import fuzz

class RacketManager:
    """Manages the centralized rackets database with rigorous deduplication."""

    def __init__(self, db_path: str = "rackets.json"):
        self.db_path = db_path
        self.data: Dict[str, Any] = self._load_db()
        self.url_map: Dict[str, str] = self._build_url_map()

    def _load_db(self) -> Dict[str, Any]:
        if os.path.exists(self.db_path):
            try:
                with open(self.db_path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except json.JSONDecodeError:
                return {}
        return {}
    
    def _build_url_map(self) -> Dict[str, str]:
        mapping = {}
        for slug, racket in self.data.items():
            for price_entry in racket.get("prices", []):
                if "url" in price_entry:
                     mapping[price_entry["url"]] = slug
        return mapping

    def save_db(self):
        with open(self.db_path, "w", encoding="utf-8") as f:
            json.dump(self.data, f, indent=4, ensure_ascii=False)
        self.url_map = self._build_url_map()

    def _slugify(self, text: str) -> str:
        text = str(text).lower()
        text = unicodedata.normalize('NFKD', text).encode('ascii', 'ignore').decode('utf-8')
        text = re.sub(r'[^\w\s-]', '', text)
        text = re.sub(r'[-\s]+', '-', text).strip('-')
        return text

    @staticmethod
    def _optimize_image_url(url: str) -> str:
        """Optimize image URL for maximum quality and standard protocol."""
        if not url: return url
        if url.startswith('//'): url = f'https:{url}'
        
        parsed = urlparse(url)
        # Shopify cleanup
        if 'shopify.com' in parsed.netloc or 'cdn.shopify.com' in parsed.netloc:
            path = re.sub(r'_(\d+x\d*|\d*x\d+)(?:_crop_center)?(?=\.)', '', parsed.path)
            params = parse_qs(parsed.query)
            clean_params = {'v': params['v'][0]} if 'v' in params else {}
            return urlunparse((parsed.scheme, parsed.netloc, path, parsed.params, urlencode(clean_params), parsed.fragment))
        
        # Magento/PadelNuestro cleanup
        if 'padelnuestro.com' in parsed.netloc:
            return urlunparse((parsed.scheme, parsed.netloc, parsed.path, parsed.params, '', parsed.fragment))
        
        return url

    def _normalize_name_for_comparison(self, name: str) -> str:
        """Deep cleaning for fuzzy comparison."""
        name = name.lower()
        # Remove years explicitly to compare base model names
        name = re.sub(r'\b202[0-9]\b', '', name)
        ignore = ['pala', 'padel', 'racket', 'de', 'para']
        for word in ignore:
            name = name.replace(word, '')
        name = re.sub(r'[^\w\s]', '', name)
        return name.strip()

    # =========================================================================
    # CORE DEDUPLICATION LOGIC (The "Fingerprint" Algorithm)
    # =========================================================================

    def _extract_features(self, name: str) -> dict:
        """Extracts immutable features for strict filtering."""
        name_lower = name.lower()
        
        # 1. Year Detection (Crucial)
        year_match = re.search(r'\b(202[3-7])\b', name_lower)
        year = year_match.group(1) if year_match else None

        # 2. Critical Suffixes (Discriminators)
        critical_suffixes = [
            "woman", "w", "light", "lite", "air", "junior", "jr", 
            "hybrid", "ctrl", "control", "attack", "comfort", "cmf", "master",
            "limited", "ltd", "pro", "team", "elite", "flow"
        ]
        # Check as whole words or suffixes
        found_suffixes = {s for s in critical_suffixes if f" {s} " in f" {name_lower} " or f"-{s}" in name_lower}

        # 3. Material/K-Factor (e.g., 12k vs 18k)
        k_factor = re.search(r'\b(\d{1,2}[kK])\b', name_lower)
        material_k = k_factor.group(1).lower() if k_factor else None

        return {
            "year": year,
            "suffixes": found_suffixes,
            "material_k": material_k,
            "clean_name": self._normalize_name_for_comparison(name)
        }

    def _are_compatible(self, f_a: dict, f_b: dict) -> bool:
        """Returns False if features have hard conflicts."""
        # Conflict 1: Different Years
        if f_a['year'] and f_b['year'] and f_a['year'] != f_b['year']:
            return False
        
        # Conflict 2: Different Suffixes (Symmetric Difference)
        # Allows fuzzy match only if suffixes are identical
        if f_a['suffixes'] != f_b['suffixes']:
            return False

        # Conflict 3: Different Material (12k vs 18k)
        if f_a['material_k'] and f_b['material_k'] and f_a['material_k'] != f_b['material_k']:
            return False

        return True

    def merge_product(self, product: Any, store_name: str):
        """Merge product with rigorous checks."""
        p_dict = product.model_dump() if hasattr(product, 'model_dump') else product.to_dict()
        p_name = p_dict.get('name', '')
        p_brand = p_dict.get('brand', 'Unknown')
        p_url = p_dict.get('url', '')

        # 0. STRICT FILTER: Exclude Packs/Bundles
        forbidden_terms = ['pack', 'duo', 'conjunto', 'oferta', '+', 'mochila', 'paletero', 'zapatillas']
        if any(term in p_name.lower() for term in forbidden_terms):
            # print(f"Skipping Bundle: {p_name}")
            return

        slug = None
        
        # 1. Exact URL Match (Fastest & Safest)
        if p_url in self.url_map:
            slug = self.url_map[p_url]
        
        # 2. Hybrid Fingerprint + Fuzzy Match
        if not slug:
            input_features = self._extract_features(p_name)
            best_score = 0
            best_match_slug = None
            
            for existing_slug, data in self.data.items():
                # Filter A: Brand must match exactly (normalized)
                if data.get('brand', '').lower() != p_brand.lower():
                    continue
                
                existing_features = self._extract_features(data['model'])

                # Filter B: Hard Compatibility Check
                if not self._are_compatible(input_features, existing_features):
                    continue

                # Filter C: Fuzzy Match on cleaned name
                score = fuzz.token_sort_ratio(input_features['clean_name'], existing_features['clean_name'])
                
                # Bonus: Exact year match increases confidence
                if input_features['year'] and input_features['year'] == existing_features['year']:
                    score += 5

                # Threshold: High (88) to prevent false positives
                if score > 88:
                    if score > best_score:
                        best_score = score
                        best_match_slug = existing_slug
            
            if best_match_slug:
                slug = best_match_slug
                # Update Master Name if new input has better data (e.g., has year)
                existing_data = self.data[slug]
                if input_features['year'] and not self._extract_features(existing_data['model'])['year']:
                    print(f"Updating Model Name: {existing_data['model']} -> {p_name}")
                    existing_data['model'] = p_name

        # 3. Create New Entry
        if not slug:
            # Include year in slug if available
            base = f"{p_brand}-{p_name}"
            slug = self._slugify(base)
            counter = 1
            original_slug = slug
            while slug in self.data:
                slug = f"{original_slug}-{counter}"
                counter += 1
            
            print(f"New Racket: {p_name} [{slug}]")
            self.data[slug] = {
                "id": slug,
                "brand": p_brand,
                "model": p_name,
                "description": p_dict.get('description', ''),
                "specs": {},
                "images": [],
                "prices": []
            }
        
        racket_entry = self.data[slug]
        self.url_map[p_url] = slug

        # 4. Merge Specs (Only fill missing)
        for key, value in p_dict.get('specs', {}).items():
            curr_val = racket_entry["specs"].get(key)
            # Prefer non-unknown values
            if not curr_val or (curr_val == "Desconocido" and value != "Desconocido"):
                racket_entry["specs"][key] = value

        # 5. Merge Images (Optimize)
        new_imgs = p_dict.get('images') or []
        if p_dict.get('image') and p_dict.get('image') not in new_imgs:
            new_imgs.insert(0, p_dict.get('image'))
        
        # Add optimized images if not present
        current_imgs = set(racket_entry["images"])
        for img in new_imgs:
            opt_img = self._optimize_image_url(img)
            if opt_img and opt_img not in current_imgs:
                racket_entry["images"].append(opt_img)
                current_imgs.add(opt_img) # Local tracking

        # 6. Update Price
        store_entry = next((item for item in racket_entry["prices"] if item["store"] == store_name), None)
        now = datetime.now().isoformat()
        
        if store_entry:
            store_entry["price"] = p_dict.get('price')
            store_entry["url"] = p_url
            store_entry["last_updated"] = now
            if p_dict.get('original_price'):
                 store_entry["original_price"] = p_dict.get('original_price')
        else:
            racket_entry["prices"].append({
                "store": store_name,
                "price": p_dict.get('price'),
                "original_price": p_dict.get('original_price'),
                "url": p_url,
                "currency": "EUR",
                "last_updated": now
            })

        self.save_db()