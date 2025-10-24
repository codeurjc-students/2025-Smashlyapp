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
from selenium.common.exceptions import TimeoutException, NoSuchElementException

class PadelProShopScrapper:
    def __init__(self, json_path):
        self.json_path = json_path
        self.palas_data = self.load_json()
        self.nuevas_palas = []
        self.palas_actualizadas = 0
        self.palas_procesadas = 0
        
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
        
        # Remover "Pala" al inicio
        name = re.sub(r'^Pala\s+', '', name, flags=re.IGNORECASE)
        
        # Convertir a mayúsculas
        name = name.upper()
        
        # Preservar números con punto decimal (ej: 3.3, 3.4) convirtiéndolos temporalmente
        name = re.sub(r'(\d+)\.(\d+)', r'\1DOT\2', name)
        
        # Remover caracteres especiales y espacios extra, pero mantener números
        name = re.sub(r'[^\w\s]', ' ', name)
        name = re.sub(r'\s+', ' ', name).strip()
        
        # Restaurar los puntos decimales
        name = re.sub(r'(\d+)DOT(\d+)', r'\1.\2', name)
        
        # Ordenar componentes para mejor matching
        # Extraer año, marca, modelo y jugador
        words = name.split()
        year = None
        player_words = []
        other_words = []
        
        for word in words:
            if re.match(r'^20\d{2}$', word):  # Año (2020-2099)
                year = word
            elif word in ['ALE', 'AGUSTIN', 'AGUSTÍN', 'FRANCO', 'STUPACKZUK', 'GALÁN', 'GALAN', 'TAPIA']:
                player_words.append(word)
            else:
                other_words.append(word)
        
        # Reconstruir en orden: marca + modelo + año + jugador
        normalized = ' '.join(other_words)
        if year:
            normalized += f' {year}'
        if player_words:
            normalized += f' {" ".join(player_words)}'
        
        return normalized.strip()

    def similarity(self, a, b):
        """Calcula la similitud entre dos strings"""
        return SequenceMatcher(None, a, b).ratio()

    def find_matching_pala(self, scraped_name):
        """Encuentra la pala correspondiente en el JSON basándose en similitud de nombres"""
        normalized_scraped = self.normalize_name(scraped_name)
        best_match = None
        best_similarity = 0.0
        
        for pala in self.palas_data['palas']:
            # Crear varios nombres posibles para comparar
            nombres_comparar = [
                pala.get('nombre', ''),
                pala.get('modelo', ''),
                f"{pala.get('marca', '')} {pala.get('modelo', '')}"
            ]
            
            for nombre in nombres_comparar:
                if nombre:
                    normalized_existing = self.normalize_name(nombre)
                    sim = self.similarity(normalized_scraped, normalized_existing)
                    
                    if sim > best_similarity and sim >= 0.95:  # Mínimo 95% de similitud
                        best_similarity = sim
                        best_match = pala
        
        return best_match, best_similarity

    def extract_price_info(self, product_element):
        """Extrae información de precios del elemento del producto"""
        try:
            price_info = {
                'precio_actual': None,
                'precio_original': None,
                'descuento_porcentaje': None
            }
            
            # Buscar precio actual
            try:
                current_price_elem = product_element.find_element(By.CSS_SELECTOR, '.price__current .money')
                current_price_text = current_price_elem.text.strip()
                price_info['precio_actual'] = self.parse_price(current_price_text)
            except NoSuchElementException:
                print("No se encontró precio actual")
            
            # Buscar precio original (tachado)
            try:
                original_price_elem = product_element.find_element(By.CSS_SELECTOR, '.price__was .money')
                original_price_text = original_price_elem.text.strip()
                price_info['precio_original'] = self.parse_price(original_price_text)
            except NoSuchElementException:
                print("No se encontró precio original")
            
            # Buscar descuento
            try:
                discount_elem = product_element.find_element(By.CSS_SELECTOR, '.discount_disclaimer')
                discount_text = discount_elem.text.strip()
                discount_match = re.search(r'(\d+)%', discount_text)
                if discount_match:
                    price_info['descuento_porcentaje'] = int(discount_match.group(1))
            except NoSuchElementException:
                print("No se encontró información de descuento")
                
            return price_info
            
        except Exception as e:
            print(f"Error extrayendo información de precios: {e}")
            return {'precio_actual': None, 'precio_original': None, 'descuento_porcentaje': None}

    def parse_price(self, price_text):
        """Parsea el texto del precio y devuelve float"""
        try:
            # Remover símbolos y convertir a float
            price_clean = re.sub(r'[^\d,.]', '', price_text)
            price_clean = price_clean.replace(',', '.')
            return float(price_clean)
        except:
            return None

    def create_new_pala_entry(self, scraped_data):
        """Crea una nueva entrada de pala con los datos scrapeados"""
        # Normalizar el nombre (remueve "Pala" y convierte a mayúsculas)
        nombre_normalizado = self.normalize_name(scraped_data['nombre'])
        palabras = nombre_normalizado.split()
        marca = palabras[0] if palabras else "UNKNOWN"
        
        nueva_pala = {
            "nombre": nombre_normalizado,
            "marca": marca,
            "modelo": nombre_normalizado,
            "imagen": scraped_data.get('imagen', ''),
            "es_bestseller": False,
            "en_oferta": scraped_data['precio_info']['descuento_porcentaje'] is not None,
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
                    "precio_actual": None,
                    "precio_original": None,
                    "descuento_porcentaje": None,
                    "enlace": None
                },
                "PadelProShop": {
                    "precio_actual": scraped_data['precio_info']['precio_actual'],
                    "precio_original": scraped_data['precio_info']['precio_original'],
                    "descuento_porcentaje": scraped_data['precio_info']['descuento_porcentaje'],
                    "enlace": scraped_data['enlace']
                }
            }
        }
        
        return nueva_pala

    def setup_driver(self):
        """Configura el driver de Edge"""
        options = Options()
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-dev-shm-usage')
        options.add_argument('--disable-gpu')
        options.add_argument('--window-size=1920,1080')
        
        try:
            driver = webdriver.Edge(options=options)
            return driver
        except Exception as e:
            print(f"Error configurando driver: {e}")
            return None

    def scrape_products(self, max_products=None):
        """Scrapea productos de PadelProShop"""
        driver = self.setup_driver()
        if not driver:
            return
        
        try:
            print("Navegando a PadelProShop...")
            driver.get("https://padelproshop.com/collections/palas-padel")
            
            # Esperar a que cargue la página
            WebDriverWait(driver, 20).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "li.js-pagination-result"))
            )
            
            print("Página cargada, buscando productos...")
            
            # Manejar la carga de más productos usando el botón "Load More"
            products_loaded = 0
            attempt = 0
            max_attempts = 50  # Máximo 50 intentos de cargar más
            
            while attempt < max_attempts:
                # Contar productos actuales usando el selector correcto
                current_products = driver.find_elements(By.CSS_SELECTOR, "li.js-pagination-result")
                current_count = len(current_products)
                
                print(f"Productos encontrados: {current_count}")
                
                # Si alcanzamos el límite deseado, parar
                if max_products and current_count >= max_products:
                    print(f"Alcanzado límite de {max_products} productos")
                    break
                
                # Si no se cargaron nuevos productos en este intento
                if current_count == products_loaded:
                    # Buscar botón "Load More" con el selector correcto
                    load_more_buttons = driver.find_elements(By.CSS_SELECTOR, "a.js-pagination-load-more")
                    
                    button_clicked = False
                    for btn in load_more_buttons:
                        try:
                            if btn.is_displayed() and btn.is_enabled():
                                print(f"Haciendo clic en botón 'Load More'...")
                                # Scroll al botón antes de hacer clic
                                driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", btn)
                                time.sleep(2)  # Más tiempo para estabilizar
                                driver.execute_script("arguments[0].click();", btn)
                                button_clicked = True
                                break
                        except Exception as e:
                            print(f"Error haciendo clic en botón: {e}")
                            continue
                    
                    if button_clicked:
                        # Esperar a que carguen nuevos productos
                        print("Esperando a que carguen nuevos productos...")
                        time.sleep(7)  # Más tiempo de espera para cargar
                        
                        # Verificar si realmente se cargaron nuevos productos usando el selector correcto
                        new_products = driver.find_elements(By.CSS_SELECTOR, "li.js-pagination-result")
                        new_count = len(new_products)
                        if new_count > current_count:
                            print(f"✓ Se cargaron {new_count - current_count} productos nuevos")
                            attempt = 0  # Resetear intentos
                        else:
                            attempt += 1
                            print(f"⚠️ No se cargaron productos nuevos (intento {attempt})")
                    else:
                        # No hay más botones, intentar scroll como backup
                        print("No se encontró botón 'Load More', intentando scroll...")
                        driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
                        time.sleep(3)
                        attempt += 1
                        
                        # Si después de varios intentos sin botón no hay cambios, salir
                        if attempt > 15:  # Más intentos para ser más exhaustivos
                            print("No se pueden cargar más productos")
                            break
                else:
                    # Se cargaron nuevos productos, actualizar contador
                    products_loaded = current_count
                    attempt = 0  # Resetear intentos fallidos
            
            # Obtener todos los productos finales usando el selector correcto
            products = driver.find_elements(By.CSS_SELECTOR, "li.js-pagination-result")
            total_products = len(products)
            
            if max_products:
                products_to_process = products[:max_products]
                print(f"Procesando {len(products_to_process)} de {total_products} productos encontrados")
            else:
                products_to_process = products
                print(f"Procesando todos los {total_products} productos encontrados")
            
            for i, product in enumerate(products_to_process):
                try:
                    print(f"\nProcesando producto {i+1}/{len(products_to_process)}...")
                    
                    # Hacer scroll al elemento para asegurar que esté visible
                    driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", product)
                    time.sleep(0.5)
                    
                    # Extraer nombre
                    try:
                        title_elem = product.find_element(By.CSS_SELECTOR, ".card__title a")
                        nombre = title_elem.text.strip()
                        enlace_relativo = title_elem.get_attribute('href')
                        enlace = f"https://padelproshop.com{enlace_relativo}" if enlace_relativo.startswith('/') else enlace_relativo
                    except NoSuchElementException:
                        print("No se pudo extraer el nombre del producto")
                        continue
                    
                    # Extraer imagen
                    try:
                        img_elem = product.find_element(By.CSS_SELECTOR, ".card__main-image")
                        imagen = img_elem.get_attribute('src')
                        if imagen and imagen.startswith('data:'):
                            # Si es una imagen lazy-load, buscar el srcset
                            srcset = img_elem.get_attribute('srcset')
                            if srcset:
                                # Tomar la primera URL del srcset
                                imagen = srcset.split()[0]
                                if imagen.startswith('//'):
                                    imagen = f"https:{imagen}"
                    except NoSuchElementException:
                        imagen = ""
                    
                    # Extraer información de precios
                    price_info = self.extract_price_info(product)
                    
                    scraped_data = {
                        'nombre': nombre,
                        'enlace': enlace,
                        'imagen': imagen,
                        'precio_info': price_info
                    }
                    
                    print(f"Nombre: {nombre}")
                    print(f"Precio actual: {price_info['precio_actual']}")
                    if price_info['precio_original']:
                        print(f"Precio original: {price_info['precio_original']}")
                    if price_info['descuento_porcentaje']:
                        print(f"Descuento: {price_info['descuento_porcentaje']}%")
                    
                    # Buscar pala existente
                    pala_existente, similitud = self.find_matching_pala(nombre)
                    
                    if pala_existente:
                        print(f"✓ Pala encontrada con similitud {similitud:.2%}: {pala_existente['nombre']}")
                        
                        # Actualizar información de PadelProShop
                        pala_existente['tiendas']['PadelProShop'] = {
                            "precio_actual": price_info['precio_actual'],
                            "precio_original": price_info['precio_original'],
                            "descuento_porcentaje": price_info['descuento_porcentaje'],
                            "enlace": enlace
                        }
                        self.palas_actualizadas += 1
                        
                    else:
                        print("✗ Pala no encontrada en JSON, creando nueva entrada")
                        nueva_pala = self.create_new_pala_entry(scraped_data)
                        self.palas_data['palas'].append(nueva_pala)
                        self.nuevas_palas.append(nueva_pala)
                    
                    self.palas_procesadas += 1
                    
                    # Pequeña pausa entre productos
                    time.sleep(0.3)
                    
                    # Guardar progreso cada 50 productos
                    if self.palas_procesadas % 50 == 0:
                        print(f"\n💾 Guardando progreso... ({self.palas_procesadas} productos procesados)")
                        self.save_json()
                    
                except Exception as e:
                    print(f"Error procesando producto {i+1}: {e}")
                    continue
            
        except Exception as e:
            print(f"Error durante el scraping: {e}")
        
        finally:
            driver.quit()
            print(f"\n=== RESUMEN FINAL ===")
            print(f"Palas procesadas: {self.palas_procesadas}")
            print(f"Palas actualizadas: {self.palas_actualizadas}")
            print(f"Palas nuevas: {len(self.nuevas_palas)}")
            print(f"Total palas en JSON: {len(self.palas_data['palas'])}")

    def run_scraping(self, max_products=None):
        """Ejecuta el scraping completo"""
        if max_products:
            print(f"Iniciando scraping de PadelProShop (máximo {max_products} productos)...")
        else:
            print("Iniciando scraping COMPLETO de PadelProShop (todas las palas)...")
        print(f"JSON original tiene {len(self.palas_data['palas'])} palas")
        
        self.scrape_products(max_products)
        
        # Guardar JSON final
        self.save_json()
        
        # Mostrar resumen de nuevas palas si las hay
        if self.nuevas_palas:
            print("\n=== NUEVAS PALAS ENCONTRADAS ===")
            for pala in self.nuevas_palas:
                print(f"- {pala['nombre']}")

def main():
    json_path = r"c:\Users\teije\Documents\Proyectos\smashly-app\palas_padel.json"
    
    if not os.path.exists(json_path):
        print(f"Error: No se encuentra el archivo JSON en {json_path}")
        return
    
    scrapper = PadelProShopScrapper(json_path)
    scrapper.run_scraping()  # Sin límite = todas las palas

if __name__ == "__main__":
    main()
