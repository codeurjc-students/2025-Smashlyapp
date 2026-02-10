#!/usr/bin/env python3
"""
Script de deduplicación y limpieza de rackets.json
- Crea backup automático con timestamp
- Elimina packs, tripacks, y entradas pala-pala-
- Corrige marcas incorrectas (Unknown, Drop, Black, Royal, Pala)
- Fusiona duplicados manteniendo la información más completa
- Genera IDs normalizados
"""
import json
import re
from datetime import datetime
from collections import defaultdict
from pathlib import Path


# ============================================================================
# CONFIGURACIÓN
# ============================================================================

RACKETS_FILE = 'rackets.json'
BACKUP_FOLDER = '../../backups/rackets'

# Marcas conocidas para extracción automática
KNOWN_BRANDS = [
    'Adidas', 'Babolat', 'Black Crown', 'Bullpadel', 'Drop Shot', 'Dunlop',
    'Enebe', 'Head', 'Joma', 'Kombat', 'LOK', 'Nox', 'Oxdog', 'Royal Padel',
    'Siux', 'Softee', 'Star Vie', 'StarVie', 'Starvie', 'Vibor-A', 'Vibor-a',
    'Wilson', 'Varlion', 'Vairo', 'Akkeron', 'Prince', 'Tecnifibre',
    'Slazenger', 'Legend', 'Harlem', 'Puma', 'Mystica', 'K-Swiss', 'Kswiss',
    'Set', 'Just Ten', 'Orygen', 'RS', 'PadelPROShop'
]

# Correcciones de marca
BRAND_CORRECTIONS = {
    'Drop': 'Drop Shot',
    'Black': 'Black Crown',
    'Royal': 'Royal Padel',
    'Vibor-A': 'Vibor-a',
    'Star Vie': 'StarVie',
    'Starvie': 'StarVie',
}


# ============================================================================
# FUNCIONES AUXILIARES
# ============================================================================

def create_backup():
    """Crea backup del archivo con timestamp."""
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_path = Path(BACKUP_FOLDER)
    backup_path.mkdir(parents=True, exist_ok=True)
    
    backup_file = backup_path / f'rackets_backup_{timestamp}.json'
    
    with open(RACKETS_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    with open(backup_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"✓ Backup creado: {backup_file}")
    return backup_file


def slugify(text):
    """Convierte texto a slug (lowercase, sin acentos, guiones)."""
    # Normalizar
    text = text.lower().strip()
    
    # Reemplazar acentos
    replacements = {
        'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u', 'ü': 'u',
        'ñ': 'n', 'à': 'a', 'è': 'e', 'ì': 'i', 'ò': 'o', 'ù': 'u'
    }
    for old, new in replacements.items():
        text = text.replace(old, new)
    
    # Eliminar caracteres especiales y reemplazar espacios por guiones
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[-\s]+', '-', text)
    
    return text.strip('-')


def extract_brand_from_model(model_name):
    """Extrae la marca del nombre del modelo."""
    model_upper = model_name.upper()
    
    # Ordenar por longitud descendente para buscar primero las marcas compuestas
    sorted_brands = sorted(KNOWN_BRANDS, key=len, reverse=True)
    
    for brand in sorted_brands:
        if brand.upper() in model_upper:
            return brand
    
    # Si no se encuentra, intentar extraer la primera palabra
    first_word = model_name.split()[0] if model_name.split() else 'Unknown'
    return first_word.title()


def clean_model_name(model_name):
    """Limpia el nombre del modelo: quita 'Pala', '(PALA)', convierte a Title Case."""
    # Quitar prefijos
    model = re.sub(r'^(pala\s+(de\s+)?padel\s+|pala\s+test\s+|pala\s+)', '', model_name, flags=re.IGNORECASE)
    
    # Quitar sufijos
    model = re.sub(r'\s*\(pala\)\s*$', '', model, flags=re.IGNORECASE)
    model = re.sub(r'\s+-\s*pala\s*$', '', model, flags=re.IGNORECASE)
    model = re.sub(r'\s+pala\s*$', '', model, flags=re.IGNORECASE)
    
    # Limpiar espacios
    model = re.sub(r'\s+', ' ', model).strip()
    
    # Convertir a Title Case inteligente
    # Preservar acrónimos como AT10, ML10, etc.
    words = model.split()
    result = []
    for word in words:
        # Si es todo mayúsculas y tiene números o tiene menos de 4 letras, mantener
        if word.isupper() and (any(c.isdigit() for c in word) or len(word) <= 3):
            result.append(word)
        # Si tiene mayúsculas intercaladas, mantener
        elif any(c.isupper() for c in word[1:]):
            result.append(word)
        else:
            result.append(word.title())
    
    return ' '.join(result)


def normalize_for_comparison(text):
    """Normaliza texto para comparación (sin acentos, lowercase, sin espacios extra)."""
    text = text.lower().strip()
    
    # Quitar 'pala' y '(pala)'
    text = re.sub(r'^(pala\s+(de\s+)?padel\s+|pala\s+test\s+|pala\s+)', '', text)
    text = re.sub(r'\s*\(pala\)\s*$', '', text)
    text = re.sub(r'\s+-\s*pala\s*$', '', text)
    text = re.sub(r'\s+pala\s*$', '', text)
    
    # Reemplazar acentos
    replacements = {
        'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u', 'ü': 'u', 'ñ': 'n'
    }
    for old, new in replacements.items():
        text = text.replace(old, new)
    
    # Normalizar espacios y caracteres
    text = re.sub(r'[_\-/]+', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    
    return text


def should_exclude_entry(key, entry):
    """Determina si una entrada debe ser excluida."""
    brand = entry.get('brand', '')
    
    # Excluir packs, tripacks, mini
    if brand in ['Pack', 'Tripack', 'Mini']:
        return True
    
    # Excluir entradas pala-pala-
    if key.startswith('pala-pala-'):
        return True
    
    return False


def correct_brand(brand, model_name):
    """Corrige la marca si es incorrecta."""
    # Si está en el mapa de correcciones, corregir
    if brand in BRAND_CORRECTIONS:
        return BRAND_CORRECTIONS[brand]
    
    # Si es Unknown o Pala, extraer del modelo
    if brand in ['Unknown', 'Pala', '']:
        return extract_brand_from_model(model_name)
    
    return brand


def merge_entries(entries):
    """Fusiona múltiples entradas de la misma pala en una sola."""
    if len(entries) == 1:
        return entries[0][1]  # Retornar el valor directamente
    
    # Ordenar por cantidad de specs (descendente)
    entries_sorted = sorted(entries, key=lambda x: len(x[1].get('specs', {})), reverse=True)
    
    # Tomar la base (la que tiene más specs)
    base_key, base_entry = entries_sorted[0]
    merged = base_entry.copy()
    
    # Fusionar specs (añadir campos que falten)
    all_specs = {}
    for key, entry in entries:
        all_specs.update(entry.get('specs', {}))
    merged['specs'] = all_specs
    
    # Tomar las imágenes de la entrada con más imágenes
    max_images = max(entries, key=lambda x: len(x[1].get('images', [])))
    merged['images'] = max_images[1].get('images', [])
    
    # Tomar la primera descripción no vacía
    for key, entry in entries:
        desc = entry.get('description', '').strip()
        if desc:
            merged['description'] = desc
            break
    
    # Preferir model en Title Case sin "Pala"
    models = [(e.get('model', ''), e.get('model', '').isupper()) for k, e in entries]
    # Buscar uno que no esté todo en mayúsculas
    for model, is_upper in models:
        if not is_upper and model:
            merged['model'] = clean_model_name(model)
            break
    else:
        # Si todos están en mayúsculas, tomar el primero y limpiar
        merged['model'] = clean_model_name(entries[0][1].get('model', ''))
    
    # Corregir marca (tomar la primera que no sea Unknown/Pala)
    for key, entry in entries:
        brand = entry.get('brand', '')
        if brand not in ['Unknown', 'Pala', '']:
            merged['brand'] = correct_brand(brand, merged['model'])
            break
    
    # Fusionar precios (unir todos, evitando duplicados por tienda)
    prices_by_store = {}
    for key, entry in entries:
        for price in entry.get('prices', []):
            store = price.get('store')
            last_updated = price.get('last_updated', '')
            
            if store not in prices_by_store:
                prices_by_store[store] = price
            else:
                # Quedarse con el más reciente
                if last_updated > prices_by_store[store].get('last_updated', ''):
                    prices_by_store[store] = price
    
    merged['prices'] = list(prices_by_store.values())
    
    return merged


def generate_new_id(brand, model):
    """Genera un ID normalizado para la entrada."""
    brand_slug = slugify(brand)
    model_slug = slugify(model)
    
    return f"{brand_slug}-{model_slug}"


# ============================================================================
# PROCESO PRINCIPAL
# ============================================================================

def main():
    print("=" * 80)
    print("SCRIPT DE DEDUPLICACIÓN DE RACKETS.JSON")
    print("=" * 80)
    print()
    
    # Fase 1: Crear backup
    print("FASE 1: Creando backup...")
    backup_file = create_backup()
    print()
    
    # Cargar datos
    with open(RACKETS_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    initial_count = len(data)
    print(f"Entradas iniciales: {initial_count}")
    print()
    
    # Fase 2: Filtrado inicial
    print("FASE 2: Filtrando entradas a excluir...")
    excluded_packs = 0
    excluded_tripacks = 0
    excluded_mini = 0
    excluded_pala_pala = 0
    
    filtered_data = {}
    for key, entry in data.items():
        brand = entry.get('brand', '')
        
        if should_exclude_entry(key, entry):
            if brand == 'Pack':
                excluded_packs += 1
            elif brand == 'Tripack':
                excluded_tripacks += 1
            elif brand == 'Mini':
                excluded_mini += 1
            elif key.startswith('pala-pala-'):
                excluded_pala_pala += 1
        else:
            filtered_data[key] = entry
    
    print(f"  ✗ Packs eliminados: {excluded_packs}")
    print(f"  ✗ Tripacks eliminados: {excluded_tripacks}")
    print(f"  ✗ Mini eliminados: {excluded_mini}")
    print(f"  ✗ pala-pala- eliminados: {excluded_pala_pala}")
    print(f"  → Entradas restantes: {len(filtered_data)}")
    print()
    
    # Fase 3: Corrección de marcas
    print("FASE 3: Corrigiendo marcas...")
    brands_corrected = defaultdict(int)
    
    for key, entry in filtered_data.items():
        original_brand = entry.get('brand', '')
        model = entry.get('model', '')
        corrected_brand = correct_brand(original_brand, model)
        
        if corrected_brand != original_brand:
            brands_corrected[original_brand] += 1
            entry['brand'] = corrected_brand
    
    for brand, count in sorted(brands_corrected.items()):
        print(f"  ✓ '{brand}' corregido en {count} entradas")
    print()
    
    # Fase 4: Normalización y agrupación
    print("FASE 4: Agrupando duplicados...")
    groups = defaultdict(list)
    
    for key, entry in filtered_data.items():
        model = entry.get('model', '')
        normalized = normalize_for_comparison(model)
        groups[normalized].append((key, entry))
    
    # Identificar grupos con duplicados
    duplicate_groups = {k: v for k, v in groups.items() if len(v) > 1}
    print(f"  → Grupos con duplicados: {len(duplicate_groups)}")
    print(f"  → Total de entradas duplicadas: {sum(len(v) for v in duplicate_groups.values())}")
    print()
    
    # Fase 5: Fusión de duplicados
    print("FASE 5: Fusionando duplicados...")
    merged_data = {}
    merge_count = 0
    
    for normalized, entries in groups.items():
        merged_entry = merge_entries(entries)
        
        # Limpiar el modelo
        merged_entry['model'] = clean_model_name(merged_entry.get('model', ''))
        
        # Generar nuevo ID
        brand = merged_entry.get('brand', '')
        model = merged_entry.get('model', '')
        new_id = generate_new_id(brand, model)
        
        # Evitar colisiones de ID (agregar sufijo si es necesario)
        original_id = new_id
        counter = 1
        while new_id in merged_data:
            new_id = f"{original_id}-{counter}"
            counter += 1
        
        merged_entry['id'] = new_id
        merged_data[new_id] = merged_entry
        
        if len(entries) > 1:
            merge_count += 1
    
    print(f"  ✓ Grupos fusionados: {merge_count}")
    print(f"  → Entradas finales: {len(merged_data)}")
    print()
    
    # Fase 6: Escritura del resultado
    print("FASE 6: Escribiendo resultado...")
    with open(RACKETS_FILE, 'w', encoding='utf-8') as f:
        json.dump(merged_data, f, ensure_ascii=False, indent=2)
    
    print(f"  ✓ Archivo actualizado: {RACKETS_FILE}")
    print()
    
    # Fase 7: Reporte final
    print("=" * 80)
    print("REPORTE FINAL")
    print("=" * 80)
    print(f"Entradas iniciales:        {initial_count}")
    print(f"Entradas eliminadas:       {initial_count - len(filtered_data)}")
    print(f"  - Packs:                 {excluded_packs}")
    print(f"  - Tripacks:              {excluded_tripacks}")
    print(f"  - Mini:                  {excluded_mini}")
    print(f"  - pala-pala:             {excluded_pala_pala}")
    print(f"Marcas corregidas:         {sum(brands_corrected.values())}")
    print(f"Grupos fusionados:         {merge_count}")
    print(f"Entradas duplicadas:       {sum(len(v) - 1 for v in duplicate_groups.values())}")
    print(f"Entradas finales:          {len(merged_data)}")
    print(f"Reducción total:           {initial_count - len(merged_data)} ({100*(initial_count - len(merged_data))/initial_count:.1f}%)")
    print()
    
    # Mostrar ejemplos de merges
    print("EJEMPLOS DE MERGES:")
    for i, (normalized, entries) in enumerate(list(duplicate_groups.items())[:5], 1):
        print(f"\n  [{i}] '{normalized}'")
        for key, entry in entries:
            stores = [p['store'] for p in entry.get('prices', [])]
            print(f"      - {key}")
            print(f"        Stores: {stores}")
        
        # Mostrar el resultado
        merged = merge_entries(entries)
        new_id = generate_new_id(merged['brand'], merged['model'])
        all_stores = [p['store'] for p in merged.get('prices', [])]
        print(f"      → MERGED: {new_id}")
        print(f"        Brand: {merged['brand']}")
        print(f"        Model: {merged['model']}")
        print(f"        All stores: {all_stores}")
        print(f"        Specs count: {len(merged.get('specs', {}))}")
        print(f"        Images count: {len(merged.get('images', []))}")
    
    print()
    print("✓ Proceso completado exitosamente!")
    print()


if __name__ == '__main__':
    main()
