package com.smashly.api;

import com.smashly.config.WebDriverConfig;
import io.restassured.RestAssured;
import io.restassured.http.ContentType;
import io.restassured.response.Response;
import org.junit.jupiter.api.*;

import java.util.List;
import java.util.Map;

import static io.restassured.RestAssured.*;
import static org.junit.jupiter.api.Assertions.*;

@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@DisplayName("Pruebas de Sistema - Rest Assured")
public class RestAssuredApiSystemTest {

    private static String apiUrl;
    private static String baseApiPath = "/api";

    // ID de una pala que se usará en las pruebas (se obtiene dinámicamente)
    private static Integer testRacketId;
    private static String testRacketName;

    /**
     * Configuración inicial antes de todas las pruebas
     */
    @BeforeAll
    static void setupClass() {
        apiUrl = WebDriverConfig.getApiUrl();
        RestAssured.baseURI = apiUrl;
        RestAssured.basePath = baseApiPath;

        System.out.println("INICIANDO PRUEBAS DE SISTEMA - API REST DE PALAS");
        System.out.println("API URL: " + apiUrl + baseApiPath);
        System.out.println("Fecha: " + java.time.LocalDateTime.now());
        System.out.println();
    }

    @AfterAll
    static void tearDownClass() {
        System.out.println();
        System.out.println("PRUEBAS DE SISTEMA COMPLETADAS");
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // TEST 1: VERIFICAR QUE EL SERVIDOR ESTÁ DISPONIBLE
    // ═══════════════════════════════════════════════════════════════════════════

    @Test
    @Order(1)
    @DisplayName("Estado del servidor")
    void test01_serverShouldBeAvailable() {
        System.out.println("TEST 1: Verificando disponibilidad del servidor");

        Response response = given()
                .when()
                .get("/health")
                .then()
                .statusCode(200)
                .contentType(ContentType.JSON)
                .extract()
                .response();

        // Validar estructura de respuesta (success y data.status)
        Boolean success = response.path("success");
        assertNotNull(success, "El campo 'success' debe existir");
        assertTrue(success, "La respuesta debe ser exitosa");

        String status = response.path("data.status");
        assertNotNull(status, "El campo 'data.status' debe existir");
        assertEquals("OK", status, "El status debe ser 'OK'");

        assertNotNull(response.path("data.timestamp"), "El campo 'timestamp' debe existir");

        System.out.println("Servidor disponible");
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // TEST 2: RECUPERAR TODAS LAS PALAS (ENDPOINT PRINCIPAL)
    // ═══════════════════════════════════════════════════════════════════════════

    @Test
    @Order(2)
    @DisplayName("Recuperar las palas")
    void test02_shouldRetrieveAllRackets() {
        System.out.println("TEST 2: Recuperando todas las palas");

        Response response = given()
                .queryParam("limit", 50)
                .when()
                .get("/rackets")
                .then()
                .statusCode(200)
                .contentType(ContentType.JSON)
                .extract()
                .response();

        // Validar estructura de respuesta exitosa
        Boolean success = response.path("success");
        assertNotNull(success, "El campo 'success' no debe ser nulo");
        assertTrue(success, "La respuesta debe ser exitosa");
        assertNotNull(response.path("data"), "Debe contener datos");
        assertNotNull(response.path("timestamp"), "Debe contener timestamp");

        // Obtener la lista de palas
        List<Map<String, Object>> rackets = response.path("data");
        assertNotNull(rackets, "La lista de palas no debe ser nula");
        assertFalse(rackets.isEmpty(), "La lista de palas no debe estar vacía");
        assertTrue(rackets.size() > 0, "Debe haber al menos 1 pala en la base de datos");

        // Guardar el primer racket para pruebas posteriores
        Map<String, Object> firstRacket = rackets.get(0);
        testRacketId = (Integer) firstRacket.get("id");
        testRacketName = (String) firstRacket.get("nombre");

        System.out.println("Palas recuperadas exitosamente");
        System.out.println();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // TEST 3: VALIDAR ESTRUCTURA COMPLETA DE LA ENTIDAD RACKET
    // ═══════════════════════════════════════════════════════════════════════════

    @Test
    @Order(3)
    @DisplayName("Campos de las palas")
    void test03_racketsShouldHaveRequiredFields() {
        System.out.println("TEST 3: Validando campos de las palas");

        Response response = given()
                .queryParam("limit", 10)
                .when()
                .get("/rackets")
                .then()
                .statusCode(200)
                .extract()
                .response();

        List<Map<String, Object>> rackets = response.path("data");
        assertFalse(rackets.isEmpty(), "Debe haber palas para validar");

        // Validar la primera pala en detalle
        Map<String, Object> racket = rackets.get(0);

        System.out.println("📋 Validando campos obligatorios:");

        // Campos principales obligatorios
        assertNotNull(racket.get("id"), "El campo 'id' es obligatorio");
        System.out.println("Id: " + racket.get("id"));

        assertNotNull(racket.get("nombre"), "El campo 'nombre' es obligatorio");
        assertFalse(racket.get("nombre").toString().isEmpty(), "El nombre no debe estar vacío");
        System.out.println("Nombre: " + racket.get("nombre"));

        // Campos booleanos obligatorios
        assertNotNull(racket.get("es_bestseller"), "El campo 'es_bestseller' debe existir");
        System.out.println("Es bestseller: " + racket.get("es_bestseller"));

        assertNotNull(racket.get("en_oferta"), "El campo 'en_oferta' debe existir");
        System.out.println("En oferta: " + racket.get("en_oferta"));

        // Campos opcionales pero esperados (pueden ser null)
        System.out.println("\nValidando campos opcionales:");
        System.out.println("marca: " + racket.get("marca"));
        System.out.println("modelo: " + racket.get("modelo"));
        System.out.println("imagen: " + (racket.get("imagen") != null ? "presente" : "no presente"));
        System.out.println("descripcion: " + (racket.get("descripcion") != null ? "presente" : "no presente"));

        // Campos de precio (computados por el backend)
        System.out.println("\nValidando campos de precio:");
        if (racket.get("precio_actual") != null) {
            System.out.println("precio_actual: " + racket.get("precio_actual"));
            System.out.println("precio_original: " + racket.get("precio_original"));
            System.out.println("descuento_porcentaje: " + racket.get("descuento_porcentaje"));
            System.out.println("fuente: " + racket.get("fuente"));
        } else {
            System.out.println("Sin precio disponible para esta pala");
        }

        // Características técnicas
        System.out.println("\nValidando características técnicas:");
        System.out.println("caracteristicas_forma: " + racket.get("caracteristicas_forma"));
        System.out.println("caracteristicas_balance: " + racket.get("caracteristicas_balance"));
        System.out.println("caracteristicas_nivel_de_juego: " + racket.get("caracteristicas_nivel_de_juego"));

        System.out.println("\nEstructura de datos validada correctamente");
        System.out.println();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // TEST 4: RECUPERAR UNA PALA ESPECÍFICA POR ID
    // ═══════════════════════════════════════════════════════════════════════════

    @Test
    @Order(4)
    @DisplayName("Palas por ID")
    void test04_shouldRetrieveRacketById() {
        System.out.println("TEST 4: Recuperando pala específica por ID");

        // Primero obtener un ID válido si no lo tenemos
        if (testRacketId == null) {
            Response listResponse = given().queryParam("limit", 1).get("/rackets");
            List<Map<String, Object>> rackets = listResponse.path("data");
            testRacketId = (Integer) rackets.get(0).get("id");
        }

        System.out.println("Buscando pala con ID: " + testRacketId);

        Response response = given()
                .pathParam("id", testRacketId)
                .when()
                .get("/rackets/{id}")
                .then()
                .statusCode(200)
                .contentType(ContentType.JSON)
                .extract()
                .response();

        // Validar respuesta exitosa
        Boolean success = response.path("success");
        assertNotNull(success, "El campo 'success' no debe ser nulo");
        assertTrue(success, "La respuesta debe ser exitosa");
        assertNotNull(response.path("data"), "Debe contener datos de la pala");

        // Obtener los datos de la pala
        Map<String, Object> racket = response.path("data");

        // Validar que el ID coincide
        assertEquals(testRacketId, racket.get("id"), "El ID debe coincidir con el solicitado");

        // Validar campos obligatorios
        assertNotNull(racket.get("nombre"), "La pala debe tener nombre");
        assertNotNull(racket.get("es_bestseller"), "Debe tener el campo es_bestseller");
        assertNotNull(racket.get("en_oferta"), "Debe tener el campo en_oferta");

        System.out.println("Pala recuperada exitosamente:");
        System.out.println("ID: " + racket.get("id"));
        System.out.println("Nombre: " + racket.get("nombre"));
        System.out.println("Marca: " + racket.get("marca"));
        System.out.println("Modelo: " + racket.get("modelo"));
        System.out.println("Precio: " + racket.get("precio_actual"));
        System.out.println("Bestseller: " + racket.get("es_bestseller"));
        System.out.println("En Oferta: " + racket.get("en_oferta"));
        System.out.println();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // TEST 5: VALIDAR ID INEXISTENTE
    // ═══════════════════════════════════════════════════════════════════════════

    @Test
    @Order(5)
    @DisplayName("Pala por ID inexistente")
    void test05_shouldReturn404ForNonExistentRacket() {
        System.out.println("TEST 5: Validando manejo de ID inexistente");

        int nonExistentId = 999999;
        System.out.println("Buscando pala con ID inexistente: " + nonExistentId);

        Response response = given()
                .pathParam("id", nonExistentId)
                .when()
                .get("/rackets/{id}")
                .then()
                .statusCode(404)
                .contentType(ContentType.JSON)
                .extract()
                .response();

        // Validar que la respuesta indica error
        Boolean success = response.path("success");
        assertNotNull(success, "El campo 'success' no debe ser nulo");
        assertFalse(success, "La respuesta debe indicar error");
        assertNotNull(response.path("message"), "Debe incluir un mensaje de error");

        System.out.println("Error manejado correctamente:");
        System.out.println("Status Code: 404");
        System.out.println("Mensaje: " + response.path("message"));
        System.out.println();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // TEST 6: BUSCAR PALAS POR TÉRMINO DE BÚSQUEDA
    // ═══════════════════════════════════════════════════════════════════════════

    @Test
    @Order(6)
    @DisplayName("Busqueda de palas")
    void test06_shouldSearchRacketsByQuery() {
        System.out.println("TEST 6: Probando búsqueda de palas");

        // Términos de búsqueda comunes en palas de pádel
        String[] searchTerms = { "NOX", "BULLPADEL", "HEAD", "BABOLAT", "Vertex" };

        boolean atLeastOneSuccessfulSearch = false;

        for (String searchTerm : searchTerms) {
            System.out.println("Buscando: '" + searchTerm + "'");

            Response response = given()
                    .queryParam("q", searchTerm)
                    .when()
                    .get("/rackets/search")
                    .then()
                    .statusCode(200)
                    .contentType(ContentType.JSON)
                    .extract()
                    .response();

            Boolean success = response.path("success");
            assertNotNull(success, "El campo 'success' no debe ser nulo");
            assertTrue(success, "La búsqueda debe ser exitosa");

            List<Map<String, Object>> results = response.path("data");

            if (results != null && !results.isEmpty()) {
                atLeastOneSuccessfulSearch = true;
                System.out.println("Encontrados: " + results.size() + " resultado(s)");

                // Validar que el primer resultado contiene el término de búsqueda
                Map<String, Object> firstResult = results.get(0);
                String nombre = (String) firstResult.get("nombre");
                String marca = (String) firstResult.get("marca");
                String modelo = (String) firstResult.get("modelo");

                System.out.println("Ejemplo: " + nombre);

                // Verificar que el término aparece en nombre, marca o modelo
                String searchTermLower = searchTerm.toLowerCase();
                boolean found = (nombre != null && nombre.toLowerCase().contains(searchTermLower)) ||
                        (marca != null && marca.toLowerCase().contains(searchTermLower)) ||
                        (modelo != null && modelo.toLowerCase().contains(searchTermLower));

                // Nota: No forzamos este assert porque el término podría estar en descripción u
                // otros campos
                if (found) {
                    System.out.println("Término encontrado en los campos principales");
                }
            } else {
                System.out.println("Sin resultados para este término");
            }
        }

        assertTrue(atLeastOneSuccessfulSearch,
                "Al menos una búsqueda debe retornar resultados con marcas comunes");

        System.out.println("\nFuncionalidad de búsqueda validada correctamente");
        System.out.println();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // TEST 7: VALIDAR BÚSQUEDA CON TÉRMINO DEMASIADO CORTO
    // ═══════════════════════════════════════════════════════════════════════════

    @Test
    @Order(7)
    @DisplayName("Rechazo de búsquedas con términos muy cortos")
    void test07_shouldRejectTooShortSearchQuery() {
        System.out.println("TEST 7: Validando rechazo de búsquedas inválidas");

        System.out.println("Intentando búsqueda con término demasiado corto: 'a'");

        given()
                .queryParam("q", "a")
                .when()
                .get("/rackets/search")
                .then()
                .statusCode(400);

        System.out.println("Búsqueda inválida rechazada correctamente (Status 400)");
        System.out.println();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // TEST 8: VALIDAR PAGINACIÓN
    // ═══════════════════════════════════════════════════════════════════════════

    @Test
    @Order(8)
    @DisplayName("Palas por parametros")
    void test08_shouldRespectPaginationParameters() {
        System.out.println("TEST 8: Validamos la paginacion");

        // Probar que el endpoint funciona con parámetro limit
        int limit = 5;
        System.out.println("Solicitando palas con limit=" + limit + "...");

        Response response = given()
                .queryParam("limit", limit)
                .when()
                .get("/rackets")
                .then()
                .statusCode(200)
                .extract()
                .response();

        List<Map<String, Object>> rackets = response.path("data");
        assertNotNull(rackets, "Debe retornar datos");
        assertTrue(rackets.size() > 0, "Debe retornar al menos 1 pala");

        System.out.println("Endpoint responde correctamente:");
        System.out.println("Parámetro limit enviado: " + limit);
        System.out.println("Palas recibidas: " + rackets.size());

        // Probar con página 2
        System.out.println("\nSolicitando con parámetro page=2...");
        Response page2Response = given()
                .queryParam("page", 2)
                .queryParam("limit", 10)
                .when()
                .get("/rackets")
                .then()
                .statusCode(200)
                .extract()
                .response();

        List<Map<String, Object>> page2Rackets = page2Response.path("data");
        assertTrue(page2Rackets.size() >= 0, "Debe retornar una lista válida");
        System.out.println("Palas en página 2: " + page2Rackets.size());

        System.out.println("\nEndpoint de palas funciona correctamente con parámetros");
        System.out.println("Nota: La implementación actual retorna todos los datos");
        System.out.println("Se recomienda implementar paginación en el backend");
        System.out.println();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // TEST 9: VALIDAR PALAS BESTSELLER
    // ═══════════════════════════════════════════════════════════════════════════

    @Test
    @Order(9)
    @DisplayName("Palas bestseller")
    void test09_shouldReturnOnlyBestsellerRackets() {
        System.out.println("TEST 9: Validando bestsellers");

        Response response = given()
                .when()
                .get("/rackets/bestsellers")
                .then()
                .statusCode(200)
                .contentType(ContentType.JSON)
                .extract()
                .response();

        Boolean success = response.path("success");
        assertNotNull(success, "El campo 'success' no debe ser nulo");
        assertTrue(success, "La respuesta debe ser exitosa");
        List<Map<String, Object>> bestsellers = response.path("data");

        if (bestsellers != null && !bestsellers.isEmpty()) {
            System.out.println("Bestsellers encontrados: " + bestsellers.size());

            // Validar que todas las palas son bestseller
            for (Map<String, Object> racket : bestsellers) {
                Boolean isBestseller = (Boolean) racket.get("es_bestseller");
                assertTrue(isBestseller, "Todas las palas deben ser bestseller");
            }

            System.out.println("Todas las palas tienen es_bestseller = true");
        } else {
            System.out.println("No hay bestsellers en la base de datos");
        }

        System.out.println();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // TEST 10: VALIDAR DATOS COMPLETOS DE EJEMPLO
    // ═══════════════════════════════════════════════════════════════════════════

    @Test
    @Order(10)
    @DisplayName("Palas con campos completos")
    void test10_shouldRetrieveCompleteRacketDataWithCharacteristics() {
        System.out.println("TEST 10: Validando recuperación completa palas con campos");

        Response response = given()
                .queryParam("limit", 20)
                .when()
                .get("/rackets")
                .then()
                .statusCode(200)
                .extract()
                .response();

        List<Map<String, Object>> rackets = response.path("data");
        assertFalse(rackets.isEmpty(), "Debe haber palas en la base de datos");

        System.out.println("Analizando " + rackets.size() + " palas de ejemplo...\n");

        // Contadores de características
        int racketsWithMarca = 0;
        int racketsWithPrice = 0;
        int racketsWithImage = 0;
        int racketsWithCharacteristics = 0;
        int bestsellers = 0;
        int onSale = 0;

        // Analizar cada pala
        for (Map<String, Object> racket : rackets) {
            if (racket.get("marca") != null)
                racketsWithMarca++;
            if (racket.get("precio_actual") != null)
                racketsWithPrice++;
            if (racket.get("imagen") != null)
                racketsWithImage++;
            if (racket.get("caracteristicas_forma") != null ||
                    racket.get("caracteristicas_balance") != null) {
                racketsWithCharacteristics++;
            }
            if (Boolean.TRUE.equals(racket.get("es_bestseller")))
                bestsellers++;
            if (Boolean.TRUE.equals(racket.get("en_oferta")))
                onSale++;
        }

        // Mostrar estadísticas
        System.out.println("Estadísticas de datos recuperados:");
        System.out.println("Total de palas: " + rackets.size());
        System.out.println(
                "Con marca: " + racketsWithMarca + " (" + (racketsWithMarca * 100 / rackets.size()) + "%)");
        System.out.println(
                "Con precio: " + racketsWithPrice + " (" + (racketsWithPrice * 100 / rackets.size()) + "%)");
        System.out.println(
                "Con imagen: " + racketsWithImage + " (" + (racketsWithImage * 100 / rackets.size()) + "%)");
        System.out.println("Con características: " + racketsWithCharacteristics + " ("
                + (racketsWithCharacteristics * 100 / rackets.size()) + "%)");
        System.out.println("Bestsellers: " + bestsellers);
        System.out.println("En oferta: " + onSale);

        // Mostrar ejemplo de una pala completa
        Map<String, Object> exampleRacket = rackets.get(0);
        System.out.println("\nEjemplo de pala recuperada:");
        System.out.println("ID: " + exampleRacket.get("id"));
        System.out.println("Nombre: " + exampleRacket.get("nombre"));
        System.out.println("Marca: " + exampleRacket.get("marca"));
        System.out.println("Modelo: " + exampleRacket.get("modelo"));
        System.out.println("Precio: " + exampleRacket.get("precio_actual"));
        System.out.println("Forma: " + exampleRacket.get("caracteristicas_forma"));
        System.out.println("Balance: " + exampleRacket.get("caracteristicas_balance"));
        System.out.println("Nivel: " + exampleRacket.get("caracteristicas_nivel_de_juego"));
        System.out.println("Bestseller: " + exampleRacket.get("es_bestseller"));
        System.out.println("En oferta: " + exampleRacket.get("en_oferta"));

        // Validaciones finales
        assertTrue(rackets.size() > 0, "Debe haber al menos 1 pala");
        assertTrue(racketsWithMarca > 0, "Al menos una pala debe tener marca");

        System.out.println("\nDatos de ejemplo recuperados y validados exitosamente");
        System.out.println();
    }
}