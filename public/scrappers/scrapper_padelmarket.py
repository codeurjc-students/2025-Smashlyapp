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
    if not name:
        return None
    n = name.strip()
    # El nombre puede tener sufijo (Pala). Lo quitamos para comparar
    n = re.sub(r"\s*\(Pala\)\s*$", "", n, flags=re.IGNORECASE)
    # Normalizamos espacios múltiples
    n = re.sub(r"\s+", " ", n)
    return n.lower()


def find_existing_index_by_name(data: List[Dict[str, Any]], name: Optional[str]) -> Optional[int]:
    if not name:
        return None
    target = normalize_name(name)
    for idx, item in enumerate(data):
        existing = normalize_name(item.get("name"))
        if existing == target:
            return idx
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

    # Intento: clases típicas de Shopify
    price_wrappers = soup.select(".price, .product__price")
    if price_wrappers:
        # Buscar spans con clases de precio
        sale_el = soup.select_one(".price-item--sale")
        reg_el = soup.select_one(".price-item--regular")
        compare_el = soup.select_one(".price__compare, .compare-at")
        current_price = parse_price(extract_text(sale_el) or extract_text(reg_el))
        original_price = parse_price(extract_text(compare_el) or extract_text(reg_el))

    # Fallback: buscar cualquier número con euro cerca de 'Precio'
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
    idx = find_existing_index_by_name(data, name)

    # Construir valores de PadelMarket
    pm_actual = scraped.get("current_price")
    pm_original = scraped.get("original_price")
    pm_discount = scraped.get("discount_pct")
    pm_link = product_url

    if idx is not None:
        # Sólo actualizar campos de PadelMarket y nombre con sufijo
        entry = data[idx]
        entry["padelmarket_actual_price"] = pm_actual
        entry["padelmarket_original_price"] = pm_original
        entry["padelmarket_discount_percentage"] = pm_discount
        entry["padelmarket_link"] = pm_link
        # nombre con sufijo
        current_name = entry.get("name") or name
        if current_name and not current_name.endswith("(Pala)"):
            entry["name"] = f"{current_name} (Pala)"
        else:
            entry["name"] = current_name
        # on_offer derivado
        entry["on_offer"] = bool(pm_discount and pm_discount > 0)
        logging.info(f"Actualizado (PadelMarket): {entry['name']}")
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


def main():
    setup_logging()
    logging.info("Inicio de scrapper PadelMarket")

    session = requests.Session()
    session.headers.update(HEADERS)

    data = load_json()
    visited: set[str] = set()

    # Recorremos páginas hasta que no haya más productos
    page = 1
    empty_pages = 0

    while True:
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
            if product_url in visited:
                continue
            visited.add(product_url)
            sleep_polite()
            try:
                detail = scrape_product_detail(session, product_url)
                if not detail:
                    continue
                apply_update_or_create(data, detail, product_url)
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
    logging.info("Scrapeo completado")


if __name__ == "__main__":
    main()