# 🚀 Smashly API

API REST para el sistema de recomendación de palas de pádel con IA de Smashly.

## 🌟 Características

- **🏓 Gestión de Palas**: CRUD completo para palas de pádel
- **👤 Perfiles de Usuario**: Gestión de perfiles con Supabase Auth
- **🤖 Recomendaciones con IA**: Powered by Google Gemini AI
- **🔍 Búsqueda Avanzada**: Filtros y ordenamiento flexibles
- **📊 Comparación de Palas**: Análisis comparativo con IA
- **🔐 Autenticación**: JWT tokens con Supabase
- **📈 Métricas y Stats**: Estadísticas de palas y usuarios

## 🛠️ Stack Tecnológico

- **Framework**: Express.js con TypeScript
- **Base de Datos**: Supabase (PostgreSQL)
- **IA**: Google Gemini AI
- **Autenticación**: Supabase Auth
- **Validación**: Joi
- **Documentación**: Swagger/OpenAPI (próximamente)

## 🚀 Instalación Rápida

### 1. Instalar Dependencias

```bash
cd api
npm install
```

### 2. Configurar Variables de Entorno

```bash
# Copiar el archivo de ejemplo
cp .env.example .env

# Editar las variables requeridas
nano .env
```

**Variables requeridas mínimas:**
```env
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu_supabase_anon_key
GEMINI_API_KEY=tu_gemini_api_key
```

### 3. Ejecutar en Desarrollo

```bash
npm run dev
```

La API estará disponible en: `http://localhost:3001`

## 📚 Scripts Disponibles

```bash
# Desarrollo con hot reload
npm run dev

# Compilar TypeScript
npm run build

# Ejecutar en producción
npm start

# Linting
npm run lint
npm run lint:fix

# Tests
npm test
npm run test:watch

# Limpiar build
npm run clean
```

## 🔗 Endpoints Principales

### 🏥 Health Check
```http
GET /api/health           # Estado básico
GET /api/health/deep      # Verificación completa
```

### 🏓 Palas de Pádel
```http
GET    /api/rackets                    # Todas las palas
GET    /api/rackets/:id               # Pala por ID
GET    /api/rackets/search?q=query    # Búsqueda por texto
GET    /api/rackets/filter            # Filtros avanzados
GET    /api/rackets/bestsellers       # Palas bestsellers
GET    /api/rackets/offers            # Palas en oferta
GET    /api/rackets/brands            # Marcas disponibles
GET    /api/rackets/brands/:brand     # Palas por marca
GET    /api/rackets/stats             # Estadísticas
```

### 👤 Usuarios
```http
GET    /api/users/profile                    # Perfil del usuario
POST   /api/users/profile                    # Crear perfil
PUT    /api/users/profile                    # Actualizar perfil
DELETE /api/users/profile                    # Eliminar perfil
GET    /api/users/nickname/:nick/available   # Verificar nickname
GET    /api/users/search?q=query            # Buscar usuarios
GET    /api/users/stats                     # Estadísticas (admin)
```

### 🤖 Recomendaciones con IA
```http
POST   /api/recommendations              # Generar recomendaciones
POST   /api/recommendations/compare      # Comparar palas
GET    /api/recommendations/history      # Historial usuario
POST   /api/recommendations/interaction  # Registrar interacción
POST   /api/recommendations/validate-form # Validar formulario
```

## 📖 Uso de la API

### 🔐 Autenticación

Para endpoints que requieren autenticación, incluye el token JWT en el header:

```bash
Authorization: Bearer <tu_jwt_token>
```

### 📝 Ejemplo: Obtener Recomendaciones

```bash
curl -X POST http://localhost:3001/api/recommendations \
  -H "Content-Type: application/json" \
  -d '{
    "gameLevel": "Intermedio",
    "playingStyle": "Equilibrado",
    "weight": "75",
    "height": "180",
    "budget": "200",
    "preferredShape": "Lágrima"
  }'
```

### 📝 Ejemplo: Buscar Palas

```bash
# Búsqueda por texto
curl "http://localhost:3001/api/rackets/search?q=bullpadel"

# Filtros avanzados
curl "http://localhost:3001/api/rackets/filter?marca=Bullpadel&forma=Lágrima&precio_max=200"

# Paginación
curl "http://localhost:3001/api/rackets?paginated=true&page=0&limit=20"
```

### 📝 Ejemplo: Comparar Palas

```bash
curl -X POST http://localhost:3001/api/recommendations/compare \
  -H "Content-Type: application/json" \
  -d '{
    "racketIds": [1, 2, 3]
  }'
```

## 🔧 Configuración Avanzada

### Supabase Setup

1. Crea un proyecto en [Supabase](https://supabase.com)
2. Obtén tu `SUPABASE_URL` y `SUPABASE_ANON_KEY`
3. Para operaciones administrativas, obtén también `SUPABASE_SERVICE_ROLE_KEY`

### Google Gemini AI Setup

1. Ve a [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Crea una API key
3. Agrégala como `GEMINI_API_KEY`

### Variables de Entorno Completas

Ver [.env.example](./.env.example) para todas las opciones disponibles.

## 📊 Monitoreo y Health Checks

### Health Check Básico
```bash
curl http://localhost:3001/api/health
```

Respuesta:
```json
{
  "success": true,
  "data": {
    "status": "OK",
    "timestamp": "2025-09-15T10:00:00.000Z",
    "uptime": 3600,
    "environment": "development",
    "version": "1.0.0",
    "services": {
      "database": { "status": "connected", "type": "Supabase" },
      "ai": { "status": "configured", "type": "Google Gemini" }
    }
  }
}
```

## 🔒 Seguridad

- **CORS**: Configurado para frontend específico
- **Rate Limiting**: 100 requests por 15 minutos
- **Helmet**: Headers de seguridad
- **Input Validation**: Joi schemas
- **JWT Authentication**: Supabase tokens

## 🐛 Troubleshooting

### Error: Supabase Connection Failed
1. Verifica `SUPABASE_URL` y `SUPABASE_ANON_KEY`
2. Asegúrate que el proyecto Supabase esté activo
3. Verifica la conectividad de red

### Error: Gemini AI Not Available
1. Verifica `GEMINI_API_KEY`
2. Comprueba cuotas de la API
3. Verifica que la región permita el servicio

### Error: TypeScript Compilation
```bash
# Limpiar y reinstalar
npm run clean
rm -rf node_modules package-lock.json
npm install
npm run build
```

## 🚀 Deployment

### Docker (Recomendado)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3001
CMD ["npm", "start"]
```

### Vercel/Railway/Render

1. Configura las variables de entorno en la plataforma
2. Instala dependencias: `npm install`
3. Compila: `npm run build`
4. Ejecuta: `npm start`

## 🤝 Contribución

1. Fork el repositorio
2. Crea una rama feature: `git checkout -b feature/nueva-caracteristica`
3. Commit: `git commit -m 'Añadir nueva característica'`
4. Push: `git push origin feature/nueva-caracteristica`
5. Abre un Pull Request

## 📄 Licencia

MIT License - ver [LICENSE](../LICENSE) para detalles.

## 🆘 Soporte

- 📧 Email: soporte@smashly.com
- 💬 Discord: [Smashly Community](https://discord.gg/smashly)
- 📚 Docs: [docs.smashly.com](https://docs.smashly.com)

---

**Hecho con ❤️ por el equipo de Smashly**