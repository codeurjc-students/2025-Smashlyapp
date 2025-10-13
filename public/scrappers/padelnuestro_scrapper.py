import requests
from bs4 import BeautifulSoup
import time
import json
import re

BASE_URL = "https://www.padelnuestro.com/palas-padel" # define the URL to scrape
HEADERS = { # the headers mimic a real browser
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "es-ES,es;q=0.8,en-US;q=0.5,en;q=0.3",
    "Accept-Encoding": "gzip, deflate, br",
    "Cache-Control": "no-cache",
}


def get_total_pages():
    """Obtains the total number of pages from the main page"""
    try:
        response = requests.get(BASE_URL, headers=HEADERS) # make a GET request to the base URL
        response.raise_for_status() # check if the request was successful
        soup = BeautifulSoup(response.text, "html.parser") # parse the HTML content

        # 
        page_last_elem = soup.select_one("a.page.last") # we find the last page link
        if page_last_elem: # check if the element exists
            href = page_last_elem.get("href", "") # get the href attribute
            if href:    # if href is not empty
                page_match = re.search(r"[?&]p=(\d+)", href) # search for the page number in the URL
                if page_match: # if we found a match
                    total_pages = int(page_match.group(1)) # convert it to an integer
                    print(
                        f"✅ Total de páginas encontrado en enlace 'page last': {total_pages}"
                    )
                    return total_pages

    except Exception as e:
        print(f"❌ Error obteniendo total de páginas: {e}")
        return 1


def extract_brand_and_model(nombre_completo):
    """Extrae marca y modelo del nombre completo"""
    # Lista de marcas conocidas
    marcas_conocidas = [
        "BULLPADEL",
        "HEAD",
        "NOX",
        "ADIDAS",
        "BABOLAT",
        "WILSON",
        "PRINCE",
        "DUNLOP",
        "VARLION",
        "STAR VIE",
        "VOLT",
        "SIUX",
        "ROYAL PADEL",
        "J.HAYBER",
        "SOFTEE",
        "VIBOR-A",
        "BLACK CROWN",
        "VAIRO",
    ]

    nombre_upper = nombre_completo.upper()

    # Buscar la marca en el nombre
    for marca in marcas_conocidas:
        if marca in nombre_upper:
            modelo = nombre_completo.replace(marca, "", 1).strip()
            return marca, modelo if modelo else nombre_completo

    # Si no se encuentra marca conocida, usar la primera palabra
    palabras = nombre_completo.split()
    marca = palabras[0] if palabras else "DESCONOCIDA"
    modelo = " ".join(palabras[1:]) if len(palabras) > 1 else nombre_completo

    return marca, modelo


def parse_price(precio_texto):
    """Convierte texto de precio a número"""
    if not precio_texto:
        return 0

    # Limpiar el texto y extraer números
    precio_limpio = re.sub(r"[^\d,.-]", "", precio_texto)

    try:
        # Manejar formato español (123,45)
        if "," in precio_limpio and "." in precio_limpio:
            # Formato 1.234,45
            precio_numerico = float(precio_limpio.replace(".", "").replace(",", "."))
        elif "," in precio_limpio:
            # Formato 123,45
            precio_numerico = float(precio_limpio.replace(",", "."))
        else:
            # Formato 123.45 o 123
            precio_numerico = float(precio_limpio)

        return precio_numerico
    except ValueError:
        return 0


def scrape_racket_details(enlace):
    """Extrae las características detalladas de una pala desde su página individual"""
    try:
        print(f"   🔍 Extrayendo detalles de: {enlace}")
        response = requests.get(enlace, headers=HEADERS)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "html.parser")

        detalles = {
            "descripcion": "",
            "caracteristicas": {},
            "especificaciones": {}
        }

        # Extraer descripción del producto
        descripcion_selectors = [
            ".product.attribute.description .value",
            ".product-description .value", 
            ".description .value",
            "#description .value",
            ".product-details .description"
        ]
        
        for selector in descripcion_selectors:
            desc_elem = soup.select_one(selector)
            if desc_elem:
                detalles["descripcion"] = desc_elem.get_text(strip=True)
                break

        # Extraer características técnicas de la tabla
        caracteristicas_tabla = soup.find("table", {"id": "product-attribute-specs-table"})
        if not caracteristicas_tabla:
            # Buscar otras posibles tablas de características
            posibles_tablas = [
                soup.find("table", class_=re.compile(r".*spec.*|.*attribute.*|.*characteristic.*", re.I)),
                soup.find("div", class_=re.compile(r".*spec.*|.*attribute.*|.*characteristic.*", re.I))
            ]
            for tabla in posibles_tablas:
                if tabla:
                    caracteristicas_tabla = tabla
                    break

        if caracteristicas_tabla:
            # Extraer filas de características
            filas = caracteristicas_tabla.find_all("tr")
            for fila in filas:
                celdas = fila.find_all(["td", "th"])
                if len(celdas) >= 2:
                    key = celdas[0].get_text(strip=True).lower()
                    value = celdas[1].get_text(strip=True)
                    
                    # Normalizar nombres de características
                    key_mapping = {
                        "marca": "marca",
                        "color": "color",
                        "color 2": "color_secundario", 
                        "balance": "balance",
                        "nucleo": "nucleo",
                        "núcleo": "nucleo",
                        "dureza": "dureza",
                        "acabado": "acabado",
                        "superficie": "superficie",
                        "forma": "forma",
                        "tipo de juego": "tipo_juego",
                        "jugador": "nivel_jugador",
                        "nivel de juego": "nivel_juego",
                        "peso": "peso",
                        "grosor": "grosor",
                        "material": "material",
                        "cara": "material_cara",
                        "marco": "material_marco"
                    }
                    
                    normalized_key = key_mapping.get(key, key.replace(" ", "_"))
                    if value and value.lower() not in ["", "-", "n/a"]:
                        detalles["caracteristicas"][normalized_key] = value

        # Buscar características alternativas en divs o listas
        if not detalles["caracteristicas"]:
            # Buscar en divs con clases específicas
            spec_containers = [
                soup.find_all("div", class_=re.compile(r".*spec.*|.*attribute.*", re.I)),
                soup.find_all("dl", class_=re.compile(r".*spec.*|.*attribute.*", re.I))
            ]
            
            for containers in spec_containers:
                for container in containers:
                    # Buscar pares dt/dd o label/value
                    labels = container.find_all(["dt", "label", "span"], class_=re.compile(r".*label.*|.*key.*", re.I))
                    for label in labels:
                        next_elem = label.find_next_sibling(["dd", "span", "div"])
                        if next_elem:
                            key = label.get_text(strip=True).lower().replace(":", "")
                            value = next_elem.get_text(strip=True)
                            
                            key_mapping = {
                                "marca": "marca",
                                "color": "color", 
                                "balance": "balance",
                                "forma": "forma",
                                "nivel": "nivel_jugador",
                                "peso": "peso"
                            }
                            
                            normalized_key = key_mapping.get(key, key.replace(" ", "_"))
                            if value and value.lower() not in ["", "-", "n/a"]:
                                detalles["caracteristicas"][normalized_key] = value

        # Pausa entre requests para no sobrecargar
        time.sleep(1)
        
        return detalles

    except Exception as e:
        print(f"   ❌ Error extrayendo detalles de {enlace}: {e}")
        return {
            "descripcion": "",
            "caracteristicas": {},
            "especificaciones": {}
        }


def scrape_page(page_num):
    """Scrapea una página específica"""
    # Construir URL de la página
    if page_num == 1:
        url = BASE_URL
    else:
        url = f"{BASE_URL}?p={page_num}"

    try:
        print(f"🌐 Scrapeando: {url}")
        response = requests.get(url, headers=HEADERS)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "html.parser")

        palas = []

        # Buscar productos usando diferentes selectores posibles
        product_selectors = [
            ".product-item",
            ".item.product.product-item",
            ".product-list__item",
            ".products-grid .item",
        ]

        products_found = []
        for selector in product_selectors:
            products_found = soup.select(selector)
            if products_found:
                print(
                    f"✅ Encontrados {len(products_found)} productos con selector: {selector}"
                )
                break

        if not products_found:
            print(f"⚠️ No se encontraron productos en la página {page_num}")
            return []

        for i, pala_div in enumerate(products_found):
            try:
                # Extraer nombre del producto
                nombre_selectors = [
                    ".product-item-name a",
                    ".product-name a",
                    "h3 a",
                    "h2 a",
                    ".product-item-link",
                ]

                nombre = ""
                for selector in nombre_selectors:
                    nombre_elem = pala_div.select_one(selector)
                    if nombre_elem:
                        nombre = nombre_elem.get_text(strip=True)
                        break

                if not nombre:
                    print(f"⚠️ No se pudo extraer nombre del producto {i+1}")
                    continue

                # Extraer precio
                precio_selectors = [
                    ".price",
                    ".current-price",
                    ".special-price",
                    ".regular-price",
                ]

                precio_texto = ""
                for selector in precio_selectors:
                    precio_elem = pala_div.select_one(selector)
                    if precio_elem:
                        precio_texto = precio_elem.get_text(strip=True)
                        break

                precio_actual = parse_price(precio_texto)

                # Buscar precio original (si está en oferta)
                precio_original_elem = pala_div.select_one(
                    ".old-price, .was-price, .regular-price"
                )
                precio_original = (
                    parse_price(precio_original_elem.get_text(strip=True))
                    if precio_original_elem
                    else None
                )

                # Extraer enlace del producto
                enlace_elem = pala_div.select_one("a")
                enlace = ""
                if enlace_elem and enlace_elem.get("href"):
                    enlace = enlace_elem["href"]
                    if enlace.startswith("/"):
                        enlace = f"https://www.padelnuestro.com{enlace}"

                # Extraer imagen
                imagen_elem = pala_div.select_one("img")
                imagen = ""
                if imagen_elem:
                    imagen = (
                        imagen_elem.get("data-src")
                        or imagen_elem.get("data-original")
                        or imagen_elem.get("src")
                        or ""
                    )
                    if imagen.startswith("/"):
                        imagen = f"https://www.padelnuestro.com{imagen}"
                    elif imagen.startswith("//"):
                        imagen = f"https:{imagen}"

                # Verificar si es bestseller
                es_bestseller = bool(pala_div.select_one(".bestseller, .best-seller"))

                # Calcular descuento
                descuento = 0
                if (
                    precio_original
                    and precio_actual
                    and precio_original > precio_actual
                ):
                    descuento = round(
                        ((precio_original - precio_actual) / precio_original) * 100
                    )

                # Extraer marca y modelo
                marca, modelo = extract_brand_and_model(nombre)

                # Construir datos básicos de la pala
                pala_data = {
                    "nombre": nombre,
                    "marca": marca,
                    "modelo": modelo,
                    "precio_actual": precio_actual,
                    "precio_original": precio_original,
                    "descuento_porcentaje": descuento,
                    "enlace": enlace,
                    "imagen": imagen,
                    "es_bestseller": es_bestseller,
                    "en_oferta": descuento > 0,
                    "scrapeado_en": time.strftime("%Y-%m-%d %H:%M:%S"),
                    "fuente": "padelnuestro.com",
                    # Campos adicionales que se llenarán después
                    "descripcion": "",
                    "caracteristicas": {},
                    "especificaciones": {}
                }

                # Extraer detalles adicionales de la página individual
                if enlace:
                    detalles = scrape_racket_details(enlace)
                    pala_data.update(detalles)

                palas.append(pala_data)

            except Exception as e:
                print(f"⚠️ Error procesando producto {i+1}: {e}")
                continue

        print(f"✅ Página {page_num}: {len(palas)} productos extraídos")
        return palas

    except Exception as e:
        print(f"❌ Error scrapeando página {page_num}: {e}")
        return []


def main():
    print("🕷️ Iniciando scraper de Padel Nuestro...")

    # Obtener total de páginas
    total_pages = get_total_pages()
    print(f"📄 Número total de páginas: {total_pages}")

    # OPCIÓN: Limitar páginas para pruebas
    # Descomenta la siguiente línea para limitar a menos páginas mientras pruebas
    # total_pages = min(total_pages, 2)  # Solo las primeras 2 páginas para pruebas

    all_palas = []
    errores = []

    # Scrapear todas las páginas
    for page in range(1, total_pages + 1):
        print(f"\n📄 Scrapeando página {page} de {total_pages}")

        try:
            palas = scrape_page(page)
            all_palas.extend(palas)

            print(f"✅ Página {page}: {len(palas)} productos procesados con detalles")
            
            # Pausa entre páginas más larga para no sobrecargar
            time.sleep(3)  # 3 segundos entre páginas

        except Exception as e:
            error_msg = f"Error en página {page}: {e}"
            errores.append(error_msg)
            print(f"❌ {error_msg}")
            continue

    # Guardar resultados
    resultado = {
        "palas": all_palas,
        "total_palas": len(all_palas),
        "total_paginas_scrapeadas": page,
        "errores": errores,
        "scrapeado_en": time.strftime("%Y-%m-%d %H:%M:%S"),
        "estadisticas": {
            "marcas": {},
            "precio_min": min(
                [p["precio_actual"] for p in all_palas if p["precio_actual"] > 0],
                default=0,
            ),
            "precio_max": max([p["precio_actual"] for p in all_palas], default=0),
            "bestsellers": len([p for p in all_palas if p["es_bestseller"]]),
            "en_oferta": len([p for p in all_palas if p["en_oferta"]]),
            "con_caracteristicas": len([p for p in all_palas if p.get("caracteristicas")]),
            "con_descripcion": len([p for p in all_palas if p.get("descripcion")])
        },
    }

    # Calcular estadísticas de marcas
    for pala in all_palas:
        marca = pala["marca"]
        resultado["estadisticas"]["marcas"][marca] = (
            resultado["estadisticas"]["marcas"].get(marca, 0) + 1
        )

    # Guardar en archivo JSON
    with open("palas_padel.json", "w", encoding="utf-8") as f:
        json.dump(resultado, f, ensure_ascii=False, indent=2)

    print(f"\n🎉 Scraping completado!")
    print(f"📊 Total palas encontradas: {len(all_palas)}")
    print(f"🏷️ Marcas diferentes: {len(resultado['estadisticas']['marcas'])}")
    print(f"⭐ Bestsellers: {resultado['estadisticas']['bestsellers']}")
    print(f"💰 En oferta: {resultado['estadisticas']['en_oferta']}")
    print(f"📋 Con características: {resultado['estadisticas']['con_caracteristicas']}")
    print(f"📝 Con descripción: {resultado['estadisticas']['con_descripcion']}")
    print(f"💾 Datos guardados en: palas_padel.json")

    if errores:
        print(f"⚠️ Se encontraron {len(errores)} errores durante el scraping")


if __name__ == "__main__":
    main()