#!/bin/bash

# 🛡️ Script para configurar Branch Protection Rules
# Este script configura las reglas de protección para la rama main

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

# Variables
REPO_OWNER="codeurjc-students"
REPO_NAME="2025-Smashlyapp"
BRANCH="main"

log "Configurando Branch Protection Rules para ${REPO_OWNER}/${REPO_NAME}:${BRANCH}"

# Verificar que GitHub CLI está instalado
if ! command -v gh &> /dev/null; then
    error "GitHub CLI (gh) no está instalado. Instálalo desde: https://cli.github.com/"
    exit 1
fi

# Verificar autenticación
if ! gh auth status &> /dev/null; then
    error "No estás autenticado en GitHub CLI. Ejecuta: gh auth login"
    exit 1
fi

log "Configurando reglas de protección..."

# Configurar Branch Protection Rules usando GitHub CLI
gh api repos/${REPO_OWNER}/${REPO_NAME}/branches/${BRANCH}/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["🖥️ Backend Complete Tests","🌐 Frontend Complete Tests","🔍 Static Code Analysis","🎭 E2E Tests","🔒 Security Scan"]}' \
  --field enforce_admins=true \
  --field required_pull_request_reviews='{"dismiss_stale_reviews":true,"require_code_owner_reviews":false,"required_approving_review_count":1}' \
  --field restrictions=null \
  --field allow_force_pushes=false \
  --field allow_deletions=false

if [ $? -eq 0 ]; then
    success "Branch Protection Rules configuradas correctamente"
    
    log "Reglas configuradas:"
    echo "  ✅ Require pull request reviews (1 approval minimum)"
    echo "  ✅ Dismiss stale reviews when new commits are pushed"
    echo "  ✅ Require status checks to pass before merging"
    echo "  ✅ Require branches to be up to date before merging"
    echo "  ✅ Include administrators in restrictions"
    echo "  ✅ Restrict pushes that create merge commits"
    echo "  ✅ Prevent force pushes"
    echo "  ✅ Prevent branch deletion"
    
    warning "IMPORTANTE: Estas reglas se aplicarán incluso a los administradores"
    warning "Para hacer cambios de emergencia, deberás desactivar temporalmente las reglas"
    
else
    error "Error al configurar Branch Protection Rules"
    error "Verifica que tienes permisos de administrador en el repositorio"
    exit 1
fi

log "¡Configuración completada!"
success "La rama main ahora está protegida y requiere que pasen todos los checks de CI/CD"