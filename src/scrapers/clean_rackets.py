#!/usr/bin/env python3
"""
Clean problematic entries from rackets.json.
Removes products that have:
- Unknown brand
- Model starting with "Palas de Padel"
- Empty specs
"""

import json
import sys
import os

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

def clean_rackets(db_path: str = "rackets.json", backup: bool = True):
    """Clean problematic products from the database."""

    # Load database
    print(f"Loading {db_path}...")
    with open(db_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    original_count = len(data)
    print(f"Total products: {original_count}")

    # Create backup
    if backup:
        backup_path = db_path.replace('.json', '.backup.json')
        with open(backup_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=4, ensure_ascii=False)
        print(f"Backup created: {backup_path}")

    # Find and remove problematic products
    to_remove = []

    for slug, racket in data.items():
        reasons = []

        # Check for unknown brand
        if racket.get('brand') == 'Unknown':
            reasons.append('unknown brand')

        # Check for model like 'Palas de Padel X'
        model = racket.get('model', '')
        if model and (model.startswith('Palas de Padel') or model.startswith('Palas de Pádel') or model.startswith('PALAS DE PÁDEL')):
            reasons.append('category page model')

        # Check for empty specs (but allow if has prices)
        if not racket.get('specs') and not racket.get('prices'):
            reasons.append('no specs and no prices')

        if reasons:
            to_remove.append((slug, reasons))

    # Remove problematic products
    for slug, reasons in to_remove:
        del data[slug]
        print(f"Removed: {slug} - {', '.join(reasons)}")

    # Save cleaned database
    with open(db_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4, ensure_ascii=False)

    removed_count = len(to_remove)
    remaining_count = len(data)

    print(f"\n=== Summary ===")
    print(f"Original: {original_count} products")
    print(f"Removed: {removed_count} products")
    print(f"Remaining: {remaining_count} products")

    return data

if __name__ == "__main__":
    clean_rackets()
