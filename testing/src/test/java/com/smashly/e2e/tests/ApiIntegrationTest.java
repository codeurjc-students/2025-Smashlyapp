package com.smashly.e2e.tests;

import com.smashly.e2e.config.WebDriverConfig;
import io.restassured.RestAssured;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.*;

import static io.restassured.RestAssured.*;
import static org.hamcrest.Matchers.*;

/**
 * -- API Integration Tests using REST Assured --
 * These tests verify the API endpoints work correctly and return expected data
 */
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@DisplayName("API Integration Tests")
public class ApiIntegrationTest {

    private static String apiUrl;

    /* Configuration of the API to test */
    @BeforeAll
    static void setupClass() {
        apiUrl = WebDriverConfig.getApiUrl();
        RestAssured.baseURI = apiUrl;
        RestAssured.basePath = "/api";

        System.out.println("🔗 API Base URL: " + apiUrl + "/api");
    }

    /* Check API health */
    @Test
    @Order(1)
    @DisplayName("API should be healthy and responsive")
    void apiShouldBeHealthy() {
        System.out.println("🧪 Test: API Health Check...");

        given()
                .when()
                .get("/health")
                .then()
                .statusCode(200)
                .contentType(ContentType.JSON)
                .body("status", equalTo("ok"))
                .body("timestamp", notNullValue())
                .body("uptime", notNullValue());

        System.out.println("✅ API is healthy and responsive");
    }

    /* Check rackets structure */
    @Test
    @Order(2)
    @DisplayName("Should return rackets list with correct structure")
    void shouldReturnRacketsListWithCorrectStructure() {
        System.out.println("🧪 Test: Rackets API structure...");

        given()
                .queryParam("limit", 20)
                .when()
                .get("/rackets")
                .then()
                .statusCode(200)
                .contentType(ContentType.JSON)
                .body("success", equalTo(true))
                .body("data", notNullValue())
                .body("data", hasSize(lessThanOrEqualTo(20)))
                .body("data", hasSize(greaterThan(0)))
                .body("timestamp", notNullValue());

        System.out.println("✅ Rackets API returns correct structure");
    }

    /* Check rackets data fields */
    @Test
    @Order(3)
    @DisplayName("Should return rackets with required fields")
    void shouldReturnRacketsWithRequiredFields() {
        System.out.println("🧪 Test: Racket data fields...");

        given()
                .queryParam("limit", 5)
                .when()
                .get("/rackets")
                .then()
                .statusCode(200)
                .body("data[0].id", notNullValue())
                .body("data[0].nombre", notNullValue())
                .body("data[0].nombre", not(emptyString()))
                .body("data[0].marca", anything())
                .body("data[0].precio_actual", anything())
                .body("data[0].es_bestseller", anything())
                .body("data[0].en_oferta", anything());

        System.out.println("✅ Rackets contain all required fields");
    }

    /* Test search functionality */
    @Test
    @Order(4)
    @DisplayName("Should handle search functionality")
    void shouldHandleSearchFunctionality() {
        System.out.println("🧪 Test: Search functionality...");

        // Test valid search
        given()
                .queryParam("q", "NOX")
                .when()
                .get("/rackets/search")
                .then()
                .statusCode(200)
                .body("success", equalTo(true))
                .body("data", notNullValue());

        // Test invalid search (too short)
        given()
                .queryParam("q", "a")
                .when()
                .get("/rackets/search")
                .then()
                .statusCode(400);

        System.out.println("✅ Search functionality works correctly");
    }

    /* Test filtering functionality */
    @Test
    @Order(5)
    @DisplayName("Should handle filtering functionality")
    void shouldHandleFilteringFunctionality() {
        System.out.println("🧪 Test: Filter functionality...");

        // Test brand filter
        given()
                .queryParam("marca", "BULLPADEL")
                .when()
                .get("/rackets/filter")
                .then()
                .statusCode(200)
                .body("success", equalTo(true))
                .body("data", notNullValue())
                .body("data.data", notNullValue());

        // Test price range filter
        given()
                .queryParam("precio_min", 100)
                .queryParam("precio_max", 200)
                .when()
                .get("/rackets/filter")
                .then()
                .statusCode(200)
                .body("success", equalTo(true));

        System.out.println("✅ Filter functionality works correctly");
    }

    /* Test statistics endpoint */
    @Test
    @Order(6)
    @DisplayName("Should return statistics")
    void shouldReturnStatistics() {
        System.out.println("🧪 Test: Statistics endpoint...");

        given()
                .when()
                .get("/rackets/stats")
                .then()
                .statusCode(200)
                .body("success", equalTo(true))
                .body("data.total", greaterThan(0))
                .body("data.total", lessThanOrEqualTo(1400))
                .body("data.bestsellers", greaterThanOrEqualTo(0))
                .body("data.onSale", greaterThanOrEqualTo(0))
                .body("data.brands", greaterThan(0));

        System.out.println("✅ Statistics endpoint works correctly");
    }
}