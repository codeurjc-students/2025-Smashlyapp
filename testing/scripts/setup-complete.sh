#!/bin/bash

# Smashly Testing Suite - Complete Setup Script
# This script sets up the entire testing environment

set -e

echo "🚀 Iniciando configuración completa de testing para Smashly..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Este script debe ejecutarse desde el directorio /testing"
    exit 1
fi

print_status "Verificando dependencias del sistema..."

# Check Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js no está instalado"
    exit 1
fi

# Check npm
if ! command -v npm &> /dev/null; then
    print_error "npm no está instalado"
    exit 1
fi

# Check Java for Selenium tests
if ! command -v java &> /dev/null; then
    print_warning "Java no está instalado. Los tests E2E de frontend no funcionarán"
else
    java_version=$(java -version 2>&1 | awk -F '"' '/version/ {print $2}')
    print_success "Java detectado: $java_version"
fi

# Check Maven for Selenium tests
if ! command -v mvn &> /dev/null; then
    print_warning "Maven no está instalado. Los tests E2E de frontend no funcionarán"
else
    mvn_version=$(mvn -version | head -n 1)
    print_success "Maven detectado: $mvn_version"
fi

print_status "Instalando dependencias de Node.js..."
npm install

print_success "Dependencias de Node.js instaladas"

# Install Maven dependencies if Maven is available
if command -v mvn &> /dev/null; then
    print_status "Instalando dependencias de Maven..."
    mvn clean install
    print_success "Dependencias de Maven instaladas"
fi

# Setup environment file
if [ ! -f ".env" ]; then
    print_status "Creando archivo de configuración .env..."
    cp .env.example .env
    print_warning "⚠️  IMPORTANTE: Edita el archivo .env con tus credenciales de Supabase"
    print_warning "    - SUPABASE_TEST_URL"
    print_warning "    - SUPABASE_TEST_SERVICE_ROLE_KEY"
else
    print_success "Archivo .env ya existe"
fi

# Setup backend dependencies
print_status "Configurando dependencias del backend..."
cd ../backend/api
if [ -f "package.json" ]; then
    npm install
    print_success "Dependencias del backend instaladas"
else
    print_warning "No se encontró package.json en backend/api"
fi

# Return to testing directory
cd ../../testing

print_status "Verificando estructura de directorios..."

# Check if required directories exist
required_dirs=(
    "src/test/java/com/smashly/e2e/config"
    "src/test/java/com/smashly/e2e/pages"
    "src/test/java/com/smashly/e2e/tests"
    "tests/api"
    "setup"
    "scripts"
)

for dir in "${required_dirs[@]}"; do
    if [ -d "$dir" ]; then
        print_success "✓ $dir"
    else
        print_warning "✗ $dir (falta)"
    fi
done

print_status "Verificando archivos de configuración..."

# Check if required config files exist
required_files=(
    "package.json"
    "pom.xml" 
    "jest.config.js"
    "tsconfig.json"
    ".env.example"
    "setup/setupTestDatabase.js"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        print_success "✓ $file"
    else
        print_warning "✗ $file (falta)"
    fi
done

echo
print_success "🎉 Configuración completa terminada!"
echo
print_status "Próximos pasos:"
echo "1. 📝 Edita el archivo .env con tus credenciales"
echo "2. 🗄️  Ejecuta: npm run setup:test-db (para configurar BD de testing)"
echo "3. 🧪 Ejecuta: npm run test:all (para ejecutar todos los tests)"
echo
print_status "Comandos disponibles:"
echo "  • npm run test:api        - Tests de API REST"
echo "  • npm run test:e2e        - Tests E2E completos"
echo "  • npm run test:all        - Todos los tests"
echo "  • mvn test                - Tests E2E de frontend (Selenium)"
echo
print_warning "⚠️  Recuerda configurar tu base de datos de testing antes de ejecutar las pruebas"