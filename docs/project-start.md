# 🚀 Inicio del Proyecto

Esta sección documenta las fases iniciales del proyecto Smashly, incluyendo los objetivos planteados al comienzo, la metodología de desarrollo establecida, las funcionalidades iniciales propuestas y el análisis del sistema.

---

## 📑 Índice

1. [Objetivos](#-objetivos)
2. [Metodología](#-metodología)
3. [Funcionalidades Iniciales](#-funcionalidades-iniciales)
4. [Análisis](#-análisis)

---

## 🎯 Objetivos

### ✅ Objetivos Funcionales

- Ofrecer un **catálogo detallado de palas de pádel** con características técnicas, imágenes y precios.
- Permitir a los usuarios **buscar, filtrar y comparar** palas de diferentes marcas y tiendas.
- Incorporar **recomendaciones personalizadas** basadas en preferencias del usuario.
- Gestionar la **autenticación y perfil de usuario**, incluyendo favoritos y reseñas.
- Sincronizar y mantener actualizado el catálogo mediante **scrapers de tiendas externas**.
- Proporcionar herramientas de soporte adicionales: **FAQ, páginas informativas y panel de administración**.

### 🛠️ Objetivos Técnicos

- Desarrollar el **frontend en React con TypeScript**, estructurado en componentes reutilizables y gestionado con Vite.
- Implementar el **backend en Node.js con Express**, siguiendo una arquitectura de controladores, servicios y middleware.
- Utilizar **Supabase** como servicio de autenticación y base de datos.
- Integrar **scrapers en Python** para obtener y migrar datos de tiendas externas.
- Establecer comunicación **API RESTful** entre frontend y backend, con validación y seguridad mediante middleware.
- Mantener una arquitectura **escalable y mantenible**, con separación clara de responsabilidades.
- Documentar la API con **Postman Collection** y gestionar el proyecto con **Git** para control de versiones y colaboración.

---

## ⚙️ Metodología

El proyecto se desarrolla **iterativamente**, en fases que garantizan progreso continuo y claro.

### 📅 Fases del Proyecto

| 🎯 Fase | 📋 Descripción | ⏰ Deadline | 🚀 Fecha Inicial | ✅ Fecha Final |
|----------|-----------------|-------------|------------------|---------------|
| 📝 **Fase 1** | Definición de funcionalidades y prototipo | 15 Septiembre 2025 | 10 Septiembre 2025 | 15 Septiembre 2025 |
| 🔧 **Fase 2** | Configuración de repositorio, testing y CI/CD | 15 Octubre 2025 | 16 Septiembre 2025 | 15 Octubre 2025 |
| 🐳 **Fase 3** | Funcionalidad básica y configuración Docker | 15 Diciembre 2025 | 16 Octubre 2025 | 15 Diciembre 2025 |
| ⚡ **Fase 4** | Funcionalidad intermedia | 1 Marzo 2026 | 16 Diciembre 2025 | - |
| 🚀 **Fase 5** | Funcionalidad avanzada | 15 Abril 2026 | 2 Marzo 2026 | - |
| 📖 **Fase 6** | Memoria del TFG | 15 Mayo 2026 | 16 Abril 2026 | - |
| 🎓 **Fase 7** | Presentación y defensa final | 15 Junio 2026 | 16 Mayo 2026 | - |

### 🔄 Metodología de Desarrollo

El proyecto sigue un enfoque **ágil e iterativo** basado en principios de:

#### **Extreme Programming (XP)**
- **Desarrollo iterativo**: Entregas frecuentes con incrementos funcionales
- **Test-Driven Development (TDD)**: Pruebas unitarias y de integración desde el inicio
- **Refactoring continuo**: Mejora constante del código
- **Integración continua**: GitHub Actions para automatización de builds y tests

#### **Kanban**
- **Gestión visual**: GitHub Projects con tablero Kanban
- **Límites WIP**: Control de trabajo en progreso
- **Flujo continuo**: Sin sprints fijos, entrega continua
- **Priorización dinámica**: Ajuste de prioridades según necesidades

### 🛠️ Herramientas y Proceso

- **Control de versiones**: Git con estrategia de branching (`feature/*`, `fix/*`, `main`)
- **Gestión de tareas**: GitHub Issues y Projects
- **CI/CD**: GitHub Actions con workflows para calidad y despliegue
- **Documentación**: Markdown en repositorio + GitHub Pages
- **Comunicación**: Blog en Medium para seguimiento público

---

## 📋 Funcionalidades Iniciales

En la fase inicial del proyecto se definieron tres niveles de funcionalidades: **Básicas**, **Intermedias** y **Avanzadas**.

### 🟢 Funcionalidades Básicas (Prioridad Alta)

Estas funcionalidades constituyen el **MVP (Minimum Viable Product)** y fueron implementadas en la **Fase 3** (versión 0.1):

| Funcionalidad | Descripción | Estado v0.1 |
|---------------|-------------|-------------|
| **Registro / Login** | Sistema completo de autenticación con roles (usuario, admin) | ✅ Implementado |
| **Ver catálogo** | Listado de palas con búsqueda, filtros y paginación | ✅ Implementado |
| **Ver página detalle** | Información completa de cada pala (características, precios, reseñas) | ✅ Implementado |
| **Listas de favoritos** | Creación y gestión de listas personalizadas de palas | ✅ Implementado |
| **Reseñas de usuarios** | Sistema de valoraciones (1-5 estrellas) y comentarios | ✅ Implementado |
| **Gestión de palas** | CRUD completo para administradores | ✅ Implementado |
| **Gestión de tiendas** | CRUD de tiendas asociadas a precios | ✅ Implementado |

### 🟡 Funcionalidades Intermedias (Prioridad Media)

Planificadas para la **Fase 4** (versión 0.2 - Marzo 2026):

| Funcionalidad | Descripción | Estado |
|---------------|-------------|--------|
| **Comparar palas** | Comparación lado a lado de características | ⏳ Pendiente |
| **Palas trending** | Ranking de palas más populares | ⏳ Pendiente |
| **Exportación PDF** | Descarga de comparativas personalizadas | ⏳ Pendiente |
| **Avisos de precios** | Notificaciones de cambios de precio | ⏳ Pendiente |
| **Formulario avanzado** | Recomendación personalizada mejorada | ⏳ Pendiente |
| **Historial de precios** | Gráficos de evolución de precios | ⏳ Pendiente |
| **Soporte / contacto** | Sistema de tickets para usuarios | ⏳ Pendiente |

### 🔴 Funcionalidades Avanzadas (Prioridad Baja)

Planificadas para la **Fase 5** (versión 0.3 - Abril 2026):

| Funcionalidad | Descripción | Estado |
|---------------|-------------|--------|
| **Scraping automático** | Actualización automática de precios desde tiendas | 🚧 Scrapers creados, automatización pendiente |
| **Recomendación con IA** | Sistema de recomendación con Gemini AI | ⏳ Pendiente |
| **Panel de estadísticas** | Dashboards interactivos para usuarios y admins | 🚧 Básico implementado |
| **Sistema de notificaciones** | Notificaciones in-app y por email | ⏳ Pendiente |
| **"Próxima pala"** | Recomendación de upgrade basada en evolución | ⏳ Pendiente |

### 📊 Priorización Inicial

La priorización se basó en:

1. **Valor para el usuario**: Funcionalidades que resuelven el problema principal
2. **Dependencias técnicas**: Orden lógico de implementación
3. **Complejidad**: Balance entre esfuerzo y beneficio
4. **Riesgo**: Validación temprana de conceptos clave

**Decisiones clave:**
- Priorizar catálogo y búsqueda sobre funciones sociales
- Implementar autenticación desde el inicio para facilitar funciones personalizadas
- Diferir IA avanzada hasta tener datos suficientes
- Crear scrapers manualmente antes de automatizar

---

## 📊 Análisis

### 🎯 Problema Identificado

**Situación actual:**
- Los jugadores de pádel amateur tienen dificultad para elegir una pala adecuada
- Muchos compran basándose en popularidad o marketing, no en necesidades reales
- La información está dispersa en múltiples tiendas y sitios web
- Falta de herramientas de comparación objetiva
- No existe un sistema centralizado con recomendaciones personalizadas

**Impacto:**
- Compras inadecuadas que no mejoran el rendimiento
- Frustración y pérdida de dinero
- Experiencia de juego subóptima
- Abandono del deporte por equipamiento inadecuado

### 💡 Solución Propuesta

**Smashly** aborda estos problemas mediante:

1. **Centralización de información**
   - Catálogo unificado de múltiples marcas y tiendas
   - Información técnica detallada y estandarizada
   - Comparación de precios en tiempo real

2. **Herramientas de decisión**
   - Comparador visual de características
   - Filtros avanzados por nivel, estilo y características
   - Recomendaciones basadas en perfil de jugador

3. **Comunidad y confianza**
   - Sistema de reseñas de usuarios reales
   - Valoraciones objetivas
   - Listas de favoritos compartibles

4. **Actualización continua**
   - Scrapers para mantener precios actualizados
   - Integración con tiendas oficiales
   - Notificaciones de ofertas

### 🔍 Análisis de Requisitos

#### Requisitos Funcionales

**RF1. Gestión de Usuarios**
- RF1.1: Registro de nuevos usuarios con validación
- RF1.2: Inicio de sesión con JWT
- RF1.3: Gestión de perfil personal
- RF1.4: Roles diferenciados (usuario, administrador)

**RF2. Catálogo de Palas**
- RF2.1: Listado paginado de palas
- RF2.2: Búsqueda por texto libre
- RF2.3: Filtros múltiples (marca, forma, balance, precio)
- RF2.4: Vista detallada de cada pala
- RF2.5: Precios por tienda con enlaces

**RF3. Interacciones de Usuario**
- RF3.1: Creación de listas de favoritos
- RF3.2: Gestión de listas (crear, editar, eliminar)
- RF3.3: Escritura de reseñas con valoración
- RF3.4: Edición y eliminación de reseñas propias
- RF3.5: Comparación de palas

**RF4. Recomendaciones**
- RF4.1: Formulario de perfil de jugador
- RF4.2: Algoritmo de matching de características
- RF4.3: Ranking de palas recomendadas
- RF4.4: Explicación de recomendaciones

**RF5. Administración**
- RF5.1: CRUD completo de palas
- RF5.2: CRUD de tiendas
- RF5.3: Gestión de usuarios
- RF5.4: Moderación de reseñas
- RF5.5: Estadísticas del sistema

#### Requisitos No Funcionales

**RNF1. Rendimiento**
- Tiempo de carga de página < 2 segundos
- Respuesta de API < 500ms (percentil 95)
- Soporte para 100+ usuarios concurrentes

**RNF2. Seguridad**
- Autenticación JWT con expiración
- Validación de entrada en cliente y servidor
- Protección CSRF y XSS
- HTTPS obligatorio en producción
- Análisis de seguridad con CodeQL

**RNF3. Usabilidad**
- Diseño responsive (móvil, tablet, desktop)
- Interfaz intuitiva sin necesidad de tutorial
- Accesibilidad básica (contraste, navegación por teclado)
- Feedback claro de acciones del usuario

**RNF4. Mantenibilidad**
- Cobertura de tests > 70%
- Documentación actualizada
- Código limpio siguiendo estándares (ESLint, Prettier)
- Separación clara por capas
- Análisis estático con SonarQube

**RNF5. Disponibilidad**
- Uptime objetivo: 99% (excluyendo mantenimiento)
- Despliegue mediante contenedores Docker
- Health checks automáticos
- Recuperación ante fallos

#### Requisitos de Datos

**Entidades principales:**
- **Usuario**: email, password (hash), nombre, apellidos, rol, fecha registro
- **Pala**: marca, modelo, descripción, forma, balance, peso, material, núcleo, nivel, precio
- **Tienda**: nombre, URL, logo, descripción
- **Reseña**: usuario, pala, valoración (1-5), comentario, fecha
- **Lista**: usuario, nombre, descripción, palas asociadas

**Volumen estimado (v0.1):**
- Palas: ~50 iniciales, crecimiento a ~500 en 1 año
- Usuarios: ~100 en fase beta, objetivo 1000 primer año
- Reseñas: estimado 3-5 por pala popular
- Tiendas: 5 iniciales, expansión a 10-15

### 🏗️ Arquitectura Propuesta

**Patrón**: Cliente-Servidor con SPA (Single Page Application)

**Componentes:**
1. **Frontend (SPA React)**
   - Componentes reutilizables
   - Gestión de estado con Context API
   - Routing con React Router
   - Comunicación API con fetch/axios

2. **Backend (Node.js + Express)**
   - Capa de controladores (routing HTTP)
   - Capa de servicios (lógica de negocio)
   - Capa de acceso a datos (Supabase SDK)
   - Middleware (auth, validación, error handling)

3. **Base de Datos (Supabase/PostgreSQL)**
   - Esquema relacional normalizado
   - Autenticación integrada
   - RLS (Row Level Security) para seguridad
   - Backups automáticos

4. **Scrapers (Python)**
   - Scripts independientes por tienda
   - Librería BeautifulSoup / Selenium
   - Almacenamiento en Supabase
   - Programación manual (automática en v0.3)

---

<div align="center">

[🏠 README Principal](../README.md) • [⚙️ Funcionalidades](functionalities.md) • [🧑‍💻 Guía de Desarrollo](development-guide.md)

</div>
