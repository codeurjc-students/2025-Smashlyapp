import time
import json
import os
import re
from datetime import datetime
from difflib import SequenceMatcher
from selenium import webdriver
from selenium.webdriver.edge.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

class PadelPointScrapper:
    def __init__(self, json_path):
        self.json_path = json_path
        self.palas_data = self.load_json()
        self.nuevas_palas = []
        self.palas_actualizadas = 0
        
    def load_json(self):
        """Carga el JSON de palas existente"""
        try:
            with open(self.json_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error cargando JSON: {e}")
            return {"palas": []}
    
    def save_json(self):
        """Guarda el JSON actualizado"""
        try:
            with open(self.json_path, 'w', encoding='utf-8') as f:
                json.dump(self.palas_data, f, indent=2, ensure_ascii=False)
            print(f"JSON guardado correctamente con {len(self.palas_data['palas'])} palas")
        except Exception as e:
            print(f"Error guardando JSON: {e}")

    def normalize_name(self, name):
        """Normaliza el nombre de la pala para comparación"""
        if not name:
            return ""
        
        # Remover "Pala" al inicio pero conservar "Pack"
        name = re.sub(r'^Pala\s+', '', name, flags=re.IGNORECASE)
        
        # Convertir a mayúsculas
        name = name.upper()
        
        # Remover caracteres especiales y espacios extra
        name = re.sub(r'[^\w\s]', ' ', name)
        name = re.sub(r'\s+', ' ', name).strip()
        
        return name

    def extract_brand(self, name):
        """Extrae la marca del nombre de la pala"""
        normalized = self.normalize_name(name)
        brands = ['NOX', 'ADIDAS', 'HEAD', 'BULLPADEL', 'BABOLAT', 'WILSON', 'ACA', 'ALACRAN', 'KSWISS', 'K-SWISS']
        
        for brand in brands:
            if normalized.startswith(brand):
                return brand
        
        # Si no encuentra marca conocida, tomar la primera palabra
        words = normalized.split()
        return words[0] if words else ""

    def extract_model(self, name, brand):
        """Extrae el modelo del nombre removiendo la marca"""
        normalized = self.normalize_name(name)
        
        # Remover la marca del inicio
        if brand and normalized.startswith(brand.upper()):
            model = normalized[len(brand):].strip()
        else:
            words = normalized.split()
            model = ' '.join(words[1:]) if len(words) > 1 else normalized
        
        return model.strip()

    def calculate_similarity(self, name1, name2):
        """Calcula la similitud entre dos nombres de palas"""
        # Normalizar ambos nombres
        norm1 = self.normalize_name(name1)
        norm2 = self.normalize_name(name2)
        
        # Similitud básica
        basic_similarity = SequenceMatcher(None, norm1, norm2).ratio()
        
        # Extraer componentes clave
        brand1 = self.extract_brand(name1)
        brand2 = self.extract_brand(name2)
        
        model1 = self.extract_model(name1, brand1)
        model2 = self.extract_model(name2, brand2)
        
        # Pesos para diferentes componentes
        brand_weight = 0.3
        model_weight = 0.7
        
        # Calcular similitudes por componente
        brand_sim = 1.0 if brand1 == brand2 else 0.0
        model_sim = SequenceMatcher(None, model1, model2).ratio()
        
        # Similitud ponderada
        weighted_similarity = (brand_sim * brand_weight + model_sim * model_weight)
        
        # Tomar el máximo entre similitud básica y ponderada
        final_similarity = max(basic_similarity, weighted_similarity)
        
        return final_similarity, {
            'basic': basic_similarity,
            'weighted': weighted_similarity,
            'brand_match': brand1 == brand2,
            'brand1': brand1,
            'brand2': brand2,
            'model1': model1,
            'model2': model2
        }

    def find_matching_pala(self, padelpoint_name):
        """Encuentra una pala matching en el JSON existente"""
        best_match = None
        best_similarity = 0.0
        best_details = None
        
        for pala in self.palas_data['palas']:
            similarity, details = self.calculate_similarity(padelpoint_name, pala['nombre'])
            
            if similarity > best_similarity and similarity >= 0.85:
                best_similarity = similarity
                best_match = pala
                best_details = details
        
        return best_match, best_similarity, best_details

    def parse_price(self, price_text):
        """Extrae precios del texto de PadelPoint"""
        if not price_text:
            return None, None, None
        
        # Buscar patrones de precio
        prices = re.findall(r'(\d+(?:\.\d+)?)\s*€', price_text)
        
        if len(prices) == 0:
            return None, None, None
        elif len(prices) == 1:
            # Solo un precio
            return float(prices[0]), None, None
        else:
            # Precio original y actual
            precio_original = float(prices[0])
            precio_actual = float(prices[1])
            descuento = round(((precio_original - precio_actual) / precio_original) * 100)
            return precio_actual, precio_original, descuento

    def create_new_pala(self, padelpoint_data):
        """Crea una nueva pala desde datos de PadelPoint"""
        nombre = self.normalize_name(padelpoint_data['name'])
        marca = self.extract_brand(padelpoint_data['name'])
        modelo = self.extract_model(padelpoint_data['name'], marca)
        
        precio_actual, precio_original, descuento = self.parse_price(padelpoint_data['price'])
        
        # Crear enlace (asumiendo que sigue un patrón)
        enlace_base = "https://www.tiendapadelpoint.com/"
        enlace = enlace_base + re.sub(r'[^\w\s-]', '', nombre.lower().replace(' ', '-'))
        
        nueva_pala = {
            "nombre": nombre,
            "marca": marca,
            "modelo": modelo,
            "imagen": padelpoint_data.get('image_url', ''),
            "es_bestseller": False,
            "en_oferta": descuento is not None and descuento > 0,
            "scrapeado_en": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "descripcion": "",
            "caracteristicas": {
                "marca": marca,
                "color": "Unknown",
                "color_2": "Unknown",
                "producto": "Palas",
                "balance": "Unknown",
                "núcleo": "Unknown",
                "cara": "Unknown",
                "formato": "Normal",
                "dureza": "Unknown",
                "nivel_de_juego": "Unknown",
                "acabado": "Unknown",
                "forma": "Unknown",
                "superfície": "Unknown",
                "tipo_de_juego": "Unknown",
                "colección_jugadores": "Unknown",
                "jugador": "Unknown"
            },
            "especificaciones": {},
            "tiendas": {
                "PadelNuestro": {
                    "precio_actual": None,
                    "precio_original": None,
                    "descuento_porcentaje": None,
                    "enlace": None
                },
                "PadelMarket": {
                    "precio_actual": None,
                    "precio_original": None,
                    "descuento_porcentaje": None,
                    "enlace": None
                },
                "PadelPoint": {
                    "precio_actual": precio_actual,
                    "precio_original": precio_original,
                    "descuento_porcentaje": descuento,
                    "enlace": enlace
                },
                "PadelProShop": {
                    "precio_actual": None,
                    "precio_original": None,
                    "descuento_porcentaje": None,
                    "enlace": None
                }
            }
        }
        
        return nueva_pala

    def update_existing_pala(self, pala, padelpoint_data):
        """Actualiza una pala existente con datos de PadelPoint"""
        precio_actual, precio_original, descuento = self.parse_price(padelpoint_data['price'])
        
        # Crear enlace
        enlace_base = "https://www.tiendapadelpoint.com/"
        enlace = enlace_base + re.sub(r'[^\w\s-]', '', pala['nombre'].lower().replace(' ', '-'))
        
        # Actualizar campos de PadelPoint
        pala['tiendas']['PadelPoint'] = {
            "precio_actual": precio_actual,
            "precio_original": precio_original,
            "descuento_porcentaje": descuento,
            "enlace": enlace
        }
        
        # Actualizar en_oferta si hay descuento en cualquier tienda
        pala['en_oferta'] = any(
            tienda.get('descuento_porcentaje') and tienda['descuento_porcentaje'] > 0
            for tienda in pala['tiendas'].values()
        )

    def setup_edge_driver(self):
        """Configura y retorna un driver de Edge"""
        edge_options = Options()
        edge_options.add_argument("--no-sandbox")
        edge_options.add_argument("--disable-dev-shm-usage")
        edge_options.add_argument("--disable-gpu")
        edge_options.add_argument("--window-size=1920,1080")
        
        try:
            driver = webdriver.Edge(options=edge_options)
            return driver
        except Exception as e:
            print(f"Error iniciando Edge driver: {e}")
            raise

    def extract_racket_info(self, product_wrapper):
        """Extrae la información de una pala desde el div product-wrapper"""
        try:
            racket_info = {}
            
            # Buscar la imagen
            try:
                image_div = product_wrapper.find_element(By.CLASS_NAME, "image")
                img_element = image_div.find_element(By.TAG_NAME, "img")
                racket_info['image_url'] = img_element.get_attribute("src")
            except:
                racket_info['image_url'] = None
            
            # Buscar el descuento
            try:
                discount_element = product_wrapper.find_element(By.CLASS_NAME, "label-sale")
                racket_info['discount'] = discount_element.text.strip()
            except:
                racket_info['discount'] = None
            
            # Buscar información en product-details
            try:
                details_div = product_wrapper.find_element(By.CLASS_NAME, "product-details")
                
                # Nombre
                try:
                    name_element = details_div.find_element(By.CLASS_NAME, "name")
                    racket_info['name'] = name_element.text.strip()
                except:
                    racket_info['name'] = None
                
                # Precio
                try:
                    price_element = details_div.find_element(By.CLASS_NAME, "price")
                    racket_info['price'] = price_element.text.strip()
                except:
                    racket_info['price'] = None
                    
            except Exception as e:
                print(f"Error extrayendo detalles del producto: {e}")
            
            return racket_info
        
        except Exception as e:
            print(f"Error procesando product-wrapper: {e}")
            return None

    def scrape_page(self, driver, page_number):
        """Hace scraping de una página específica"""
        url = f"https://www.tiendapadelpoint.com/palas-de-padel?page={page_number}"
        print(f"Scrapeando página {page_number}: {url}")
        
        try:
            driver.get(url)
            wait = WebDriverWait(driver, 20)
            wait.until(EC.presence_of_element_located((By.CLASS_NAME, "product-wrapper")))
            time.sleep(3)
            
            product_wrappers = driver.find_elements(By.CLASS_NAME, "product-wrapper")
            
            if len(product_wrappers) == 0:
                print(f"No se encontraron productos en la página {page_number}")
                return []
            
            print(f"Encontrados {len(product_wrappers)} productos en la página {page_number}")
            
            rackets = []
            for i, wrapper in enumerate(product_wrappers):
                racket_info = self.extract_racket_info(wrapper)
                if racket_info and racket_info.get('name'):
                    rackets.append(racket_info)
            
            return rackets
        
        except Exception as e:
            print(f"Error scrapeando página {page_number}: {e}")
            return []

    def process_scraped_data(self, scraped_rackets):
        """Procesa los datos scrapeados y actualiza el JSON"""
        print(f"\n=== PROCESANDO {len(scraped_rackets)} PALAS ===")
        
        for i, racket in enumerate(scraped_rackets, 1):
            print(f"\nProcesando pala {i}/{len(scraped_rackets)}: {racket['name']}")
            
            # Buscar match en JSON existente
            matching_pala, similarity, details = self.find_matching_pala(racket['name'])
            
            if matching_pala:
                print(f"  ✓ MATCH encontrado (similitud: {similarity:.2%})")
                print(f"    Original: {matching_pala['nombre']}")
                print(f"    PadelPoint: {racket['name']}")
                print(f"    Detalles: {details}")
                
                # Actualizar pala existente
                self.update_existing_pala(matching_pala, racket)
                self.palas_actualizadas += 1
            else:
                print(f"  + NUEVA pala agregada")
                print(f"    Nombre normalizado: {self.normalize_name(racket['name'])}")
                
                # Crear nueva pala
                nueva_pala = self.create_new_pala(racket)
                self.palas_data['palas'].append(nueva_pala)
                self.nuevas_palas.append(nueva_pala)

    def run_complete_scraping(self):
        """Ejecuta el scraping completo de todas las páginas"""
        driver = self.setup_edge_driver()
        all_rackets = []
        
        try:
            page = 1
            while True:
                rackets = self.scrape_page(driver, page)
                
                if not rackets:
                    print(f"No se encontraron más productos. Deteniendo en página {page}")
                    break
                
                all_rackets.extend(rackets)
                print(f"Total acumulado: {len(all_rackets)} palas")
                
                # Pausa entre páginas
                time.sleep(2)
                page += 1
                
                # Límite de seguridad (máximo 50 páginas)
                if page > 50:
                    print("Límite de páginas alcanzado (50)")
                    break
            
            print(f"\n=== SCRAPING COMPLETADO ===")
            print(f"Total de palas scrapeadas: {len(all_rackets)}")
            
            # Procesar datos
            self.process_scraped_data(all_rackets)
            
            # Guardar JSON actualizado
            self.save_json()
            
            # Resumen final
            print(f"\n=== RESUMEN FINAL ===")
            print(f"Palas actualizadas: {self.palas_actualizadas}")
            print(f"Nuevas palas agregadas: {len(self.nuevas_palas)}")
            print(f"Total de palas en JSON: {len(self.palas_data['palas'])}")
            
        except KeyboardInterrupt:
            print("\nProceso interrumpido por el usuario")
        except Exception as e:
            print(f"Error en el scraping: {e}")
        finally:
            driver.quit()
            print("Driver cerrado correctamente")

def main():
    json_path = "C:\\Users\\teije\\Documents\\Proyectos\\smashly-app\\palas_padel.json"
    
    scrapper = PadelPointScrapper(json_path)
    scrapper.run_complete_scraping()

if __name__ == "__main__":
    main()
