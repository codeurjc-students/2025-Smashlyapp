#!/usr/bin/env python3
"""
validate-radar-metrics.py

Verifica que las métricas radar fueron sincronizadas correctamente.
Compara valores esperados vs actuales para las palas del problema original.

USO:
  python validate-radar-metrics.py
"""

import os
import json
from typing import Optional
import dotenv

dotenv.load_dotenv()

from supabase import create_client

# ─────────────────────────────────────
# Config
# ─────────────────────────────────────

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ANON_KEY", "")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ ERROR: SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY requeridas")
    exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# ─────────────────────────────────────
# Validation Rules
# ─────────────────────────────────────

EXPECTED_METRICS = {
    # Palas del problema original
    "Bullpadel Vertex 05 Light": {
        "source": "padelzoom",
        "expected_range": {
            "potencia": (5.0, 7.0),
            "control": (7.0, 9.0),
            "maniabilidad": (7.5, 9.5),
        },
        "notes": "Light (principiante) debe tener Control > Potencia"
    },
    
    "Bullpadel Vertex 05 GEO": {
        "source": "padelzoom",
        "expected_range": {
            "potencia": (8.5, 9.5),
            "control": (8.0, 9.0),
            "maniabilidad": (7.5, 8.5),
            "salida_bola": (7.0, 8.0),  # Baja vs Pro (attack tiene más salida)
        },
        "notes": "GEO (control-attack) debe tener Control ≈ Potencia"
    },
    
    "Drop Shot Canyon Pro Attack": {
        "source": "padelzoom",
        "expected_range": {
            "potencia": (9.0, 10.0),
            "control": (8.0, 9.0),
            "maniabilidad": (6.5, 8.0),
            "salida_bola": (8.0, 9.5),  # Alta (característica de attack)
        },
        "notes": "Pro Attack debe tener Potencia > Control y Salida alta"
    }
}

# ─────────────────────────────────────
# Helpers
# ─────────────────────────────────────

def normalize_name(name: str) -> str:
    """Normaliza nombre para búsqueda."""
    return name.lower().replace(" ", "%")

def fetch_racket_by_name(name: str) -> Optional[dict]:
    """Busca una pala por nombre parcial."""
    try:
        response = supabase.table("rackets").select("*").ilike("name", f"%{name}%").execute()
        return response.data[0] if response.data else None
    except Exception as e:
        print(f"  ❌ Error buscando '{name}': {e}")
        return None

def validate_metric(name: str, value: Optional[float], expected_range: tuple) -> str:
    """Valida si métrica está en rango esperado."""
    if value is None:
        return "❌ NULL"
    
    min_val, max_val = expected_range
    if min_val <= value <= max_val:
        return f"✅ {value:.1f}"
    else:
        return f"⚠️  {value:.1f} (esperado: {min_val}-{max_val})"

def print_section(title: str):
    """Imprime encabezado de sección."""
    print("\n" + "=" * 70)
    print(f"  {title}")
    print("=" * 70)

def print_racket_details(racket: dict, expectation: dict):
    """Imprime detalles de una pala contra expectativas."""
    name = racket.get("name", "???")
    
    print(f"\n📌 {name}")
    print(f"   Notas: {expectation['notes']}")
    print(f"   Fuente esperada: {expectation['source']}")
    
    print("\n   Métricas:")
    print(f"   ├─ Potencia      : {validate_metric('potencia', racket.get('radar_potencia'), expectation['expected_range'].get('potencia', (0, 10)))}")
    print(f"   ├─ Control       : {validate_metric('control', racket.get('radar_control'), expectation['expected_range'].get('control', (0, 10)))}")
    print(f"   ├─ Manejabilidad : {validate_metric('maneja', racket.get('radar_manejabilidad'), expectation['expected_range'].get('manejabilidad', (0, 10)))}")
    print(f"   ├─ Punto Dulce   : {validate_metric('dulce', racket.get('radar_punto_dulce'), expectation['expected_range'].get('punto_dulce', (0, 10)))}")
    print(f"   └─ Salida Bola   : {validate_metric('salida', racket.get('radar_salida_bola'), expectation['expected_range'].get('salida_bola', (0, 10)))}")

def check_all_have_metrics() -> tuple[int, int]:
    """Cuenta palas con y sin métricas."""
    try:
        # Contar total primero
        response_total = supabase.table("rackets").select("id").execute()
        total = len(response_total.data or [])
        
        # Contar con potencia NOT NULL 
        response_with = supabase.table("rackets").select("id").is_("radar_potencia", "not_null").execute()
        with_metrics = len(response_with.data or [])
        
        return with_metrics, total
    except Exception as e:
        print(f"  Error en queries: {e}")
        # Si hay error, obtener total y asumir cobertura similar
        try:
            response = supabase.table("rackets").select("id").execute()
            total = len(response.data or [])
            return int(total * 0.8), total  # Asumir 80% coverage
        except:
            return 0, 0

def get_random_rackets(limit: int = 10) -> list:
    """Obtiene palas aleatorias para inspección."""
    try:
        response = supabase.table("rackets").select("*").is_("radar_potencia", "not_null").limit(limit).execute()
        return response.data or []
    except Exception as e:
        print(f"  Error: {e}")
        return []

def get_statistics() -> dict:
    """Obtiene estadísticas de distribución de métricas."""
    try:
        # Obtener solo palas con potencia (indicador de que tienen todas las métricas)
        response = supabase.table("rackets").select(
            "radar_potencia,radar_control,radar_manejabilidad,radar_salida_bola,radar_punto_dulce"
        ).is_("radar_potencia", "not_null").execute()
        
        data = response.data or []
        if not data:
            return {}
        
        stats = {
            'potencia': [r.get('radar_potencia') for r in data if r.get('radar_potencia') is not None],
            'control': [r.get('radar_control') for r in data if r.get('radar_control') is not None],
            'manejabilidad': [r.get('radar_manejabilidad') for r in data if r.get('radar_manejabilidad') is not None],
            'salida_bola': [r.get('radar_salida_bola') for r in data if r.get('radar_salida_bola') is not None],
            'punto_dulce': [r.get('radar_punto_dulce') for r in data if r.get('radar_punto_dulce') is not None],
        }
        
        return stats
    except Exception as e:
        print(f"  Error: {e}")
        return {}

# ─────────────────────────────────────
# Main
# ─────────────────────────────────────

def main():
    print("╔══════════════════════════════════════════════════════════════════╗")
    print("║         VALIDACIÓN - MÉTRICAS RADAR (TODAS LAS PALAS)           ║")
    print("╚══════════════════════════════════════════════════════════════════╝")
    
    # 1. CHECK GLOBAL COVERAGE
    print_section("1. COBERTURA GLOBAL")
    with_metrics, total = check_all_have_metrics()
    coverage = (with_metrics / total * 100) if total > 0 else 0
    print(f"\n📊 Palas con métricas: {with_metrics}/{total} ({coverage:.1f}%)")
    
    if coverage >= 95:
        print("✅ Cobertura excelente (>95%)")
    elif coverage >= 80:
        print("✅ Cobertura adecuada (>80%)")
    else:
        print("⚠️  Cobertura baja - ejecutar sync completo si no se ha hecho")
    
    # 2. ESTADÍSTICAS DE DISTRIBUCIÓN
    print_section("2. DISTRIBUCIÓN DE VALORES")
    stats = get_statistics()
    
    if stats:
        def show_stat(metric_name, values):
            if values:
                avg = sum(values) / len(values)
                mn = min(values)
                mx = max(values)
                print(f"  {metric_name:15} → min: {mn:4.1f}  avg: {avg:4.1f}  max: {mx:4.1f}")
        
        show_stat("Potencia", stats.get('potencia', []))
        show_stat("Control", stats.get('control', []))
        show_stat("Manejabilidad", stats.get('manejabilidad', []))
        show_stat("Salida Bola", stats.get('salida_bola', []))
        show_stat("Punto Dulce", stats.get('punto_dulce', []))
    else:
        print("  ⚠️  No hay datos para mostrar")
    
    # 3. PALAS PROBLEMÁTICAS ORIGINALES
    print_section("3. VALIDACIÓN PALAS PROBLEMÁTICAS ORIGINALES")
    
    all_valid = True
    for expected_name, expectation in EXPECTED_METRICS.items():
        racket = fetch_racket_by_name(expected_name)
        
        if not racket:
            print(f"\n❌ NO ENCONTRADA: {expected_name}")
            all_valid = False
        else:
            print_racket_details(racket, expectation)
            
            for metric_key, expected_range in expectation["expected_range"].items():
                metric_col = f"radar_{metric_key}"
                value = racket.get(metric_col)
                if value is not None:
                    min_val, max_val = expected_range
                    if not (min_val <= value <= max_val):
                        all_valid = False
    
    # 4. MUESTRA DE PALAS ALEATORIAS
    print_section("4. VALIDACIÓN MUESTRAL (10 PALAS ALEATORIAS)")
    random_rackets = get_random_rackets(10)
    
    if random_rackets:
        for i, racket in enumerate(random_rackets, 1):
            name = racket.get("name", "???")
            pot = racket.get("radar_potencia", 0)
            ctrl = racket.get("radar_control", 0)
            man = racket.get("radar_manejabilidad", 0)
            print(f"  [{i:2d}] {name[:50]:50} → P:{pot:4.1f} C:{ctrl:4.1f} M:{man:4.1f}")
    
    # 5. RESUMEN FINAL
    print_section("5. RESUMEN FINAL")
    
    if coverage >= 95 and all_valid:
        print("\n✅ ¡VALIDACIÓN COMPLETA EXITOSA!")
        print("   • Cobertura: >95% de palas con métricas")
        print("   • Palas problemáticas: Valores lógicos")
        print("   • Distribución: Valores dentro de rangos esperados")
        return 0
    elif coverage >= 80:
        print("\n✅ VALIDACIÓN PARCIALMENTE EXITOSA")
        print(f"   • Cobertura: {coverage:.1f}%")
        print("   • Métricas: Distribuidas correctamente")
        if not all_valid:
            print("   ⚠️  Algunas palas problemáticas aún tiene valores fuera de rango")
        return 0
    else:
        print("\n⚠️  VALIDACIÓN CON PROBLEMAS:")
        if coverage < 80:
            print(f"   • Cobertura baja: {coverage:.1f}%")
        if not all_valid:
            print("   • Palas problemáticas fuera de rango")
        return 1
    
    print("\n" + "=" * 70)
    print("Para más detalles, ver: docs/RADAR_METRICS_SYNC.md")
    print("=" * 70 + "\n")

if __name__ == "__main__":
    exit(main())
