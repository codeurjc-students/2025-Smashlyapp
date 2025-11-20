<p align="center">
  <img src="public/images/icons/smashly-banner.svg" alt="Smashly App - Your game, your racket" />
</p>

---

## 📋 Resumen de la Versión 0.1

**Smashly** es una aplicación web para jugadores de pádel amateur y semi-profesionales que buscan encontrar la pala más adecuada según sus características y estilo de juego.

En la **versión 0.1**, la aplicación incluye las siguientes funcionalidades principales:

- 🔐 **Sistema de autenticación completo**: Registro de nuevos usuarios, inicio de sesión y gestión de perfiles personalizados
- 📚 **Catálogo de palas**: Exploración de un amplio catálogo con información detallada de cada pala (características técnicas, imágenes, precios)
- 🔍 **Búsqueda y filtrado avanzado**: Filtros por marca, forma, balance, rango de precio y más
- 📝 **Sistema de reseñas**: Los usuarios registrados pueden escribir y consultar opiniones sobre las palas
- ⭐ **Gestión de favoritos**: Creación y gestión de listas personalizadas de palas favoritas
- 👤 **Perfil de usuario**: Gestión de datos personales y visualización de actividad
- ❓ **Sección FAQ**: Preguntas frecuentes con información útil para los usuarios
- 👨‍💼 **Panel de administración**: Gestión completa de palas, tiendas y usuarios (CRUD)

### 📸 Capturas de Pantalla

<details>
<summary><b>Ver capturas de la versión 0.1</b></summary>

#### Página Principal

![Página Principal](public/images/readme-images/MAIN-PAGE.png)

#### Catálogo de Palas

![Catálogo](public/images/readme-images/CATALOG-PAGE.png)

#### Detalle de Pala

![Detalle de Pala](public/images/readme-images/RACKET-DETAIL-PAGE.png)

#### Comparador

![Comparador](public/images/readme-images/COMPARE-PAGE.png)

#### Formulario de Recomendación

![Formulario](public/images/readme-images/FORM-PAGE.png)

#### Registro y Login

![Registro](public/images/readme-images/REGISTER-PAGE.png)
![Login](public/images/readme-images/LOGIN-PAGE.png)

#### Sección FAQ

![FAQ](public/images/readme-images/FAQ-PAGE.png)

</details>

---

## 🚧 Desarrollo Continuo

> **⚠️ Nota importante**: Esta aplicación se encuentra en **desarrollo activo**. La versión 0.1 representa la base funcional del proyecto, y se seguirán implementando nuevas características y mejoras en las próximas versiones.

---

## 🎥 Vídeo Demostrativo - Versión 0.1


<video src="public/videos/videoDemoFase3.mp4" controls style="max-width:100%; height:auto; border:1px solid #ddd; border-radius:8px;"></video>
<p><a href="public/videos/videoDemoFase3.mp4">Abrir video en el navegador</a></p>

**Funcionalidades mostradas por tipo de usuario:**

- **👤 Usuario No Registrado**: Navegación del catálogo, búsqueda, comparación básica y visualización de reseñas
- **🔐 Usuario Registrado**: Creación de listas de favoritos y escritura de reseñas
- **👨‍💼 Administrador**: Gestión completa de palas, tiendas y usuarios desde el panel de administración

---

## 🔮 Próximas Funcionalidades

En las **versiones futuras** se espera implementar:

### Versión 0.2 (Funcionalidades Intermedias)

- 📊 **Historial de precios**: Gráficos de evolución de precios por pala y tienda
- 💾 **Exportación a PDF**: Descarga de comparativas personalizadas
- 🔔 **Sistema de notificaciones**: Avisos de cambios de precio y ofertas
- 📈 **Palas trending**: Visualización de las palas más populares y consultadas
- 🎨 **Mejoras en el comparador**: Comparación de más de 2 palas simultáneamente

### Versión 0.3 (Funcionalidades Avanzadas)

- 🤖 **Recomendación con IA**: Sistema de recomendación inteligente mejorado con Gemini AI
- 🕷️ **Scraping automático**: Actualización automática de precios desde tiendas externas
- 📊 **Panel de estadísticas**: Dashboards para usuarios y administradores
- 🔄 **Recomendación de "próxima pala"**: Sugerencias basadas en la pala actual del usuario
- 📧 **Notificaciones por email**: Sistema de alertas configurable
- 🎯 **Mejoras en el formulario**: Algoritmo de recomendación más preciso

---

## � Índice de Documentación

### 📄 Documentación Principal

1. **🚀 [Ejecución](#ejecución)** - Instrucciones para ejecutar la aplicación
2. **🏗️ Arquitectura** - Consulta el diagrama detallado en `docs/development-guide.md` (sección "Diagrama detallado")
2. **⚙️ [Funcionalidades v0.1](docs/functionalities-v0.1.md)** - Funcionalidades implementadas con capturas
3. **📋 [Funcionalidades Detalladas](docs/functionalities.md)** - Lista completa de funcionalidades (implementadas y pendientes)
4. **🧑‍💻 [Guía de Desarrollo](docs/development-guide.md)** - Documentación técnica completa

### � Documentación del Inicio del Proyecto

5. **🎯 [Objetivos](docs/objectives.md)** - Objetivos funcionales y técnicos
6. **� [Metodología](docs/methodology.md)** - Metodología de desarrollo
7. **� [Análisis](docs/analysis.md)** - Análisis inicial del proyecto
8. **🔄 [Seguimiento](docs/following.md)** - Enlaces a tableros y blog

### 👥 Información del Proyecto

9. **👨‍🎓 [Autores](docs/authors.md)** - Información del equipo y tutores

---

## 🚀 Ejecución

### 📋 Requisitos Previos

Antes de ejecutar la aplicación, asegúrate de tener instalado:

#### Windows / Mac

- **Docker Desktop**: [Descargar Docker Desktop](https://www.docker.com/products/docker-desktop/)
  - Incluye Docker Engine y Docker Compose
  - Sigue las instrucciones de instalación según tu sistema operativo

#### Linux

- **Docker**: [Instalar Docker en Linux](https://docs.docker.com/engine/install/)
- **Docker Compose**: [Instalar Docker Compose](https://docs.docker.com/compose/install/)

### 🐳 Ejecutar la Aplicación con Docker

La aplicación está publicada en **Docker Hub** y se puede ejecutar fácilmente con Docker Compose.

1. **Descargar el archivo docker-compose.yml**:

   ```bash
   curl -O https://raw.githubusercontent.com/codeurjc-students/2025-Smashlyapp/main/docker/docker-compose.yml
   ```

2. **Crear archivo de variables de entorno** (`.env`):

   ```bash
   # Configuración de Supabase (requerido)
   SUPABASE_URL=tu_url_de_supabase
   SUPABASE_ANON_KEY=tu_clave_anonima
   SUPABASE_SERVICE_ROLE_KEY=tu_clave_de_servicio

   # Configuración de JWT
   JWT_SECRET=tu_secreto_jwt

   # API de Gemini (opcional para IA)
   GEMINI_API_KEY=tu_clave_de_gemini

   # Configuración de MySQL (opcional, usa valores por defecto)
   MYSQL_ROOT_PASSWORD=root
   MYSQL_DATABASE=smashly
   MYSQL_USER=smashly
   MYSQL_PASSWORD=smashly
   ```

3. **Iniciar los contenedores**:

   ```bash
   docker-compose up -d
   ```

4. **Acceder a la aplicación**:
   - 🌐 Aplicación Web: [https://localhost](https://localhost)
   - ⚙️ API REST: [https://localhost/api/v1/health](https://localhost/api/v1/health)

### 👤 Credenciales de Acceso

La aplicación incluye datos de ejemplo pre-cargados con las siguientes cuentas:

#### Usuario Administrador

- **Email**: `admin@smashly.com`
- **Contraseña**: `Admin123!`
- **Permisos**: Acceso completo al panel de administración

#### Usuario Registrado

- **Email**: `user@smashly.com`
- **Contraseña**: `User123!`
- **Permisos**: Gestión de perfil, favoritos y reseñas

#### Usuario de Prueba

- **Email**: `test@smashly.com`
- **Contraseña**: `Test123!`
- **Permisos**: Usuario estándar

### 🛑 Detener la Aplicación

```bash
docker-compose down
```

Para eliminar también los volúmenes de datos:

```bash
docker-compose down -v
```

---

## 📄 Licencia

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

---

<div align="center">

**Smashly © 2025** - Trabajo de Fin de Grado  
Ingeniería del Software - Universidad Rey Juan Carlos

</div>
