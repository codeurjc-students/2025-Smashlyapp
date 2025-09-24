# Testing Scripts Collection

Este directorio contiene scripts útiles para automatizar tareas de testing.

## Scripts Disponibles

### 🔧 setup-complete.sh
Script completo de configuración inicial del entorno de testing.

### 📊 run-all-tests.sh  
Ejecuta toda la suite de tests en orden secuencial.

### 🧹 cleanup-test-data.sh
Limpia datos de testing de la base de datos.

### 📈 generate-test-report.sh
Genera reportes consolidados de todas las pruebas.

## Uso

```bash
# Hacer ejecutables
chmod +x scripts/*.sh

# Configuración inicial completa
./scripts/setup-complete.sh

# Ejecutar todos los tests
./scripts/run-all-tests.sh

# Limpiar datos de testing
./scripts/cleanup-test-data.sh

# Generar reporte
./scripts/generate-test-report.sh
```