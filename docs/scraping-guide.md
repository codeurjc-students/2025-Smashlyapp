# 🕷️ Guía de Scraping con GitHub Actions

Esta guía explica cómo ejecutar los scrapers de Smashly en la nube usando GitHub Actions, sin necesidad de tener tu ordenador encendido.

---

## 📋 Índice

1. [¿Por qué GitHub Actions?](#por-qué-github-actions)
2. [Configuración Inicial](#configuración-inicial)
3. [Ejecutar los Scrapers](#ejecutar-los-scrapers)
4. [Descargar los Resultados](#descargar-los-resultados)
5. [Workflows Disponibles](#workflows-disponibles)
6. [Solución de Problemas](#solución-de-problemas)

---

## 🤔 ¿Por qué GitHub Actions?

**Ventajas:**

- ✅ **Gratis** para repositorios públicos (2000 min/mes)
- ✅ **No requiere servidor propio** ni infraestructura
- ✅ **Ejecuta en la nube** - no necesitas tu ordenador encendido
- ✅ **6 horas de timeout** por job (suficiente para ~1000 productos)
- ✅ **Resultados automáticos** - se guardan como artifacts o commits

**Limitaciones:**

- ⚠️ Máximo 6 horas por job (si se pasa, usa el workflow en modo "split")
- ⚠️ Recursos limitados (2 CPU cores, 7GB RAM)

---

## ⚙️ Configuración Inicial

### 1. Verificar que el repositorio esté en GitHub

```bash
git remote -v
# Debe aparecer: origin  https://github.com/codeurjc-students/2025-Smashlyapp.git
```

### 2. Hacer push de los workflows

```bash
git add .github/workflows/run-scrapers.yml
git add .github/workflows/run-scrapers-split.yml
git commit -m "feat: add GitHub Actions workflows for scrapers"
git push origin main
```

### 3. Verificar que los workflows estén activos

1. Ve a tu repositorio en GitHub
2. Click en la pestaña **"Actions"**
3. Deberías ver:
   - `Run Padel Scrapers` (modo normal)
   - `Run Padel Scrapers (Split Mode)` (modo paralelo)

---

## 🚀 Ejecutar los Scrapers

### Opción 1: Modo Normal (recomendado para la primera vez)

**Úsalo cuando:**

- Es tu primera ejecución y no sabes cuánto tarda
- Quieres scrapear todas las tiendas a la vez
- Estimas que tardará menos de 6 horas

**Pasos:**

1. Ve a **GitHub → Actions → Run Padel Scrapers**
2. Click en **"Run workflow"** (botón gris a la derecha)
3. Configura los parámetros:
   - **stores**: `all` (o específicas: `padelmarket,padelnuestro`)
   - **limit**: Vacío para todo, o un número (ej: `50` para probar)
4. Click en **"Run workflow"** (botón verde)

**Monitorear el progreso:**

- Verás el job ejecutándose en tiempo real
- Los logs muestran cada producto scraped
- Puedes cancelarlo en cualquier momento si es necesario

---

### Opción 2: Modo Split (si supera 6 horas)

**Úsalo cuando:**

- El modo normal se quedó sin tiempo (timeout)
- Quieres aprovechar paralelización (más rápido)
- Cada tienda se ejecuta independientemente

**Pasos:**

1. Ve a **GitHub → Actions → Run Padel Scrapers (Split Mode)**
2. Click en **"Run workflow"**
3. Configura **limit** si quieres (opcional)
4. Click en **"Run workflow"**

**Ventajas:**

- Cada tienda tiene **6 horas propias** (total: 24h disponibles)
- Se ejecutan **en paralelo** (termina más rápido)
- Al final se **fusionan automáticamente** los resultados

---

## 📥 Descargar los Resultados

### Método 1: Artifacts (descarga manual)

1. Cuando el workflow termine, ve a la ejecución
2. Scroll hasta abajo → **"Artifacts"**
3. Descarga `rackets-data-XXX.zip`
4. Descomprime → Dentro está `rackets.json`

**Luego copia el archivo a tu proyecto local:**

```bash
# Reemplaza tu rackets.json local con el descargado
cp ~/Downloads/rackets.json /Users/teijeiro7/Documents/Proyectos/2025-Smashlyapp/src/scrapers/rackets.json
```

---

### Método 2: Commit Automático (recomendado)

El workflow **automáticamente** hace commit del `rackets.json` al repositorio.

**Para obtenerlo:**

```bash
git pull origin main
```

¡Listo! El archivo `src/scrapers/rackets.json` se actualiza automáticamente.

---

## 📊 Workflows Disponibles

### 1. `run-scrapers.yml` - Modo Normal

**Ejecuta las tiendas secuencialmente (una tras otra)**

| Parámetro | Descripción          | Ejemplo                            |
| --------- | -------------------- | ---------------------------------- |
| `stores`  | Tiendas a scrapear   | `all` o `padelmarket,padelnuestro` |
| `limit`   | Productos por tienda | Vacío (sin límite) o `50`          |

**Timeout:** 6 horas total

---

### 2. `run-scrapers-split.yml` - Modo Paralelo

**Ejecuta cada tienda en un job separado (paralelamente)**

| Parámetro | Descripción          | Ejemplo                    |
| --------- | -------------------- | -------------------------- |
| `limit`   | Productos por tienda | Vacío (sin límite) o `100` |

**Timeout:** 6 horas **por tienda** (24h totales disponibles)

**Jobs:**

- `scrape-padelmarket`
- `scrape-padelnuestro`
- `scrape-padelproshop`
- `scrape-tiendapadelpoint`
- `merge-results` (fusiona todo al final)

---

## 🛠️ Solución de Problemas

### ❌ Error: "Timeout después de 6 horas"

**Solución:** Usa el workflow `run-scrapers-split.yml`

```bash
# Cada tienda tendrá 6h propias
```

---

### ❌ Error: "playwright not found"

**Causa:** A veces Playwright no se instala correctamente

**Solución:** El workflow ya incluye el paso `playwright install-deps`. Si falla, revisa los logs del step "Install Playwright browsers".

---

### ❌ Error: "Permission denied" al hacer commit

**Causa:** El token de GitHub no tiene permisos

**Solución:** Ve a **Settings → Actions → General → Workflow permissions** y activa:

- ✅ Read and write permissions

---

### ⚠️ Los resultados están duplicados

**Causa:** Ejecutaste ambos workflows a la vez

**Solución:** Usa solo uno de los workflows. Si tienes `rackets.json` duplicado, ejecuta:

```bash
cd src/scrapers
python clean_rackets.py  # Si tienes un script de limpieza
```

---

### 🐛 Ver logs detallados

1. Ve a la ejecución del workflow
2. Click en el job (ej: `scrape`)
3. Expande cada step para ver los logs
4. Busca mensajes de error específicos

---

## 💡 Consejos Útiles

### Primera Ejecución - Prueba con Límite

```yaml
stores: all
limit: 10 # Solo 10 productos por tienda para probar
```

Esto te permite:

- ✅ Verificar que todo funciona
- ✅ Estimar cuánto tarda (10 productos × 4 tiendas = 40 productos)
- ✅ Calcular tiempo total: si 40 productos tardan X minutos, 1000 tardarán ~25X minutos

---

### Cálculo de Tiempo Estimado

**Fórmula aproximada:**

```
Tiempo por producto ≈ 5-10 segundos (con Playwright)
1000 productos × 8 seg ≈ 8000 seg ≈ 2.2 horas
```

**⚠️ Varía según:**

- Velocidad de respuesta de las tiendas
- Tamaño de las páginas
- Cantidad de imágenes
- Runners de GitHub (pueden ser más lentos que tu local)

---

### Ejecutar Solo una Tienda Específica

```yaml
stores: padelmarket
limit: (vacío)
```

Útil para:

- Probar scrapers individuales
- Re-scrapear una tienda que falló
- Debugging

---

## 📅 Automatización Programada (Opcional)

Si quieres ejecutar los scrapers **automáticamente** cada cierto tiempo:

**Edita el workflow y añade:**

```yaml
on:
  workflow_dispatch: # Mantener la ejecución manual
  schedule:
    - cron: "0 2 * * 0" # Cada domingo a las 2 AM UTC
```

**Ejemplos de cron:**

- `0 2 * * 0` - Cada domingo a las 2 AM
- `0 3 * * 1` - Cada lunes a las 3 AM
- `0 4 1 * *` - El día 1 de cada mes a las 4 AM

---

## 🎯 Recomendación Final

**Para tu caso (1000 productos, ejecución única):**

1. **Primero:** Ejecuta `run-scrapers.yml` con `limit: 20` → Ver cuánto tarda
2. **Calcular:** Si 20 productos tardan X minutos, 1000 tardarán ~50X minutos
3. **Si <6h:** Ejecuta `run-scrapers.yml` sin límite
4. **Si >6h:** Ejecuta `run-scrapers-split.yml` sin límite

**Ventaja del modo split:**

- Aunque tarde más de 6h en total, cada tienda tiene su propio límite
- Se ejecutan en paralelo → Termina en ~1/4 del tiempo

---

## 📞 Ayuda

Si algo falla, revisa:

1. Los **logs del workflow** en GitHub Actions
2. El archivo `scraper.log` en los artifacts descargados
3. Que las dependencias estén en `requirements.txt`

---

**¡Listo para scrapear sin preocuparte de tener el ordenador encendido! 🚀**
