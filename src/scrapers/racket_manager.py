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
        """Optimize image URL for maximum quality."""
        if not url: return url
        if url.startswith('//'): url = f'https:{url}'
        parsed = urlparse(url)
        
        # Shopify cleanup
        if 'shopify.com' in parsed.netloc or 'cdn.shopify.com' in parsed.netloc:
            path = re.sub(r'_(\d+x\d*|\d*x\d+)(?:_crop_center)?(?=\.)', '', parsed.path)
            params = parse_qs(parsed.query)
            clean_params = {'v': params['v'][0]} if 'v' in params else {}
            return urlunparse((parsed.scheme, parsed.netloc, path, parsed.params, urlencode(clean_params), parsed.fragment))
        
        # Magento cleanup
        if 'padelnuestro.com' in parsed.netloc:
            return urlunparse((parsed.scheme, parsed.netloc, parsed.path, parsed.params, '', parsed.fragment))
        
        return url

    def _detect_brand_from_name(self, name: str) -> str:
        """Helper to rescue Unknown brands."""
        name_upper = name.upper()
        # Lista de marcas prioritarias (primero las compuestas)
        brands = [
            'DROP SHOT', 'BLACK CROWN', 'ROYAL PADEL', 'STAR VIE', 'ADIDAS', 
            'BULLPADEL', 'NOX', 'HEAD', 'BABOLAT', 'SIUX', 'WILSON', 'VARLION',
            'KUIKMA', 'OXYDOG', 'VIBOR-A', 'LOK', 'ENEBE', 'JOMA'
        ]
        for brand in brands:
            if brand in name_upper:
                return brand.title() if brand != 'ADIDAS' else 'Adidas' # Case specific
        return "Unknown"

    def _normalize_name_for_comparison(self, name: str) -> str:
        """Deep cleaning removing noise like player names and punctuation."""
        name = name.lower()
        
        # 1. Remove Years
        name = re.sub(r'\b202[0-9]\b', '', name)
        
        # 2. Remove Common Filler Words
        ignore_words = ['pala', 'padel', 'racket', 'de', 'para', 'la', 'el']
        for word in ignore_words:
            name = name.replace(word, '')
            
        # 3. Remove Player Names (NOISE REDUCTION)
        # Esto es crucial para que "Jon Sanz" no rompa el match
        players = [
            'jon sanz', 'paquito', 'navarro', 'lebron', 'galan', 'tapia', 'coello', 
            'chingotto', 'stupa', 'di nenno', 'sanyo', 'bela', 'belasteguin', 
            'momo', 'alex ruiz', 'tello', 'yanguas', 'garrido', 'ari sanchez', 
            'paulita', 'josemaria', 'triay', 'salazar', 'bea gonzalez', 'martita', 'ortega'
        ]
        for player in players:
            name = name.replace(player, '')

        # 4. Handle Versions (1.0 -> 10, but keep consistent)
        # remove decimals to treat 1.0 same as 1
        name = re.sub(r'\.0\b', '', name) 
        
        # 5. Remove special chars
        name = re.sub(r'[^\w\s]', '', name)
        
        return name.strip()

    # =========================================================================
    # CORE DEDUPLICATION LOGIC
    # =========================================================================

    def _extract_features(self, name: str) -> dict:
        name_lower = name.lower()
        
        # Year
        year_match = re.search(r'\b(202[3-7])\b', name_lower)
        year = year_match.group(1) if year_match else None

        # Suffixes
        critical_suffixes = [
            "woman", "w", "light", "lite", "air", "junior", "jr", 
            "hybrid", "ctrl", "control", "attack", "comfort", "cmf", "master",
            "limited", "ltd", "pro", "team", "elite", "flow",
            "12k", "18k", "24k", "3k", "carbon" # Treat materials as suffixes too for safety
        ]
        found_suffixes = {s for s in critical_suffixes if f" {s} " in f" {name_lower} " or f"-{s}" in name_lower}

        # Clean Name
        clean_name = self._normalize_name_for_comparison(name)

        return {
            "year": year,
            "suffixes": found_suffixes,
            "clean_name": clean_name
        }

    def _are_compatible(self, f_a: dict, f_b: dict) -> bool:
        # Conflict 1: Years
        if f_a['year'] and f_b['year'] and f_a['year'] != f_b['year']:
            return False
        
        # Conflict 2: Suffixes (Must match exactly if present)
        # Exception: If one set is empty and the other isn't, careful.
        # But for "Woman" vs "Normal", we want them separate.
        if f_a['suffixes'] != f_b['suffixes']:
            return False

        return True

    def merge_product(self, product: Any, store_name: str):
        """Merge product with rigorous checks and auto-correction."""
        p_dict = product.model_dump() if hasattr(product, 'model_dump') else product.to_dict()
        p_name = p_dict.get('name', '')
        p_brand = p_dict.get('brand', 'Unknown')
        p_url = p_dict.get('url', '')

        # 0. RESCUE UNKNOWN BRAND
        if p_brand == "Unknown" or p_brand == "":
            detected = self._detect_brand_from_name(p_name)
            if detected != "Unknown":
                print(f"Rescued Brand: {p_name} -> {detected}")
                p_brand = detected
                p_dict['brand'] = detected

        # 1. STRICT FILTER: Exclude Packs
        forbidden = ['pack', 'duo', 'conjunto', 'oferta', '+', 'mochila', 'paletero', 'zapatillas']
        if any(term in p_name.lower() for term in forbidden):
            return

        slug = None
        
        # 2. Exact URL Match
        if p_url in self.url_map:
            slug = self.url_map[p_url]
        
        # 3. Hybrid Fingerprint Match
        if not slug:
            input_features = self._extract_features(p_name)
            best_score = 0
            best_match_slug = None
            
            for existing_slug, data in self.data.items():
                # Filter A: Brand must match (normalized)
                existing_brand = data.get('brand', 'Unknown')
                
                # Fix for existing bad data in DB (e.g. "Unknown" in DB but real brand now)
                if existing_brand == "Unknown":
                    existing_brand = self._detect_brand_from_name(data['model'])
                
                if existing_brand.lower() != p_brand.lower():
                    continue
                
                existing_features = self._extract_features(data['model'])

                # Filter B: Hard Compatibility
                if not self._are_compatible(input_features, existing_features):
                    continue

                # Filter C: Fuzzy Match
                score = fuzz.token_sort_ratio(input_features['clean_name'], existing_features['clean_name'])
                
                if input_features['year'] and input_features['year'] == existing_features['year']:
                    score += 5

                # Threshold
                if score > 88:
                    if score > best_score:
                        best_score = score
                        best_match_slug = existing_slug
            
            if best_match_slug:
                slug = best_match_slug
                # Update Master Model Name if incoming is cleaner (heuristic: shorter is usually cleaner for masters)
                # But we prefer names with Year.
                existing_entry = self.data[slug]
                
                # Logic: If current has no year, but new one does, take new name.
                existing_feats = self._extract_features(existing_entry['model'])
                if not existing_feats['year'] and input_features['year']:
                     existing_entry['model'] = p_name
                # Logic: If both have year (or neither), prefer the one WITHOUT player name (cleaner)
                elif len(p_name) < len(existing_entry['model']):
                     # Simple heuristic: shorter often means less marketing fluff
                     pass 

        # 4. Create New Entry
        if not slug:
            # Clean "Unknown" from slug generation
            slug_brand = p_brand if p_brand != "Unknown" else "generic"
            base = f"{slug_brand}-{p_name}"
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

        # Force Brand update if it was Unknown before
        if racket_entry.get('brand') == "Unknown" and p_brand != "Unknown":
            racket_entry['brand'] = p_brand

        # 5. Merge Specs
        for key, value in p_dict.get('specs', {}).items():
            curr_val = racket_entry["specs"].get(key)
            if not curr_val or (curr_val == "Desconocido" and value != "Desconocido"):
                racket_entry["specs"][key] = value

        # 6. Merge Images
        new_imgs = p_dict.get('images') or []
        if p_dict.get('image') and p_dict.get('image') not in new_imgs:
            new_imgs.insert(0, p_dict.get('image'))
        
        current_imgs = set(racket_entry["images"])
        for img in new_imgs:
            opt_img = self._optimize_image_url(img)
            if opt_img and opt_img not in current_imgs:
                racket_entry["images"].append(opt_img)
                current_imgs.add(opt_img)

        # 7. Update Price
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

    def add_price_only(self, slug: str, store_name: str, price: float, 
                       original_price: float = None, url: str = "", currency: str = "EUR"):
        """
        Add or update a price entry for an existing racket.
        Used by the price finder when we already know which racket to update.
        Does NOT create new rackets or run matching logic.
        """
        if slug not in self.data:
            print(f"Warning: slug '{slug}' not found in database, skipping price update.")
            return
        
        racket_entry = self.data[slug]
        now = datetime.now().isoformat()
        
        # Find existing store entry
        store_entry = next((item for item in racket_entry["prices"] if item["store"] == store_name), None)
        
        price_data = {
            "store": store_name,
            "price": price,
            "original_price": original_price,
            "url": url,
            "currency": currency,
            "last_updated": now
        }
        
        if store_entry:
            store_entry.update(price_data)
        else:
            racket_entry["prices"].append(price_data)
        
        # Update url_map
        if url:
            self.url_map[url] = slug