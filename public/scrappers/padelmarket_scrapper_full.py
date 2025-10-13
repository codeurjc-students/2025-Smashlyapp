#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Scrapper COMPLETO para PadelMarket - TODAS las palas
Actualiza precios, descuentos y enlaces en el JSON existente
"""

import json
import time
import re
from datetime import datetime
from difflib import SequenceMatcher
from selenium import webdriver
from selenium.webdriver.edge.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException

class PadelMarketScrapperFull:
    def __init__(self, json_file_path):
        self.json_file_path = json_file_path
        self.driver = None
        self.wait = None
        
        # Cargar datos existentes
        with open(json_file_path, 'r', encoding='utf-8') as f:
            json_data = json.load(f)
            
        # Verificar si el JSON tiene estructura con clave "palas"
        if isinstance(json_data, dict) and "palas" in json_data:
            self.data = json_data["palas"]
        else:
            self.data = json_data
            
        print(f"JSON original tiene {len(self.data)} palas")

    def setup_driver(self):
        """Configurar el driver de Edge con las opciones necesarias"""
        options = Options()
        
        # Configuración similar a PadelProShop
        options.add_argument("--start-maximized")
        options.add_argument("--disable-blink-features=AutomationControlled")
        options.add_experimental_option("excludeSwitches", ["enable-automation"])
        options.add_experimental_option('useAutomationExtension', False)
        options.add_argument("--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59")
        
        # Usar Edge instalado en el sistema
        self.driver = webdriver.Edge(options=options)
        self.wait = WebDriverWait(self.driver, 10)
        
        # Ejecutar script para evitar detección
        self.driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")

    def normalize_name(self, name):
        """
        Normaliza el nombre de la pala para hacer matching
        """
        if not name:
            return ""
            
        # Convertir a mayúsculas
        normalized = name.upper()
        
        # Remover "PALA" y "(RACKET)" si están presentes
        normalized = re.sub(r'\bPALA\b\s*', '', normalized)
        normalized = re.sub(r'\(RACKET\)\s*', '', normalized)
        
        # Remover caracteres especiales y extra spaces
        normalized = re.sub(r'[^\w\s]', ' ', normalized)
        normalized = re.sub(r'\s+', ' ', normalized).strip()
        
        # Remover palabras comunes que pueden variar
        words_to_remove = ['RACKET', 'PADEL', 'PADDLE']
        for word in words_to_remove:
            normalized = re.sub(rf'\b{word}\b', '', normalized)
        
        # Limpiar espacios extra
        normalized = re.sub(r'\s+', ' ', normalized).strip()
        
        return normalized

    def find_matching_racket(self, scraped_name):
        """
        Busca una pala coincidente en el JSON existente
        """
        scraped_normalized = self.normalize_name(scraped_name)
        best_match = None
        best_ratio = 0
        
        for i, pala in enumerate(self.data):
            existing_normalized = self.normalize_name(pala['nombre'])
            
            # Calcular similitud
            ratio = SequenceMatcher(None, scraped_normalized, existing_normalized).ratio()
            
            if ratio > best_ratio and ratio >= 0.95:  # 95% de similitud
                best_match = i
                best_ratio = ratio
                
        return best_match, best_ratio

    def extract_product_data(self, product_element):
        """
        Extrae datos de un elemento de producto
        """
        try:
            # Extraer nombre
            title_element = product_element.find_element(By.CSS_SELECTOR, "a.product-card-title")
            nombre = title_element.get_attribute("title") or title_element.text
            
            if not nombre:
                return None
            
            # Extraer URL
            url = title_element.get_attribute("href")
            if url and not url.startswith("http"):
                url = "https://padelmarket.com" + url
            
            # Extraer precios
            price_container = product_element.find_element(By.CSS_SELECTOR, "span.price")
            
            # Precio actual (siempre presente)
            precio_actual_elem = price_container.find_element(By.CSS_SELECTOR, "ins span.amount")
            precio_actual_text = precio_actual_elem.text.replace('€', '').replace(',', '.').strip()
            precio_actual = float(precio_actual_text)
            
            # Precio original (puede no existir)
            precio_original = None
            descuento_porcentaje = 0
            
            try:
                precio_original_elem = price_container.find_element(By.CSS_SELECTOR, "del span.amount")
                precio_original_text = precio_original_elem.text.replace('€', '').replace(',', '.').strip()
                precio_original = float(precio_original_text)
                
                # Extraer porcentaje de descuento
                try:
                    descuento_elem = price_container.find_element(By.CSS_SELECTOR, "span.badge.onsale")
                    descuento_text = descuento_elem.text.replace('-', '').replace('%', '')
                    descuento_porcentaje = int(descuento_text)
                except:
                    # Calcular descuento manualmente
                    if precio_original and precio_original > precio_actual:
                        descuento_porcentaje = int(((precio_original - precio_actual) / precio_original) * 100)
                    
            except:
                precio_original = precio_actual
            
            # Extraer imagen
            imagen_url = None
            try:
                img_element = product_element.find_element(By.CSS_SELECTOR, "img.product-primary-image")
                imagen_url = img_element.get_attribute("src")
                if imagen_url and not imagen_url.startswith("http"):
                    imagen_url = "https:" + imagen_url
            except:
                pass
            
            return {
                'nombre': nombre,
                'url': url,
                'precio_actual': precio_actual,
                'precio_original': precio_original,
                'descuento_porcentaje': descuento_porcentaje,
                'imagen': imagen_url
            }
            
        except Exception as e:
            print(f"Error extrayendo datos del producto: {e}")
            return None

    def extract_marca_modelo(self, nombre):
        """
        Extrae marca y modelo del nombre
        """
        # Lista de marcas conocidas
        marcas = ['NOX', 'BULLPADEL', 'ADIDAS', 'WILSON', 'HEAD', 'BABOLAT', 'DUNLOP', 'PRINCE', 'SIUX', 'STARVIE', 'VIBOR-A']
        
        nombre_upper = nombre.upper()
        marca_encontrada = None
        
        for marca in marcas:
            if marca in nombre_upper:
                marca_encontrada = marca
                break
        
        if not marca_encontrada:
            # Intentar extraer primera palabra como marca
            palabras = nombre_upper.split()
            if palabras:
                marca_encontrada = palabras[0]
        
        # El modelo es el nombre completo sin "PALA" y sin "(Racket)"
        modelo = re.sub(r'\bPALA\b\s*', '', nombre_upper)
        modelo = re.sub(r'\(RACKET\)\s*', '', modelo)
        modelo = re.sub(r'\s+', ' ', modelo).strip()
        
        return marca_encontrada or "Unknown", modelo

    def create_new_racket_entry(self, scraped_data):
        """
        Crea una nueva entrada de pala en el JSON
        """
        marca, modelo = self.extract_marca_modelo(scraped_data['nombre'])
        
        return {
            "nombre": scraped_data['nombre'].upper(),
            "marca": marca,
            "modelo": modelo,
            "imagen": scraped_data['imagen'] or "",
            "es_bestseller": False,
            "en_oferta": scraped_data['descuento_porcentaje'] > 0,
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
                    "precio_actual": scraped_data['precio_actual'],
                    "precio_original": scraped_data['precio_original'],
                    "descuento_porcentaje": scraped_data['descuento_porcentaje'],
                    "enlace": scraped_data['url']
                },
                "PadelPoint": {
                    "precio_actual": None,
                    "precio_original": None,
                    "descuento_porcentaje": None,
                    "enlace": None
                },
                "PadelProShop": {
                    "precio_actual": None,
                    "precio_original": None,
                    "descuento_porcentaje": None,
                    "enlace": None
                }
            }
        }

    def save_json(self):
        """Guardar el JSON actualizado"""
        # Mantener la estructura original con la clave "palas"
        json_output = {"palas": self.data}
        
        with open(self.json_file_path, 'w', encoding='utf-8') as f:
            json.dump(json_output, f, ensure_ascii=False, indent=2)

    def load_all_products(self):
        """
        Carga todas las palas usando el botón 'Load More'
        """
        try:
            print("Navegando a PadelMarket...")
            self.driver.get("https://padelmarket.com/en-eu/collections/rackets")
            
            # Esperar a que cargue la página
            WebDriverWait(self.driver, 20).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "li.column"))
            )
            
            print("Página cargada, buscando productos y cargando todos...")
            
            # Manejar la carga de más productos usando el botón "Load More"
            products_loaded = 0
            attempt = 0
            max_attempts = 100  # Máximo intentos para cargar más
            
            while attempt < max_attempts:
                # Contar productos actuales
                current_products = self.driver.find_elements(By.CSS_SELECTOR, "li.column")
                current_count = len(current_products)
                
                print(f"Productos encontrados: {current_count}")
                
                # Parar si llegamos a 222 palas
                if current_count >= 222:
                    print(f"🛑 Límite alcanzado: {current_count} palas cargadas (máximo: 222)")
                    break
                
                # Si no se cargaron nuevos productos en este intento
                if current_count == products_loaded:
                    # Buscar botón "Load More"
                    load_more_buttons = self.driver.find_elements(By.CSS_SELECTOR, "button.load-more")
                    
                    button_clicked = False
                    for btn in load_more_buttons:
                        try:
                            if btn.is_displayed() and btn.is_enabled():
                                print(f"Haciendo clic en botón 'Load More'...")
                                # Scroll al botón antes de hacer clic
                                self.driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", btn)
                                time.sleep(2)
                                self.driver.execute_script("arguments[0].click();", btn)
                                button_clicked = True
                                break
                        except Exception as e:
                            print(f"Error haciendo clic en botón: {e}")
                            continue
                    
                    if button_clicked:
                        # Esperar a que carguen nuevos productos
                        print("Esperando a que carguen nuevos productos...")
                        time.sleep(7)  # Tiempo para cargar
                        
                        # Verificar si realmente se cargaron nuevos productos
                        new_products = self.driver.find_elements(By.CSS_SELECTOR, "li.column")
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
                        self.driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
                        time.sleep(3)
                        attempt += 1
                        
                        # Si después de varios intentos sin botón no hay cambios, salir
                        if attempt > 15:
                            print("No se pueden cargar más productos")
                            break
                else:
                    # Se cargaron nuevos productos, actualizar contador
                    products_loaded = current_count
                    attempt = 0  # Resetear intentos fallidos
            
            # Obtener todos los productos finales
            all_products = self.driver.find_elements(By.CSS_SELECTOR, "li.column")
            print(f"Total productos cargados: {len(all_products)}")
            
            return all_products
            
        except Exception as e:
            print(f"Error cargando productos: {e}")
            return []

    def scrape_all_products(self):
        """
        Hacer scraping de TODAS las palas de PadelMarket
        """
        try:
            # Cargar todas las palas
            products = self.load_all_products()
            
            if not products:
                print("❌ No se pudieron cargar productos")
                return
            
            print(f"Procesando todas las {len(products)} palas encontradas...")
            
            palas_procesadas = 0
            palas_actualizadas = 0
            palas_nuevas = 0
            
            for i, product in enumerate(products):
                try:
                    print(f"\nProcesando producto {i+1}/{len(products)}...")
                    
                    # Hacer scroll al elemento
                    self.driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", product)
                    time.sleep(0.3)
                    
                    # Extraer datos del producto
                    scraped_data = self.extract_product_data(product)
                    
                    if not scraped_data or not scraped_data['nombre']:
                        print("❌ No se pudieron extraer datos del producto")
                        continue
                        
                    print(f"Producto encontrado: {scraped_data['nombre']}")
                    print(f"Precio: {scraped_data['precio_actual']}€ (Descuento: {scraped_data['descuento_porcentaje']}%)")
                    
                    # Buscar coincidencia en el JSON
                    match_index, similarity = self.find_matching_racket(scraped_data['nombre'])
                    
                    if match_index is not None:
                        # Actualizar pala existente
                        print(f"✅ Match encontrado (similitud: {similarity:.2%})")
                        print(f"   Pala existente: {self.data[match_index]['nombre']}")
                        
                        self.data[match_index]["tiendas"]["PadelMarket"]["precio_actual"] = scraped_data['precio_actual']
                        self.data[match_index]["tiendas"]["PadelMarket"]["precio_original"] = scraped_data['precio_original']
                        self.data[match_index]["tiendas"]["PadelMarket"]["descuento_porcentaje"] = scraped_data['descuento_porcentaje']
                        self.data[match_index]["tiendas"]["PadelMarket"]["enlace"] = scraped_data['url']
                        
                        palas_actualizadas += 1
                    else:
                        # Crear nueva entrada
                        print("➕ Nueva pala detectada, agregando al JSON...")
                        new_racket = self.create_new_racket_entry(scraped_data)
                        self.data.append(new_racket)
                        palas_nuevas += 1
                    
                    palas_procesadas += 1
                    
                    # Guardar cada 25 productos procesados
                    if palas_procesadas % 25 == 0:
                        self.save_json()
                        print(f"💾 JSON guardado (progreso: {palas_procesadas} productos)")
                    
                except Exception as e:
                    print(f"❌ Error procesando producto {i+1}: {e}")
                    continue
            
            # Guardar al final
            self.save_json()
            
            print(f"\n=== RESUMEN FINAL ===")
            print(f"Palas procesadas: {palas_procesadas}")
            print(f"Palas actualizadas: {palas_actualizadas}")
            print(f"Palas nuevas: {palas_nuevas}")
            print(f"Total palas en JSON: {len(self.data)}")
            
        except Exception as e:
            print(f"Error durante el scraping: {e}")
        finally:
            if self.driver:
                self.driver.quit()

def main():
    # Crear backup antes de empezar
    import shutil
    from datetime import datetime
    
    json_file = "../palas_padel.json"
    backup_file = f"../palas_padel_backup_padelmarket_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    
    print("Creando backup del JSON...")
    shutil.copy2(json_file, backup_file)
    print(f"Backup creado: {backup_file}")
    
    print("\nIniciando scraping COMPLETO de PadelMarket (todas las palas)...")
    
    scrapper = PadelMarketScrapperFull(json_file)
    scrapper.setup_driver()
    scrapper.scrape_all_products()

if __name__ == "__main__":
    main()
