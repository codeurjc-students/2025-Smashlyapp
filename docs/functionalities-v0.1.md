# ⚙️ Funcionalidades de la Versión 0.1

Esta sección describe las funcionalidades implementadas en la **versión 0.1** de Smashly, ilustradas con capturas de pantalla y descripciones detalladas.

---

## 📑 Índice de Funcionalidades

1. [Página Principal](#-1-página-principal)
2. [Sistema de Autenticación](#-2-sistema-de-autenticación)
3. [Catálogo de Palas](#-3-catálogo-de-palas)
4. [Detalle de Pala](#-4-detalle-de-pala)
5. [Comparador de Palas](#-5-comparador-de-palas)
6. [Sistema de Reseñas](#-6-sistema-de-reseñas)
7. [Listas de Favoritos](#-7-listas-de-favoritos)
8. [Formulario de Recomendación](#-8-formulario-de-recomendación)
9. [Perfil de Usuario](#-9-perfil-de-usuario)
10. [Sección FAQ](#-10-sección-faq)
11. [Panel de Administración](#-11-panel-de-administración)

---

## 🏠 1. Página Principal

### Descripción
La página principal es el punto de entrada a la aplicación. Presenta una interfaz atractiva y moderna que muestra:
- Banner principal con el logo y eslogan de Smashly
- Acceso directo al catálogo de palas
- Enlaces de navegación a todas las secciones
- Opciones de registro e inicio de sesión

### Captura de Pantalla
![Página Principal](../public/images/readme-images/MAIN-PAGE.png)

### Funcionalidades
- **Navegación intuitiva**: Menú superior con acceso a todas las secciones
- **Diseño responsive**: Adaptado a diferentes tamaños de pantalla
- **Call-to-action**: Botones destacados para explorar el catálogo
- **Acceso rápido**: Links directos a registro y login

### Usuarios que pueden acceder
✅ Usuario no registrado  
✅ Usuario registrado  
✅ Administrador

---

## 🔐 2. Sistema de Autenticación

### Descripción
Sistema completo de gestión de usuarios que permite:
- Registro de nuevos usuarios con validación de datos
- Inicio de sesión seguro con JWT
- Recuperación de contraseña (próximamente)
- Gestión de sesiones

### Capturas de Pantalla

#### Registro
![Página de Registro](../public/images/readme-images/REGISTER-PAGE.png)

El formulario de registro incluye:
- Validación de email único
- Requisitos de contraseña segura
- Confirmación de contraseña
- Términos y condiciones

#### Login
![Página de Login](../public/images/readme-images/LOGIN-PAGE.png)

El formulario de login incluye:
- Autenticación con email y contraseña
- Opción "Recordarme"
- Mensajes de error claros
- Redirección automática tras login exitoso

### Funcionalidades
- **Registro seguro**: Validación de campos y encriptación de contraseñas
- **Autenticación JWT**: Tokens seguros con expiración
- **Gestión de roles**: Diferenciación entre usuario estándar y administrador
- **Protección de rutas**: Middleware de autenticación en backend y frontend

### Usuarios que pueden acceder
✅ Usuario no registrado (solo registro y login)  
✅ Usuario registrado (gestión de perfil)  
✅ Administrador (gestión completa de usuarios)

---

## 📚 3. Catálogo de Palas

### Descripción
Vista principal del catálogo con todas las palas disponibles. Incluye:
- Grid responsive con tarjetas de palas
- Información básica de cada pala (marca, modelo, precio)
- Imágenes de alta calidad
- Filtros y búsqueda avanzada

### Captura de Pantalla
![Catálogo de Palas](../public/images/readme-images/CATALOG-PAGE.png)

### Funcionalidades
- **Búsqueda por texto**: Buscar por marca, modelo o descripción
- **Filtros múltiples**:
  - Por marca (Adidas, Bullpadel, Head, Nox, etc.)
  - Por forma (Redonda, Lágrima, Diamante)
  - Por balance (Bajo, Medio, Alto)
  - Por rango de precio
  - Por nivel de jugador
- **Ordenamiento**: Por precio, popularidad o nombre
- **Paginación**: Navegación eficiente con grandes conjuntos de datos
- **Vista rápida**: Información resumida en cada tarjeta
- **Acceso a detalle**: Click en cualquier pala para ver información completa

### Usuarios que pueden acceder
✅ Usuario no registrado (solo lectura)  
✅ Usuario registrado (lectura + añadir a favoritos)  
✅ Administrador (lectura + gestión)

---

## 🎾 4. Detalle de Pala

### Descripción
Página dedicada con toda la información de una pala específica:
- Imágenes en alta resolución
- Características técnicas completas
- Precios en diferentes tiendas
- Reseñas de usuarios
- Opción de añadir a favoritos

### Captura de Pantalla
![Detalle de Pala](../public/images/readme-images/RACKET-DETAIL-PAGE.png)

### Funcionalidades
- **Información completa**:
  - Marca y modelo
  - Descripción detallada
  - Forma, balance, peso
  - Material del marco y superficie
  - Núcleo y tipo de juego
  - Nivel recomendado
- **Precios comparados**: Listado de precios en diferentes tiendas con enlaces directos
- **Galería de imágenes**: Visualización de múltiples ángulos
- **Reseñas integradas**: Valoraciones y comentarios de otros usuarios
- **Acciones rápidas**:
  - Añadir a lista de favoritos
  - Compartir pala
  - Comparar con otras palas
- **Información de disponibilidad**: Stock y tiendas donde encontrarla

### Usuarios que pueden acceder
✅ Usuario no registrado (solo lectura)  
✅ Usuario registrado (lectura + favoritos + reseñas)  
✅ Administrador (lectura + edición completa)

---

## 📝 5. Sistema de Reseñas

### Descripción
Sistema completo de valoraciones y opiniones de usuarios sobre las palas:
- Calificación con estrellas (1-5)
- Comentarios detallados
- Información del usuario que reseña
- Moderación de contenido

### Funcionalidades
- **Escritura de reseñas** (usuarios registrados):
  - Sistema de estrellas para valoración
  - Campo de texto para comentarios
  - Validación de contenido
  - Una reseña por usuario y pala
- **Lectura de reseñas** (todos):
  - Visualización ordenada por fecha o valoración
  - Promedio de valoraciones
  - Número total de reseñas
  - Filtrado por puntuación
- **Gestión de reseñas propias**:
  - Editar reseña existente
  - Eliminar reseña
- **Moderación** (administradores):
  - Aprobar o rechazar reseñas
  - Ocultar contenido inapropiado
  - Gestionar reportes de usuarios

### Visualización
Las reseñas se muestran en la página de detalle de cada pala, con:
- Avatar del usuario
- Nombre del usuario
- Fecha de publicación
- Valoración con estrellas
- Texto del comentario
- Opciones de edición/eliminación (si es propia)

### Usuarios que pueden acceder
✅ Usuario no registrado (solo lectura)  
✅ Usuario registrado (lectura + escribir/editar propias)  
✅ Administrador (moderación completa)

---

## ⭐ 6. Listas de Favoritos

### Descripción
Sistema de gestión de listas personalizadas de palas favoritas:
- Crear múltiples listas temáticas
- Organizar palas por categorías personalizadas
- Añadir etiquetas y notas
- Compartir listas (próximamente)

### Funcionalidades
- **Creación de listas**:
  - Nombre personalizado
  - Descripción opcional
  - Visibilidad (privada/pública)
- **Gestión de palas en listas**:
  - Añadir palas desde catálogo o detalle
  - Mover palas entre listas
  - Eliminar palas de listas
  - Añadir notas personales a cada pala
- **Organización**:
  - Múltiples listas por usuario
  - Ordenar palas dentro de cada lista
  - Etiquetas personalizadas
- **Visualización**:
  - Vista de grilla o lista
  - Acceso rápido desde perfil de usuario
  - Contadores de palas por lista

### Ejemplo de uso
- Lista "Próxima compra" para palas que consideras adquirir
- Lista "Recomendadas para principiantes" para aconsejar a amigos
- Lista "Favoritas 2025" con tus palas preferidas del año

### Usuarios que pueden acceder
❌ Usuario no registrado  
✅ Usuario registrado (gestión completa de listas propias)  
✅ Administrador (ver estadísticas agregadas)

---

## 👤 7. Perfil de Usuario

### Descripción
Área personal del usuario donde gestiona:
- Información personal
- Listas de favoritos
- Reseñas escritas
- Configuraciones de cuenta
- Historial de actividad

### Funcionalidades
- **Información personal**:
  - Nombre y apellidos
  - Email (no editable)
  - Nivel de juego
  - Años de experiencia
  - Estilo de juego preferido
- **Gestión de listas**:
  - Ver todas las listas creadas
  - Acceso rápido a cada lista
  - Contadores de palas por lista
- **Reseñas**:
  - Historial de reseñas escritas
  - Edición rápida
  - Estadísticas de actividad
- **Configuración**:
  - Cambio de contraseña
  - Preferencias de notificaciones (próximamente)
  - Eliminar cuenta
- **Actividad**:
  - Última sesión
  - Palas vistas recientemente
  - Comparativas guardadas

### Usuarios que pueden acceder
❌ Usuario no registrado  
✅ Usuario registrado (gestión de perfil propio)  
✅ Administrador (vista de todos los usuarios)

---

## ❓ 8. Sección FAQ

### Descripción
Página de preguntas frecuentes con información útil sobre:
- Uso de la aplicación
- Consejos para elegir palas
- Información sobre precios y tiendas
- Políticas de privacidad y términos

### Captura de Pantalla
![Sección FAQ](../public/images/readme-images/FAQ-PAGE.png)

### Funcionalidades
- **Preguntas organizadas por categorías**:
  - Sobre Smashly
  - Uso de la aplicación
  - Palas y características
  - Precios y tiendas
  - Cuenta y privacidad
- **Diseño accordion**:
  - Expandir/contraer preguntas
  - Búsqueda de preguntas
  - Navegación por categorías
- **Contenido actualizado**:
  - Información clara y concisa
  - Enlaces a recursos adicionales
  - Capturas de pantalla explicativas
- **Contacto**:
  - Formulario para preguntas no resueltas
  - Sugerencias de mejora

### Usuarios que pueden acceder
✅ Usuario no registrado  
✅ Usuario registrado  
✅ Administrador

---

## 👨‍💼 9. Panel de Administración

### Descripción
Panel completo de administración con acceso exclusivo para administradores:
- Gestión CRUD de palas
- Gestión de tiendas
- Gestión de usuarios
- Estadísticas y métricas
- Moderación de contenido

### Funcionalidades

#### Gestión de Palas
- **Crear nueva pala**:
  - Formulario completo con todos los campos
  - Validación de datos
  - Subida de imágenes
  - Asignación de precios por tienda
- **Editar pala existente**:
  - Modificación de cualquier campo
  - Actualización de imágenes
  - Cambio de visibilidad
- **Eliminar pala**:
  - Confirmación de eliminación
  - Gestión de referencias (reseñas, listas)
- **Vista de lista**:
  - Todas las palas del sistema
  - Filtros y búsqueda
  - Ordenamiento personalizado
  - Acciones rápidas

#### Gestión de Tiendas
- **Crear tienda**:
  - Nombre, URL, descripción
  - Logo y datos de contacto
- **Editar tienda**:
  - Actualizar información
  - Modificar enlaces
- **Eliminar tienda**:
  - Confirmación
  - Reasignación de precios
- **Ver estadísticas**:
  - Número de palas por tienda
  - Precios promedio
  - Disponibilidad

#### Gestión de Usuarios
- **Lista de usuarios**:
  - Todos los usuarios registrados
  - Filtros por rol
  - Búsqueda por email/nombre
- **Editar usuario**:
  - Cambiar rol (usuario/admin)
  - Bloquear/desbloquear cuenta
  - Ver actividad
- **Ver estadísticas**:
  - Usuarios activos
  - Registros recientes
  - Actividad por usuario

#### Moderación de Contenido
- **Reseñas**:
  - Lista de todas las reseñas
  - Aprobar/rechazar
  - Ocultar contenido inapropiado
  - Gestionar reportes
- **Reportes de usuarios**:
  - Ver reportes de contenido
  - Tomar acciones
  - Historial de moderación

#### Estadísticas Globales
- **Dashboards**:
  - Total de palas, usuarios, reseñas
  - Palas más vistas
  - Usuarios más activos
  - Actividad reciente
- **Gráficos**:
  - Tendencias de uso
  - Registros por período
  - Popularidad de palas

### Usuarios que pueden acceder
❌ Usuario no registrado  
❌ Usuario registrado  
✅ Administrador

---

## 📊 Resumen de Funcionalidades por Tipo de Usuario

### 👤 Usuario No Registrado
- ✅ Ver página principal
- ✅ Explorar catálogo de palas
- ✅ Ver detalle de palas
- ✅ Leer reseñas
- ✅ Comparar palas (básico)
- ✅ Usar formulario de recomendación (básico)
- ✅ Ver sección FAQ
- ✅ Registrarse
- ✅ Iniciar sesión

### 🔐 Usuario Registrado
- ✅ Todas las funcionalidades de usuario no registrado
- ✅ Crear y gestionar listas de favoritos
- ✅ Escribir y editar reseñas propias
- ✅ Guardar comparativas
- ✅ Usar formulario avanzado de recomendación
- ✅ Gestionar perfil personal
- ✅ Ver historial de actividad

### 👨‍💼 Administrador
- ✅ Todas las funcionalidades de usuario registrado
- ✅ Gestión completa de palas (CRUD)
- ✅ Gestión de tiendas (CRUD)
- ✅ Gestión de usuarios
- ✅ Moderación de reseñas
- ✅ Acceso a estadísticas globales
- ✅ Configuración del sistema

---

## 🎯 Próximos Pasos

Las funcionalidades descritas en este documento representan la **versión 0.1** de Smashly. En las próximas versiones se implementarán:

- **v0.2**: Historial de precios, exportación a PDF, notificaciones, trending
- **v0.3**: IA avanzada, scraping automático, dashboards mejorados

Para más información sobre el roadmap completo, consulta el archivo [functionalities.md](functionalities.md).

---
