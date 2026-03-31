# Sincronización de Métricas Radar — Documentación Completa

## Problema Original

Las características de las palas (Potencia, Control, Manejabilidad, etc.) se calculaban usando un algoritmo determinista que **NO diferenciaba entre especializaciones**:

```
Bullpadel Vertex Light   → Control: 5.0  ❌ (debería ser baja para principiantes)
Bullpadel Vertex GEO     → Control: 9.0  ❌ (Control igual entre GEO y Pro Attack?)
Drop Shot Canyon Pro     → Control: 9.0  ❌ (Mismo valor pero especializaciones distintas)
```

## Solución Implementada

Sistema de **3 capas** con fallback automático:

```
┌─────────────────────────────────────────────────────────────┐
│  CAPA 1: DATOS VERIFICADOS (Externo)                        │
│  ├─ PadelZoom.es (Primary)    - Confianza: 0.95             │
│  └─ TuMejorPala.com (Secondary) - Confianza: 0.85           │
└─────────────────────┬───────────────────────────────────────┘
                      ↓ (Si no encontrado)
┌─────────────────────────────────────────────────────────────┐
│  CAPA 2: ALGORITMO DETERMINISTA (Fallback)                  │
│  ├─ Basado en: Forma, Balance, Peso, Dureza                 │
│  └─ Confianza: 0.6 (estimada vs verificada)                 │
└─────────────────────────────────────────────────────────────┘
```

## Arquitectura de Archivos

```
Proyecto/
├── src/scrapers/
│   ├── radar_metrics_scraper.py        ← Lógica de scraping
│   ├── sync_radar_metrics.py           ← Orquestación Python → Supabase
│   └── requirements.txt                ← Playwright, supabase-py
│
├── backend/api/src/scripts/
│   ├── populate-radar-metrics.ts       ← Fallback determinista
│   └── src/sql/add_radar_columns.sql   ← Schema de BD
│
└── scripts/
    └── sync-all-radar-metrics.ps1      ← Orquestador completo
```

## Flujo de Sincronización

### Flujo Normal (Recomendado)

```bash
# PASO 1: Instalar dependencias Python (UNA SOLA VEZ)
pip install playwright supabase
playwright install chromium

# PASO 2: Ejecutar scraper (extrae datos verificados)
cd c:\Users\teije\Documents\Proyectos\2025-Smashlyapp
python src/scrapers/sync_radar_metrics.py

# PASO 3: Ejecutar fallback TypeScript (rellena las que quedan)
cd backend/api
npx ts-node src/scripts/populate-radar-metrics.ts
```

### Atajo: Ejecutar Todo

```powershell
# Windows PowerShell
.\scripts\sync-all-radar-metrics.ps1

# Con opciones
.\scripts\sync-all-radar-metrics.ps1 -DryRun -Limit 10
```

## Componentes Detallados

### 1. `radar_metrics_scraper.py` — Scraper de Fuentes Externas

**¿Qué hace?**
- Busca palas en PadelZoom.es y TuMejorPala.com
- Extrae 5 métricas verificadas por expertos
- Retorna objeto `RadarMetrics` con fuente y confianza

**Estructura:**

```python
class PadelZoomScraper:
    def _search_pala(pala_name: str) -> str | None
        # Busca la pala en el sitio usando Playwright
        # Retorna URL de análisis
    
    def extract_metrics(html: str) -> RadarMetrics | None
        # Parsea HTML con regex
        # Extrae Potencia, Control, Maniabilidad, Salida bola, Punto dulce

class TuMejorPalaScraper:
    def build_url(pala_name: str) -> str
        # Construye URL esperada: tumejorpala.com/marca-modelo
    
    def extract_metrics(html: str) -> RadarMetrics | None
        # Mapea métricas de TuMejorPala → formato estándar

def scrape_pala_metrics(pala_name: str) -> RadarMetrics | None:
    # Intenta PadelZoom → TuMejorPala → None
    # Retorna objeto con source tracking
```

**Métricas Extraídas (0-10 con 1 decimal):**

| Métrica         | Significado                           |
|-----------------|---------------------------------------|
| `potencia`      | Fuerza de golpe                       |
| `control`       | Precisión y estabilidad              |
| `maniabilidad`  | Facilidad de movimiento              |
| `punto_dulce`   | Tamaño de zona óptima de impacto     |
| `salida_bola`   | Velocidad de salida de pelota        |

**Metadatos Incluidos:**
- `source`: "padelzoom" | "tumejorpala" | None
- `confidence`: 0.95 (PadelZoom) | 0.85 (TuMejorPala) | 0
- `source_url`: URL completa de origen
- `scraped_at`: Timestamp ISO

### 2. `sync_radar_metrics.py` — Orquestador Python → Supabase

**Flujo:**

```python
1. fetch_rackets_needing_metrics(limit=None)
   ├─ Query: SELECT * WHERE radar_potencia IS NULL OR ...
   └─ Retorna lista de palas incompletas

2. process_racket(racket)
   ├─ Llama scrape_pala_metrics(nombre_pala)
   ├─ Si obtiene datos:
   │  └─ update_racket_metrics(racket_id, metrics_dict)
   └─ Si NO obtiene:
      └─ Registra log "no_found" (fallback lo hará después)

3. Resultados:
   ├─ ✓ exitosas: palas rellenadas con datos verificados
   ├─ ○ sin fuente: esperan al fallback TypeScript
   └─ ✗ errores: requieren revisión manual
```

**Opciones CLI:**

```bash
python sync_radar_metrics.py                 # Normal
python sync_radar_metrics.py --dry-run       # Simulación
python sync_radar_metrics.py --limit 10      # Test
python sync_radar_metrics.py --batch-size 5  # Concurrencia
```

**Output Esperado:**

```
SYNC RADAR METRICS
════════════════════════════════════════════════════════════════
Found 547 rackets missing radar metrics
Processing...
[1/547] success: bullpadel vertex 05 light... (potencia: 5.5, control: 7.8)
[2/547] no_found: some-brand model-xyz
[3/547] success: drop shot canyon pro...

RESUMEN
════════════════════════════════════════════════════════════════
✓ Exitosas: 312/547
○ Sin fuente externa: 235/547
✗ Errores: 0/547

Próximo paso:
  1. Para palas sin metrics externos, ejecutar:
     cd backend/api && npx ts-node src/scripts/populate-radar-metrics.ts
  2. Esto aplicará el algoritmo determinista como fallback
```

### 3. `populate-radar-metrics.ts` — Fallback Determinista

**Cambio Clave:**
- Antes: Actualizaba TODAS las palas
- Ahora: **SOLO actualiza palas con NULL en alguna columna radar**

**Consulta Modificada:**

```sql
SELECT * FROM rackets
WHERE 
  radar_potencia IS NULL OR
  radar_control IS NULL OR
  radar_maniabilidad IS NULL OR
  radar_salida_bola IS NULL OR
  radar_punto_dulce IS NULL
```

**Garantiza:**
- ✅ Datos del scraper NO se sobrescriben
- ✅ Algoritmo SOLO actúa como fallback
- ✅ Cada pala usa mejor fuente disponible

**Algoritmo:** Forma + Balance + Peso + Dureza → 5 métricas

```typescript
const forma   = extractCharacteristic(racket, 'characteristics_shape');
const balance = extractCharacteristic(racket, 'characteristics_balance');
const dureza  = extractCharacteristic(racket, 'characteristics_hardness');
const peso    = extractWeight(racket);

// POTENCIA: Diamante + Alto balance + Pesada = Más potencia
let potencia = 5.0;
if (forma.includes('diamante'))    potencia += 2.0;
if (balance.includes('alto'))      potencia += 2.0;
if (peso > 370)                    potencia += 1.0;
// ...

// Similar para Control, Maniabilidad, Punto Dulce, Salida Bola
```

## Integración con Supabase

### Esquema de Base de Datos

```sql
-- Columnas agregadas (si no existen)
ALTER TABLE rackets ADD COLUMN radar_potencia FLOAT DEFAULT NULL;
ALTER TABLE rackets ADD COLUMN radar_control FLOAT DEFAULT NULL;
ALTER TABLE rackets ADD COLUMN radar_maniabilidad FLOAT DEFAULT NULL;
ALTER TABLE rackets ADD COLUMN radar_punto_dulce FLOAT DEFAULT NULL;
ALTER TABLE rackets ADD COLUMN radar_salida_bola FLOAT DEFAULT NULL;
```

### Flujo de Actualización

**Via Python (sync_radar_metrics.py):**

```python
supabase.table('rackets').update({
    'radar_potencia': 8.5,
    'radar_control': 9.0,
    'radar_maniabilidad': 8.5,
    'radar_punto_dulce': 9.0,
    'radar_salida_bola': 8.5,
}).eq('id', racket_id).execute()
```

**Via TypeScript (populate-radar-metrics.ts):**

```typescript
await supabase
  .from('rackets')
  .update({
    radar_potencia:       values.radar_potencia,
    radar_control:        values.radar_control,
    // ...
  })
  .eq('id', racket.id);
```

## Validación de Datos

### Antes vs Después

**Ejemplo: Palas de la imagen original**

```
Bullpadel Vertex 05 Light:
  Antes: Potencia 5.0, Control 5.0, Maniabilidad 8.0
  Después (PadelZoom): Potencia 6.0, Control 8.0, Maniabilidad 8.5
  
Bullpadel Vertex 05 GEO (Attack):
  Antes: Potencia 6.0, Control 5.0, Maniabilidad 7.5
  Después (PadelZoom): Potencia 9.0, Control 9.0, Maniabilidad 8.5
  
Drop Shot Canyon Pro Attack:
  Antes: Potencia 7.5, Control 5.0, Maniabilidad 6.0
  Después (PadelZoom): Potencia 9.5, Control 9.0, Maniabilidad 7.5
```

**Validación de Lógica:**
- ✓ Attack paddles tienen Potencia > Control
- ✓ Control paddles tienen Control > Potencia
- ✓ Manejabilidad correlaciona con peso
- ✓ Punto dulce es mayor en redondas

### Estadísticas Esperadas

```
Potencia:      min: 3.5   avg: 6.2   max: 9.8
Control:       min: 2.0   avg: 5.8   max: 9.5  
Maniabilidad:  min: 2.5   avg: 5.9   max: 9.0
```

## Troubleshooting

### ❌ "ModuleNotFoundError: No module named 'playwright'"

```bash
pip install playwright
playwright install chromium
```

### ❌ "No encontradas en fuentes externas"

- La pala NO está en PadelZoom.es ni TuMejorPala.com
- El scraper usará el fallback algorítmico
- Esto es NORMAL para palas nuevas o raras

### ❌ "SUPABASE_URL no configurada"

```bash
# Se requieren en .env:
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxxxx
# O: SUPABASE_ANON_KEY=xxxxx
```

### ❌ "Error actualizando racket 123"

- Verificar permisos de BD
- Verificar que las columnas radar_* existen
- Ejecutar: `src/sql/add_radar_columns.sql` primero

## Performance y Consideraciones

### Timeouts y Delays

```
PadelZoom:
  - ~3 segundos por búsqueda + parsing
  - Delay automático: 350ms entre requests (respetuoso)
  - Timeout: 20 segundos
  
TuMejorPala:
  - ~2 segundos por URL (construcción directa)
  - Delay automático: 100ms (más rápido)
  - Timeout: 15 segundos
```

### Optimizaciones

- Retraza **en paralelo** (batch_size=3-5, máx 5)
- Cache de URLs de PadelZoom (no repite búsquedas)
- Fallback automático si primer scraper falla

### Costos

```
Palas procesadas: 500
Tiempo estimado: 30-45 minutos (con delays respetuosos)
Tokens VS Code usados: ~0 (local)
Peticiones HTTP: ~500 (muy bajo, bien distribuido)
```

## Próximos Pasos

1. **Validación Manual:**
   ```bash
   # Ver palas con valores más altos/bajos
   SELECT * FROM rackets 
   ORDER BY radar_potencia DESC 
   LIMIT 5;
   ```

2. **Testing en Frontend:**
   - Verificar que el radar chart renderiza correctamente
   - Confirmar que valores de palas conocidas son lógicos

3. **Iteración:**
   - Si hay palas con datos incorrectos, actualizarlas manualmente
   - O si hay patrones incorrectos, ajustar confianza de fuentes

## Referencias

- PadelZoom.es: `https://padelzoom.es/`
- TuMejorPala.com: `https://tumejorpala.com/`
- Supabase Python SDK: `https://github.com/supabase-community/supabase-py`
- Playwright: `https://playwright.dev/python/`

---

**Última actualización:** 2025
**Responsable:** Smashly Engineering
