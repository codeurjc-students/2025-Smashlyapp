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
    # Configurar logging tanto a archivo como a consola
    logger = logging.getLogger()
    logger.setLevel(logging.INFO)

    # Handler para archivo
    file_handler = logging.FileHandler(LOG_FILE, mode='a', encoding='utf-8')
    file_handler.setLevel(logging.DEBUG)
    file_formatter = logging.Formatter('%(asctime)s [%(levelname)s] %(message)s')
    file_handler.setFormatter(file_formatter)
    logger.addHandler(file_handler)

    # Handler para consola (stderr)
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)
    console_formatter = logging.Formatter('%(message)s')
    console_handler.setFormatter(console_formatter)
    logger.addHandler(console_handler)

    logging.info("Logging configurado a nivel INFO")


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


def normalize_name(name: Optional[str]) -> Optional[str]:
    """
    Normaliza un nombre de pala para comparación.
    Elimina prefijos/sufijos, espacios extra, y convierte a minúsculas.
    """
    if not name:
        return None
    n = name.strip()
    # Quitar prefijo "Pala " (con o sin mayúscula y espacios)
    n = re.sub(r'^\s*Pala\s+', '', n, flags=re.IGNORECASE)
    # Normalizar espacios múltiples
    n = re.sub(r'\s+', ' ', n)
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
    """
    Extrae precios actual y original desde el HTML.
    Intenta múltiples métodos: JSON embebido, clases CSS, y fallback.
    """
    current = None
    original = None

    # Método 1: Extraer de datos JSON embebidos (Shopify Analytics, etc.)
    try:
        for script in soup.find_all('script'):
            if not script.string:
                continue

            script_content = script.string

            # Buscar patrones de precio en JSON
            # Patrón 1: "price":{"amount":259.95,"currencyCode":"EUR"}
            price_match = re.search(r'"price"\s*:\s*\{\s*"amount"\s*:\s*([\d.]+)', script_content)
            if price_match and current is None:
                current = float(price_match.group(1))

            # Patrón 2: "price":25995 (en centavos)
            if current is None:
                price_cents_match = re.search(r'"price"\s*:\s*(\d+)\s*,\s*["\']?currencyCode["\']?\s*:\s*["\']EUR["\']', script_content)
                if price_cents_match:
                    current = float(price_cents_match.group(1)) / 100

            # Buscar precio original/comparación
            compare_match = re.search(r'[Cc]ompare[Aa]t[Pp]rice["\']?\s*:\s*["\']?([\d,]+)', script_content)
            if compare_match and original is None:
                compare_str = compare_match.group(1).replace(',', '.')
                try:
                    original = float(compare_str)
                except ValueError:
                    pass
    except Exception as e:
        logging.debug(f"Error extrayendo precios de JSON: {e}")

    # Método 2: Buscar en elementos HTML con clases típicas de Shopify
    if current is None:
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
        if regular_texts:
            original = _parse_price(' '.join(regular_texts))

    # Método 3: Fallback - buscar cualquier número con euro
    if not current:
        euro_texts = [el.get_text(strip=True) for el in soup.find_all(text=re.compile(r"€"))]
        if euro_texts:
            prices = [p for p in (_parse_price(t) for t in euro_texts) if p]
            if prices:
                current = min(prices)
                if len(prices) > 1:
                    original = max(prices)

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

    # Usar lxml parser para mejor compatibilidad
    soup = BeautifulSoup(resp.text, 'lxml')

    json_ld = _extract_json_ld(soup)

    # Nombre - intentar múltiples fuentes
    name = None

    # Método 1: JSON-LD
    if json_ld and json_ld.get('name'):
        try:
            name = str(json_ld.get('name')).strip()
        except Exception as e:
            logging.debug(f"Error extrayendo nombre de JSON-LD: {e}")

    # Método 2: h1 (fallback)
    if not name:
        h1 = soup.find('h1')
        if h1:
            name = h1.get_text(strip=True)

    # Método 3: og:title (segundo fallback)
    if not name:
        og_title = soup.find('meta', property='og:title')
        if og_title and og_title.get('content'):
            name = og_title['content'].strip()
            # Limpiar el sufijo del sitio si existe
            name = re.sub(r'\s*\|\s*PadelPROShop\s*$', '', name, flags=re.IGNORECASE)

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

    # Normalizar el nombre (mantener capitalización original, solo limpiar)
    normalized_name = name.strip() if name else None

    # Completar los campos del resultado
    result: Dict[str, Any] = {
        'name': normalized_name,
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

    # Comentado para evitar problemas de encoding en Windows
    # logging.debug(f"Producto extraído: {result['name']} | Precio: {current_price} | Descuento: {discount_pct}")
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

    # Umbral de similitud: 85%
    SIMILARITY_THRESHOLD = 0.85

    if best_similarity >= SIMILARITY_THRESHOLD and best_match_idx is not None:
        existing_name = data[best_match_idx].get("name")
        logging.info(f"Match por similitud {best_method} ({best_similarity*100:.1f}%): '{name}' ~= '{existing_name}'")
        return best_match_idx

    # No se encontró match
    if best_similarity > 0.5:  # Log solo si hubo alguna similitud considerable
        logging.info(f"No match para '{name}' (mejor similitud: {best_similarity*100:.1f}%)")

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
    print("="*60)
    print("Inicio de scrapper PadelProShop")
    print("="*60)
    logging.info("Inicio del scrapper PadelProShop")

    data = load_json(OUTPUT_FILE)
    print(f"Cargadas {len(data)} palas existentes del JSON")

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
            print(f"Scrape detalle: {url}")

            scraped = scrape_product_detail(url)
            if not scraped or not scraped.get('name'):
                logging.warning(f"No se pudo extraer información de {url}")
                continue

            name = scraped.get('name')
            brand = scraped.get('brand')

            # Buscar pala existente usando el algoritmo mejorado
            match_idx = find_existing_index_by_name(data, name, brand)

            if match_idx is not None:
                # Actualizar solo campos de PadelProShop
                entry = data[match_idx]
                entry['padelproshop_actual_price'] = scraped.get('padelproshop_actual_price')
                entry['padelproshop_original_price'] = scraped.get('padelproshop_original_price')
                entry['padelproshop_discount_percentage'] = scraped.get('padelproshop_discount_percentage')
                entry['padelproshop_link'] = scraped.get('padelproshop_link')

                # Actualizar imagen solo si no existe
                if not entry.get('image') and scraped.get('image'):
                    entry['image'] = scraped.get('image')

                # Actualizar on_offer basado en todas las tiendas
                pn_discount = entry.get('padelnuestro_discount_percentage')
                pm_discount = entry.get('padelmarket_discount_percentage')
                pp_discount = entry.get('padelproshop_discount_percentage')
                has_offer = (pn_discount and pn_discount > 0) or (pm_discount and pm_discount > 0) or (pp_discount and pp_discount > 0)
                entry['on_offer'] = bool(has_offer)

                print(f"[OK] Actualizado (PadelProShop): {entry['name']}")
                logging.info(f"[OK] Actualizado (PadelProShop): {entry['name']}")
            else:
                # Crear nueva entrada completa
                logging.info(f"Creada nueva entrada: {name}")
                print(f"Creada nueva entrada: {name}")
                new_entry = _create_new_entry_from_scraped(scraped)
                data.append(new_entry)

            # Guardado incremental para no perder progreso
            save_json(OUTPUT_FILE, data)
            print(f"Guardado {len(data)} palas en {OUTPUT_FILE}")

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
    main()
    pass