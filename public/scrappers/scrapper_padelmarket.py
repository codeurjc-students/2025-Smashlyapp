import json
import logging
import os
import re
import time
from typing import Any, Dict, List, Optional, Tuple

import requests
from bs4 import BeautifulSoup


# Configuración
BASE_COLLECTION_URL = "https://padelmarket.com/es-eu/collections/palas"
JSON_PATH = "rackets.json"
LOG_PATH = "scrapper.log"
USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/124.0.0.0 Safari/537.36"
)
HEADERS = {
    "User-Agent": USER_AGENT,
    "Accept-Language": "es-ES,es;q=0.9",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Connection": "keep-alive",
}

# Delays entre peticiones para evitar bloqueos
MIN_DELAY_SEC = 1.5
MAX_DELAY_SEC = 3.0


def setup_logging() -> None:
    logging.basicConfig(
        filename=LOG_PATH,
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(message)s",
    )
    logging.getLogger().addHandler(logging.StreamHandler())


def sleep_polite(multiplier: float = 1.0) -> None:
    import random

    delay = random.uniform(MIN_DELAY_SEC, MAX_DELAY_SEC) * multiplier
    time.sleep(delay)


def sanitize_url(url: str) -> str:
    # Quita coma final y espacios accidentales
    url = url.strip().rstrip(",")
    return url


def load_json() -> List[Dict[str, Any]]:
    if not os.path.exists(JSON_PATH):
        logging.info("rackets.json no existe; se creará automáticamente")
        return []
    try:
        with open(JSON_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        logging.error(f"Error al cargar {JSON_PATH}: {e}")
        return []


def save_json(data: List[Dict[str, Any]]) -> None:
    try:
        with open(JSON_PATH, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        logging.info(f"Guardado {len(data)} palas en {JSON_PATH}")
    except Exception as e:
        logging.error(f"Error al guardar {JSON_PATH}: {e}")


def normalize_name(name: Optional[str]) -> Optional[str]:
    """
    Normaliza un nombre de pala para comparación.
    Elimina sufijos, espacios extra, y convierte a minúsculas.
    """
    if not name:
        return None
    n = name.strip()
    # Quitar sufijo (Pala)
    n = re.sub(r"\s*\(Pala\)\s*$", "", n, flags=re.IGNORECASE)
    # Normalizar espacios múltiples
    n = re.sub(r"\s+", " ", n)
    return n.lower()


def create_comparison_key(name: Optional[str], brand: Optional[str] = None) -> Optional[str]:
    """
    Crea una clave de comparación más robusta para matching.
    Normaliza el nombre eliminando caracteres especiales, acentos, espacios y mayúsculas.
    """
    if not name:
        return None

    # Normalizar nombre
    key = normalize_name(name)
    if not key:
        return None

    # Eliminar acentos y caracteres especiales
    import unicodedata
    key = unicodedata.normalize('NFKD', key).encode('ASCII', 'ignore').decode('ASCII')

    # Eliminar todos los caracteres que no sean letras o números
    key = re.sub(r'[^a-z0-9]', '', key)

    return key


def calculate_similarity(str1: str, str2: str) -> float:
    """
    Calcula la similitud entre dos strings usando distancia de Levenshtein simplificada.
    Retorna un valor entre 0 (totalmente diferente) y 1 (idéntico).
    """
    if str1 == str2:
        return 1.0

    # Algoritmo de distancia de Levenshtein simplificado
    len1, len2 = len(str1), len(str2)
    if len1 == 0 or len2 == 0:
        return 0.0

    # Crear matriz de distancias
    distances = [[0] * (len2 + 1) for _ in range(len1 + 1)]

    for i in range(len1 + 1):
        distances[i][0] = i
    for j in range(len2 + 1):
        distances[0][j] = j

    for i in range(1, len1 + 1):
        for j in range(1, len2 + 1):
            cost = 0 if str1[i-1] == str2[j-1] else 1
            distances[i][j] = min(
                distances[i-1][j] + 1,      # deletion
                distances[i][j-1] + 1,      # insertion
                distances[i-1][j-1] + cost  # substitution
            )

    max_len = max(len1, len2)
    similarity = 1 - (distances[len1][len2] / max_len)
    return similarity


def extract_version_numbers(text: str) -> List[str]:
    """
    Extrae números de versión del texto (ej: "3.3", "2024", "V2", etc.)
    Returns:
        Lista de números de versión encontrados
    """
    # Patrones comunes de versión: 3.3, V2, 2024, etc.
    patterns = [
        r'\d+\.\d+',  # 3.3, 2.1, etc.
        r'v\d+',      # v2, V3, etc.
        r'\b20\d{2}\b',  # 2024, 2025, etc. (años)
        r'\b\d{2}\b$',   # 03, 23, etc. al final
    ]

    versions = []
    for pattern in patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        versions.extend(matches)

    return versions


def tokenize_name(name: str) -> set:
    """
    Tokeniza un nombre en palabras/números significativos.
    Aplica normalización antes de tokenizar.
    """
    # Normalizar primero (sin quitar espacios todavía)
    normalized = normalize_name(name) or ""

    # Extraer tokens: palabras de 2+ caracteres o números
    tokens = set()

    # Patrones de tokens
    # 1. Palabras de 2+ letras
    for word in re.findall(r'[a-z]{2,}', normalized):
        tokens.add(word)

    # 2. Números (años, versiones, etc.)
    for num in re.findall(r'\d+', normalized):
        if len(num) >= 2:  # Al menos 2 dígitos
            tokens.add(num)

    return tokens


def calculate_token_similarity(name1: str, name2: str) -> float:
    """
    Calcula similitud basada en tokens (palabras) comunes.
    Útil cuando el orden de las palabras puede variar.
    """
    tokens1 = tokenize_name(name1)
    tokens2 = tokenize_name(name2)

    if not tokens1 or not tokens2:
        return 0.0

    # Calcular similitud de Jaccard (intersección / unión)
    intersection = len(tokens1 & tokens2)
    union = len(tokens1 | tokens2)

    return intersection / union if union > 0 else 0.0


def find_existing_index_by_name(data: List[Dict[str, Any]], name: Optional[str], brand: Optional[str] = None) -> Optional[int]:
    """
    Busca una pala existente en el JSON usando múltiples estrategias de matching.

    Estrategia de matching:
    1. Comparación exacta de claves normalizadas
    2. Comparación por similitud de tokens (palabras comunes) con umbral del 85%
    3. Comparación por similitud de secuencia (Levenshtein) con umbral del 90%
    4. Verificación de números de versión (deben coincidir)
    5. Comparación adicional por marca + modelo si está disponible

    Returns:
        Índice de la pala si existe, None si no existe
    """
    if not name:
        return None

    # Crear clave de comparación del nombre a buscar
    target_key = create_comparison_key(name, brand)
    if not target_key:
        return None

    # Extraer versiones del nombre objetivo
    target_versions = extract_version_numbers(normalize_name(name) or "")

    # Variables para tracking del mejor match
    best_match_idx = None
    best_similarity = 0.0
    best_method = None

    # Recorrer todas las palas existentes
    for idx, item in enumerate(data):
        existing_name = item.get("name")
        existing_brand = item.get("brand") or item.get("characteristics_brand")

        # Crear clave de comparación de la pala existente
        existing_key = create_comparison_key(existing_name, existing_brand)

        if not existing_key:
            continue

        # 1. Comparación exacta de claves
        if existing_key == target_key:
            logging.info(f"Match exacto encontrado: '{name}' == '{existing_name}'")
            return idx

        # 2. Calcular similitud de tokens (independiente del orden)
        # Usar nombres originales, no las claves
        token_similarity = calculate_token_similarity(name, existing_name)

        # 3. Calcular similitud de secuencia (Levenshtein)
        sequence_similarity = calculate_similarity(target_key, existing_key)

        # Usar la mayor de las dos similitudes
        similarity = max(token_similarity, sequence_similarity)
        method = "tokens" if token_similarity > sequence_similarity else "secuencia"

        # 4. Verificar versiones - si hay versiones diferentes, penalizar
        existing_versions = extract_version_numbers(normalize_name(existing_name) or "")

        # Si ambos tienen versiones y no coinciden, penalizar mucho la similitud
        if target_versions and existing_versions:
            # Normalizar versiones para comparación
            target_v_set = set(v.lower() for v in target_versions)
            existing_v_set = set(v.lower() for v in existing_versions)

            # Si las versiones son completamente diferentes, reducir similitud
            if target_v_set.isdisjoint(existing_v_set):
                similarity *= 0.5  # Penalizar al 50%

        # 5. Si la marca coincide, dar un boost a la similitud
        if brand and existing_brand:
            brand_key1 = create_comparison_key(brand)
            brand_key2 = create_comparison_key(existing_brand)
            if brand_key1 == brand_key2:
                similarity = min(1.0, similarity + 0.1)  # Boost del 10%

        # Tracking del mejor match
        if similarity > best_similarity:
            best_similarity = similarity
            best_match_idx = idx
            best_method = method

    # Umbral de similitud: 85% (reducido porque ahora usamos tokens)
    SIMILARITY_THRESHOLD = 0.85

    if best_similarity >= SIMILARITY_THRESHOLD and best_match_idx is not None:
        existing_name = data[best_match_idx].get("name")
        logging.info(f"Match por similitud {best_method} ({best_similarity*100:.1f}%): '{name}' ~= '{existing_name}'")
        return best_match_idx

    # No se encontró match
    if best_similarity > 0.5:  # Log solo si hubo alguna similitud considerable
        logging.info(f"No match para '{name}' (mejor similitud: {best_similarity*100:.1f}%)")

    return None


def default_racket_structure() -> Dict[str, Any]:
    # Estructura basada en ejemplos del rackets.json existente.
    return {
        "name": None,
        "brand": None,
        "model": None,
        "image": None,
        "on_offer": None,
        "description": None,
        # Características principales
        "characteristics_brand": None,
        "characteristics_color": None,
        "characteristics_color_2": None,
        "characteristics_product": "Palas",
        "characteristics_balance": None,
        "characteristics_core": None,
        "characteristics_face": None,
        "characteristics_format": None,
        "characteristics_hardness": None,
        "characteristics_game_level": None,
        "characteristics_finish": None,
        "characteristics_shape": None,
        "characteristics_surface": None,
        "characteristics_game_type": None,
        "characteristics_player_collection": None,
        "characteristics_player": None,
        # Especificaciones técnicas
        "specs": {
            "tecnologias": [],
            "peso": None,
            "marco": None,
        },
        # Campos tienda PadelNuestro (rellenar con null si no aplica)
        "padelnuestro_actual_price": None,
        "padelnuestro_original_price": None,
        "padelnuestro_discount_percentage": None,
        "padelnuestro_link": None,
        # Campos tienda PadelMarket (objetivo de este scraper)
        "padelmarket_actual_price": None,
        "padelmarket_original_price": None,
        "padelmarket_discount_percentage": None,
        "padelmarket_link": None,
    }


def calculate_discount(original: Optional[float], current: Optional[float]) -> Optional[int]:
    try:
        if original and current and original > 0 and current >= 0 and current <= original:
            pct = round((1 - (current / original)) * 100)
            return max(0, pct)
    except Exception:
        pass
    return None


def parse_price(text: Optional[str]) -> Optional[float]:
    if not text:
        return None
    try:
        # El precio puede venir como "€184,95" o "184,95 €" o con puntos de miles.
        cleaned = text.strip()
        cleaned = cleaned.replace("€", "").replace("EUR", "")
        cleaned = cleaned.replace("\xa0", " ")
        cleaned = cleaned.replace(".", "")  # miles
        cleaned = cleaned.replace(",", ".")  # decimales
        # Extraer número flotante
        m = re.search(r"([0-9]+(?:\.[0-9]+)?)", cleaned)
        if not m:
            return None
        return float(m.group(1))
    except Exception:
        return None


def request_soup(session: requests.Session, url: str, retries: int = 3) -> Optional[BeautifulSoup]:
    url = sanitize_url(url)
    for attempt in range(retries):
        try:
            resp = session.get(url, headers=HEADERS, timeout=20)
            if resp.status_code >= 400:
                logging.warning(f"HTTP {resp.status_code} en {url}")
                sleep_polite(1.2)
                continue
            return BeautifulSoup(resp.text, "html.parser")
        except requests.RequestException as e:
            logging.warning(f"Fallo de red en {url}: {e} (intento {attempt+1}/{retries})")
            sleep_polite(1.5)
    logging.error(f"No se pudo obtener contenido de {url}")
    return None


def scrape_catalog_page(session: requests.Session, page_number: int) -> List[str]:
    url = f"{sanitize_url(BASE_COLLECTION_URL)}?page={page_number}"
    logging.info(f"Scrape catálogo página {page_number}: {url}")
    soup = request_soup(session, url)
    if soup is None:
        return []

    product_links: List[str] = []

    # Intento 1: enlaces típicos de Shopify en cartas de producto
    for a in soup.select("a.full-unstyled-link"):
        href = a.get("href")
        if href and "/products/" in href:
            product_links.append(href)

    # Intento 2: enlaces en tarjetas con selector alternativo
    if not product_links:
        for a in soup.select("a[href*='/products/']"):
            href = a.get("href")
            if href and "/products/" in href:
                product_links.append(href)

    # Normalizar a URL absoluta
    abs_links = []
    base_prefix = "https://padelmarket.com"
    for href in product_links:
        if href.startswith("http"):
            abs_links.append(href)
        else:
            abs_links.append(base_prefix + href)

    # Eliminar duplicados manteniendo orden
    seen = set()
    unique_links = []
    for l in abs_links:
        if l not in seen:
            unique_links.append(l)
            seen.add(l)

    logging.info(f"Encontrados {len(unique_links)} enlaces de producto en página {page_number}")
    return unique_links


def extract_text(el) -> Optional[str]:
    if not el:
        return None
    txt = el.get_text(strip=True)
    return txt or None


def extract_features(soup: BeautifulSoup) -> Dict[str, Any]:
    features: Dict[str, Any] = {
        "characteristics_brand": None,
        "characteristics_color": None,
        "characteristics_color_2": None,
        "characteristics_balance": None,
        "characteristics_core": None,
        "characteristics_face": None,
        "characteristics_format": None,
        "characteristics_hardness": None,
        "characteristics_game_level": None,
        "characteristics_finish": None,
        "characteristics_shape": None,
        "characteristics_surface": None,
        "characteristics_game_type": None,
        "characteristics_player_collection": None,
        "characteristics_player": None,
        "specs": {
            "tecnologias": [],
            "peso": None,
            "marco": None,
        },
    }

    # Buscar tablas de características (th/td o dt/dd)
    try:
        tables = soup.select("table, .product__specs table, .product-specs table")
        for table in tables:
            for row in table.select("tr"):
                header = extract_text(row.find("th")) or extract_text(row.find("td"))
                value_cell = row.find_all("td")
                value = None
                if value_cell:
                    value = extract_text(value_cell[-1])
                elif row.find("th") and row.find("th").find_next("td"):
                    value = extract_text(row.find("th").find_next("td"))
                if not header or not value:
                    continue
                map_feature(features, header, value)
    except Exception:
        pass

    # Listas con pares "Clave: Valor" en bullet points
    try:
        for li in soup.select("ul li"):
            txt = extract_text(li)
            if txt and ":" in txt:
                parts = [p.strip() for p in txt.split(":", 1)]
                if len(parts) == 2:
                    map_feature(features, parts[0], parts[1])
    except Exception:
        pass

    # Tecnologías: buscar palabras tipo tecnologías en listas
    try:
        tecnologias = []
        for li in soup.select("ul li"):
            t = extract_text(li)
            if not t:
                continue
            # Heurística básica: entradas que parecen tecnología
            if any(keyword in t.lower() for keyword in ["eva", "carbon", "spin", "structure", "system", "grip", "reinforce", "smart", "rugos", "alum", "k"]):
                tecnologias.append(t)
        if tecnologias:
            # mantener únicas y con orden
            seen_t = set()
            uniq_t = []
            for t in tecnologias:
                if t not in seen_t:
                    uniq_t.append(t)
                    seen_t.add(t)
            features["specs"]["tecnologias"] = uniq_t
    except Exception:
        pass

    return features


def map_feature(features: Dict[str, Any], header: str, value: str) -> None:
    h = header.strip().lower()
    v = value.strip() if value is not None else None
    # Mapeo básico de etiquetas comunes en español
    mapping = {
        "marca": "characteristics_brand",
        "color": "characteristics_color",
        "colores": "characteristics_color_2",
        "balance": "characteristics_balance",
        "núcleo": "characteristics_core",
        "nucleo": "characteristics_core",
        "cara": "characteristics_face",
        "plano": "characteristics_face",
        "material cara": "characteristics_face",
        "formato": "characteristics_format",
        "dureza": "characteristics_hardness",
        "nivel de juego": "characteristics_game_level",
        "acabado": "characteristics_finish",
        "forma": "characteristics_shape",
        "superficie": "characteristics_surface",
        "tipo de juego": "characteristics_game_type",
        "colección": "characteristics_player_collection",
        "jugador": "characteristics_player",
        "peso": ("specs", "peso"),
        "marco": ("specs", "marco"),
        "tecnologías": ("specs", "tecnologias"),
        "tecnologias": ("specs", "tecnologias"),
    }

    key = None
    # Encontrar mejor coincidencia por prefix
    for k in mapping.keys():
        if h.startswith(k):
            key = mapping[k]
            break
    if not key:
        return

    if isinstance(key, tuple):
        # specs
        spec_key = key[1]
        if spec_key == "tecnologias":
            # separar por coma si aplica
            vals = [x.strip() for x in re.split(r",|;|/", v) if x.strip()]
            features["specs"][spec_key] = vals
        else:
            features["specs"][spec_key] = v
    else:
        features[key] = v


def scrape_product_detail(session: requests.Session, url: str) -> Optional[Dict[str, Any]]:
    logging.info(f"Scrape detalle: {url}")
    soup = request_soup(session, url)
    if soup is None:
        return None

    # Nombre
    name = None
    for sel in [
        "h1.product__title",
        "h1.product-title",
        "h1.product__heading",
        "h1.page-title",
        "h1",
    ]:
        el = soup.select_one(sel)
        name = extract_text(el)
        if name:
            break

    if not name:
        logging.error(f"Nombre no encontrado en {url}; se omite el producto")
        return None

    # Precios
    current_price = None
    original_price = None

    # Método 1: Extraer de datos JSON embebidos (Shopify Analytics, Klaviyo, etc.)
    try:
        # Buscar scripts con datos JSON
        for script in soup.find_all('script'):
            if not script.string:
                continue

            script_content = script.string

            # Buscar patrones de precio en JSON
            # Patrón 1: "price":{"amount":259.95,"currencyCode":"EUR"}
            price_match = re.search(r'"price"\s*:\s*\{\s*"amount"\s*:\s*([\d.]+)', script_content)
            if price_match and current_price is None:
                current_price = float(price_match.group(1))

            # Patrón 2: "price":25995 (en centavos)
            if current_price is None:
                price_cents_match = re.search(r'"price"\s*:\s*(\d+)\s*,\s*["\']?currencyCode["\']?\s*:\s*["\']EUR["\']', script_content)
                if price_cents_match:
                    current_price = float(price_cents_match.group(1)) / 100

            # Buscar precio original/comparación
            # Patrón: CompareAtPrice: "389,95€" o "compare_at_price"
            compare_match = re.search(r'[Cc]ompare[Aa]t[Pp]rice["\']?\s*:\s*["\']?([\d,]+)', script_content)
            if compare_match and original_price is None:
                compare_str = compare_match.group(1).replace(',', '.')
                try:
                    original_price = float(compare_str)
                except ValueError:
                    pass
    except Exception as e:
        logging.debug(f"Error extrayendo precios de JSON: {e}")

    # Método 2: Buscar en elementos HTML (clases típicas de Shopify)
    if current_price is None:
        price_wrappers = soup.select(".price, .product__price")
        if price_wrappers:
            # Buscar spans con clases de precio
            sale_el = soup.select_one(".price-item--sale")
            reg_el = soup.select_one(".price-item--regular")
            compare_el = soup.select_one(".price__compare, .compare-at")
            current_price = parse_price(extract_text(sale_el) or extract_text(reg_el))
            if not original_price:
                original_price = parse_price(extract_text(compare_el) or extract_text(reg_el))

    # Método 3: Fallback - buscar cualquier número con euro
    if current_price is None:
        for el in soup.select("span, div"):
            txt = extract_text(el)
            if not txt:
                continue
            if "€" in txt or "EUR" in txt:
                p = parse_price(txt)
                if p:
                    current_price = p
                    break

    # Si no hay original explícito y hay actual, asumimos sin descuento
    if original_price is None and current_price is not None:
        original_price = current_price

    if current_price is None:
        logging.error(f"Precio no encontrado en {url}; se omite el producto")
        return None

    discount_pct = calculate_discount(original_price, current_price)

    # Imagen principal
    image_url = None
    for sel in [
        "img.product__media",  # tema moderno
        "img.product-featured-media",
        "img#FeaturedImage-product-template",
        "img[src*='cdn.shopify.com']",
        "img",
    ]:
        img = soup.select_one(sel)
        if img and (img.get("src") or img.get("data-src") or img.get("data-image")):
            image_url = img.get("src") or img.get("data-src") or img.get("data-image")
            break
    if image_url and image_url.startswith("//"):
        image_url = "https:" + image_url

    # Descripción
    description = None
    for sel in [
        ".product__description",
        ".product-description",
        "#ProductInfo-template",
        "article.product",
        "main .rte",
    ]:
        el = soup.select_one(sel)
        description = extract_text(el)
        if description:
            break

    # Extraer brand/model si es posible
    brand = None
    model = None
    # Heurística: si el nombre empieza por marca conocida, separar
    known_brands = [
        "Nox",
        "Adidas",
        "Bullpadel",
        "Head",
        "Babolat",
        "Siux",
        "Star Vie",
        "Varlion",
        "Vibora",
        "Royal Padel",
        "Dunlop",
        "Wilson",
        "Kuikma",
    ]
    for b in known_brands:
        if name.lower().startswith(b.lower()):
            brand = b
            model = name[len(b) :].strip(" -")
            break
    if not brand:
        # Buscar en breadcrumbs o metadatos
        crumb = soup.select_one("nav.breadcrumb a, .breadcrumb a")
        if crumb:
            crumb_txt = extract_text(crumb)
            if crumb_txt and len(crumb_txt) <= 20:
                brand = crumb_txt
    if not model:
        model = name

    # Características técnicas
    features = extract_features(soup)

    return {
        "name": name,
        "brand": brand,
        "model": model,
        "image": image_url,
        "description": description,
        "current_price": current_price,
        "original_price": original_price,
        "discount_pct": discount_pct,
        "features": features,
    }


def apply_update_or_create(
    data: List[Dict[str, Any]], scraped: Dict[str, Any], product_url: str
) -> None:
    name = scraped.get("name")
    brand = scraped.get("brand")

    # Buscar pala existente usando el algoritmo mejorado
    idx = find_existing_index_by_name(data, name, brand)

    # Construir valores de PadelMarket
    pm_actual = scraped.get("current_price")
    pm_original = scraped.get("original_price")
    pm_discount = scraped.get("discount_pct")
    pm_link = product_url

    if idx is not None:
        # Actualizar SOLO campos de PadelMarket, NO modificar nombre ni otros campos
        entry = data[idx]
        entry["padelmarket_actual_price"] = pm_actual
        entry["padelmarket_original_price"] = pm_original
        entry["padelmarket_discount_percentage"] = pm_discount
        entry["padelmarket_link"] = pm_link

        # Actualizar imagen solo si no existe
        if not entry.get("image") and scraped.get("image"):
            entry["image"] = scraped.get("image")

        # Actualizar on_offer basado en ambas tiendas
        pn_discount = entry.get("padelnuestro_discount_percentage")
        has_offer = (pm_discount and pm_discount > 0) or (pn_discount and pn_discount > 0)
        entry["on_offer"] = bool(has_offer)

        logging.info(f"✓ Actualizado (PadelMarket): {entry['name']}")
        return

    # Crear nueva entrada con todos los campos
    new_entry = default_racket_structure()
    # Campos generales
    # Añadir sufijo (Pala) sólo si no existe ya
    if name:
        if re.search(r"\(Pala\)\s*$", name, flags=re.IGNORECASE):
            new_entry["name"] = name
        else:
            new_entry["name"] = f"{name} (Pala)"
    else:
        new_entry["name"] = None
    new_entry["brand"] = scraped.get("brand")
    new_entry["model"] = scraped.get("model")
    new_entry["image"] = scraped.get("image")
    new_entry["description"] = scraped.get("description")
    new_entry["on_offer"] = bool(pm_discount and pm_discount > 0)

    # Características
    feats = scraped.get("features") or {}
    for k in [
        "characteristics_brand",
        "characteristics_color",
        "characteristics_color_2",
        "characteristics_balance",
        "characteristics_core",
        "characteristics_face",
        "characteristics_format",
        "characteristics_hardness",
        "characteristics_game_level",
        "characteristics_finish",
        "characteristics_shape",
        "characteristics_surface",
        "characteristics_game_type",
        "characteristics_player_collection",
        "characteristics_player",
    ]:
        new_entry[k] = feats.get(k)

    specs = feats.get("specs") or {}
    new_entry["specs"] = {
        "tecnologias": specs.get("tecnologias") or [],
        "peso": specs.get("peso"),
        "marco": specs.get("marco"),
    }

    # Campos de PadelMarket
    new_entry["padelmarket_actual_price"] = pm_actual
    new_entry["padelmarket_original_price"] = pm_original
    new_entry["padelmarket_discount_percentage"] = pm_discount
    new_entry["padelmarket_link"] = pm_link

    # Campos de PadelNuestro (no disponibles aquí)
    new_entry["padelnuestro_actual_price"] = None
    new_entry["padelnuestro_original_price"] = None
    new_entry["padelnuestro_discount_percentage"] = None
    new_entry["padelnuestro_link"] = None

    data.append(new_entry)
    logging.info(f"Creada nueva entrada: {new_entry['name']}")


def main(max_products: int = None):
    setup_logging()
    logging.info("Inicio de scrapper PadelMarket")
    if max_products:
        logging.info(f"Modo prueba: limitado a {max_products} productos")

    session = requests.Session()
    session.headers.update(HEADERS)

    data = load_json()
    visited: set[str] = set()

    # Recorremos páginas hasta que no haya más productos
    page = 1
    empty_pages = 0
    products_processed = 0

    while True:
        # Si alcanzamos el límite, terminar
        if max_products and products_processed >= max_products:
            logging.info(f"Límite de {max_products} productos alcanzado")
            break

        links = scrape_catalog_page(session, page)
        if not links:
            empty_pages += 1
            logging.info(f"Página {page} vacía ({empty_pages} consecutivas)")
            if empty_pages >= 2:
                break
            page += 1
            sleep_polite()
            continue

        empty_pages = 0
        for product_url in links:
            # Si alcanzamos el límite, terminar
            if max_products and products_processed >= max_products:
                break

            if product_url in visited:
                continue
            visited.add(product_url)
            sleep_polite()
            try:
                detail = scrape_product_detail(session, product_url)
                if not detail:
                    continue
                apply_update_or_create(data, detail, product_url)
                products_processed += 1
                # Guardado incremental para no perder progreso
                save_json(data)
            except Exception as e:
                logging.error(f"Error procesando {product_url}: {e}")
                continue

        page += 1
        # Pequeño descanso al finalizar cada página
        sleep_polite(1.2)

    # Guardado final
    save_json(data)
    logging.info(f"Scrapeo completado: {products_processed} productos procesados")


if __name__ == "__main__":
    import sys
    # Si se pasa un argumento numérico, usarlo como límite de productos
    max_products = None
    if len(sys.argv) > 1:
        try:
            max_products = int(sys.argv[1])
        except ValueError:
            pass
    main(max_products)