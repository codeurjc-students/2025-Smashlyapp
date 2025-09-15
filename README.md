# 🤖 Sistema de Recomendación de Palas de Pádel con IA - TFG

Sistema inteligente de recomendación personalizada de palas de pádel utilizando **Google Gemini AI** y técnicas de **RAG (Retrieval-Augmented Generation)**.

## 🌟 Funcionalidades Principales

### 🤖 Recomendación con IA

- **Análisis personalizado** basado en perfil de jugador
- **3 recomendaciones rankeadas** con explicaciones detalladas
- **Sistema RAG** para mejorar recomendaciones con historial de usuarios

### ⚡ Tecnologías

- **React + TypeScript + Vite**
- **Google Gemini AI** (gemini-1.5-flash)
- **Supabase** para datos de usuarios
- **Styled Components** para UI moderna

## 🚀 Instalación y Configuración

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

Crear archivo `.env`:

```bash
VITE_GEMINI_API_KEY=tu_api_key_de_gemini
VITE_SUPABASE_URL=tu_supabase_url
VITE_SUPABASE_ANON_KEY=tu_supabase_anon_key
```

### 3. Ejecutar en desarrollo

```bash
npm run dev
```

## 📊 Base de Datos

- +100 palas de pádel con especificaciones detalladas
- Datos en formato JSON para desarrollo
- Integración con Supabase para producción

## 🎯 Algoritmo de Recomendación

1. **Análisis de perfil**: Nivel, estilo, físico, presupuesto
2. **Filtrado colaborativo**: Usuarios similares
3. **Filtrado basado en contenido**: Características técnicas
4. **Generación con IA**: Explicaciones personalizadas
5. **Ranking inteligente**: Porcentaje de compatibilidad

## 📁 Estructura del Proyecto

```
src/
├── utils/gemini.ts          # Core de IA con Gemini
├── services/
│   ├── ragService.ts        # Sistema RAG
│   └── vectorService.ts     # Embeddings vectoriales
├── pages/BestRacketPage.tsx # Interfaz principal
├── types/racket.ts          # Tipos TypeScript
└── contexts/               # Estado global
```

## � Interfaz de Usuario - Recorrido por la Aplicación

### 🏠 Página Principal

La experiencia comienza en nuestra página de inicio, diseñada para ofrecer acceso directo a las funcionalidades principales de Smashly.

![Página Principal](public/images/readme-images/MAIN-PAGE.png)

Desde aquí, los usuarios pueden:

- **Acceder al sistema de recomendaciones IA**
- **Explorar el catálogo completo de palas**
- **Iniciar sesión o registrarse**
- **Consultar las FAQ**

---

### 🔐 Sistema de Autenticación

#### Registro de Usuario

![Página de Registro](public/images/readme-images/REGISTER-PAGE.png)

#### Inicio de Sesión

![Página de Login](public/images/readme-images/LOGIN-PAGE.png)

El sistema de autenticación permite a los usuarios crear perfiles personalizados que mejoran la precisión de las recomendaciones IA.

---

### 🤖 Motor de Recomendaciones IA

![Formulario de Recomendación](public/images/readme-images/FORM-PAGE.png)

**Características del formulario:**

- **Análisis de perfil completo**: Nivel de juego, estilo, características físicas
- **Preferencias técnicas**: Forma de pala, balance, materiales
- **Presupuesto personalizable**
- **Recomendaciones instantáneas** con explicaciones detalladas

---

### 🏪 Catálogo de Palas

![Catálogo Completo](public/images/readme-images/CATALOG-PAGE.png)

**Funcionalidades del catálogo:**

- **+100 palas** de las mejores marcas
- **Filtros avanzados** por marca, nivel, forma, precio
- **Comparación de precios** entre múltiples tiendas
- **Sistema de favoritos y comparación**

---

### 🔍 Detalle de Producto

![Detalle de Pala](public/images/readme-images/RACKET-DETAIL-PAGE.png)

**Información detallada:**

- **Especificaciones técnicas completas**
- **Comparación de precios multi-tienda**
- **Reseñas y valoraciones**
- **Botón de añadir a comparación**
- **Recomendaciones relacionadas**

---

### ⚖️ Sistema de Comparación

![Página de Comparación](public/images/readme-images/COMPARE-PAGE.png)

**Características de la comparación:**

- **Hasta 3 palas simultáneamente**
- **Análisis IA detallado** de cada opción
- **Tabla comparativa de especificaciones**
- **Recomendación final personalizada**
- **Análisis de pros y contras**

---

### ❓ Centro de Ayuda

![FAQ](public/images/readme-images/FAQ-PAGE.png)

**Soporte completo:**

- **Preguntas frecuentes**
- **Guías de uso**
- **Consejos de selección de palas**
- **Información técnica**

---

## �🔧 Configuración de APIs

### Google Gemini AI

1. Obtener API key en [ai.google.dev](https://ai.google.dev)
2. Configurar en variables de entorno
3. El sistema usa `gemini-1.5-flash` como modelo principal

---

**Desarrollado como parte del Trabajo de Fin de Grado**
