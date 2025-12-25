#!/usr/bin/env python3
"""
Scraper para PadelNuestro.com
Extrae información de palas de pádel y genera/actualiza rackets.json
"""

import json
import time
import logging
import re
from typing import Dict, List, Optional, Any
from pathlib import Path
from datetime import datetime

import requests
from bs4 import BeautifulSoup
from tqdm import tqdm
import os
import sys

# Import matching utils
try:
    from matching_utils import normalize_name
except ImportError:
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    from matching_utils import normalize_name


# Configuración
BASE_URL = "https://www.padelnuestro.com"
CATALOG_URL = f"{BASE_URL}/palas-padel"
DELAY_BETWEEN_REQUESTS = 2  # segundos
PRODUCTS_PER_PAGE = 36  # Máximo permitido por el sitio (opciones: 9, 12, 24, 36)
OUTPUT_FILE = "rackets.json"
CHECKPOINT_FILE = "scraper_checkpoint.json"
LOG_FILE = "scraper_padelnuestro.log"

# Headers para simular navegador
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
}

# Mapeo de campos de características
CHARACTERISTICS_MAPPING = {
    'Marca': 'characteristics_brand',
    'Color': 'characteristics_color',
    'Color 2': 'characteristics_color_2',
    'Producto': 'characteristics_product',
    'Balance': 'characteristics_balance',
    'Núcleo': 'characteristics_core',
    'Cara': 'characteristics_face',
    'Formato': 'characteristics_format',
    'Dureza': 'characteristics_hardness',
    'Nivel de Juego': 'characteristics_game_level',
    'Acabado': 'characteristics_finish',
    'Forma': 'characteristics_shape',
    'Superfície': 'characteristics_surface',
    'Tipo de Juego': 'characteristics_game_type',
    'Colección Jugadores': 'characteristics_player_collection',
    'Jugador': 'characteristics_player',
}


# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(LOG_FILE, encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


class PadelNuestroScraper:
    """Scraper para extraer información de palas de PadelNuestro"""

    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update(HEADERS)
        self.scraped_urls = set()
        self.existing_data = {}
        self.checkpoint = {'last_page': 0, 'scraped_urls': []}

    def load_existing_data(self) -> Dict[str, Dict]:
        """Carga datos existentes del JSON si existe"""
        if Path(OUTPUT_FILE).exists():
            try:
                with open(OUTPUT_FILE, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    logger.info(f"Cargados {len(data)} registros existentes de {OUTPUT_FILE}")
                    # Indexar por URL para merge eficiente
                    return {item.get('padelnuestro_link'): item for item in data}
            except json.JSONDecodeError as e:
                logger.error(f"Error al leer {OUTPUT_FILE}: {e}")
                return {}
        return {}

    def load_checkpoint(self):
        """Carga el checkpoint si existe"""
        if Path(CHECKPOINT_FILE).exists():
            try:
                with open(CHECKPOINT_FILE, 'r', encoding='utf-8') as f:
                    self.checkpoint = json.load(f)
                    self.scraped_urls = set(self.checkpoint.get('scraped_urls', []))
                    logger.info(f"Checkpoint cargado: página {self.checkpoint['last_page']}, {len(self.scraped_urls)} URLs scrapeadas")
            except json.JSONDecodeError as e:
                logger.error(f"Error al leer checkpoint: {e}")

    def save_checkpoint(self, page: int):
        """Guarda el checkpoint actual"""
        self.checkpoint['last_page'] = page
        self.checkpoint['scraped_urls'] = list(self.scraped_urls)
        self.checkpoint['timestamp'] = datetime.now().isoformat()

        with open(CHECKPOINT_FILE, 'w', encoding='utf-8') as f:
            json.dump(self.checkpoint, f, ensure_ascii=False, indent=2)

    def save_data(self, data: List[Dict]):
        """Guarda los datos en el archivo JSON"""
        with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        logger.info(f"Datos guardados en {OUTPUT_FILE}: {len(data)} palas")

    def clean_value(self, value: Optional[str]) -> Optional[str]:
        """Limpia y normaliza valores"""
        if not value: return None
        value = value.strip()
        if value.lower() in ['unknow', 'unknown', '']: return None
        return value

    def extract_price_info(self, soup: BeautifulSoup) -> Dict[str, Any]:
        """Extrae información de precios de la página"""
        price_info = {
            'actual_price': None,
            'original_price': None,
            'discount_percentage': None,
            'on_offer': False
        }

        try:
            # Precio actual (special-price o precio normal)
            special_price = soup.find('span', class_='special-price')
            if special_price:
                price_elem = special_price.find('span', {'data-price-type': 'finalPrice'})
                if price_elem:
                    price_str = price_elem.get('data-price-amount')
                    price_info['actual_price'] = float(price_str) if price_str else None
                    price_info['on_offer'] = True

                # Precio original
                old_price = soup.find('span', class_='old-price')
                if old_price:
                    old_price_elem = old_price.find('span', {'data-price-type': 'oldPrice'})
                    if old_price_elem:
                        old_price_str = old_price_elem.get('data-price-amount')
                        price_info['original_price'] = float(old_price_str) if old_price_str else None
            else:
                # Solo hay precio normal
                price_elem = soup.find('span', {'data-price-type': 'finalPrice'})
                if price_elem:
                    price_str = price_elem.get('data-price-amount')
                    price_info['actual_price'] = float(price_str) if price_str else None
                    price_info['original_price'] = price_info['actual_price']

            # Calcular porcentaje de descuento
            if price_info['on_offer'] and price_info['actual_price'] and price_info['original_price']:
                discount = ((price_info['original_price'] - price_info['actual_price']) / price_info['original_price']) * 100
                price_info['discount_percentage'] = round(discount)

        except Exception as e:
            logger.warning(f"Error extrayendo precios: {e}")

        return price_info

    def extract_specs(self, soup: BeautifulSoup) -> Dict[str, Any]:
        """Extrae especificaciones técnicas de la descripción para el campo specs JSONB"""
        specs = {}

        try:
            description = soup.find('div', class_='product attribute description')
            if description:
                text = description.get_text()

                # Extraer tecnologías mencionadas (buscar palabras en mayúsculas o itálica)
                technologies = []

                # Buscar textos en <em> (itálicas) que suelen ser tecnologías
                tech_tags = description.find_all('em')
                for tag in tech_tags:
                    tech = tag.get_text().strip()
                    if tech and len(tech) > 2:
                        technologies.append(tech)

                if technologies:
                    specs['tecnologias'] = list(set(technologies))  # Eliminar duplicados

                # Extraer información específica con regex
                # Peso
                peso_match = re.search(r'(\d+)\s*g(?:r)?(?:amos)?', text, re.IGNORECASE)
                if peso_match:
                    specs['peso'] = f"{peso_match.group(1)}g"

                # Grosor
                grosor_match = re.search(r'(\d+)\s*mm', text, re.IGNORECASE)
                if grosor_match:
                    specs['grosor'] = f"{grosor_match.group(1)}mm"

                # Marco/Frame material
                if 'carbono' in text.lower():
                    if '100% carbono' in text.lower() or '100% de carbono' in text.lower():
                        specs['marco'] = '100% Carbono'
                    elif 'carbono' in text.lower():
                        specs['marco'] = 'Carbono'

        except Exception as e:
            logger.warning(f"Error extrayendo specs: {e}")

        return specs if specs else {}

    def scrape_product_detail(self, url: str) -> Optional[Dict[str, Any]]:
        """Scrapea los detalles de una pala específica"""
        try:
            time.sleep(DELAY_BETWEEN_REQUESTS)

            response = self.session.get(url, timeout=30)
            response.raise_for_status()

            soup = BeautifulSoup(response.content, 'html.parser')

            # Extraer nombre
            name_elem = soup.find('h1', class_='page-title')
            name = self.clean_value(name_elem.get_text() if name_elem else None)

            if not name:
                logger.warning(f"No se pudo extraer el nombre de {url}")
                return None

            # Extraer imagen principal - intentar múltiples métodos
            image = None

            # Método 1: Buscar en JSON-LD Schema.org
            try:
                json_ld_scripts = soup.find_all('script', type='application/ld+json')
                for script in json_ld_scripts:
                    if script.string:
                        try:
                            data = json.loads(script.string)
                            if isinstance(data, dict) and 'image' in data:
                                image = data['image']
                                break
                        except json.JSONDecodeError:
                            continue
            except Exception as e:
                logger.debug(f"Error extrayendo imagen de JSON-LD: {e}")

            # Método 2: Buscar img con class product-image-photo
            if not image:
                image_elem = soup.find('img', class_='product-image-photo')
                if image_elem:
                    image = image_elem.get('src') or image_elem.get('data-src')

            # Método 3: Buscar en fotorama (galería de imágenes)
            if not image:
                image_elem = soup.find('img', class_='fotorama__img')
                if image_elem:
                    image = image_elem.get('src') or image_elem.get('data-src')

            # Método 4: Buscar cualquier img en product media
            if not image:
                media_wrapper = soup.find('div', class_='product media')
                if media_wrapper:
                    image_elem = media_wrapper.find('img')
                    if image_elem:
                        image = image_elem.get('src') or image_elem.get('data-src')

            # Extraer precios
            price_info = self.extract_price_info(soup)

            # Extraer descripción
            description_elem = soup.find('div', class_='product attribute description')
            description = None
            if description_elem:
                value_div = description_elem.find('div', class_='value')
                if value_div:
                    description = self.clean_value(value_div.get_text())

            # Inicializar producto
            product = {
                'name': name,
                'brand': None,
                'model': None,
                'image': image,
                'on_offer': price_info['on_offer'],
                'description': description,
                'characteristics_brand': None,
                'characteristics_color': None,
                'characteristics_color_2': None,
                'characteristics_product': 'Palas',
                'characteristics_balance': None,
                'characteristics_core': None,
                'characteristics_face': None,
                'characteristics_format': 'Normal',
                'characteristics_hardness': None,
                'characteristics_game_level': None,
                'characteristics_finish': None,
                'characteristics_shape': None,
                'characteristics_surface': None,
                'characteristics_game_type': None,
                'characteristics_player_collection': None,
                'characteristics_player': None,
                'specs': {},
                'padelnuestro_actual_price': price_info['actual_price'],
                'padelnuestro_original_price': price_info['original_price'],
                'padelnuestro_discount_percentage': price_info['discount_percentage'],
                'padelnuestro_link': url,
            }

            # Extraer características
            attributes_wrapper = soup.find('div', class_='additional-attributes-wrapper')
            if attributes_wrapper:
                attr_divs = attributes_wrapper.find_all('div', class_='description-attributes')

                for attr_div in attr_divs:
                    label_elem = attr_div.find('span', class_='description-attributes-label')
                    value_elem = attr_div.find('span', class_='description-attributes-value')

                    if label_elem and value_elem:
                        label = label_elem.get_text().strip()
                        value = self.clean_value(value_elem.get_text())

                        # Mapear a los campos correspondientes
                        if label in CHARACTERISTICS_MAPPING:
                            field_name = CHARACTERISTICS_MAPPING[label]
                            product[field_name] = value

            # Extraer specs técnicas
            product['specs'] = self.extract_specs(soup)

            # Extraer brand y model del nombre si es posible
            if product['characteristics_brand']:
                product['brand'] = product['characteristics_brand']
                # El modelo sería el nombre sin la marca
                if name.upper().startswith(product['brand'].upper()):
                    product['model'] = name[len(product['brand']):].strip()
                else:
                    product['model'] = name

            return product

        except requests.RequestException as e:
            logger.error(f"Error scrapeando {url}: {e}")
            return None
        except Exception as e:
            logger.error(f"Error inesperado scrapeando {url}: {e}", exc_info=True)
            return None

    def get_product_links_from_page(self, page_num: int) -> List[str]:
        """Obtiene los enlaces de productos de una página del catálogo"""
        try:
            url = f"{CATALOG_URL}?p={page_num}&product_list_limit={PRODUCTS_PER_PAGE}"

            response = self.session.get(url, timeout=30)
            response.raise_for_status()

            soup = BeautifulSoup(response.content, 'html.parser')

            # Encontrar todos los enlaces de productos
            product_links = []
            product_items = soup.find_all('div', class_='product-item-info')

            for item in product_items:
                link_elem = item.find('a', class_='product-item-link')
                if link_elem and link_elem.get('href'):
                    product_links.append(link_elem['href'])

            logger.info(f"Página {page_num}: encontrados {len(product_links)} productos")
            return product_links

        except requests.RequestException as e:
            logger.error(f"Error obteniendo página {page_num}: {e}")
            return []
        except Exception as e:
            logger.error(f"Error inesperado en página {page_num}: {e}", exc_info=True)
            return []

    def get_total_pages(self) -> int:
        """Obtiene el número total de páginas"""
        try:
            url = f"{CATALOG_URL}?product_list_limit={PRODUCTS_PER_PAGE}"
            response = self.session.get(url, timeout=30)
            response.raise_for_status()

            soup = BeautifulSoup(response.content, 'html.parser')

            # Primero intentar obtener el total de productos del toolbar
            toolbar_amount = soup.find('p', class_='toolbar-amount')
            if toolbar_amount:
                toolbar_number = toolbar_amount.find('span', class_='toolbar-number')
                if toolbar_number:
                    try:
                        total_products = int(toolbar_number.get_text().strip())
                        total_pages = (total_products + PRODUCTS_PER_PAGE - 1) // PRODUCTS_PER_PAGE
                        logger.info(f"Total de productos encontrados: {total_products}")
                        return total_pages
                    except ValueError:
                        pass

            # Fallback: buscar el último número de página en la paginación
            pages = soup.find_all('a', class_='page')
            if pages:
                last_page = 1
                for page in pages:
                    try:
                        # Buscar el span dentro del elemento 'a'
                        span = page.find('span')
                        if span and span.get_text().strip().isdigit():
                            page_num = int(span.get_text().strip())
                            last_page = max(last_page, page_num)
                    except (ValueError, AttributeError):
                        continue

                # La paginación solo muestra las primeras páginas,
                # necesitamos calcular el total real
                if last_page > 0:
                    # Intentar obtener el total de productos de otra forma
                    return last_page * 2  # Multiplicador conservador

            # Si no hay paginación, solo hay 1 página
            return 1

        except Exception as e:
            logger.error(f"Error obteniendo número total de páginas: {e}")
            # Estimar basado en 857 palas y productos por página
            return (857 + PRODUCTS_PER_PAGE - 1) // PRODUCTS_PER_PAGE

    def run(self):
        """Ejecuta el scraper completo"""
        logger.info("="*60)
        logger.info("Iniciando scraper de PadelNuestro")
        logger.info("="*60)

        # Cargar datos existentes
        self.existing_data = self.load_existing_data()

        # Cargar checkpoint
        self.load_checkpoint()

        # Obtener número total de páginas
        total_pages = self.get_total_pages()
        logger.info(f"Total de páginas a procesar: {total_pages}")

        # Recopilar todos los enlaces de productos
        all_product_links = []
        start_page = self.checkpoint['last_page'] + 1 if self.checkpoint['last_page'] > 0 else 1

        logger.info(f"Recopilando enlaces de productos (desde página {start_page})...")
        for page in tqdm(range(start_page, total_pages + 1), desc="Recopilando enlaces"):
            links = self.get_product_links_from_page(page)
            all_product_links.extend(links)

            # Guardar checkpoint cada 5 páginas
            if page % 5 == 0:
                self.save_checkpoint(page)

            time.sleep(DELAY_BETWEEN_REQUESTS)

        # Filtrar enlaces ya scrapeados
        new_links = [link for link in all_product_links if link not in self.scraped_urls]
        logger.info(f"Total de enlaces encontrados: {len(all_product_links)}")
        logger.info(f"Enlaces nuevos a scrapear: {len(new_links)}")
        logger.info(f"Enlaces ya scrapeados: {len(self.scraped_urls)}")

        # Scrapear cada producto
        new_products = []
        logger.info("Iniciando scraping de productos...")

        for link in tqdm(new_links, desc="Scrapeando productos"):
            product = self.scrape_product_detail(link)

            if product:
                new_products.append(product)
                self.scraped_urls.add(link)

                # Guardar cada 10 productos
                if len(new_products) % 10 == 0:
                    # Merge con datos existentes
                    for prod in new_products:
                        self.existing_data[prod['padelnuestro_link']] = prod

                    # Guardar datos actualizados
                    all_data = list(self.existing_data.values())
                    self.save_data(all_data)

                    logger.info(f"Checkpoint: guardados {len(all_data)} productos totales")

        # Guardar datos finales
        for prod in new_products:
            self.existing_data[prod['padelnuestro_link']] = prod

        all_data = list(self.existing_data.values())
        self.save_data(all_data)

        # Limpiar checkpoint si terminó exitosamente
        if Path(CHECKPOINT_FILE).exists():
            Path(CHECKPOINT_FILE).unlink()
            logger.info("Checkpoint eliminado (scraping completado)")

        logger.info("="*60)
        logger.info(f"Scraping completado exitosamente")
        logger.info(f"Total de productos en JSON: {len(all_data)}")
        logger.info(f"Productos nuevos scrapeados: {len(new_products)}")
        logger.info("="*60)


def main():
    scraper = PadelNuestroScraper()

    try:
        scraper.run()
    except KeyboardInterrupt:
        logger.info("\n\nScraping interrumpido por el usuario")
        logger.info("El checkpoint ha sido guardado. Puedes reanudar ejecutando el script nuevamente.")
    except Exception as e:
        logger.error(f"Error fatal: {e}", exc_info=True)
        logger.info("El checkpoint ha sido guardado. Puedes reanudar ejecutando el script nuevamente.")


if __name__ == "__main__":
    main()
