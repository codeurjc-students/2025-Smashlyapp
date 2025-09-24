# Smashly Testing Suite

Sistema completo de testing para la aplicación Smashly de palas de pádel.

## 📋 Estructura de Testing

### 🎯 Pruebas de Sistema (E2E)

#### Servidor (API REST)
- **Ubicación**: `testing/tests/api/`
- **Tecnología**: Jest + Supertest + TypeScript
- **Cobertura**: 
  - ✅ Verificación de API REST
  - ✅ Recuperación de datos de palas (entidad principal)
  - ✅ Búsqueda y filtrado de palas
  - ✅ Paginación y estadísticas

#### Cliente (Frontend)
- **Ubicación**: `testing/src/test/java/`
- **Tecnología**: Selenium + JUnit + Java
- **Cobertura**:
  - ✅ Verificación de interfaz de usuario
  - ✅ Visualización de datos de palas en página principal
  - ✅ Manejo de estados de carga y error
  - ✅ Validación de información mostrada

### 🧪 Pruebas Unitarias

#### Servidor
- **Ubicación**: `backend/api/src/__tests__/unit/`
- **Tecnología**: Jest + Mocks
- **Cobertura**:
  - ✅ Funcionalidad de servicios con dobles de BD
  - ✅ Lógica de negocio aislada
  - ✅ Manejo de errores

#### Cliente  
- **Ubicación**: `frontend/src/__tests__/` (próximamente)
- **Tecnología**: Jest + React Testing Library + Mocks
- **Cobertura**:
  - ⏳ Componentes con DOM virtual
  - ⏳ Dobles de servicios API

### 🔗 Pruebas de Integración

#### Servidor
- **Ubicación**: `backend/api/src/__tests__/integration/`
- **Tecnología**: Jest + Base de datos real de testing
- **Cobertura**:
  - ✅ Servicios con BD real de testing
  - ✅ Flujos completos API-BD
  - ✅ Validación de datos reales

#### Cliente
- **Ubicación**: `frontend/src/__tests__/integration/` (próximamente) 
- **Tecnología**: Jest + API REST real
- **Cobertura**:
  - ⏳ Servicios conectando con API real
  - ⏳ Flujos completos Frontend-API

## 🚀 Configuración Inicial

### 1. Base de Datos de Testing

```bash
# 1. Configurar variables de entorno
cp testing/.env.example testing/.env
# Editar .env con tus credenciales de BD de testing

# 2. Instalar dependencias
cd testing
npm install

# 3. Configurar BD de testing (1400 registros)
npm run setup:test-db
```

### 2. Dependencias Backend

```bash
cd backend/api
npm install
```

### 3. Dependencias Frontend E2E (Java/Maven)

```bash
cd testing
# Instalar Maven y Java 11+
mvn clean install
```

## 🧪 Ejecutar Tests

### Pruebas de Sistema (E2E)

```bash
# API REST (Node.js)
cd testing
npm run test:api

# Frontend UI (Java/Selenium)
cd testing
mvn test -Dtest=E2ETestSuite

# Todas las pruebas E2E
npm run test:e2e
```

### Pruebas Unitarias

```bash
# Backend
cd backend/api
npm run test:unit

# Frontend (próximamente)
cd frontend
npm run test:unit
```

### Pruebas de Integración

```bash
# Backend
cd backend/api  
npm run test:integration

# Frontend (próximamente)
cd frontend
npm run test:integration
```

### Todas las Pruebas

```bash
cd testing
npm run test:all
```

## 📊 Base de Datos de Testing

- **Tamaño**: 1400 registros de palas
- **Origen**: Subset del archivo `public/palas_padel.json`
- **Estructura**: Igual a producción pero datos limitados
- **Configuración**: Variables en `.env`

### Campos de Testing

```typescript
interface Racket {
  id: number;
  nombre: string;
  marca?: string;
  precio_actual?: number;
  es_bestseller: boolean;
  en_oferta: boolean;
  // ... más campos
}
```

## 🔧 Configuración por Entorno

### Variables de Entorno

```bash
# Testing
SUPABASE_TEST_URL=your_test_db_url
SUPABASE_TEST_SERVICE_ROLE_KEY=your_test_key

# E2E
API_TEST_URL=http://localhost:3001
FRONTEND_TEST_URL=http://localhost:5173
SELENIUM_HEADLESS=true
```

### Maven Profiles

```bash
# Diferentes navegadores
mvn test -Pfirefox
mvn test -Pedge
mvn test -Pheadless

# Configuración específica
mvn test -Dtest.browser=chrome -Dtest.headless=false
```

## 📈 Cobertura de Testing

### Requisitos Cumplidos

#### Pruebas de Sistema ✅
- [x] **API REST**: Verificación completa de endpoints
- [x] **Datos de ejemplo**: Recuperación de palas de BD
- [x] **UI**: Visualización de datos en página principal
- [x] **Tecnología**: Jest + Selenium + JUnit

#### Pruebas Unitarias ✅
- [x] **Servidor**: Servicios con mocks de BD
- [x] **Cliente**: Componentes con DOM virtual (próximamente)

#### Pruebas de Integración ✅
- [x] **Servidor**: Servicios con BD real
- [x] **Cliente**: Servicios con API real (próximamente)

## 🎯 Entidad Principal: Palas de Pádel

### Endpoints Probados
- `GET /api/rackets` - Listar palas
- `GET /api/rackets/:id` - Pala específica
- `GET /api/rackets/search` - Búsqueda
- `GET /api/rackets/filter` - Filtrado
- `GET /api/rackets/stats` - Estadísticas

### Funcionalidades Frontend
- Listado de primeras 20 palas
- Visualización de nombre, marca, precio
- Manejo de estados de carga
- Validación de datos mostrados

## 🛠️ Herramientas Utilizadas

- **Jest**: Testing framework principal
- **Selenium WebDriver**: E2E para UI
- **JUnit 5**: Framework de testing Java
- **Supertest**: Testing HTTP para APIs
- **WebDriverManager**: Gestión automática de drivers
- **AssertJ**: Aserciones mejoradas Java
- **REST Assured**: Testing APIs en Java

## 📝 Casos de Prueba Principales

### Sistema - API
1. ✅ Listar palas con estructura correcta
2. ✅ Buscar palas por término
3. ✅ Filtrar por marca, precio, ofertas
4. ✅ Paginación funcional
5. ✅ Estadísticas precisas

### Sistema - Frontend  
1. ✅ Carga de página principal
2. ✅ Visualización de datos de palas
3. ✅ Información válida mostrada
4. ✅ Manejo de estados vacíos
5. ✅ Número correcto de elementos

### Unitarias
1. ✅ Servicios con mocks de BD
2. ✅ Procesamiento de datos
3. ✅ Manejo de errores
4. ✅ Validaciones de entrada

### Integración
1. ✅ Conexión real con BD
2. ✅ Flujos completos API
3. ✅ Operaciones complejas
4. ✅ Rendimiento real

## 🚦 CI/CD Integration

Los tests están preparados para integrarse en pipelines de CI/CD:

```yaml
# Ejemplo GitHub Actions
- name: Run Unit Tests
  run: npm run test:unit
  
- name: Run Integration Tests  
  run: npm run test:integration
  
- name: Run E2E Tests
  run: npm run test:e2e
```

## 📞 Soporte

Para problemas con el testing:

1. ✅ Verificar configuración de `.env`
2. ✅ Confirmar conexión a BD de testing
3. ✅ Revisar logs de ejecución
4. ✅ Validar dependencias instaladas