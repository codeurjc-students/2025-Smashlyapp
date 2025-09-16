## ⚙️ Funcionalidades del sistema

Las funcionalidades se clasifican en **Básicas**, **Intermedias** y **Avanzadas**, según el nivel de complejidad y prioridad.

### 🟢 Funcionalidades Básicas
| Funcionalidad                              | Usuario no registrado                             | Usuario registrado               | Administrador                         |
| ------------------------------------------ | ------------------------------------------------- | -------------------------------- | ------------------------------------- |
| **Registro / Login**                       | Registrarse, iniciar sesión, recuperar contraseña | Gestionar su perfil              | Gestión de usuarios (roles, bloqueo)  |
| **Ver catálogo**                           | Sí (leer)                                         | Sí (leer)                        | Sí (leer + gestionar visibilidad)     |
| **Ver página detalle**                     | Sí (leer)                                         | Sí (leer)                        | Sí (leer + editar metadatos)          |
| **Lista de palas favoritas con etiquetas** | —                                                 | Sí (crear/editar/borrar propias) | Ver agregados anonimizados            |
| **Reseñas de usuarios sobre palas**        | Leer reseñas públicas                             | Crear/editar/borrar propias      | Moderación (aprobar, ocultar, banear) |
| **Gestión de palas**                       | —                                                 | —                                | Alta/edición/borrado de palas         |
| **Gestión de tiendas**                     | —                                                 | —                                | Alta/edición/borrado de tiendas       |

### 🟡 Funcionalidades Intermedias
| Funcionalidad                                          | Usuario no registrado         | Usuario registrado                          | Administrador                          |
| ------------------------------------------------------ | ----------------------------- | ------------------------------------------- | -------------------------------------- |
| **Comparar palas**                                     | Comparación básica de 2 palas | Comparación completa + guardar comparativas | Definir reglas, fuentes y pesos        |
| **Ver palas *trending***                               | Sí                            | Personalización según actividad             | Configurar algoritmo/triggers          |
| **Descargar comparativa en PDF**                       | —                             | Sus propias comparativas                    | Plantillas/branding global             |
| **Avisos de bajada/subida de precios**                 | —                             | Suscripción por pala/tienda/umbral          | Configurar umbrales globales y cuotas  |
| **Rellenar datos personales para formulario avanzado** | —                             | Guardar perfil de juego y preferencias      | Ver agregados anonimizados             |
| **Formulario “mejor pala” avanzado**                   | —                             | Versión avanzada con historial              | Definir preguntas, pesos, A/B tests    |
| **Historial de precios por pala (gráfico)**            | Consultar gráfico básico      | Consultar más detalles, exportar datos      | Configurar frecuencia y almacenamiento |
| **Soporte / contacto**                                 | Formulario básico             | Historial de tickets                        | Gestión de soporte                     |


### 🔴 Funcionalidades Avanzadas
| Funcionalidad                                     | Usuario no registrado                           | Usuario registrado                                                | Administrador                                  |
| ------------------------------------------------- | ----------------------------------------------- | ----------------------------------------------------------------- | ---------------------------------------------- |
| **Realizar scraping automático de precios**       | —                                               | —                                                                 | Programar/forzar ejecuciones, logs, reintentos |
| **Recomendar “Próxima pala” en base a la actual** | —                                               | Recomendación personalizada                                       | Ajustar modelos/reglas                         |
| **Panel de estadísticas**                         | —                                               | Consultar sus datos (actividad, favoritos, comparativas)          | Métricas globales, dashboards                  |
| **Sistema de notificaciones (in-app o email)**    | —                                               | Avisos de precios, recordatorios, novedades                       | Configurar plantillas y políticas              |
| **Recomendación de mejor pala mediante IA**       | Formulario básico con recomendaciones generales | Formulario avanzado con recomendaciones precisas y personalizadas | Configurar campos de formularios               |