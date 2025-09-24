#!/bin/bash

# Smashly Testing Suite - Run All Tests Script
# Executes all test suites in proper order

set -e

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

# Function to run tests with error handling
run_test_suite() {
    local test_name="$1"
    local test_command="$2"
    local is_optional="$3"
    
    print_status "Ejecutando: $test_name"
    
    if eval "$test_command"; then
        print_success "✓ $test_name - PASARON"
        return 0
    else
        if [ "$is_optional" = "true" ]; then
            print_warning "⚠ $test_name - FALLARON (opcional)"
            return 0
        else
            print_error "✗ $test_name - FALLARON"
            return 1
        fi
    fi
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Este script debe ejecutarse desde el directorio /testing"
    exit 1
fi

echo "🧪 Ejecutando suite completa de testing para Smashly..."
echo "=============================================="

# Initialize test results
total_tests=0
passed_tests=0
failed_tests=0

# Test counters
declare -a test_results=()

# 1. Backend Unit Tests
print_status "1/6 - Ejecutando tests unitarios del backend..."
if run_test_suite "Tests Unitarios Backend" "cd ../backend/api && npm run test:unit" false; then
    ((passed_tests++))
    test_results+=("✓ Tests Unitarios Backend")
else
    ((failed_tests++))
    test_results+=("✗ Tests Unitarios Backend")
fi
((total_tests++))

# 2. Backend Integration Tests
print_status "2/6 - Ejecutando tests de integración del backend..."
if run_test_suite "Tests Integración Backend" "cd ../backend/api && npm run test:integration" false; then
    ((passed_tests++))
    test_results+=("✓ Tests Integración Backend")
else
    ((failed_tests++))
    test_results+=("✗ Tests Integración Backend")
fi
((total_tests++))

# Return to testing directory
cd "$(dirname "$0")/.."

# 3. API System Tests
print_status "3/6 - Ejecutando tests de sistema de API..."
if run_test_suite "Tests Sistema API" "npm run test:api" false; then
    ((passed_tests++))
    test_results+=("✓ Tests Sistema API")
else
    ((failed_tests++))
    test_results+=("✗ Tests Sistema API")
fi
((total_tests++))

# 4. E2E Frontend Tests (optional if Maven not available)
print_status "4/6 - Ejecutando tests E2E de frontend..."
if command -v mvn &> /dev/null; then
    if run_test_suite "Tests E2E Frontend" "mvn test -Dtest=FrontendSystemTest" false; then
        ((passed_tests++))
        test_results+=("✓ Tests E2E Frontend")
    else
        ((failed_tests++))
        test_results+=("✗ Tests E2E Frontend")
    fi
else
    print_warning "Maven no disponible - saltando tests E2E de frontend"
    test_results+=("⚠ Tests E2E Frontend - Maven no disponible")
fi
((total_tests++))

# 5. Complete E2E Test Suite (optional if Maven not available)
print_status "5/6 - Ejecutando suite completa E2E..."
if command -v mvn &> /dev/null; then
    if run_test_suite "Suite Completa E2E" "mvn test -Dtest=E2ETestSuite" true; then
        ((passed_tests++))
        test_results+=("✓ Suite Completa E2E")
    else
        ((failed_tests++))
        test_results+=("✗ Suite Completa E2E")
    fi
else
    print_warning "Maven no disponible - saltando suite E2E completa"
    test_results+=("⚠ Suite Completa E2E - Maven no disponible")
fi
((total_tests++))

# 6. API Integration Tests
print_status "6/6 - Ejecutando tests de integración de API..."
if run_test_suite "Tests Integración API" "npm run test:integration" true; then
    ((passed_tests++))
    test_results+=("✓ Tests Integración API")
else
    ((failed_tests++))
    test_results+=("✗ Tests Integración API")
fi
((total_tests++))

# Print final results
echo
echo "=============================================="
echo "🏁 RESUMEN DE EJECUCIÓN DE TESTS"
echo "=============================================="

for result in "${test_results[@]}"; do
    echo "$result"
done

echo
echo "📊 ESTADÍSTICAS:"
echo "   Total de suites ejecutadas: $total_tests"
echo "   Suites exitosas: $passed_tests"
echo "   Suites fallidas: $failed_tests"

if [ $failed_tests -eq 0 ]; then
    print_success "🎉 ¡Todos los tests han pasado exitosamente!"
    exit 0
else
    print_error "❌ $failed_tests suite(s) de tests fallaron"
    
    echo
    print_status "💡 CONSEJOS PARA DEBUGGEAR:"
    echo "  • Revisa los logs de cada suite fallida"
    echo "  • Verifica la configuración de .env"
    echo "  • Confirma que la BD de testing esté configurada"
    echo "  • Asegúrate de que los servicios estén ejecutándose"
    
    exit 1
fi