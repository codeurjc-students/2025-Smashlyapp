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
    if not name:
        return None
    n = name.strip()
    # Eliminar prefijos como "Pala"
    n = re.sub(r"^\s*Pala\s+", "", n, flags=re.IGNORECASE)
    # Normalizar espacios
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


def scrape_catalog_page(session: requests.Session, page_number: int) -> List[str]:
    url = catalog_page_url(page_number)
    logging.info(f"Scrape catálogo página {page_number}: {url}")
    soup = request_soup(session, url)
    if soup is None:
        return []

    product_links: List[str] = []

    # Intento 1: tarjetas de producto comunes
    for a in soup.select("a[href]"):
        href = a.get("href", "").strip()
        if not href:
            continue
        # Filtrar enlaces que parecen productos de palas
        # Heurísticas: contienen '/pala' o '/palas-' o slug con REF/EAN
        if "/pala" in href or "/palas" in href or "/producto" in href:
            # Normalizar absoluta
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


# Mapeo de etiquetas en español a claves characteristics_*
CHARACTERISTICS_MAPPING = {
    'Marca': 'characteristics_brand',
    'Color': 'characteristics_color',
    'Color 2': 'characteristics_color_2',
    'Producto': 'characteristics_product',
    'Balance': 'characteristics_balance',
    'Núcleo': 'characteristics_core',
    'Core': 'characteristics_core',
    'Cara': 'characteristics_face',
    'Material': 'characteristics_face',
    'Formato': 'characteristics_format',
    'Dureza': 'characteristics_hardness',
    'Nivel de Juego': 'characteristics_game_level',
    'Nivel de juego': 'characteristics_game_level',
    'Acabado': 'characteristics_finish',
    'Forma': 'characteristics_shape',
    'Superficie': 'characteristics_surface',
    'Tipo de Juego': 'characteristics_game_type',
    'Colección Jugadores': 'characteristics_player_collection',
    'Colección jugadores': 'characteristics_player_collection',
    'Jugador': 'characteristics_player',
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
    specs: Dict[str, Any] = {"tecnologias": []}
    if not description_text:
        return specs

    txt = description_text

    # Tecnologías: heurística simple, palabras en mayúsculas y términos comunes
    tech_candidates = set()
    for token in re.findall(r"\b[A-Z][A-Z0-9]{2,}\b", txt):
        tech_candidates.add(token)
    # Palabras clave conocidas
    for kw in ["EVA", "CARBON", "SPIN", "STRUCTURE", "REINFORCEMENT", "ALUMINIZED", "XR", "3K", "12K", "18K"]:
        if kw in txt.upper():
            tech_candidates.add(kw)
    if tech_candidates:
        specs["tecnologias"] = sorted(list(tech_candidates))

    # Peso y marco
    m_peso = re.search(r"(\d+)\s*g(?:r|ramos)?", txt, flags=re.IGNORECASE)
    if m_peso:
        specs["peso"] = f"{m_peso.group(1)}g"

    if "carbono" in txt.lower():
        if "100%" in txt:
            specs["marco"] = "100% Carbono"
        else:
            specs["marco"] = "Carbono"

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

    # Tablas comunes: <table> con filas <tr><th>/<td> o <tr><td> label : value
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

    # Listas de características tipo <dl><dt><dd>
    for dl in soup.find_all("dl"):
        dts = dl.find_all("dt")
        dds = dl.find_all("dd")
        for dt, dd in zip(dts, dds):
            label = _extract_text(dt) or ""
            value = _extract_text(dd) or ""
            if label:
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
    logging.info("Inicio scrapper TiendaPadelPoint")

    data = load_json()

    session = requests.Session()

    total_pages = get_total_pages(session)
    all_links: List[str] = []
    for page in range(1, total_pages + 1):
        try:
            links = scrape_catalog_page(session, page)
            logging.info(f"Página {page}: {len(links)} enlaces")
            all_links.extend(links)
        except Exception as e:
            logging.error(f"Error obteniendo enlaces en página {page}: {e}")

    # Deduplicar manteniendo orden
    seen = set()
    all_unique_links: List[str] = []
    for l in all_links:
        if l not in seen:
            all_unique_links.append(l)
            seen.add(l)

    logging.info(f"Total enlaces únicos de producto: {len(all_unique_links)}")

    # Scrape concurrente de detalle
    futures = []
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        for url in all_unique_links:
            futures.append(executor.submit(scrape_product_detail, session, url))

        for future in as_completed(futures):
            try:
                scraped = future.result()
                if scraped:
                    apply_update_or_create(data, scraped)
            except Exception as e:
                logging.error(f"Error procesando detalle de producto: {e}")

    save_json(data)
    logging.info("Fin scrapper TiendaPadelPoint")


if __name__ == "__main__":
    # No ejecutar automáticamente
    pass