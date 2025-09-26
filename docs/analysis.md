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

## 📦 Entidades del sistema

A continuación se describen las entidades principales de la aplicación:

| Entidad                               | Descripción                                                                                                                                                                                             |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 🏓 **Palas**                           | Representan cada pala de pádel disponible en el catálogo. Incluyen atributos como nombre, marca, modelo, imagen, características técnicas (peso, balance, forma, materiales, etc.) y precios asociados. |
| 👤 **Usuarios**                        | Gestionados a través del sistema de autenticación. Cada usuario tiene un perfil con datos personales (nombre, email, avatar) y preferencias de juego (nivel, estilo, limitaciones, etc.).               |
| ✍️ **Reviews**                         | Opiniones y valoraciones realizadas por los usuarios sobre las palas. Incluyen puntuación, comentarios y referencia al usuario que la creó.                                                             |
| 🤖 **Recomendaciones** *(en revisión)* | Permite a los usuarios obtener la pala que mejor se adecua a sus características                                                                                                                        |
| ✉️ **Suscriptores newsletter**         | Usuarios que se suscriben para recibir actualizaciones, novedades y promociones. Se almacenan con su email y estado de suscripción.                                                                     |


---

### 🖼️ Imágenes
- **Imágenes de palas**: mostradas en el catálogo, en la página de detalle y en la comparativa.
- **Imágenes gráficas/logos**: logotipo principal de la aplicación en el header y favicon.

---

### 📊 Gráficos
- **Evolución del precio mínimo de cada pala**: gráfico en la página de detalle para mostrar la variación de precios en el tiempo.

---

### 🧩 Tecnología complementaria
- **Soporte por email**: canal de contacto para incidencias o preguntas.
- **Generación de PDFs**: posibilidad de descargar:
  - La página de detalle de una pala.
  - Una comparativa entre palas seleccionadas.
  - El resultado de la recomendación de la mejor pala según la IA.

---

### 🤖 Algoritmos y consultas avanzadas
1. **Recomendación de próxima pala**: algoritmo que sugiere la mejor opción en base a la pala actual y las características del usuario.  
2. **Cálculo del precio mínimo**: algoritmo que determina el precio más bajo de cada pala entre varias tiendas.  
3. **Búsqueda avanzada**: algoritmo de búsqueda que recorre toda la base de datos aplicando filtros de características, materiales, peso, forma, etc.