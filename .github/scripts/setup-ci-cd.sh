#!/bin/bash

# 🔧 Script para configurar el entorno de CI/CD localmente
# Este script prepara el proyecto para testing y CI/CD

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para logging
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

log "🚀 Configurando entorno CI/CD para Smashly App"

# Verificar Node.js
if ! command -v node &> /dev/null; then
    error "Node.js no está instalado. Instálalo desde: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node --version)
log "Node.js detectado: $NODE_VERSION"

# Verificar Java para E2E tests
if ! command -v java &> /dev/null; then
    warning "Java no está instalado. Los tests E2E no funcionarán."
    warning "Instala Java 11+ desde: https://adoptium.net/"
else
    JAVA_VERSION=$(java -version 2>&1 | head -n 1)
    log "Java detectado: $JAVA_VERSION"
fi

# Verificar Maven
if ! command -v mvn &> /dev/null; then
    warning "Maven no está instalado. Los tests E2E no funcionarán."
    warning "Instala Maven desde: https://maven.apache.org/"
else
    MVN_VERSION=$(mvn --version | head -n 1)
    log "Maven detectado: $MVN_VERSION"
fi

# Configurar backend
log "Configurando backend..."
cd backend/api

if [ ! -f "package-lock.json" ]; then
    log "Instalando dependencias del backend..."
    npm install
else
    log "Actualizando dependencias del backend..."
    npm ci
fi

log "Compilando backend..."
npm run build

log "Ejecutando tests unitarios del backend..."
npm run test:unit

success "Backend configurado correctamente"
cd ../..

# Configurar frontend
log "Configurando frontend..."
cd frontend

if [ ! -f "package-lock.json" ]; then
    log "Instalando dependencias del frontend..."
    npm install
else
    log "Actualizando dependencias del frontend..."
    npm ci
fi

log "Compilando frontend..."
npm run build

log "Ejecutando tests unitarios del frontend..."
npm run test:unit

success "Frontend configurado correctamente"
cd ..

# Configurar testing E2E
if command -v mvn &> /dev/null && command -v java &> /dev/null; then
    log "Configurando tests E2E..."
    cd testing
    
    log "Instalando dependencias Maven..."
    mvn clean compile test-compile
    
    success "Tests E2E configurados correctamente"
    cd ..
else
    warning "Saltando configuración de tests E2E (Java/Maven no disponible)"
fi

# Verificar archivos de configuración
log "Verificando configuración de CI/CD..."

if [ -f ".github/workflows/basic-quality-check.yml" ]; then
    success "Workflow de calidad básica configurado"
else
    error "Falta el workflow de calidad básica"
fi

if [ -f ".github/workflows/complete-quality-check.yml" ]; then
    success "Workflow de calidad completa configurado"
else
    error "Falta el workflow de calidad completa"
fi

if [ -f "sonar-project.properties" ]; then
    success "Configuración de SonarQube encontrada"
else
    warning "Configuración de SonarQube no encontrada"
fi

# Verificar .env
if [ -f "testing/.env" ]; then
    success "Archivo .env encontrado"
    warning "RECUERDA: Configura los GitHub Secrets antes de usar CI/CD"
else
    error "Archivo .env no encontrado en testing/"
fi

# Crear .gitignore si no existe
if [ ! -f ".gitignore" ]; then
    log "Creando .gitignore..."
    cat > .gitignore << 'EOF'
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Build outputs
dist/
build/
coverage/

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Testing
test-results/
screenshots/
videos/

# Java
target/
*.class
*.jar
*.war
*.ear

# Logs
logs/
*.log
EOF
    success ".gitignore creado"
fi

# Resumen final
echo ""
log "🎉 ¡Configuración completada!"
echo ""
success "✅ Backend configurado y funcionando"
success "✅ Frontend configurado y funcionando"
if command -v mvn &> /dev/null && command -v java &> /dev/null; then
    success "✅ Tests E2E configurados y listos"
else
    warning "⚠️  Tests E2E requieren Java 11+ y Maven"
fi
success "✅ Workflows de CI/CD configurados"

echo ""
log "📋 Próximos pasos:"
echo "1. 🔐 Configura los GitHub Secrets (ver .github/SECRETS.md)"
echo "2. 🛡️ Ejecuta ./.github/scripts/setup-branch-protection.sh"
echo "3. 🧪 Haz un commit para probar el CI básico"
echo "4. 🚀 Crea un PR para probar el CI completo"

echo ""
warning "📖 Lee la documentación completa en .github/CI-CD-README.md"