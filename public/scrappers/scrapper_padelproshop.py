#!/usr/bin/env python3
"""
Scrapper para PadelProShop

Objetivo:
- Recorrer todo el catálogo de palas (scroll infinito) en:
  https://padelproshop.com/collections/palas-padel
- Extraer datos detallados de cada pala desde la página de producto
- Actualizar/crear entradas en rackets.json siguiendo el esquema indicado

No ejecutar automáticamente. Este script está listo para ser lanzado manualmente.
"""

import json
import time
import logging
import re
from typing import Dict, Any, List, Optional, Tuple
from pathlib import Path

import requests
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options as ChromeOptions
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException


# Configuración general
BASE_URL = "https://padelproshop.com"
COLLECTION_URL = f"{BASE_URL}/collections/palas-padel"
OUTPUT_FILE = "rackets.json"
LOG_FILE = "scrapper.log"
SCROLL_DELAY_SECONDS = 1
REQUEST_TIMEOUT = 15

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
}


CHARACTERISTICS_MAPPING = {
    # Mapeo de etiquetas en español a claves del JSON
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
    'Nivel de juego': 'characteristics_game_level',
    'Acabado': 'characteristics_finish',
    'Forma': 'characteristics_shape',
    'Superficie': 'characteristics_surface',
    'Tipo de juego': 'characteristics_game_type',
    'Colección jugadores': 'characteristics_player_collection',
    'Jugador': 'characteristics_player',
}


def setup_logging() -> None:
    logging.basicConfig(
        filename=LOG_FILE,
        filemode='a',
        level=logging.DEBUG,
        format='%(asctime)s [%(levelname)s] %(message)s'
    )
    logging.debug("Logging configurado a nivel DEBUG")


def default_racket_structure() -> Dict[str, Any]:
    return {
        # Campos principales
        "name": None,
        "brand": None,
        "model": None,
        "image": None,
        "on_offer": None,
        "description": None,
        # Características
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
        # Especificaciones
        "specs": {
            "tecnologias": [],
            "peso": None,
            "marco": None,
        },
        # Campos tienda PadelNuestro (compatibilidad)
        "padelnuestro_actual_price": None,
        "padelnuestro_original_price": None,
        "padelnuestro_discount_percentage": None,
        "padelnuestro_link": None,
        # Campos tienda PadelMarket (compatibilidad)
        "padelmarket_actual_price": None,
        "padelmarket_original_price": None,
        "padelmarket_discount_percentage": None,
        "padelmarket_link": None,
        # Campos tienda PadelProShop (este scraper)
        "padelproshop_actual_price": None,
        "padelproshop_original_price": None,
        "padelproshop_discount_percentage": None,
        "padelproshop_link": None,
    }


def load_json(path: str) -> List[Dict[str, Any]]:
    setup_logging()
    p = Path(path)
    if not p.exists():
        logging.info("rackets.json no existe, creando uno nuevo como lista vacía")
        return []
    try:
        with p.open('r', encoding='utf-8') as f:
            data = json.load(f)
            if isinstance(data, list):
                logging.debug(f"Se cargaron {len(data)} entradas del JSON")
                return data
            else:
                logging.warning("El JSON no es una lista; se usará lista vacía")
                return []
    except Exception as e:
        logging.error(f"Error cargando JSON: {e}")
        return []


def save_json(path: str, data: List[Dict[str, Any]]) -> None:
    try:
        with Path(path).open('w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        logging.info(f"JSON guardado con {len(data)} entradas en {path}")
    except Exception as e:
        logging.error(f"Error guardando JSON: {e}")


def normalize_name(name: str) -> str:
    if not name:
        return ""
    # Eliminar prefijo "Pala " (con o sin mayúscula y espacios)
    n = re.sub(r'^\s*Pala\s+', '', name, flags=re.IGNORECASE)
    n = re.sub(r'\s+', ' ', n).strip()
    return n.upper()


def calculate_discount(original: Optional[float], current: Optional[float]) -> Optional[int]:
    try:
        if original and current and original > 0 and current > 0 and original > current:
            pct = round((original - current) / original * 100)
            return int(pct)
        return 0 if (original and current) else None
    except Exception as e:
        logging.debug(f"Error calculando descuento: {e}")
        return None


def _get_requests_session() -> requests.Session:
    s = requests.Session()
    s.headers.update(HEADERS)
    return s


def _parse_price(text: str) -> Optional[float]:
    if not text:
        return None
    # Extraer números con coma o punto decimal
    m = re.findall(r"\d+[\.,]?\d*", text)
    if not m:
        return None
    # Tomar el primer número relevante
    raw = m[0].replace('.', '').replace(',', '.')
    try:
        return float(raw)
    except ValueError:
        return None


def _extract_prices_from_soup(soup: BeautifulSoup) -> Tuple[Optional[float], Optional[float]]:
    # Intentar primero con estructura Shopify común
    # price-item--sale y price-item--regular/compare
    current = None
    original = None

    def find_text_by_classes(classes: List[str]) -> List[str]:
        texts = []
        for cls in classes:
            for el in soup.select(f'.{cls}'):
                t = el.get_text(strip=True)
                if t:
                    texts.append(t)
        return texts

    sale_texts = find_text_by_classes([
        'price-item--sale', 'price__sale', 'product__price', 'price--sale'
    ])
    regular_texts = find_text_by_classes([
        'price-item--regular', 'price__regular', 'price--regular', 'price--compare'
    ])

    if sale_texts:
        current = _parse_price(' '.join(sale_texts))
    # La original puede aparecer en compare/regular
    if regular_texts:
        original = _parse_price(' '.join(regular_texts))

    # Fallback: buscar por símbolo €
    if not current or not original:
        euro_texts = [el.get_text(strip=True) for el in soup.find_all(text=re.compile(r"€"))]
        if euro_texts:
            # Suponemos el menor como precio actual y el mayor como original
            prices = [p for p in (_parse_price(t) for t in euro_texts) if p]
            if prices:
                current = min(prices) if not current else current
                original = max(prices) if not original else original

    return current, original


def _extract_json_ld(soup: BeautifulSoup) -> Dict[str, Any]:
    data: Dict[str, Any] = {}
    try:
        for script in soup.find_all('script', type='application/ld+json'):
            try:
                content = json.loads(script.string or '{}')
            except Exception:
                continue
            # Puede ser lista o objeto
            items = content if isinstance(content, list) else [content]
            for item in items:
                if isinstance(item, dict) and item.get('@type') == 'Product':
                    data = item
                    return data
    except Exception as e:
        logging.debug(f"Error leyendo JSON-LD: {e}")
    return data


def scrape_product_detail(url: str) -> Dict[str, Any]:
    logging.debug(f"Scrapeando detalle de producto: {url}")
    session = _get_requests_session()
    try:
        resp = session.get(url, timeout=REQUEST_TIMEOUT)
        resp.raise_for_status()
    except Exception as e:
        logging.error(f"Error al solicitar {url}: {e}")
        return {}

    soup = BeautifulSoup(resp.text, 'html.parser')

    json_ld = _extract_json_ld(soup)

    # Nombre
    name = None
    if json_ld.get('name'):
        name = str(json_ld.get('name')).strip()
    else:
        h1 = soup.find('h1')
        name = h1.get_text(strip=True) if h1 else None

    # Imagen (solo URL)
    image_url = None
    if json_ld.get('image'):
        if isinstance(json_ld['image'], list):
            image_url = json_ld['image'][0]
        elif isinstance(json_ld['image'], str):
            image_url = json_ld['image']
    if not image_url:
        og = soup.find('meta', property='og:image')
        image_url = og['content'] if og and og.get('content') else None

    # Marca y modelo
    brand = None
    model = None
    if json_ld.get('brand'):
        if isinstance(json_ld['brand'], dict):
            brand = json_ld['brand'].get('name')
        elif isinstance(json_ld['brand'], str):
            brand = json_ld['brand']
    # Modelo: derivado del nombre si hay marca
    normalized = normalize_name(name or "")
    if normalized:
        if brand:
            # Quitar la marca del comienzo si coincide
            pattern = re.compile(rf'^\s*{re.escape(brand)}\s+', re.IGNORECASE)
            model = pattern.sub('', normalized).strip()
        else:
            # Sin marca, tomar la primera palabra como marca tentativa
            parts = normalized.split(' ', 1)
            brand = parts[0] if parts else None
            model = parts[1] if len(parts) > 1 else None

    # Precios
    current_price, original_price = _extract_prices_from_soup(soup)
    if not current_price and isinstance(json_ld.get('offers'), dict):
        current_price = _parse_price(str(json_ld['offers'].get('price')))

    discount_pct = calculate_discount(original_price, current_price)
    on_offer = bool(discount_pct and discount_pct > 0)

    # Descripción
    description = None
    if json_ld.get('description'):
        description = str(json_ld['description']).strip()
    else:
        desc_container = soup.select_one('.product__description, .product-description, .rte')
        description = desc_container.get_text("\n", strip=True) if desc_container else None

    # Características y especificaciones
    characteristics: Dict[str, Any] = {}
    specs: Dict[str, Any] = {}

    # Buscar pares tipo tabla/definición (dt/dd) o filas de tabla
    for dl in soup.find_all('dl'):
        dts = dl.find_all('dt')
        dds = dl.find_all('dd')
        for dt, dd in zip(dts, dds):
            key = dt.get_text(strip=True)
            value = dd.get_text(" ", strip=True)
            _assign_characteristic_or_spec(key, value, characteristics, specs)

    for table in soup.find_all('table'):
        for tr in table.find_all('tr'):
            tds = tr.find_all(['td', 'th'])
            if len(tds) >= 2:
                key = tds[0].get_text(strip=True)
                value = tds[1].get_text(" ", strip=True)
                _assign_characteristic_or_spec(key, value, characteristics, specs)

    # También listas con posibles características
    for ul in soup.find_all('ul'):
        for li in ul.find_all('li'):
            text = li.get_text(" ", strip=True)
            # Intentar patrones como "Forma: Diamante"
            m = re.match(r"^([A-Za-zÁÉÍÓÚÑáéíóúñ ]{3,}):\s*(.+)$", text)
            if m:
                key, value = m.group(1).strip(), m.group(2).strip()
                _assign_characteristic_or_spec(key, value, characteristics, specs)
            else:
                # Si no, acumular como posibles tecnologías en specs
                if 'tecnologias' not in specs:
                    specs['tecnologias'] = []
                if text and text not in specs['tecnologias']:
                    specs['tecnologias'].append(text)

    # Completar los campos del resultado
    result: Dict[str, Any] = {
        'name': normalize_name(name or ""),
        'brand': brand,
        'model': model,
        'image': image_url,
        'on_offer': on_offer,
        'description': description,
        'characteristics': characteristics,
        'specs': specs,
        'padelproshop_actual_price': current_price,
        'padelproshop_original_price': original_price,
        'padelproshop_discount_percentage': discount_pct,
        'padelproshop_link': url,
    }

    logging.debug(f"Producto extraído: {result['name']} | Precio: {current_price} | Descuento: {discount_pct}")
    return result


def _assign_characteristic_or_spec(key: str, value: str, characteristics: Dict[str, Any], specs: Dict[str, Any]) -> None:
    key_clean = key.strip()
    mapped = CHARACTERISTICS_MAPPING.get(key_clean)
    if mapped:
        characteristics[mapped] = value
    else:
        # Guardar en specs si no está mapeado
        specs[key_clean] = value


def scroll_and_collect_links(driver: webdriver.Chrome) -> List[str]:
    logging.info("Iniciando scroll infinito para recolectar URLs de producto")
    driver.get(COLLECTION_URL)

    # Esperar que cargue el grid de productos
    try:
        WebDriverWait(driver, 20).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, 'a[href*="/products/"]'))
        )
    except TimeoutException:
        logging.error("Timeout esperando el grid de productos")
        return []

    last_height = driver.execute_script("return document.body.scrollHeight")
    stable_iterations = 0
    max_stable = 5  # parar tras varias iteraciones sin aumentar

    while True:
        driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
        time.sleep(SCROLL_DELAY_SECONDS)
        new_height = driver.execute_script("return document.body.scrollHeight")
        if new_height == last_height:
            stable_iterations += 1
            logging.debug(f"Scroll estable {stable_iterations}/{max_stable}")
            if stable_iterations >= max_stable:
                break
        else:
            stable_iterations = 0
            last_height = new_height

    # Recoger enlaces de producto
    anchors = driver.find_elements(By.CSS_SELECTOR, 'a[href*="/products/"]')
    urls = set()
    for a in anchors:
        href = a.get_attribute('href')
        if href and href.startswith(BASE_URL) and "/products/" in href:
            urls.add(href.split('?')[0])  # normalizar sin queries

    urls_list = sorted(urls)
    logging.info(f"Recolectadas {len(urls_list)} URLs de producto")
    return urls_list


def _find_racket_index_by_name(data: List[Dict[str, Any]], normalized_name: str) -> Optional[int]:
    for i, item in enumerate(data):
        if normalize_name(item.get('name') or '') == normalized_name:
            return i
    return None


def _create_new_entry_from_scraped(scraped: Dict[str, Any]) -> Dict[str, Any]:
    entry = default_racket_structure()
    entry['name'] = scraped.get('name')
    entry['brand'] = scraped.get('brand')
    entry['model'] = scraped.get('model')
    entry['image'] = scraped.get('image')
    entry['on_offer'] = scraped.get('on_offer')
    entry['description'] = scraped.get('description')

    # Características mapeadas
    ch = scraped.get('characteristics') or {}
    for key, value in ch.items():
        entry[key] = value

    # Especificaciones
    specs = scraped.get('specs') or {}
    entry['specs'] = specs

    # Campos tienda PadelProShop
    entry['padelproshop_actual_price'] = scraped.get('padelproshop_actual_price')
    entry['padelproshop_original_price'] = scraped.get('padelproshop_original_price')
    entry['padelproshop_discount_percentage'] = scraped.get('padelproshop_discount_percentage')
    entry['padelproshop_link'] = scraped.get('padelproshop_link')

    return entry


def main():
    setup_logging()
    logging.info("Inicio del scrapper PadelProShop")

    data = load_json(OUTPUT_FILE)

    # Configurar Selenium (Chrome)
    chrome_options = ChromeOptions()
    chrome_options.add_argument('--headless=new')
    chrome_options.add_argument('--disable-gpu')
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--window-size=1920,1080')

    driver = webdriver.Chrome(options=chrome_options)

    try:
        product_urls = scroll_and_collect_links(driver)
        logging.info(f"Total de URLs a procesar: {len(product_urls)}")

        for idx, url in enumerate(product_urls, start=1):
            logging.debug(f"Procesando {idx}/{len(product_urls)}: {url}")
            scraped = scrape_product_detail(url)
            if not scraped or not scraped.get('name'):
                logging.warning(f"No se pudo extraer información de {url}")
                continue

            normalized = scraped['name']
            match_idx = _find_racket_index_by_name(data, normalized)

            if match_idx is not None:
                # Actualizar solo campos de PadelProShop
                logging.debug(f"Match en JSON para {normalized} (índice {match_idx}) - actualizando campos padelproshop_*")
                data[match_idx]['padelproshop_actual_price'] = scraped.get('padelproshop_actual_price')
                data[match_idx]['padelproshop_original_price'] = scraped.get('padelproshop_original_price')
                data[match_idx]['padelproshop_discount_percentage'] = scraped.get('padelproshop_discount_percentage')
                data[match_idx]['padelproshop_link'] = scraped.get('padelproshop_link')
            else:
                # Crear nueva entrada completa
                logging.debug(f"Nueva pala detectada: {normalized} - creando entrada con esquema completo")
                new_entry = _create_new_entry_from_scraped(scraped)
                data.append(new_entry)

            # Pequeño delay entre peticiones para cortesía
            time.sleep(0.2)

        # Guardar JSON final
        save_json(OUTPUT_FILE, data)
        logging.info("Scrapper PadelProShop finalizado")

    finally:
        try:
            driver.quit()
        except Exception:
            pass


if __name__ == "__main__":
    # No ejecutar automáticamente. Dejar preparado para ejecución manual.
    # main()
    pass