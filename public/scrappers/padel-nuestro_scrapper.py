import requests
from bs4 import BeautifulSoup
import time
import json
import re

BASE_URL = "https://www.padelnuestro.com/palas-padel"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "es-ES,es;q=0.8,en-US;q=0.5,en;q=0.3",
    "Accept-Encoding": "gzip, deflate, br",
    "Cache-Control": "no-cache",
}


def get_total_pages():
    """Obtiene el número total de páginas disponibles"""
    try:
        response = requests.get(BASE_URL, headers=HEADERS)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "html.parser")

        # Método 1: Buscar el enlace con class="page last"
        page_last_elem = soup.select_one("a.page.last")
        if page_last_elem:
            href = page_last_elem.get("href", "")
            if href:
                page_match = re.search(r"[?&]p=(\d+)", href)
                if page_match:
                    total_pages = int(page_match.group(1))
                    print(
                        f"✅ Total de páginas encontrado en enlace 'page last': {total_pages}"
                    )
                    return total_pages

        # Método 2: Buscar el span que contiene "Pág" y obtener el span siguiente con el número
        label_span = soup.find(
            "span", class_="label", string=re.compile(r"Pág", re.IGNORECASE)
        )
        if label_span:
            next_span = label_span.find_next_sibling("span")
            if next_span and next_span.get_text(strip=True).isdigit():
                total_pages = int(next_span.get_text(strip=True))
                print(
                    f"✅ Total de páginas encontrado en span siguiente a 'Pág': {total_pages}"
                )
                return total_pages

        # Método 3: Buscar dentro del contenedor de paginación con diferentes selectores
        pagination_selectors = [
            "a.page.last",
            ".pages .page.last",
            ".pages-item-last a",
            ".pagination .page.last",
            'a[href*="p="]',
        ]

        for selector in pagination_selectors:
            last_page_elem = soup.select_one(selector)
            if last_page_elem:
                href = last_page_elem.get("href", "")
                text = last_page_elem.get_text(strip=True)

                # Extraer de la URL (ej: ?p=36)
                if href:
                    page_match = re.search(r"[?&]p=(\d+)", href)
                    if page_match:
                        total_pages = int(page_match.group(1))
                        print(
                            f"✅ Total de páginas encontrado en URL con selector '{selector}': {total_pages}"
                        )
                        return total_pages

                # Extraer del texto
                if text.isdigit():
                    total_pages = int(text)
                    print(
                        f"✅ Total de páginas encontrado en texto con selector '{selector}': {total_pages}"
                    )
                    return total_pages

        # Método 4: Buscar cualquier enlace que contenga el parámetro más alto de página
        page_links = soup.find_all("a", href=re.compile(r"[?&]p=\d+"))
        if page_links:
            max_page = 0
            for link in page_links:
                href = link.get("href", "")
                page_match = re.search(r"[?&]p=(\d+)", href)
                if page_match:
                    page_num = int(page_match.group(1))
                    max_page = max(max_page, page_num)

            if max_page > 0:
                print(
                    f"✅ Total de páginas encontrado buscando el máximo en enlaces: {max_page}"
                )
                return max_page

        print("⚠️ No se pudo determinar el número de páginas, usando 1")
        return 1

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
                }

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

    all_palas = []
    errores = []

    # Scrapear todas las páginas
    for page in range(1, total_pages + 1):  # Limitar a 20 páginas por seguridad
        print(f"\n📄 Scrapeando página {page} de {total_pages}")

        try:
            palas = scrape_page(page)
            all_palas.extend(palas)

            # Pausa entre páginas
            time.sleep(2)  # 2 segundos para no sobrecargar

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
    print(f"💾 Datos guardados en: palas_padel.json")

    if errores:
        print(f"⚠️ Se encontraron {len(errores)} errores durante el scraping")


if __name__ == "__main__":
    main()