import json
import re
import urllib.request
import ssl
import asyncio
from typing import Dict, List, Optional
from urllib.parse import urlparse
from .base_scraper import BaseScraper, Product, clean_price, normalize_specs


class PadelNuestroScraper(BaseScraper):
    """Scraper for PadelNuestro online store using GraphQL API."""

    # ── Magento option‑ID → human‑readable label mappings ──────────────
    _ATTR_OPTIONS: Dict[str, Dict[str, str]] = {
        "padelracket_balance": {
            "2181": "Alto", "2183": "Medio", "2182": "Bajo",
        },
        "padelracket_core": {
            "2651": "Black Eva HR3", "2652": "Black Eva HR9",
            "2184": "Black EVA", "2836": "Cloud EVA", "2785": "Comfort FOAM",
            "3267": "Custom EVA", "2657": "Dual Density",
            "3263": "EV25 Black Soft", "2654": "EVA",
            "2810": "EVA Pro High Density", "2807": "EVA Soft Performance",
            "3233": "Evalastic", "2760": "EVA 3XPly",
            "2761": "Eva High Memory", "2762": "EVA HR3",
            "3977": "EVA Mid Hard", "2789": "EVA PRO",
            "2780": "EVA PRO 50", "2781": "EVA Pro Touch",
            "2187": "EVA", "2782": "EVA SOFT 30",
            "2821": "EVA Soft Low Density", "2191": "Foam",
            "2185": "Hard EVA", "3128": "HR3",
            "3125": "HR3 Black EVA", "3122": "HR3 Core",
            "3260": "HR3 White EVA", "3200": "Koridion",
            "2186": "Medium EVA", "2649": "Mega Flex Core",
            "2577": "Multieva", "3236": "Polyglass",
            "2192": "Polietileno", "2769": "Power Blast EVA",
            "2786": "SC White EVA", "2188": "Soft EVA",
            "3971": "Soft Poly", "2189": "Supersoft EVA",
            "2763": "Super Flex", "2190": "Ultrasoft EVA",
            "2839": "X-EVA", "2771": "Xtend Carbon 3K",
        },
        "padelracket_face": {
            "2194": "Carbono", "2203": "Carbono + Grafeno",
            "2201": "Carbono 3K", "2195": "Carbono 12K",
            "2197": "Carbono 18K", "2199": "Carbono 21K",
            "2200": "Carbono 24K", "2193": "Aluminio + Carbono",
            "2204": "Fibra de Vidrio", "2206": "Grafeno",
            "2196": "Carbono 15K", "2198": "Carbono 1K",
            "2205": "Fibra de Lino", "2207": "Policarbonato",
            "2202": "Carbono 6K", "2578": "Fibrix",
            "2598": "Polietileno", "2623": "Carbono 16K",
            "2655": "Fibra de carbono", "2765": "Tricarbon",
            "2764": "Glaphite", "2783": "Basalto",
            "2813": "Carbon Flex", "2787": "Fiberflex",
            "2816": "White EVA", "2824": "Carbono 18K Textreme",
            "2833": "ElasticFiber", "2845": "Carbon Plain",
            "3058": "X Tend Carbon 3K", "3131": "Fiber Glass 3K",
            "3239": "Polyglass", "3270": "Amplitex 3K",
            "3974": "Fibertech", "3980": "X Tend Carbon 12K",
            "3983": "Soft Carbon",
        },
        "padelracket_format": {
            "2208": "Normal", "2209": "Oversize",
        },
        "padelracket_hardness": {
            "2210": "Dura", "2211": "Media", "2212": "Blanda",
        },
        "padelracket_level": {
            "2213": "Avanzado / Competición",
            "2214": "Principiante / Intermedio",
            "2215": "Profesional",
        },
        "padelracket_relief": {
            "2217": "Brillo", "2218": "Mate", "2216": "Relieve 3D",
            "2766": "Rugosa", "2219": "Arenoso",
        },
        "padelracket_shape": {
            "2220": "Beach Tennis", "2221": "Diamante",
            "2222": "Híbrida", "2223": "Pickleball",
            "2224": "Redonda", "2225": "Lágrima",
        },
        "padelracket_surface": {
            "2227": "Gomosa", "2226": "Lisa",
            "2228": "Rugosa", "2767": "Arenosa",
        },
        "padelrakect_player_type": {          # Note: typo in Magento schema
            "2230": "Control", "2229": "Polivalente", "2231": "Potencia",
        },
    }

    # Maps GraphQL field name → normalised spec key used in the Product
    _FIELD_TO_SPEC: Dict[str, str] = {
        "padelracket_balance": "Balance",
        "padelracket_core": "Núcleo",
        "padelracket_face": "Cara",
        "padelracket_format": "Formato",
        "padelracket_hardness": "Dureza",
        "padelracket_level": "Nivel",
        "padelracket_relief": "Acabado",
        "padelracket_shape": "Forma",
        "padelracket_surface": "Rugosidad",
        "padelrakect_player_type": "Tipo de Juego",
    }

    def _resolve_option(self, field: str, raw_value) -> Optional[str]:
        """Resolve a Magento numeric option‑ID to its label."""
        if raw_value is None:
            return None
        options = self._ATTR_OPTIONS.get(field, {})
        return options.get(str(raw_value))

    def _fetch_graphql(self, query: str) -> dict:
        """Execute a GraphQL query against PadelNuestro API (sync)."""
        data = json.dumps({"query": query}).encode("utf-8")
        req = urllib.request.Request(
            "https://www.padelnuestro.com/graphql",
            data=data,
            headers={
                "Content-Type": "application/json",
                "Store": "es",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            },
        )

        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE

        try:
            with urllib.request.urlopen(req, timeout=30, context=ctx) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                return data if data is not None else {}
        except Exception as e:
            print(f"[PadelNuestro] GraphQL Error: {e}")
            return {}

    def _parse_specs_from_html(self, body_html: str) -> Dict[str, str]:
        """Parse specs from description HTML using regex."""
        specs: Dict[str, str] = {}
        if not body_html:
            return specs

        text = (
            body_html.replace("&nbsp;", " ")
            .replace("<br>", " ")
            .replace("</p>", " ")
            .replace("<p>", " ")
        )
        text = re.sub(r"<[^>]+>", "", text)
        text = re.sub(r"\s+", " ", text).strip()

        # 1. Forma
        match = re.search(
            r"(?:forma|formato)\s+(?:de\s+)?([a-zA-ZáéíóúÁÉÍÓÚñÑ]+)",
            text,
            re.IGNORECASE,
        )
        if match:
            specs["Forma"] = match.group(1).title()

        # 2. Balance
        match = re.search(r"balance\s+([a-zA-ZáéíóúÁÉÍÓÚñÑ]+)", text, re.IGNORECASE)
        if match:
            specs["Balance"] = match.group(1).title()

        # 3. Peso
        match = re.search(
            r"(\d{3}\s*[-–]\s*\d{3})\s*(?:gr|gramos|g)", text, re.IGNORECASE
        )
        if not match:
            match = re.search(
                r"peso\s+(?:aproximado\s+)?(?:de\s+)?(\d{3}(?:[-–]\d{3})?)",
                text,
                re.IGNORECASE,
            )
        if match:
            specs["Peso"] = match.group(1) + " g"

        # 4. Núcleo/Goma
        match = re.search(
            r"(?:goma|núcleo|core)\s+(?:de\s+)?([a-zA-Z0-9\s]+?)(?:(?=\.|,)|$)",
            text,
            re.IGNORECASE,
        )
        if match:
            val = match.group(1).strip()
            if len(val) < 40:
                specs["Núcleo"] = val.title()

        # 5. Cara/Material
        match = re.search(
            r"(?:caras|superficie|fabricad[ao]s?)\s+(?:de\s+|con\s+)?(carbono\s+[0-9]+[kK]|fibra de vidrio|carbono)",
            text,
            re.IGNORECASE,
        )
        if match:
            specs["Cara"] = match.group(1).title()

        # 6. Nivel
        match = re.search(
            r"jugador(?:es)?\s+(?:de\s+)?(?:nivel\s+)?([a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+)",
            text,
            re.IGNORECASE,
        )
        if match:
            val = match.group(1).strip()
            if "avanzado" in val.lower():
                specs["Nivel"] = "Avanzado"
            elif "intermedio" in val.lower():
                specs["Nivel"] = "Intermedio"
            elif "profesional" in val.lower():
                specs["Nivel"] = "Profesional/Avanzado"
            elif "iniciación" in val.lower():
                specs["Nivel"] = "Iniciación"

        return specs

    async def scrape_product(self, url: str) -> Optional[Product]:
        """Scrape product data using GraphQL with structured spec fields."""
        try:
            parsed = urlparse(url)
            path = parsed.path
            # Limpia .html legacy por si acaso
            if path.endswith(".html"):
                path = path[:-5]

            parts = path.strip("/").split("/")
            url_key = parts[-1]

            # ── GraphQL fields for padel racket specs ──────────────────
            spec_fields = " ".join(self._FIELD_TO_SPEC.keys())

            query = f"""
            {{
              products(filter: {{url_key: {{eq: "{url_key}"}}}}) {{
                items {{
                  name
                  sku
                  url_key
                  price_range {{
                    minimum_price {{
                      final_price {{ value }}
                      regular_price {{ value }}
                    }}
                  }}
                  media_gallery {{ url }}
                  description {{ html }}
                  {spec_fields}
                }}
              }}
            }}
            """

            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(None, self._fetch_graphql, query)

            if not response:
                print(f"[PadelNuestro] Empty response for {url_key}")
                return None

            if "errors" in response:
                print(f"[PadelNuestro] GraphQL errors: {response.get('errors')}")
                return None

            items = response.get("data", {}).get("products", {}).get("items", [])
            print(f"[PadelNuestro] Response for {url_key}: found {len(items)} items")

            if not items:
                print(f"[PadelNuestro] API could not find product by key: {url_key}")
                return None

            item = items[0]
            name = item.get("name")

            # ── URL canónica (sin .html) ───────────────────────────────
            resolved_key = item.get("url_key") or url_key
            canonical_url = f"https://www.padelnuestro.com/{resolved_key}"

            # Price
            price_info = item.get("price_range", {}).get("minimum_price", {})
            price = price_info.get("final_price", {}).get("value", 0.0)
            regular = price_info.get("regular_price", {}).get("value")
            original_price = regular if regular and regular > price else None

            # Images
            gallery = item.get("media_gallery", [])
            images = [img.get("url") for img in gallery if img.get("url")]
            image = images[0] if images else ""

            # ── Specs: structured GraphQL fields (priority) ────────────
            specs: Dict[str, str] = {}
            for field, spec_name in self._FIELD_TO_SPEC.items():
                label = self._resolve_option(field, item.get(field))
                if label:
                    specs[spec_name] = label

            # ── Specs: fallback to HTML parsing for missing fields ─────
            description_html = item.get("description", {}).get("html", "")
            html_specs = self._parse_specs_from_html(description_html)
            for k, v in html_specs.items():
                if k not in specs:
                    specs[k] = v

            # Brand - Extract from product name
            brand = "Unknown"
            if name:
                common_brands = [
                    "Nox", "Bullpadel", "Adidas", "Siux", "Head", "Babolat",
                    "StarVie", "Varlion", "Kuikma", "Wilson", "Drop Shot",
                    "Black Crown", "Royal Padel", "Vairo", "Dunlop", "Puma",
                    "Tecnifibre", "Kelme", "Asics", "Joma", "Enebe",
                    "Vibora", "Víbora", "Wingpadel", "J'hayber",
                    "Softee", "Akkeron", "Eme", "Cartri",
                ]
                name_upper = name.upper()
                for b in common_brands:
                    if b.upper() in name_upper:
                        brand = b
                        break
                if brand == "Unknown":
                    brand = name.split(" ")[0].title()

            specs = normalize_specs(specs)

            return Product(
                url=canonical_url,
                name=name,
                price=float(price),
                original_price=float(original_price) if original_price else None,
                brand=brand,
                image=image,
                images=images,
                specs=specs,
                description=description_html,
            )

        except Exception as e:
            print(f"[PadelNuestro] Error scraping product {url}: {e}")
            return None

    async def scrape_category(self, url: str) -> List[str]:
        """Scrape product URLs using GraphQL, filtering invisible variants."""
        product_urls = []
        page_num = 1
        page_size = 50
        category_id = "6"  # Palas

        exclude_terms = [
            "zapatilla",
            "paletero",
            "mochila",
            "camiseta",
            "pantalon",
            "falda",
            "gorra",
            "calcetin",
            "funda",
            "overgrip",
            "protector",
        ]

        print(f"[PadelNuestro] Using GraphQL Category {category_id}...")

        while True:
            if page_num > 40:
                break

            # Query GraphQL para obtener productos de la categoría
            query = f"""
            {{
              products(filter: {{category_id: {{eq: "{category_id}"}}}}, pageSize: {page_size}, currentPage: {page_num}) {{
                total_count
                items {{
                  name
                  url_key
                  url_suffix
                  url_rewrites {{
                    url
                  }}
                }}
              }}
            }}
            """

            try:
                loop = asyncio.get_event_loop()
                response = await loop.run_in_executor(None, self._fetch_graphql, query)

                data = response.get("data", {}).get("products", {})
                items = data.get("items", [])
                total_count = data.get("total_count", 0)

                if not items:
                    break

                for item in items:
                    name = item.get("name", "").lower()
                    if any(term in name for term in exclude_terms):
                        continue

                    full_url = None

                    # 1. Preferencia: Usar url_rewrites (URL pública real, sin .html)
                    rewrites = item.get("url_rewrites")
                    if rewrites and len(rewrites) > 0:
                        slug = rewrites[0].get("url")
                        if slug:
                            slug = slug.rstrip("/")
                            if slug.endswith(".html"):
                                slug = slug[:-5]
                            full_url = (
                                f"https://www.padelnuestro.com/{slug.lstrip('/')}"
                            )

                    # 2. Fallback: url_key directamente (sin sufijo)
                    if not full_url and item.get("url_key"):
                        slug = item["url_key"]
                        full_url = f"https://www.padelnuestro.com/{slug}"

                    if full_url and full_url not in product_urls:
                        product_urls.append(full_url)

                print(
                    f"[PadelNuestro] Page {page_num}: Found {len(items)} items. Saved {len(product_urls)}"
                )

                if page_num * page_size >= total_count:
                    break

                page_num += 1

            except Exception as e:
                print(f"[PadelNuestro] Error on page {page_num}: {e}")
                break

        return product_urls
