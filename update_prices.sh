#!/bin/bash

# Activar entorno virtual si es necesario (ajustar path segun se use venv o no)
# source venv/bin/activate

echo "==================================================="
echo "🎾  SMASHLY RACKET UPDATE AUTOMATION"
echo "==================================================="
echo "This script will update prices from all stores and sync with Supabase."
echo ""

# 1. PadelMarket
echo "[1/5] Running Scraper: PadelMarket..."
python3 public/scrappers/scrapper_padelmarket.py
if [ $? -ne 0 ]; then
    echo "❌ Error in PadelMarket scraper. Creating backup and continuing..."
    cp rackets.json rackets_backup_padelmarket_fail.json
fi

# 2. PadelNuestro
echo "[2/5] Running Scraper: PadelNuestro..."
# Este scraper a veces sobreescribe, asegurarnos que haga append o merge si es necesario.
# NOTA: Los scrapers actuales leen rackets.json, añaden/modifican y guardan.
# Por lo tanto, el orden importa. PadelNuestro debería ser segundo.
python3 public/scrappers/scraper_padelnuestro.py
if [ $? -ne 0 ]; then
    echo "❌ Error in PadelNuestro scraper."
fi

# 3. PadelProShop
echo "[3/5] Running Scraper: PadelProShop..."
python3 public/scrappers/scrapper_padelproshop.py
if [ $? -ne 0 ]; then
    echo "❌ Error in PadelProShop scraper."
fi

# 4. TiendaPadelPoint
echo "[4/5] Running Scraper: TiendaPadelPoint..."
python3 public/scrappers/scrapper_tiendapadelpoint.py
if [ $? -ne 0 ]; then
    echo "❌ Error in TiendaPadelPoint scraper."
fi

# 5. Migration (Clean Slate)
echo ""
echo "[5/5] Running Database Migration (Clean Slate)..."
echo "⚠️  This will WIPE the database and re-insert all scraped data."
python3 public/scrappers/migrate_to_supabase.py

echo ""
echo "==================================================="
echo "✅  UPDATE COMPLETE"
echo "==================================================="
