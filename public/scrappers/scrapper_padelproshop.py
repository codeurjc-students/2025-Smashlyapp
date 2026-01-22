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
from datetime import datetime
from typing import Dict, Any, List, Optional, Tuple
from pathlib import Path

import requests
from bs4 import BeautifulSoup
from selenium import webdriver

# Import matching utils
try:
    from matching_utils import (
        normalize_name,
        create_comparison_key,
        calculate_similarity,
        calculate_token_similarity,
        check_critical_keywords,
        extract_brand_from_name,
        calculate_composite_score,
    )
except ImportError:
    import sys
    import os
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    from matching_utils import (
        normalize_name,
        create_comparison_key,
        calculate_similarity,
        calculate_token_similarity,
        check_critical_keywords,
        extract_brand_from_name,
        calculate_composite_score,
    )

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
        # Especificaciones técnicas
        "specs": {
            "tecnologias": [],
            "peso": None,
            "marco": None,
            "grosor": None,  # Nuevo: perfil/grosor (ej: 38mm)
            "to": None,     # Nuevo: año del modelo (ej: 2026)
        },
        # Métricas numéricas (0-10) - scrapear de tumejorpala o calcular
        "score_control": None,
        "score_power": None,
        "score_rebound": None,
        "score_handling": None,
        "score_sweet_spot": None,
        "score_global": None,
        # Meta-datos
        "last_updated": None,
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
        # Campos tienda TiendaPadelPoint
        "padelpoint_actual_price": None,
        "padelpoint_original_price": None,
        "padelpoint_discount_percentage": None,
        "padelpoint_link": None,
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


    return versions

# Eliminadas funciones locales duplicadas: tokenize_name, normalize_name, create_comparison_key, calculate_similarity



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
            # Sin marca, intentar extraer usando la lista conocida
            extracted_brand, extracted_model = extract_brand_from_name(name)
            if extracted_brand:
                brand = extracted_brand
                model = extracted_model
            else:
                # Fallback final: tomar primera palabra
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
    specs: Dict[str, Any] = {"tecnologias": []}

    # Buscar sección principal del producto
    product_section = soup.select_one("main, .product, .product-single, #product-content") or soup

    # 1. Buscar pares tipo tabla/definición (dt/dd) o filas de tabla
    for dl in product_section.find_all('dl'):
        dts = dl.find_all('dt')
        dds = dl.find_all('dd')
        for dt, dd in zip(dts, dds):
            key = dt.get_text(strip=True)
            value = dd.get_text(" ", strip=True)
            _assign_characteristic_or_spec(key, value, characteristics, specs)

    for table in product_section.find_all('table'):
        for tr in table.find_all('tr'):
            tds = tr.find_all(['td', 'th'])
            if len(tds) >= 2:
                key = tds[0].get_text(strip=True)
                value = tds[1].get_text(" ", strip=True)
                _assign_characteristic_or_spec(key, value, characteristics, specs)

    # 2. Listas con posibles características (solo en secciones del producto)
    specs_sections = product_section.select(
        ".product__description ul, .product-specs ul, .specifications ul, "
        ".product-details ul, .product-info ul, [class*='characteristic'] ul, "
        "[class*='specification'] ul, [class*='feature'] ul"
    )

    for ul in specs_sections:
        for li in ul.find_all('li'):
            text = li.get_text(" ", strip=True)

            # Filtrar elementos de navegación
            if any(nav_keyword in text.lower() for nav_keyword in
                   ["ver todo", "todas las", "marcas", "género", "juega como",
                    "black friday", "€", "precio", "pack", "cookies", "política",
                    "palas", "zapatillas", "ropa", "bolsas", "bestseller"]):
                continue

            # Intentar patrones como "Forma: Diamante"
            m = re.match(r"^([A-Za-zÁÉÍÓÚÑáéíóúñ ]{3,}):\s*(.+)$", text)
            if m:
                key, value = m.group(1).strip(), m.group(2).strip()
                _assign_characteristic_or_spec(key, value, characteristics, specs)
            else:
                # Tecnologías: verificar que sean razonables
                if text and len(text) < 100 and len(text) > 3:
                    if any(keyword in text.lower() for keyword in
                           ["eva", "carbon", "fibra", "spin", "structure", "system",
                            "grip", "reinforce", "smart", "rugos", "alum", "vibra",
                            "shock", "power", "control", "air", "foam", "frame", "tech",
                            "composite", "hybrid", "dynamic", "pulse"]):
                        if text not in specs['tecnologias']:
                            specs['tecnologias'].append(text)

    # 3. Extraer características desde la descripción usando patrones
    try:
        if description:
            desc_text = description

            # Patrones para extraer características comunes
            patterns = {
                "forma": r"forma\s+(?:de\s+)?([a-záéíóúñ]+)",
                "balance": r"balance\s+([a-záéíóúñ]+)",
                "núcleo": r"n[uú]cleo\s+(?:de\s+)?([a-z\s]+?)(?:\.|,|que|con|y)",
                "peso": r"peso\s+(?:de\s+)?(\d+[-–]\d+\s*g(?:r)?|\d+\s*g(?:r)?)",
                "dureza": r"dureza\s+([a-záéíóúñ\s]+?)(?:\.|,|que|con|y)",
                "nivel": r"nivel\s+([a-záéíóúñ\s/]+?)(?:\.|,|para|que|con)",
            }

            for key, pattern in patterns.items():
                match = re.search(pattern, desc_text.lower())
                if match:
                    value = match.group(1).strip()
                    if len(value) < 50:  # Evitar extracciones demasiado largas
                        _assign_characteristic_or_spec(key, value.title(), characteristics, specs)
    except Exception:
        pass

    # 4. Buscar tecnologías en texto usando mayúsculas y patrones
    try:
        full_text = product_section.get_text()
        # Buscar palabras en mayúsculas que parezcan nombres de tecnologías
        tech_pattern = r'\b([A-Z][a-z]*\s*[A-Z][A-Za-z]*(?:\s+[A-Z0-9][A-Za-z0-9]*)*)\b'
        potential_techs = re.findall(tech_pattern, full_text)

        for tech in potential_techs:
            if 5 < len(tech) < 60:  # Longitud razonable
                if any(keyword in tech.lower() for keyword in
                       ["system", "tech", "frame", "eva", "carbon", "grip",
                        "structure", "composite", "core", "smart", "power"]):
                    if tech not in specs['tecnologias']:
                        specs['tecnologias'].append(tech.strip())
    except Exception:
        pass

    # Limitar tecnologías a las 20 más relevantes
    if specs.get('tecnologias'):
        specs['tecnologias'] = specs['tecnologias'][:20]

    # Limpiar el nombre eliminando el prefijo "Pala" si existe
    cleaned_name = clean_name_and_model(name) if name else None

    # Limpiar también el modelo
    cleaned_model = clean_name_and_model(model) if model else None

    # Completar los campos del resultado
    result: Dict[str, Any] = {
        'name': cleaned_name,
        'brand': brand,
        'model': cleaned_model,
        'image': image_url,
        'on_offer': on_offer,
        'description': description,
        'characteristics': characteristics,
        'specs': specs,
        'padelproshop_actual_price': current_price,
        'padelproshop_original_price': original_price,
        'padelproshop_discount_percentage': discount_pct,
        'padelproshop_link': url,
        'last_updated': datetime.now().isoformat(),
    }

    # Comentado para evitar problemas de encoding en Windows
    # logging.debug(f"Producto extraído: {result['name']} | Precio: {current_price} | Descuento: {discount_pct}")
    return result


def _assign_characteristic_or_spec(key: str, value: str, characteristics: Dict[str, Any], specs: Dict[str, Any]) -> None:
    """
    Mapea una característica extraída a su campo correspondiente.
    Versión mejorada con mapeo ampliado en español e inglés.
    """
    h = key.strip().lower()
    v = value.strip() if value else None

    if not v:
        return

    # Mapeo ampliado de etiquetas comunes en español e inglés
    mapping = {
        # Marca
        "marca": "characteristics_brand",
        "brand": "characteristics_brand",

        # Color
        "color": "characteristics_color",
        "colores": "characteristics_color_2",
        "color 2": "characteristics_color_2",
        "colors": "characteristics_color_2",

        # Producto
        "producto": "characteristics_product",
        "product": "characteristics_product",

        # Balance
        "balance": "characteristics_balance",
        "punto de balance": "characteristics_balance",

        # Núcleo
        "núcleo": "characteristics_core",
        "nucleo": "characteristics_core",
        "core": "characteristics_core",
        "goma": "characteristics_core",
        "espuma": "characteristics_core",
        "foam": "characteristics_core",

        # Cara/Plano
        "cara": "characteristics_face",
        "caras": "characteristics_face",
        "plano": "characteristics_face",
        "planos": "characteristics_face",
        "material": "characteristics_face",
        "material cara": "characteristics_face",
        "material de cara": "characteristics_face",
        "surface material": "characteristics_face",
        "fibra": "characteristics_face",

        # Formato
        "formato": "characteristics_format",
        "format": "characteristics_format",

        # Dureza
        "dureza": "characteristics_hardness",
        "hardness": "characteristics_hardness",

        # Nivel de juego
        "nivel": "characteristics_game_level",
        "nivel de juego": "characteristics_game_level",
        "nivel del jugador": "characteristics_game_level",
        "player level": "characteristics_game_level",

        # Acabado
        "acabado": "characteristics_finish",
        "finish": "characteristics_finish",
        "textura": "characteristics_finish",

        # Forma
        "forma": "characteristics_shape",
        "shape": "characteristics_shape",
        "molde": "characteristics_shape",

        # Superficie
        "superficie": "characteristics_surface",
        "surface": "characteristics_surface",
        "rugosidad": "characteristics_surface",

        # Tipo de juego
        "tipo de juego": "characteristics_game_type",
        "game type": "characteristics_game_type",
        "estilo": "characteristics_game_type",

        # Colección/Jugador
        "colección": "characteristics_player_collection",
        "colección jugadores": "characteristics_player_collection",
        "collection": "characteristics_player_collection",
        "jugador": "characteristics_player",
        "player": "characteristics_player",
        "género": "characteristics_player",

        # Especificaciones (specs)
        "peso": ("specs", "peso"),
        "weight": ("specs", "peso"),
        "marco": ("specs", "marco"),
        "frame": ("specs", "marco"),
        "perfil": ("specs", "marco"),
        "tecnologías": ("specs", "tecnologias"),
        "tecnologias": ("specs", "tecnologias"),
        "technologies": ("specs", "tecnologias"),
        "technology": ("specs", "tecnologias"),
    }

    mapped_field = None
    # Encontrar mejor coincidencia por prefix o match exacto
    for k in mapping.keys():
        if h == k or h.startswith(k):
            mapped_field = mapping[k]
            break

    if mapped_field:
        if isinstance(mapped_field, tuple):
            # Es una spec
            spec_key = mapped_field[1]
            if spec_key == "tecnologias":
                # Separar por coma, punto y coma o slash
                vals = [x.strip() for x in re.split(r",|;|/|\|", v) if x.strip()]
                if "tecnologias" not in specs:
                    specs["tecnologias"] = []
                specs["tecnologias"].extend(vals)
            else:
                specs[spec_key] = v
        else:
            # Es una característica
            characteristics[mapped_field] = v
    else:
        # No mapeado: guardar en specs con la clave original
        if h not in ["tecnologías", "tecnologias", "technology", "technologies"]:
            specs[key.strip()] = v


def scroll_and_collect_links(driver: webdriver.Chrome) -> List[str]:
    """
    Hace scroll infinito en la página de colección para cargar todos los productos.
    Termina cuando no se cargan más productos después de varios intentos.
    """
    logging.info("Iniciando scroll infinito para recolectar URLs de producto")
    print(f"Cargando página: {COLLECTION_URL}")
    driver.get(COLLECTION_URL)

    # Esperar que cargue el grid de productos
    try:
        WebDriverWait(driver, 20).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, 'a[href*="/products/"]'))
        )
        logging.info("Grid de productos cargado correctamente")
    except TimeoutException:
        logging.error("Timeout esperando el grid de productos")
        print("❌ Error: No se pudieron cargar los productos")
        return []

    last_height = driver.execute_script("return document.body.scrollHeight")
    last_product_count = 0
    stable_iterations = 0
    max_stable = 5  # parar tras 5 iteraciones sin aumentar
    scroll_count = 0

    print("Haciendo scroll para cargar todos los productos...")

    while True:
        # Hacer scroll hasta el final
        driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
        time.sleep(SCROLL_DELAY_SECONDS)

        scroll_count += 1
        new_height = driver.execute_script("return document.body.scrollHeight")

        # Contar productos actuales
        current_products = driver.find_elements(By.CSS_SELECTOR, 'a[href*="/products/"]')
        current_product_count = len(current_products)

        # Verificar si hay cambios en altura o en número de productos
        height_changed = new_height != last_height
        products_changed = current_product_count != last_product_count

        if height_changed or products_changed:
            # Hubo cambios, resetear contador
            stable_iterations = 0
            last_height = new_height
            last_product_count = current_product_count
            logging.debug(f"Scroll #{scroll_count}: {current_product_count} productos encontrados")
            print(f"  Productos encontrados: {current_product_count}", end='\r')
        else:
            # No hubo cambios
            stable_iterations += 1
            logging.debug(f"Scroll estable {stable_iterations}/{max_stable} (productos: {current_product_count})")

            if stable_iterations >= max_stable:
                logging.info(f"Scroll finalizado tras {stable_iterations} iteraciones estables")
                print(f"\n✓ Scroll completado: {current_product_count} productos encontrados")
                break

    # Recoger enlaces de producto únicos
    anchors = driver.find_elements(By.CSS_SELECTOR, 'a[href*="/products/"]')
    urls = set()
    for a in anchors:
        href = a.get_attribute('href')
        if href and href.startswith(BASE_URL) and "/products/" in href:
            # Normalizar URL: eliminar query params y fragmentos
            clean_url = href.split('?')[0].split('#')[0]
            urls.add(clean_url)

    urls_list = sorted(urls)
    logging.info(f"Recolectadas {len(urls_list)} URLs únicas de producto")

    if len(urls_list) == 0:
        logging.warning("⚠️ No se encontraron URLs de productos")
        print("⚠️ Advertencia: No se encontraron productos para scrapear")
    else:
        print(f"✓ Total de URLs únicas recolectadas: {len(urls_list)}")

    return urls_list


def find_existing_index_by_name(data: List[Dict[str, Any]], name: Optional[str], brand: Optional[str] = None) -> Optional[int]:
    """
    Busca una pala existente en el JSON usando matching mejorado con especificaciones técnicas.
    """
    if not name:
        return None

    # Crear producto temporal con el nombre
    target_product = {'name': name}
    if brand:
        target_product['brand'] = brand

    target_key = create_comparison_key(name)
    if not target_key:
        return None

    # 1. Primero buscar match exacto (más rápido)
    for idx, item in enumerate(data):
        existing_name = item.get("name")
        if not existing_name:
            continue

        existing_key = create_comparison_key(existing_name)
        if existing_key and existing_key == target_key:
            if check_critical_keywords(name, existing_name):
                return idx

    # 2. Si no hay match exacto, usar matching compuesto con specs
    best_idx = None
    best_score = 0.0

    for idx, item in enumerate(data):
        existing_name = item.get("name")
        if not existing_name:
            continue

        if not check_critical_keywords(name, existing_name):
            continue

        # Calcular score compuesto (nombre + especificaciones)
        score, _ = calculate_composite_score(target_product, item)

        # Boost si la marca coincide
        existing_brand = item.get("brand") or item.get("characteristics_brand")
        if brand and existing_brand:
            brand_key1 = create_comparison_key(brand)
            brand_key2 = create_comparison_key(existing_brand)
            if brand_key1 == brand_key2:
                score = min(1.0, score + 0.05)

        if score > best_score:
            best_score = score
            best_idx = idx

    # Umbral de similitud: 85%
    SIMILARITY_THRESHOLD = 0.85

    if best_score >= SIMILARITY_THRESHOLD and best_idx is not None:
        return best_idx

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
    entry['last_updated'] = datetime.now().isoformat()

    return entry


def main():
    setup_logging()
    print("="*60)
    print("Inicio de scrapper PadelProShop")
    print("="*60)
    logging.info("Inicio del scrapper PadelProShop")

    data = load_json(OUTPUT_FILE)
    print(f"✓ Cargadas {len(data)} palas existentes del JSON\n")

    # Configurar Selenium (Chrome)
    print("Configurando navegador headless...")
    chrome_options = ChromeOptions()
    chrome_options.add_argument('--headless=new')
    chrome_options.add_argument('--disable-gpu')
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--window-size=1920,1080')

    driver = webdriver.Chrome(options=chrome_options)

    try:
        # Recolectar URLs de productos
        product_urls = scroll_and_collect_links(driver)

        # Verificar si se encontraron URLs
        if not product_urls or len(product_urls) == 0:
            print("\n" + "="*60)
            print("⚠️ No se encontraron productos para procesar")
            print("="*60)
            logging.warning("No se encontraron URLs de productos. Finalizando.")
            return

        logging.info(f"Total de URLs a procesar: {len(product_urls)}")
        print(f"\nIniciando scraping de {len(product_urls)} productos...\n")

        productos_actualizados = 0
        productos_nuevos = 0
        productos_fallidos = 0

        for idx, url in enumerate(product_urls, start=1):
            logging.debug(f"Procesando {idx}/{len(product_urls)}: {url}")
            print(f"\n[{idx}/{len(product_urls)}] Procesando: {url}")

            try:
                scraped = scrape_product_detail(url)
                if not scraped or not scraped.get('name'):
                    logging.warning(f"No se pudo extraer información de {url}")
                    print("  ❌ Error: No se pudo extraer información del producto")
                    productos_fallidos += 1
                    continue

                name = scraped.get('name')
                brand = scraped.get('brand')
                print(f"  📦 Producto: {name}")

                # Buscar pala existente usando el algoritmo mejorado
                match_idx = find_existing_index_by_name(data, name, brand)

                if match_idx is not None:
                    # Actualizar solo campos de PadelProShop
                    entry = data[match_idx]
                    entry['padelproshop_actual_price'] = scraped.get('padelproshop_actual_price')
                    entry['padelproshop_original_price'] = scraped.get('padelproshop_original_price')
                    entry['padelproshop_discount_percentage'] = scraped.get('padelproshop_discount_percentage')
                    entry['padelproshop_link'] = scraped.get('padelproshop_link')
                    entry['last_updated'] = datetime.now().isoformat()

                    # Actualizar imagen solo si no existe
                    if not entry.get('image') and scraped.get('image'):
                        entry['image'] = scraped.get('image')

                    # Actualizar on_offer basado en todas las tiendas
                    pn_discount = entry.get('padelnuestro_discount_percentage')
                    pm_discount = entry.get('padelmarket_discount_percentage')
                    pp_discount = entry.get('padelproshop_discount_percentage')
                    has_offer = (pn_discount and pn_discount > 0) or (pm_discount and pm_discount > 0) or (pp_discount and pp_discount > 0)
                    entry['on_offer'] = bool(has_offer)

                    print(f"  ✓ Actualizado (precio: {scraped.get('padelproshop_actual_price')}€)")
                    logging.info(f"[OK] Actualizado (PadelProShop): {entry['name']}")
                    productos_actualizados += 1
                else:
                    # Crear nueva entrada completa
                    logging.info(f"Creada nueva entrada: {name}")
                    print(f"  ➕ Nueva pala agregada")
                    new_entry = _create_new_entry_from_scraped(scraped)
                    data.append(new_entry)
                    productos_nuevos += 1

                # Guardado incremental para no perder progreso
                save_json(OUTPUT_FILE, data)

                # Pequeño delay entre peticiones para cortesía
                time.sleep(0.2)

            except Exception as e:
                logging.error(f"Error procesando {url}: {e}")
                print(f"  ❌ Error inesperado: {e}")
                productos_fallidos += 1
                continue

        # Guardar JSON final
        save_json(OUTPUT_FILE, data)

        # Resumen final
        print("\n" + "="*60)
        print("🎉 Scrapping PadelProShop FINALIZADO")
        print("="*60)
        print(f"Total productos procesados:  {len(product_urls)}")
        print(f"  ✓ Actualizados:            {productos_actualizados}")
        print(f"  ➕ Nuevos:                 {productos_nuevos}")
        print(f"  ❌ Fallidos:               {productos_fallidos}")
        print(f"Total palas en JSON:         {len(data)}")
        print(f"Archivo guardado:            {OUTPUT_FILE}")
        print("="*60)
        logging.info("Scrapper PadelProShop finalizado exitosamente")

    except Exception as e:
        print(f"\n❌ Error fatal durante el scraping: {e}")
        logging.error(f"Error fatal durante el scraping: {e}")
        raise

    finally:
        try:
            driver.quit()
            logging.info("Navegador cerrado")
        except Exception as e:
            logging.debug(f"Error cerrando navegador: {e}")


if __name__ == "__main__":
    main()
    pass