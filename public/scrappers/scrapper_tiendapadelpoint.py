#!/usr/bin/env python3
"""
Scrapper para TiendaPadelPoint

Objetivo:
- Recorrer todo el catálogo de palas con paginación en:
  https://www.tiendapadelpoint.com/palas-de-padel
- Extraer datos detallados de cada pala desde la página de producto
- Actualizar/crear entradas en rackets.json siguiendo el esquema indicado

Requisitos técnicos:
- Librerías: requests, BeautifulSoup, concurrent.futures, json, time, logging
- Scrap concurrente con delay de 1 segundo entre peticiones
- Manejo de reintentos automáticos con backoff
- Guardar logs en scrapper.log con nivel DEBUG
- Extraer características en español

Nota: Este script NO ejecuta automáticamente. Preparado para ejecución manual.
"""

import json
import logging
import os
import re
import time
from typing import Any, Dict, List, Optional, Tuple
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
from urllib.parse import urlparse

import requests
from bs4 import BeautifulSoup


# Configuración
BASE_URL = "https://www.tiendapadelpoint.com"
CATALOG_URL = f"{BASE_URL}/palas-de-padel"
JSON_PATH = "rackets.json"
LOG_PATH = "scrapper.log"
REQUEST_TIMEOUT = 20
RETRIES = 3
DELAY_SECONDS = 1.0
MAX_WORKERS = 8


def setup_logging() -> None:
    logging.basicConfig(
        filename=LOG_PATH,
        filemode='a',
        level=logging.DEBUG,
        format='%(asctime)s [%(levelname)s] %(message)s'
    )
    # También log a consola para observabilidad local (si se ejecuta manualmente)
    logging.getLogger().addHandler(logging.StreamHandler())


def polite_sleep(multiplier: float = 1.0) -> None:
    # Delay fijo requerido: 1 segundo (se puede multiplicar en backoff)
    time.sleep(DELAY_SECONDS * max(1.0, multiplier))


def load_json() -> List[Dict[str, Any]]:
    if not os.path.exists(JSON_PATH):
        logging.info("rackets.json no existe; se creará automáticamente como lista vacía")
        return []
    try:
        with open(JSON_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
            if isinstance(data, list):
                logging.debug(f"Cargadas {len(data)} entradas desde {JSON_PATH}")
                return data
            logging.warning("El contenido de rackets.json no es una lista; se usará lista vacía")
            return []
    except Exception as e:
        logging.error(f"Error al cargar {JSON_PATH}: {e}")
        return []


def save_json(data: List[Dict[str, Any]]) -> None:
    try:
        with open(JSON_PATH, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        logging.info(f"Guardado JSON con {len(data)} palas en {JSON_PATH}")
    except Exception as e:
        logging.error(f"Error al guardar {JSON_PATH}: {e}")


def default_racket_structure() -> Dict[str, Any]:
    # Estructura alineada con los scrapers existentes y requisitos
    return {
        "name": None,
        "brand": None,
        "model": None,
        "image": None,
        "on_offer": None,
        "description": None,
        # Características conocidas (valores en español)
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
        # Campos tiendas existentes para compatibilidad
        "padelnuestro_actual_price": None,
        "padelnuestro_original_price": None,
        "padelnuestro_discount_percentage": None,
        "padelnuestro_link": None,
        "padelmarket_actual_price": None,
        "padelmarket_original_price": None,
        "padelmarket_discount_percentage": None,
        "padelmarket_link": None,
        "padelproshop_actual_price": None,
        "padelproshop_original_price": None,
        "padelproshop_discount_percentage": None,
        "padelproshop_link": None,
        # Campos tienda TiendaPadelPoint (este scraper)
        "padelpoint_actual_price": None,
        "padelpoint_original_price": None,
        "padelpoint_discount_percentage": None,
        "padelpoint_link": None,
    }


def normalize_name(name: Optional[str]) -> Optional[str]:
    """
    Normaliza un nombre de pala para comparación.
    Elimina prefijos, espacios extra, y convierte a minúsculas.
    """
    if not name:
        return None
    n = name.strip()
    # Eliminar prefijos como "Pala"
    n = re.sub(r"^\s*Pala\s+", "", n, flags=re.IGNORECASE)
    # Normalizar espacios
    n = re.sub(r"\s+", " ", n)
    return n.lower()

def clean_name_and_model(name: Optional[str]) -> Optional[str]:
    """
    Limpia el nombre/modelo eliminando el prefijo 'Pala' del principio.
    """
    if not name:
        return None
    # Eliminar "Pala " del principio del string
    cleaned = re.sub(r'^\s*Pala\s+', '', name.strip(), flags=re.IGNORECASE)
    # Normalizar espacios
    cleaned = re.sub(r'\s+', ' ', cleaned)
    return cleaned.strip()


def find_existing_index_by_name(data: List[Dict[str, Any]], name: Optional[str]) -> Optional[int]:
    if not name:
        return None
    target = normalize_name(name)
    for idx, item in enumerate(data):
        existing = normalize_name(item.get("name"))
        if existing == target:
            return idx
    return None


def parse_price(text: Optional[str]) -> Optional[float]:
    if not text:
        return None
    try:
        cleaned = text.strip()
        cleaned = cleaned.replace("€", "").replace("EUR", "")
        cleaned = cleaned.replace("\xa0", " ")
        cleaned = cleaned.replace(".", "")  # miles
        cleaned = cleaned.replace(",", ".")  # decimales
        m = re.search(r"([0-9]+(?:\.[0-9]+)?)", cleaned)
        if not m:
            return None
        return float(m.group(1))
    except Exception:
        return None


def calculate_discount(original: Optional[float], current: Optional[float]) -> Optional[int]:
    try:
        if original and current and original > 0 and 0 <= current <= original:
            pct = round((1 - (current / original)) * 100)
            return max(0, pct)
    except Exception:
        pass
    return None


def request_soup(session: requests.Session, url: str, retries: int = RETRIES) -> Optional[BeautifulSoup]:
    # No se requiere User-Agent personalizado según el requisito
    for attempt in range(retries):
        try:
            polite_sleep(1.0)
            resp = session.get(url, timeout=REQUEST_TIMEOUT)
            if resp.status_code >= 400:
                logging.warning(f"HTTP {resp.status_code} en {url} (intento {attempt+1}/{retries})")
                polite_sleep(1.5 * (attempt + 1))
                continue
            return BeautifulSoup(resp.text, "html.parser")
        except requests.RequestException as e:
            logging.warning(f"Fallo de red en {url}: {e} (intento {attempt+1}/{retries})")
            polite_sleep(1.5 * (attempt + 1))
    logging.error(f"No se pudo obtener contenido de {url}")
    return None


def get_total_pages(session: requests.Session) -> int:
    soup = request_soup(session, CATALOG_URL)
    if soup is None:
        logging.error("No se pudo cargar la página de catálogo para calcular paginación; se asume 1 página")
        return 1

    # Estrategias para encontrar el último número de página
    last_page = 1

    # Intento 1: elementos de paginación típicos
    try:
        pag_links = []
        for sel in ["ul.pagination a", "nav.pagination a", "div.pagination a", "a.page"]:
            for a in soup.select(sel):
                txt = a.get_text(strip=True)
                if txt.isdigit():
                    pag_links.append(int(txt))
        if pag_links:
            last_page = max(pag_links)
    except Exception as e:
        logging.debug(f"Fallo en parsing de paginación (intento 1): {e}")

    # Intento 2: buscar enlaces con query ?page=
    try:
        for a in soup.select("a[href*='page=']"):
            href = a.get("href", "")
            m = re.search(r"page=(\d+)", href)
            if m:
                last_page = max(last_page, int(m.group(1)))
    except Exception as e:
        logging.debug(f"Fallo en parsing de paginación (intento 2): {e}")

    logging.info(f"Total de páginas detectadas en catálogo: {last_page}")
    return max(1, last_page)


def catalog_page_url(page_number: int) -> str:
    # Padrón común: ?page=N
    if page_number <= 1:
        return CATALOG_URL
    return f"{CATALOG_URL}?page={page_number}"


def _is_catalog_product_link(href: str) -> bool:
    """Heurística estricta para enlaces de detalle de producto en el catálogo.
    
    - Excluye categorías y secciones promocionales (p.ej. 'palas-de-padel', 'flash-point', 'outlet').
    - Incluye únicamente detalles cuya ruta empiece o contenga claramente '/pala-'.
    """
    if not href:
        return False
    h = href.strip()
    # Excluir enlaces de categoría/paginación y otras secciones
    if "/palas-de-padel" in h:
        return False
    if "flash-point" in h:
        return False
    if "/outlet/" in h:
        return False

    # Aceptar solo rutas de detalle de producto tipo "pala-..."
    # Si es absoluta, usamos urlparse para analizar la path
    path = urlparse(h).path if h.startswith("http") else h
    return path.startswith("/pala-") or "/pala-" in path or path.startswith("/pala/")


def scrape_catalog_page(session: requests.Session, page_number: int) -> List[str]:
    url = catalog_page_url(page_number)
    logging.info(f"Scrape catálogo página {page_number}: {url}")
    soup = request_soup(session, url)
    if soup is None:
        return []

    product_links: List[str] = []

    # Intento 1: tarjetas de producto comunes (filtro amplio para máxima cobertura)
    for a in soup.select("a[href]"):
        href = a.get("href", "").strip()
        if not href:
            continue
        # Heurísticas amplias: enlaces que parecen detalle de palas/productos
        if "/pala" in href or "/palas" in href or "/producto" in href:
            # Normalizar a absoluta
            if href.startswith("http"):
                product_links.append(href)
            else:
                product_links.append(BASE_URL + href)

    # Eliminar duplicados manteniendo orden
    seen = set()
    unique_links: List[str] = []
    for l in product_links:
        if l not in seen and l.startswith(BASE_URL):
            unique_links.append(l)
            seen.add(l)

    logging.info(f"Encontrados {len(unique_links)} enlaces de producto en página {page_number}")
    return unique_links


# Mapeo ampliado de etiquetas en español e inglés a claves characteristics_*
CHARACTERISTICS_MAPPING = {
    # Marca
    'Marca': 'characteristics_brand',
    'Brand': 'characteristics_brand',

    # Color
    'Color': 'characteristics_color',
    'Color 2': 'characteristics_color_2',
    'Colores': 'characteristics_color_2',
    'Colors': 'characteristics_color_2',

    # Producto
    'Producto': 'characteristics_product',
    'Product': 'characteristics_product',

    # Balance
    'Balance': 'characteristics_balance',
    'Punto de balance': 'characteristics_balance',

    # Núcleo
    'Núcleo': 'characteristics_core',
    'Nucleo': 'characteristics_core',
    'Core': 'characteristics_core',
    'Goma': 'characteristics_core',
    'Espuma': 'characteristics_core',
    'Foam': 'characteristics_core',

    # Cara/Plano
    'Cara': 'characteristics_face',
    'Caras': 'characteristics_face',
    'Plano': 'characteristics_face',
    'Planos': 'characteristics_face',
    'Material': 'characteristics_face',
    'Material cara': 'characteristics_face',
    'Material de cara': 'characteristics_face',
    'Surface material': 'characteristics_face',
    'Fibra': 'characteristics_face',

    # Formato
    'Formato': 'characteristics_format',
    'Format': 'characteristics_format',

    # Dureza
    'Dureza': 'characteristics_hardness',
    'Hardness': 'characteristics_hardness',

    # Nivel de juego
    'Nivel': 'characteristics_game_level',
    'Nivel de Juego': 'characteristics_game_level',
    'Nivel de juego': 'characteristics_game_level',
    'Nivel del jugador': 'characteristics_game_level',
    'Player level': 'characteristics_game_level',

    # Acabado
    'Acabado': 'characteristics_finish',
    'Finish': 'characteristics_finish',
    'Textura': 'characteristics_finish',

    # Forma
    'Forma': 'characteristics_shape',
    'Shape': 'characteristics_shape',
    'Molde': 'characteristics_shape',

    # Superficie
    'Superficie': 'characteristics_surface',
    'Surface': 'characteristics_surface',
    'Rugosidad': 'characteristics_surface',

    # Tipo de juego
    'Tipo de Juego': 'characteristics_game_type',
    'Tipo de juego': 'characteristics_game_type',
    'Game type': 'characteristics_game_type',
    'Estilo': 'characteristics_game_type',

    # Colección/Jugador
    'Colección': 'characteristics_player_collection',
    'Colección Jugadores': 'characteristics_player_collection',
    'Colección jugadores': 'characteristics_player_collection',
    'Collection': 'characteristics_player_collection',
    'Jugador': 'characteristics_player',
    'Player': 'characteristics_player',
    'Género': 'characteristics_player',
}


KNOWN_BRANDS = [
    # Lista de marcas comunes para inferencia desde el nombre
    'Adidas', 'Nox', 'Bullpadel', 'Babolat', 'Head', 'Wilson', 'Siux', 'Varlion',
    'Royal Padel', 'Black Crown', 'Star Vie', 'Drop Shot', 'Vibora', 'Kuikma',
    'Dunlop', 'Prince', 'Orygen', 'Akkeron', 'Pro Kennex', 'Aca', 'RS', 'Asics'
]


def _extract_text(el) -> Optional[str]:
    if not el:
        return None
    txt = el.get_text(strip=True)
    return txt or None


def _infer_brand_and_model(name: Optional[str]) -> Tuple[Optional[str], Optional[str]]:
    if not name:
        return None, None
    brand = None
    model = None
    for b in KNOWN_BRANDS:
        if name.lower().startswith(b.lower()):
            brand = b
            model = name[len(b):].strip()
            break
    # Fallback: primer token como marca si tiene mayúscula
    if not brand:
        parts = name.split()
        if parts:
            candidate = parts[0]
            if candidate[0].isupper():
                brand = candidate
                model = name[len(candidate):].strip()
    return brand, model


def _extract_prices_from_soup(soup: BeautifulSoup) -> Tuple[Optional[float], Optional[float], Optional[int], bool]:
    current = None
    original = None
    discount_pct = None
    on_offer = False

    # Buscar textos con €
    euro_texts = [el.get_text(strip=True) for el in soup.find_all(text=re.compile(r"€"))]
    prices = [p for p in (parse_price(t) for t in euro_texts) if p is not None]
    if prices:
        # Heurística: el menor suele ser precio actual, mayor el original
        current = min(prices)
        original = max(prices) if max(prices) != current else current

    # Buscar etiquetas de descuento "-25%"
    pct_texts = [el.get_text(strip=True) for el in soup.find_all(text=re.compile(r"-\s?\d+%"))]
    if pct_texts:
        try:
            m = re.search(r"(\d+)%", pct_texts[0])
            if m:
                discount_pct = int(m.group(1))
        except Exception:
            pass

    # Calcular y ajustar
    if current and original and original > current:
        disc_calc = calculate_discount(original, current)
        discount_pct = discount_pct or disc_calc
        on_offer = True
    elif current and original and original == current:
        on_offer = False
    elif current and not original:
        on_offer = False

    return current, original or current, discount_pct, on_offer


def _extract_specs(description_text: str) -> Dict[str, Any]:
    """
    Extrae especificaciones técnicas (tecnologías, peso, marco) desde texto de descripción.
    Utiliza múltiples métodos: mayúsculas, palabras clave, patrones, y filtrado de navegación.
    """
    specs: Dict[str, Any] = {"tecnologias": []}
    if not description_text:
        return specs

    txt = description_text

    # Blacklist para filtrar elementos de navegación que no son tecnologías reales
    NAV_BLACKLIST = {
        'PALAS', 'PADEL', 'OUTLET', 'OFERTAS', 'NOVEDADES', 'MARCAS', 'HOMBRE', 'MUJER',
        'JUNIOR', 'ACCESORIOS', 'TEXTIL', 'CALZADO', 'BOLSAS', 'MOCHILAS', 'ROPA',
        'ZAPATILLAS', 'INICIO', 'TIENDA', 'CONTACTO', 'AYUDA', 'CARRITO', 'ENVIO',
        'PAGO', 'POLITICA', 'TERMINOS', 'CONDICIONES', 'PRIVACIDAD', 'COOKIES',
    }

    # Método 1: palabras en mayúsculas (tecnologías suelen estar en mayúsculas)
    tech_candidates = set()
    for token in re.findall(r"\b[A-Z][A-Z0-9]{2,}\b", txt):
        # Filtrar palabras demasiado comunes o de navegación
        if token not in NAV_BLACKLIST and len(token) >= 3 and len(token) <= 25:
            tech_candidates.add(token)

    # Método 2: palabras clave conocidas de tecnologías de palas
    tech_keywords = [
        "EVA", "CARBON", "CARBONO", "SPIN", "STRUCTURE", "REINFORCEMENT",
        "ALUMINIZED", "XR", "3K", "12K", "18K", "FIBERGLASS", "FIBRA",
        "GRAPHENE", "POWER", "CONTROL", "ROUGH", "FOAM", "CORE",
        "AIR", "REACT", "HOLES", "FRAME", "SMARTSTRAP", "PROTECTOR",
        "VIBRADRIVE", "DIFUSOR", "NERVE", "CUSTOM", "GRIP", "HEART",
        "MULTIEVA", "BLACK EVA", "HYPERSOFT", "METALSHIELD"
    ]

    for kw in tech_keywords:
        if kw in txt.upper():
            tech_candidates.add(kw)

    # Método 3: buscar palabras entre comillas o después de "tecnología:"
    tech_pattern_matches = re.findall(
        r'(?:tecnolog[íi]a[s]?|technology)[:\s]*([A-Z][A-Za-z0-9\s]{2,30})',
        txt,
        flags=re.IGNORECASE
    )
    for match in tech_pattern_matches:
        cleaned = match.strip()
        if cleaned and len(cleaned) >= 3:
            tech_candidates.add(cleaned.upper())

    # Filtrar y limpiar tecnologías
    final_techs = []
    for tech in tech_candidates:
        tech_upper = tech.upper().strip()
        # Filtrar blacklist y tecnologías muy cortas/largas
        if (tech_upper not in NAV_BLACKLIST and
            len(tech_upper) >= 3 and
            len(tech_upper) <= 30 and
            not tech_upper.isdigit()):
            final_techs.append(tech)

    if final_techs:
        specs["tecnologias"] = sorted(list(set(final_techs)))

    # Peso: buscar patrones como "365g", "365 gramos", "365 gr"
    m_peso = re.search(r"(\d+)\s*g(?:r|ramos)?", txt, flags=re.IGNORECASE)
    if m_peso:
        specs["peso"] = f"{m_peso.group(1)}g"

    # Marco: detectar materiales
    if "carbono" in txt.lower():
        if "100%" in txt or "full carbon" in txt.lower():
            specs["marco"] = "100% Carbono"
        else:
            specs["marco"] = "Carbono"
    elif "fibra de vidrio" in txt.lower() or "fiberglass" in txt.lower():
        specs["marco"] = "Fibra de vidrio"

    return specs


def scrape_product_detail(session: requests.Session, url: str) -> Optional[Dict[str, Any]]:
    logging.debug(f"Scrape detalle producto: {url}")
    soup = request_soup(session, url)
    if soup is None:
        return None

    # Nombre
    name = None
    for sel in ["h1", "h1.product-title", "h1.page-title", "div.product-name h1"]:
        el = soup.select_one(sel)
        name = _extract_text(el)
        if name:
            break
    if not name:
        logging.warning(f"No se pudo extraer nombre en {url}")
        return None

    # Limpiar el nombre eliminando "Pala" del principio
    name = clean_name_and_model(name)

    # Imagen principal
    image = None
    for sel in ["img#product-image", "div.product-media img", "img.fotorama__img", "img[src]"]:
        el = soup.select_one(sel)
        if el and el.get("src"):
            src = el.get("src")
            if src.startswith("http"):
                image = src
            else:
                image = BASE_URL + src
            break

    # Descripción
    description = None
    for sel in ["div.product-description", "div.product attribute description", "div#description", "div[itemprop='description']"]:
        el = soup.select_one(sel)
        if el:
            description = el.get_text("\n", strip=True)
            break

    # Precios y oferta
    current, original, discount_pct, on_offer = _extract_prices_from_soup(soup)

    # Características en español (tablas/definiciones)
    characteristics: Dict[str, Any] = {
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
    }

    # Buscar tablas de características
    def _assign_characteristic(label: str, value: str) -> None:
        key = CHARACTERISTICS_MAPPING.get(label.strip())
        if key:
            characteristics[key] = value.strip() if value else None
        else:
            # Mapear claves desconocidas a specs, manteniendo español
            if value:
                # Guardar en specs adicionales
                extra_key = f"caracteristica_{re.sub(r'[^a-z0-9]+', '_', label.lower()).strip('_')}"
                specs[extra_key] = value.strip()

    specs = {"tecnologias": []}

    # Método 1: Tablas HTML <table> con filas <tr><th>/<td> o <tr><td> label : value
    for table in soup.find_all("table"):
        for tr in table.find_all("tr"):
            th = tr.find("th")
            tds = tr.find_all("td")
            if th and tds:
                label = _extract_text(th) or ""
                value = _extract_text(tds[-1]) or ""
                if label:
                    _assign_characteristic(label, value)
            elif len(tds) >= 2:
                label = _extract_text(tds[0]) or ""
                value = _extract_text(tds[1]) or ""
                if label:
                    _assign_characteristic(label, value)

    # Método 2: Listas de características tipo <dl><dt><dd>
    for dl in soup.find_all("dl"):
        dts = dl.find_all("dt")
        dds = dl.find_all("dd")
        for dt, dd in zip(dts, dds):
            label = _extract_text(dt) or ""
            value = _extract_text(dd) or ""
            if label:
                _assign_characteristic(label, value)

    # Método 3: Listas <ul><li> con formato "Etiqueta: Valor"
    for ul in soup.find_all("ul"):
        for li in ul.find_all("li"):
            li_text = _extract_text(li) or ""
            if ":" in li_text:
                parts = li_text.split(":", 1)
                if len(parts) == 2:
                    label = parts[0].strip()
                    value = parts[1].strip()
                    if label:
                        _assign_characteristic(label, value)

    # Método 4: Extracción desde descripción con regex para patrones tipo "Etiqueta: Valor"
    if description:
        # Buscar líneas con formato "Campo: Valor" en la descripción
        pattern_lines = re.findall(
            r'([A-Za-zÁ-ÿ\s]+):\s*([^\n\r]+)',
            description,
            flags=re.MULTILINE
        )
        for label, value in pattern_lines:
            label = label.strip()
            value = value.strip()
            if label and value and len(label) < 50 and len(value) < 200:
                _assign_characteristic(label, value)

    # Specs desde descripción
    if description:
        specs_desc = _extract_specs(description)
        # Merge specs
        for k, v in specs_desc.items():
            specs[k] = v

    # Inferir brand/model si no vienen en características
    brand = characteristics.get("characteristics_brand")
    model = None
    if not brand:
        brand, model = _infer_brand_and_model(name)
    else:
        # Model a partir del nombre quitando la marca si coincide
        if name and brand and name.lower().startswith(brand.lower()):
            model = name[len(brand):].strip()
        else:
            model = None

    # Limpiar el modelo si existe
    if model:
        model = clean_name_and_model(model)

    scraped: Dict[str, Any] = {
        "name": name,
        "brand": brand,
        "model": model,
        "image": image,
        "on_offer": on_offer,
        "description": description,
        # Características
        **characteristics,
        # Specs
        "specs": specs,
        # Campos tienda TiendaPadelPoint
        "padelpoint_actual_price": current,
        "padelpoint_original_price": original,
        "padelpoint_discount_percentage": discount_pct,
        "padelpoint_link": url,
    }

    return scraped


def apply_update_or_create(data: List[Dict[str, Any]], scraped: Dict[str, Any]) -> None:
    name = scraped.get("name")
    idx = find_existing_index_by_name(data, name)
    if idx is not None:
        # Solo actualizar campos padelpoint_*
        for key in [
            "padelpoint_actual_price",
            "padelpoint_original_price",
            "padelpoint_discount_percentage",
            "padelpoint_link",
        ]:
            data[idx][key] = scraped.get(key)
        logging.debug(f"Actualizada entrada existente para '{name}' con datos padelpoint_*")
    else:
        # Crear nueva entrada con esquema completo, rellenando faltantes con null
        entry = default_racket_structure()
        for k, v in scraped.items():
            entry[k] = v
        data.append(entry)
        logging.debug(f"Creada nueva entrada para '{name}'")


def main():
    setup_logging()
    print("\n" + "="*60)
    print("🚀 Iniciando scrapper TiendaPadelPoint")
    print("="*60)
    logging.info("Inicio scrapper TiendaPadelPoint")

    data = load_json()

    session = requests.Session()

    # Obtener total de páginas
    print("\n📄 Detectando total de páginas del catálogo...")
    total_pages = get_total_pages(session)
    print(f"✓ Total de páginas detectadas: {total_pages}")

    # Recolectar enlaces de todas las páginas
    print(f"\n🔍 Recolectando enlaces de productos...")
    all_links: List[str] = []
    for page in range(1, total_pages + 1):
        try:
            links = scrape_catalog_page(session, page)
            print(f"  Página {page}/{total_pages}: {len(links)} enlaces encontrados")
            logging.info(f"Página {page}: {len(links)} enlaces")
            all_links.extend(links)

            # Terminar si no se encuentran productos en una página
            if len(links) == 0:
                print(f"\n⚠️  Página {page} sin productos - finalizando recolección")
                logging.info(f"Página {page} sin productos - terminando")
                break
        except Exception as e:
            logging.error(f"Error obteniendo enlaces en página {page}: {e}")
            print(f"  ❌ Error en página {page}: {e}")

    # Deduplicar manteniendo orden
    seen = set()
    all_unique_links: List[str] = []
    for l in all_links:
        if l not in seen:
            all_unique_links.append(l)
            seen.add(l)

    print(f"\n✓ Total enlaces únicos recolectados: {len(all_unique_links)}")
    logging.info(f"Total enlaces únicos de producto: {len(all_unique_links)}")

    # Verificar que hay productos para procesar
    if not all_unique_links or len(all_unique_links) == 0:
        print("\n" + "="*60)
        print("⚠️  No se encontraron productos para procesar")
        print("="*60)
        logging.warning("No se encontraron URLs de productos. Finalizando.")
        return

    # Scrape concurrente de detalle
    print(f"\n🔄 Procesando {len(all_unique_links)} productos...")
    print("="*60)

    productos_actualizados = 0
    productos_nuevos = 0
    productos_fallidos = 0

    futures = []
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        for url in all_unique_links:
            futures.append(executor.submit(scrape_product_detail, session, url))

        for idx, future in enumerate(as_completed(futures), 1):
            try:
                scraped = future.result()
                if scraped:
                    # Verificar si es actualización o nuevo
                    name = scraped.get("name")
                    existing_idx = find_existing_index_by_name(data, name)

                    apply_update_or_create(data, scraped)

                    if existing_idx is not None:
                        productos_actualizados += 1
                        print(f"  [{idx}/{len(all_unique_links)}] ✓ Actualizado: {name}")
                    else:
                        productos_nuevos += 1
                        print(f"  [{idx}/{len(all_unique_links)}] ➕ Nuevo: {name}")
                else:
                    productos_fallidos += 1
                    print(f"  [{idx}/{len(all_unique_links)}] ❌ Fallo al procesar producto")
            except Exception as e:
                productos_fallidos += 1
                logging.error(f"Error procesando detalle de producto: {e}")
                print(f"  [{idx}/{len(all_unique_links)}] ❌ Error: {e}")

    # Guardar resultados
    print("\n💾 Guardando datos en rackets.json...")
    save_json(data)

    # Resumen final
    print("\n" + "="*60)
    print("🎉 Scrapping TiendaPadelPoint FINALIZADO")
    print("="*60)
    print(f"Total productos procesados:  {len(all_unique_links)}")
    print(f"  ✓ Actualizados:            {productos_actualizados}")
    print(f"  ➕ Nuevos:                 {productos_nuevos}")
    print(f"  ❌ Fallidos:               {productos_fallidos}")
    print("="*60)

    logging.info(f"Fin scrapper TiendaPadelPoint - Actualizados: {productos_actualizados}, Nuevos: {productos_nuevos}, Fallidos: {productos_fallidos}")


if __name__ == "__main__":
    main()