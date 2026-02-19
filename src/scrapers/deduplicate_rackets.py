#!/usr/bin/env python3
"""
Script de mantenimiento: Limpieza + Deduplicación rigurosa.
Fase 1: Filtra packs/bundles y corrige marcas incorrectas.
Fase 2: Usa Fingerprinting (hard filter + fuzzy) para fusionar duplicados sin mezclar años/variantes.
"""
import json
import re
from datetime import datetime
from collections import defaultdict
from pathlib import Path
from thefuzz import fuzz

# ============================================================================
# CONFIGURACIÓN
# ============================================================================

RACKETS_FILE = 'rackets.json'
BACKUP_FOLDER = '../../backups/rackets'

# Marcas conocidas (ordenadas por longitud desc para matching prioritario)
KNOWN_BRANDS = sorted([
    'Adidas', 'Babolat', 'Black Crown', 'Bullpadel', 'Drop Shot', 'Dunlop',
    'Enebe', 'Head', 'Joma', 'Kombat', 'LOK', 'Nox', 'Oxdog', 'Royal Padel',
    'Siux', 'Softee', 'StarVie', 'Vibor-a', 'Wilson', 'Varlion', 'Vairo',
    'Akkeron', 'Prince', 'Tecnifibre', 'Slazenger', 'Legend', 'Harlem',
    'Puma', 'Mystica', 'K-Swiss', 'Just Ten', 'Orygen', 'RS',
], key=len, reverse=True)

# Correcciones de marcas parciales/incorrectas
BRAND_CORRECTIONS = {
    'Drop': 'Drop Shot',
    'Black': 'Black Crown',
    'Royal': 'Royal Padel',
    'Star Vie': 'StarVie',
    'Starvie': 'StarVie',
    'Vibor-A': 'Vibor-a',
}

# Brands que indican que la entrada NO es una pala
EXCLUDED_BRANDS = {'Pack', 'Tripack', 'Mini'}

# Nombres de jugadores que son ENDORSEMENT (se eliminan del nombre del modelo)
# Ordenados por longitud desc para evitar matches parciales ("Dal Bianco" antes que "Bianco")
PLAYER_NAMES = sorted([
    # Hombres
    'Agustín Tapia', 'Agustin Tapia', 'A. Tapia', 'A Tapia',
    'Juan Lebrón', 'Juan Lebron', 'J. Lebrón', 'J. Lebron', 'J Lebron', 'Lebrón', 'Lebron',
    'Ale Galán', 'Ale Galan', 'Alejandro Galán', 'Alejandro Galan',
    'Paquito Navarro',
    'Juan Tello',
    'Franco Stupaczuk', 'Franco Stupa', 'Stupa',
    'Fede Chingotto', 'Federico Chingotto',
    'Juan M. Díaz', 'Juan Martín Díaz', 'Juan Martin Diaz',
    'Martín Di Nenno', 'Martin Di Nenno', 'Di Nenno',
    'Álex Ruiz', 'Alex Ruiz',
    'Maxi Arce',
    'Seba Nerone', 'Sebastian Nerone',
    'Tino Libaak',
    'Álex Chozas', 'Alex Chozas',
    'Mike Yanguas', 'Yanguas',
    'Franco Dal Bianco', 'Dal Bianco',
    'Leo Augsburger', 'Leo Ausburger',
    'Edu Alonso',
    'Jon Sanz',
    'Pablo Lima',
    'Miguel Lamperti',
    'Lucas Campagnolo',
    'Javi Garrido',
    'Pablo Cardona',
    'Juanlu Esbri',
    'Sanyo Gutiérrez', 'Sanyo Gutierrez',
    'Momo González', 'Momo Gonzalez',
    'Javi Leal',
    # Mujeres
    'Martita Ortega', 'Marta Ortega',
    'Patty Llaguno',
    'Alejandra Salazar',
    'Bea González', 'Bea Gonzalez',
    'Sofía Araujo', 'Sofia Araujo',
    'Aranzazu Osoro',
    'Ari Sánchez', 'Ari Sanchez',
    'Claudia Fernández', 'Claudia Fernandez',
    'Paula Josemaría', 'Paula Josemaria',
    'Vero Virseda',
    'Delfi Brea',
    'Fernando Belasteguín', 'Fernando Belasteguin',
], key=len, reverse=True)

# Jugadores cuyo nombre ES el modelo (NO se eliminan)
MODEL_PLAYER_NAMES = {'coello', 'bela'}

# Términos que indican que la entrada es para niños/junior (se excluyen)
JUNIOR_TERMS = ['junior', ' jr ', ' jr$', ' kid ', ' kids ', ' boy ', ' girl ', ' mini ']

# ============================================================================
# LÓGICA DE FINGERPRINTING (Replicada de RacketManager para consistencia)
# ============================================================================

def extract_features(name: str):
    """Extrae características clave para comparación estricta."""
    name_lower = name.lower()
    
    year_match = re.search(r'\b(202[3-7])\b', name_lower)
    year = year_match.group(1) if year_match else None

    critical_suffixes = [
        "woman", "w", "light", "lite", "air", "junior", "jr", 
        "hybrid", "ctrl", "control", "attack", "comfort", "cmf", "master",
        "limited", "ltd", "pro", "team", "elite"
    ]
    found_suffixes = sorted([s for s in critical_suffixes if f" {s} " in f" {name_lower} " or f"-{s}" in name_lower])

    k_factor = re.search(r'\b(\d{1,2}[kK])\b', name_lower)
    material_k = k_factor.group(1).lower() if k_factor else None
    
    # Extraer dígitos de versión (ST2, ST3, V3, etc.) como discriminador
    version_match = re.search(r'\b(?:st|v|ver|gen)(\d+)\b', name_lower)
    version = version_match.group(0) if version_match else None
    
    # Clean name for fuzzy
    clean_name = name_lower
    clean_name = re.sub(r'\b202[0-9]\b', '', clean_name)
    for w in ['pala', 'padel', 'racket', 'de', 'para']:
        clean_name = clean_name.replace(w, '')
    clean_name = re.sub(r'[^\w\s]', '', clean_name).strip()

    hard_signature = f"{year}|{'-'.join(found_suffixes)}|{material_k}|{version}"
    
    return {
        "year": year,
        "suffixes": found_suffixes,
        "material_k": material_k,
        "version": version,
        "clean_name": clean_name,
        "hard_signature": hard_signature
    }

# ============================================================================
# FASE 1: LIMPIEZA (Filtrado + Corrección de marcas)
# ============================================================================

def extract_brand_from_model(model_name: str) -> str:
    """Intenta extraer la marca del nombre del modelo."""
    model_upper = model_name.upper()
    for brand in KNOWN_BRANDS:
        if brand.upper() in model_upper:
            return brand
    return 'Unknown'

def correct_brand(brand: str, model_name: str) -> str:
    """Corrige marcas incorrectas o parciales."""
    if brand in BRAND_CORRECTIONS:
        return BRAND_CORRECTIONS[brand]
    if brand in ('Unknown', 'Pala', ''):
        return extract_brand_from_model(model_name)
    return brand

def should_exclude(key: str, entry: dict) -> bool:
    """Determina si una entrada debe ser excluida (packs, bundles, junior, etc.)."""
    brand = entry.get('brand', '')
    model = entry.get('model', '').lower()
    padded_model = f" {model} "  # Pad para buscar palabras completas
    
    if brand in EXCLUDED_BRANDS:
        return True
    if key.startswith('pala-pala-'):
        return True
    
    # Detectar packs/bundles por nombre
    pack_terms = ['pack ', 'tripack', ' + ', 'conjunto', 'kit ']
    if any(term in model for term in pack_terms):
        return True
    
    # Detectar junior/kids/boy/girl
    junior_terms = [' junior ', ' jr ', ' kid ', ' kids ', ' boy ', ' girl ', ' mini ']
    if any(term in padded_model for term in junior_terms):
        return True
    # También buscar en la key por si el model no lo tiene
    key_lower = key.lower()
    if any(term.strip() in key_lower.split('-') for term in [' junior', ' jr', ' kid', ' kids', ' boy', ' girl', ' mini']):
        return True
    
    return False

def remove_player_names(model_name: str) -> str:
    """Elimina nombres de jugadores endorsement del modelo.
    Respeta los nombres que SON el modelo (ej: Coello, Bela)."""
    result = model_name
    
    for player in PLAYER_NAMES:
        # Crear patrón que busca el nombre del jugador como palabra completa (case insensitive)
        # Precedido opcionalmente por "by" o "-"
        pattern = r'(?:\s+by)?\s+' + re.escape(player) + r'\b'
        result = re.sub(pattern, '', result, flags=re.IGNORECASE)
    
    # Eliminar "by" suelto que pueda quedar al final
    result = re.sub(r'\s+by\s*$', '', result, flags=re.IGNORECASE)
    
    # Limpiar espacios dobles
    result = re.sub(r'\s+', ' ', result).strip()
    
    return result

def clean_model_name(model_name: str) -> str:
    """Limpia prefijos/sufijos innecesarios del nombre del modelo."""
    model = re.sub(r'^(pala\s+(de\s+)?padel\s+|pala\s+test\s+|pala\s+)', '', model_name, flags=re.IGNORECASE)
    model = re.sub(r'\s*\(pala\)\s*$', '', model, flags=re.IGNORECASE)
    model = re.sub(r'\s+-\s*pala\s*$', '', model, flags=re.IGNORECASE)
    model = re.sub(r'\s+pala\s*$', '', model, flags=re.IGNORECASE)
    
    # Eliminar nombres de jugadores endorsement
    model = remove_player_names(model)
    
    model = re.sub(r'\s+', ' ', model).strip()
    return model

def phase_clean(data: dict) -> dict:
    """Fase 1: Filtra entradas inválidas y corrige marcas."""
    cleaned = {}
    stats = defaultdict(int)
    
    for key, entry in data.items():
        if should_exclude(key, entry):
            stats['excluded'] += 1
            continue
        
        # Corregir marca
        original_brand = entry.get('brand', '')
        model = entry.get('model', '')
        corrected_brand = correct_brand(original_brand, model)
        
        if corrected_brand != original_brand:
            stats[f'brand_fix:{original_brand}->{corrected_brand}'] += 1
            entry['brand'] = corrected_brand
        
        # Limpiar nombre del modelo
        original_model = model
        entry['model'] = clean_model_name(model)
        
        if entry['model'] != original_model:
            # Detectar si se eliminó un jugador
            cleaned_lower = entry['model'].lower()
            original_lower = original_model.lower()
            if len(cleaned_lower) < len(original_lower) - 5:  # Cambio significativo
                stats['player_removed'] += 1
        
        cleaned[key] = entry
    
    # Reporte
    print(f"\n--- FASE 1: LIMPIEZA ---")
    print(f"  Entradas excluidas (packs/junior/bundles): {stats['excluded']}")
    print(f"  Nombres de jugador eliminados: {stats.get('player_removed', 0)}")
    brand_fixes = {k: v for k, v in stats.items() if k.startswith('brand_fix:')}
    if brand_fixes:
        print(f"  Marcas corregidas:")
        for fix, count in sorted(brand_fixes.items()):
            label = fix.replace('brand_fix:', '  ')
            print(f"    {label}: {count}")
    print(f"  Entradas tras limpieza: {len(cleaned)}")
    
    return cleaned

# ============================================================================
# FASE 2: FUNCIONES DE MERGE
# ============================================================================

def create_backup():
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_path = Path(BACKUP_FOLDER)
    backup_path.mkdir(parents=True, exist_ok=True)
    backup_file = backup_path / f'rackets_dedupe_{timestamp}.json'
    
    with open(RACKETS_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)
    with open(backup_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"  Backup: {backup_file}")
    return backup_file

def merge_entries(entries):
    """Fusiona entradas manteniendo la información más rica."""
    entries.sort(key=lambda x: (len(x[1].get('specs', {})), len(x[1].get('images', []))), reverse=True)
    
    base_id, base_data = entries[0]
    merged = base_data.copy()
    
    # Fusionar Specs
    for _, entry in entries[1:]:
        for k, v in entry.get('specs', {}).items():
            if k not in merged['specs'] or merged['specs'][k] == 'Desconocido':
                merged['specs'][k] = v
    
    # Fusionar Images (evitar duplicados)
    existing_imgs = set(merged.get('images', []))
    for _, entry in entries[1:]:
        for img in entry.get('images', []):
            if img not in existing_imgs:
                merged['images'].append(img)
                existing_imgs.add(img)

    # Fusionar Precios
    prices_map = {}
    for p in merged.get('prices', []):
        prices_map[p['store']] = p
    for _, entry in entries[1:]:
        for p in entry.get('prices', []):
            store = p['store']
            if store not in prices_map:
                prices_map[store] = p
            elif p.get('last_updated', '') > prices_map[store].get('last_updated', ''):
                prices_map[store] = p
    merged['prices'] = list(prices_map.values())
    
    # Nombre: Preferir el que tenga año si el base no lo tiene
    if extract_features(merged['model'])['year'] is None:
        for _, entry in entries[1:]:
            if extract_features(entry['model'])['year']:
                merged['model'] = entry['model']
                break
                
    return merged

# ============================================================================
# FASE 2: DEDUPLICACIÓN (Fingerprint + Fuzzy)
# ============================================================================

def phase_deduplicate(data: dict) -> dict:
    """Fase 2: Agrupa por brand+signature y fusiona con fuzzy match."""
    buckets = defaultdict(list)
    
    for rid, entry in data.items():
        brand = entry.get('brand', 'Unknown').lower().strip()
        features = extract_features(entry.get('model', ''))
        bucket_key = f"{brand}|{features['hard_signature']}"
        buckets[bucket_key].append((rid, entry, features))

    new_data = {}
    merges_count = 0

    for key, items in buckets.items():
        if len(items) == 1:
            new_data[items[0][0]] = items[0][1]
            continue
            
        sub_groups = []
        used_indices = set()
        
        for i in range(len(items)):
            if i in used_indices: continue
            
            current_group = [items[i]]
            used_indices.add(i)
            
            for j in range(i + 1, len(items)):
                if j in used_indices: continue
                
                score = fuzz.token_sort_ratio(items[i][2]['clean_name'], items[j][2]['clean_name'])
                
                if score > 88:
                    current_group.append(items[j])
                    used_indices.add(j)
            
            sub_groups.append(current_group)
        
        for group in sub_groups:
            if len(group) > 1:
                entries_to_merge = [(x[0], x[1]) for x in group]
                merged_entry = merge_entries(entries_to_merge)
                final_id = entries_to_merge[0][0]
                new_data[final_id] = merged_entry
                merges_count += 1
                
                stores = [s['store'] for s in merged_entry.get('prices', [])]
                print(f"  Fusionados ({len(group)}): {[x[1]['model'] for x in group]} -> {merged_entry['model']} [{', '.join(stores)}]")
            else:
                new_data[group[0][0]] = group[0][1]

    print(f"\n--- FASE 2: DEDUPLICACIÓN ---")
    print(f"  Grupos fusionados: {merges_count}")
    
    return new_data

# ============================================================================
# MAIN
# ============================================================================

def main():
    print("=" * 60)
    print("LIMPIEZA + DEDUPLICACIÓN ESTRICTA")
    print("=" * 60)
    
    create_backup()
    
    with open(RACKETS_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    initial_count = len(data)
    
    # Fase 1: Limpieza
    cleaned_data = phase_clean(data)
    
    # Fase 2: Deduplicación
    final_data = phase_deduplicate(cleaned_data)
    
    # Guardar
    with open(RACKETS_FILE, 'w', encoding='utf-8') as f:
        json.dump(final_data, f, ensure_ascii=False, indent=2)

    # Reporte final
    print(f"\n{'=' * 60}")
    print(f"RESULTADO FINAL")
    print(f"{'=' * 60}")
    print(f"  Inicial:    {initial_count}")
    print(f"  Excluidas:  {initial_count - len(cleaned_data)}")
    print(f"  Fusionadas: {len(cleaned_data) - len(final_data)}")
    print(f"  Final:      {len(final_data)}")
    print(f"  Reducción:  {initial_count - len(final_data)} ({100*(initial_count - len(final_data))/initial_count:.1f}%)")

if __name__ == '__main__':
    main()