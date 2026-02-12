#!/usr/bin/env python3
"""
Script de mantenimiento: Deduplicación rigurosa.
Usa la misma lógica de "Fingerprinting" que el RacketManager para no fusionar años distintos.
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
    
    # Clean name for fuzzy
    clean_name = name_lower
    clean_name = re.sub(r'\b202[0-9]\b', '', clean_name)
    for w in ['pala', 'padel', 'racket', 'de', 'para']:
        clean_name = clean_name.replace(w, '')
    clean_name = re.sub(r'[^\w\s]', '', clean_name).strip()

    # Generamos un hash string de las 'hard features' para agrupamiento inicial
    hard_signature = f"{year}|{'-'.join(found_suffixes)}|{material_k}"
    
    return {
        "year": year,
        "suffixes": found_suffixes,
        "material_k": material_k,
        "clean_name": clean_name,
        "hard_signature": hard_signature
    }

# ============================================================================
# FUNCIONES AUXILIARES
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
    return backup_file

def merge_entries(entries):
    """Fusiona entradas manteniendo la información más rica."""
    # Ordenar por riqueza de datos (specs + imagenes)
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
    prices_map = {} # store -> price_obj
    # Cargar iniciales
    for p in merged.get('prices', []):
        prices_map[p['store']] = p
    
    # Actualizar con otros
    for _, entry in entries[1:]:
        for p in entry.get('prices', []):
            store = p['store']
            if store not in prices_map:
                prices_map[store] = p
            else:
                # Si este precio es más reciente, actualizamos
                if p.get('last_updated', '') > prices_map[store].get('last_updated', ''):
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
# MAIN
# ============================================================================

def main():
    print("=== DEDUPLICACIÓN ESTRICTA (HARD FILTER + FUZZY) ===")
    create_backup()
    
    with open(RACKETS_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # Paso 1: Agrupar por Marca + Hard Signature (Año/Sufijos/Material)
    # Esto garantiza que NUNCA mezclaremos un 2024 con un 2025, ni una Woman con una Normal
    buckets = defaultdict(list)
    
    for rid, entry in data.items():
        brand = entry.get('brand', 'Unknown').lower().strip()
        features = extract_features(entry.get('model', ''))
        
        # La clave del bucket asegura compatibilidad estricta
        bucket_key = f"{brand}|{features['hard_signature']}"
        buckets[bucket_key].append((rid, entry, features))

    new_data = {}
    merges_count = 0

    # Paso 2: Fuzzy match DENTRO de cada bucket compatible
    for key, items in buckets.items():
        if len(items) == 1:
            new_data[items[0][0]] = items[0][1]
            continue
            
        # Sub-agrupación por similitud de nombre limpio
        sub_groups = []
        used_indices = set()
        
        for i in range(len(items)):
            if i in used_indices: continue
            
            current_group = [items[i]]
            used_indices.add(i)
            
            for j in range(i + 1, len(items)):
                if j in used_indices: continue
                
                # Comparar clean_name
                score = fuzz.token_sort_ratio(items[i][2]['clean_name'], items[j][2]['clean_name'])
                
                if score > 88: # Umbral alto
                    current_group.append(items[j])
                    used_indices.add(j)
            
            sub_groups.append(current_group)
        
        # Procesar grupos fusionados
        for group in sub_groups:
            if len(group) > 1:
                # Preparar formato para merge_entries
                entries_to_merge = [(x[0], x[1]) for x in group]
                merged_entry = merge_entries(entries_to_merge)
                
                # Mantener el ID del principal
                final_id = entries_to_merge[0][0]
                new_data[final_id] = merged_entry
                
                merges_count += 1
                print(f"Fusionados ({len(group)}): {[x[1]['model'] for x in group]} -> {merged_entry['model']}")
            else:
                new_data[group[0][0]] = group[0][1]

    # Guardar
    with open(RACKETS_FILE, 'w', encoding='utf-8') as f:
        json.dump(new_data, f, ensure_ascii=False, indent=2)

    print(f"\nProceso terminado. Fusionados {merges_count} grupos.")
    print(f"Total inicial: {len(data)} -> Final: {len(new_data)}")

if __name__ == '__main__':
    main()