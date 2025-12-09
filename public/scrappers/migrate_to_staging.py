#!/usr/bin/env python3
"""
Script de migración a staging area para revisión del administrador
Detecta cambios, duplicados y conflictos antes de aplicar a producción

Autor: Automated Scraper System
Fecha: 2025-12-06
"""

import json
import os
import sys
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple
from dotenv import load_dotenv
from supabase import create_client, Client
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import logging

# Configuration
JSON_PATH = "rackets.json"
ENV_PATH = ".env"
LOG_FILE = "scraper_staging.log"

# Similarity threshold for duplicate detection (85%)
SIMILARITY_THRESHOLD = 0.85

# Load environment variables
load_dotenv(ENV_PATH)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
ADMIN_EMAIL = "info@smashly-app.es"
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(LOG_FILE, encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


def calculate_changes_summary(current: Dict, proposed: Dict) -> Dict[str, Any]:
    """Generate summary of changes between current and proposed data"""
    changes = {}
    
    # Fields to track for changes
    tracked_fields = [
        'name', 'brand', 'model', 'image', 'description',
        'characteristics_shape', 'characteristics_balance', 
        'characteristics_core', 'characteristics_face',
        'characteristics_hardness', 'characteristics_game_level',
        'padelnuestro_actual_price', 'padelnuestro_original_price',
        'padelmarket_actual_price', 'padelmarket_original_price',
        'on_offer'
    ]
    
    for field in tracked_fields:
        current_val = current.get(field)
        proposed_val = proposed.get(field)
        
        if current_val != proposed_val:
            changes[field] = {
                'old': current_val,
                'new': proposed_val
            }
    
    return changes


def normalize_name(name: Optional[str]) -> Optional[str]:
    """Normalize racket name for comparison"""
    if not name:
        return None
    import re
    import unicodedata
    
    # Remove accents
    name = unicodedata.normalize('NFKD', name).encode('ASCII', 'ignore').decode('ASCII')
    # Remove special characters
    name = re.sub(r'[^a-z0-9]', '', name.lower())
    return name


def calculate_similarity(name1: str, name2: str) -> float:
    """Calculate similarity between two racket names (0.0 - 1.0)"""
    if not name1 or not name2:
        return 0.0
    
    norm1 = normalize_name(name1)
    norm2 = normalize_name(name2)
    
    if not norm1 or not norm2:
        return 0.0
    
    if norm1 == norm2:
        return 1.0
    
    # Simple Levenshtein distance
    len1, len2 = len(norm1), len(norm2)
    if len1 == 0 or len2 == 0:
        return 0.0
    
    distances = [[0] * (len2 + 1) for _ in range(len1 + 1)]
    
    for i in range(len1 + 1):
        distances[i][0] = i
    for j in range(len2 + 1):
        distances[0][j] = j
    
    for i in range(1, len1 + 1):
        for j in range(1, len2 + 1):
            cost = 0 if norm1[i-1] == norm2[j-1] else 1
            distances[i][j] = min(
                distances[i-1][j] + 1,
                distances[i][j-1] + 1,
                distances[i-1][j-1] + cost
            )
    
    max_len = max(len1, len2)
    similarity = 1 - (distances[len1][len2] / max_len)
    return similarity


def detect_action_type(
    existing_rackets: List[Dict],
    scraped_racket: Dict
) -> Tuple[str, Optional[int], Dict]:
    """
    Determine if scraped racket is CREATE, UPDATE, or duplicate
    Returns: (action_type, racket_id, changes_summary)
    """
    name = scraped_racket.get('name')
    
    # Search for existing racket by exact link match first
    for link_field in ['padelnuestro_link', 'padelmarket_link']:
        scraped_link = scraped_racket.get(link_field)
        if scraped_link:
            for racket in existing_rackets:
                if racket.get(link_field) == scraped_link:
                    # Found exact match by link
                    changes = calculate_changes_summary(racket, scraped_racket)
                    if changes:
                        return ('UPDATE', racket['id'], changes)
                    else:
                        return ('NO_CHANGE', racket['id'], {})
    
    # Search by name similarity
    best_match = None
    best_similarity = 0.0
    
    for racket in existing_rackets:
        similarity = calculate_similarity(name, racket.get('name'))
        if similarity > best_similarity:
            best_similarity = similarity
            best_match = racket
    
    if best_similarity >= SIMILARITY_THRESHOLD and best_match:
        # Found similar racket - it's an UPDATE
        changes = calculate_changes_summary(best_match, scraped_racket)
        if changes:
            return ('UPDATE', best_match['id'], changes)
        else:
            return ('NO_CHANGE', best_match['id'], {})
    
    # Not found - it's a CREATE
    return ('CREATE', None, {})


def insert_pending_update(
    supabase: Client,
    action_type: str,
    racket_id: Optional[int],
    proposed_data: Dict,
    current_data: Optional[Dict],
    changes_summary: Dict,
    source_scraper: str
) -> None:
    """Insert pending update into staging table"""
    
    try:
        supabase.table('pending_racket_updates').insert({
            'racket_id': racket_id,
            'action_type': action_type,
            'proposed_data': proposed_data,
            'current_data': current_data,
            'changes_summary': changes_summary,
            'source_scraper': source_scraper,
            'status': 'pending'
        }).execute()
        logger.info(f"✓ Inserted {action_type} for racket: {proposed_data.get('name')}")
    except Exception as e:
        logger.error(f"✗ Failed to insert pending update: {e}")
        raise


def send_admin_notification(stats: Dict, execution_id: str) -> None:
    """Send email notification to admin"""
    
    if not SMTP_USER or not SMTP_PASSWORD:
        logger.warning("⚠️  SMTP not configured, skipping email notification")
        return
    
    subject = f"🔔 Smashly Scraper: {stats['new']} nuevas, {stats['updates']} actualizaciones, {stats['discontinued']} descontinuadas"
    
    body = f"""
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">📊 Scraper Execution Report</h2>
        <p>Se ha completado la ejecución semanal del scraper.</p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Resumen:</h3>
            <ul style="list-style: none; padding: 0;">
                <li style="padding: 8px 0;">
                    <strong>🆕 Nuevas palas:</strong> 
                    <span style="color: #16a34a; font-size: 18px; font-weight: bold;">{stats['new']}</span>
                </li>
                <li style="padding: 8px 0;">
                    <strong>🔄 Actualizaciones:</strong> 
                    <span style="color: #ea580c; font-size: 18px; font-weight: bold;">{stats['updates']}</span>
                </li>
                <li style="padding: 8px 0;">
                    <strong>🗑️ Descontinuadas:</strong> 
                    <span style="color: #dc2626; font-size: 18px; font-weight: bold;">{stats['discontinued']}</span>
                </li>
                <li style="padding: 8px 0;">
                    <strong>🔀 Duplicados detectados:</strong> 
                    <span style="color: #9333ea; font-size: 18px; font-weight: bold;">{stats['duplicates']}</span>
                </li>
                <li style="padding: 8px 0;">
                    <strong>❌ Errores:</strong> 
                    <span style="color: #dc2626; font-size: 18px; font-weight: bold;">{stats['errors']}</span>
                </li>
            </ul>
        </div>
        
        <div style="background-color: #dbeafe; padding: 15px; border-left: 4px solid #2563eb; margin: 20px 0;">
            <p style="margin: 0;">
                <strong>⚡ Acción requerida:</strong> 
                Por favor, revisa los cambios pendientes en el panel de administración.
            </p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="https://smashly-app.es/admin/pending-updates" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 6px; display: inline-block;">
                Ver cambios pendientes
            </a>
        </div>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        
        <p style="color: #6b7280; font-size: 12px;">
            <em>Execution ID: {execution_id}</em><br>
            <em>Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</em>
        </p>
    </body>
    </html>
    """
    
    msg = MIMEMultipart('alternative')
    msg['Subject'] = subject
    msg['From'] = SMTP_USER
    msg['To'] = ADMIN_EMAIL
    
    msg.attach(MIMEText(body, 'html'))
    
    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(msg)
        logger.info(f"✅ Email sent to {ADMIN_EMAIL}")
    except Exception as e:
        logger.error(f"❌ Failed to send email: {e}")


def determine_source_scraper(racket: Dict) -> str:
    """Determine which scraper this racket came from"""
    if racket.get('padelnuestro_link'):
        return 'padelnuestro'
    elif racket.get('padelmarket_link'):
        return 'padelmarket'
    elif racket.get('padelproshop_link'):
        return 'padelproshop'
    elif racket.get('tiendapadelpoint_link'):
        return 'tiendapadelpoint'
    return 'unknown'


def main():
    logger.info("="*60)
    logger.info("🚀 Starting staging migration...")
    logger.info("="*60)
    
    # Validate environment
    if not SUPABASE_URL or not SUPABASE_KEY:
        logger.error("❌ Missing Supabase credentials in .env")
        sys.exit(1)
    
    # Connect to Supabase
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        logger.info("✓ Connected to Supabase")
    except Exception as e:
        logger.error(f"❌ Failed to connect to Supabase: {e}")
        sys.exit(1)
    
    # Generate execution ID
    execution_id = f"scraper_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    
    # Create execution log entry
    try:
        supabase.table('scraper_executions').insert({
            'execution_id': execution_id,
            'started_at': datetime.now().isoformat(),
            'status': 'running'
        }).execute()
        logger.info(f"✓ Created execution log: {execution_id}")
    except Exception as e:
        logger.warning(f"⚠️  Failed to create execution log: {e}")
    
    # Load scraped data
    if not os.path.exists(JSON_PATH):
        logger.error(f"❌ File not found: {JSON_PATH}")
        sys.exit(1)
    
    try:
        with open(JSON_PATH, 'r', encoding='utf-8') as f:
            scraped_rackets = json.load(f)
        logger.info(f"✓ Loaded {len(scraped_rackets)} rackets from {JSON_PATH}")
    except Exception as e:
        logger.error(f"❌ Failed to load JSON: {e}")
        sys.exit(1)
    
    # Get existing rackets from production
    try:
        response = supabase.table('rackets').select('*').execute()
        existing_rackets = response.data or []
        logger.info(f"✓ Loaded {len(existing_rackets)} existing rackets from database")
    except Exception as e:
        logger.error(f"❌ Failed to load existing rackets: {e}")
        sys.exit(1)
    
    # Process statistics
    stats = {
        'new': 0,
        'updates': 0,
        'duplicates': 0,
        'no_change': 0,
        'discontinued': 0,
        'errors': 0
    }
    
    # Process each scraped racket
    logger.info("📝 Processing scraped rackets...")
    for i, racket in enumerate(scraped_rackets, 1):
        try:
            action_type, racket_id, changes = detect_action_type(
                existing_rackets, racket
            )
            
            if action_type == 'NO_CHANGE':
                stats['no_change'] += 1
                continue
            
            current_data = None
            if racket_id:
                current_data = next(
                    (r for r in existing_rackets if r['id'] == racket_id),
                    None
                )
            
            source = determine_source_scraper(racket)
            
            insert_pending_update(
                supabase,
                action_type,
                racket_id,
                racket,
                current_data,
                changes,
                source
            )
            
            if action_type == 'CREATE':
                stats['new'] += 1
            elif action_type == 'UPDATE':
                stats['updates'] += 1
            
            # Progress indicator
            if i % 50 == 0:
                logger.info(f"  Progress: {i}/{len(scraped_rackets)} processed...")
                
        except Exception as e:
            logger.error(f"❌ Error processing racket {racket.get('name')}: {e}")
            stats['errors'] += 1
    
    # Detect discontinued rackets (in DB but not in scrapers)
    logger.info("🔍 Checking for discontinued rackets...")
    scraped_ids = set()
    
    # Collect all racket IDs that were found in scrapers
    for racket in scraped_rackets:
        # Check by links
        for link_field in ['padelnuestro_link', 'padelmarket_link', 'padelproshop_link', 'tiendapadelpoint_link']:
            scraped_link = racket.get(link_field)
            if scraped_link:
                for existing in existing_rackets:
                    if existing.get(link_field) == scraped_link:
                        scraped_ids.add(existing['id'])
        
        # Check by name similarity
        name = racket.get('name')
        if name:
            for existing in existing_rackets:
                similarity = calculate_similarity(name, existing.get('name'))
                if similarity >= SIMILARITY_THRESHOLD:
                    scraped_ids.add(existing['id'])
    
    # Find rackets in DB that were not found in scrapers
    stats['discontinued'] = 0
    for existing in existing_rackets:
        if existing['id'] not in scraped_ids:
            try:
                # Create DELETE pending update
                insert_pending_update(
                    supabase,
                    'DELETE',
                    existing['id'],
                    {},  # No proposed data for DELETE
                    existing,  # Current data
                    {'reason': 'No longer available in any scraper'},
                    'auto_detection'
                )
                stats['discontinued'] += 1
                logger.info(f"⚠️  Discontinued: {existing.get('name')} (ID: {existing['id']})")
            except Exception as e:
                logger.error(f"❌ Error creating DELETE update for {existing.get('name')}: {e}")
                stats['errors'] += 1
    
    # Update execution log
    try:
        supabase.table('scraper_executions').update({
            'completed_at': datetime.now().isoformat(),
            'status': 'completed' if stats['errors'] == 0 else 'partial',
            'total_new_rackets': stats['new'],
            'total_updates': stats['updates'],
            'total_errors': stats['errors']
        }).eq('execution_id', execution_id).execute()
    except Exception as e:
        logger.warning(f"⚠️  Failed to update execution log: {e}")
    
    # Send notification
    if stats['new'] > 0 or stats['updates'] > 0 or stats['discontinued'] > 0:
        send_admin_notification(stats, execution_id)
    
    logger.info("")
    logger.info("="*60)
    logger.info("✅ Migration to staging complete!")
    logger.info("="*60)
    logger.info(f"  🆕 New rackets:        {stats['new']}")
    logger.info(f"  🔄 Updates:            {stats['updates']}")
    logger.info(f"  🗑️  Discontinued:       {stats['discontinued']}")
    logger.info(f"  ⏭️  No changes:         {stats['no_change']}")
    logger.info(f"  ❌ Errors:             {stats['errors']}")
    logger.info("="*60)
    
    if stats['new'] > 0 or stats['updates'] > 0 or stats['discontinued'] > 0:
        logger.info(f"📧 Admin notification sent to {ADMIN_EMAIL}")
        logger.info("👉 Admin must review and approve changes in dashboard")
    
    sys.exit(0 if stats['errors'] == 0 else 1)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        logger.info("\n\n⚠️  Migration interrupted by user")
        sys.exit(1)
    except Exception as e:
        logger.error(f"❌ Fatal error: {e}", exc_info=True)
        sys.exit(1)
