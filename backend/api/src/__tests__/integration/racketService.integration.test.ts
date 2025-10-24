import request from "supertest";
import app from "../../app";
import { RacketService } from "../../services/racketService";

/**
 * PRUEBAS DE INTEGRACIÓN - SERVIDOR
 *
 * Requisitos a verificar:
 * Prueba de la funcionalidad de los servicios usando la base de datos real
 */

describe("RacketService - Integration Tests (with Real DB)", () => {
  // Skip integration tests if no test database is configured
  const hasTestDB =
    process.env.SUPABASE_TEST_URL || process.env.NODE_ENV === "test";

  beforeAll(() => {
    if (!hasTestDB) {
      console.warn("Skipping integration tests: No test database configured");
    }
  });

  describe("Real Database Integration", () => {
    (hasTestDB ? test : test.skip)(
      "should connect to real database and fetch rackets",
      async () => {
        console.log("Testing real database connection...");

        try {
          const rackets = await RacketService.getAllRackets();

          expect(Array.isArray(rackets)).toBe(true);
          console.log(
            `Successfully fetched ${rackets.length} rackets from real database`
          );

          if (rackets.length > 0) {
            // Verify real data structure
            const firstRacket = rackets[0];
            expect(firstRacket).toHaveProperty("id");
            expect(firstRacket).toHaveProperty("nombre");
            expect(typeof firstRacket.nombre).toBe("string");
            expect(firstRacket.nombre.length).toBeGreaterThan(0);
          }
        } catch (error) {
          console.error("Database integration test failed:", error);
          throw error;
        }
      }
    );

    (hasTestDB ? test : test.skip)(
      "should perform real search operations",
      async () => {
        console.log("Testing real search functionality...");

        try {
          // Test search with common brand
          const searchResults = await RacketService.searchRackets("NOX");

          expect(Array.isArray(searchResults)).toBe(true);
          console.log(
            `Search returned ${searchResults.length} results for 'NOX'`
          );

          // Verify search results contain the search term
          searchResults.forEach((racket) => {
            const searchTerm = "NOX";
            const found =
              racket.nombre.toUpperCase().includes(searchTerm) ||
              (racket.marca &&
                racket.marca.toUpperCase().includes(searchTerm)) ||
              (racket.modelo &&
                racket.modelo.toUpperCase().includes(searchTerm));
            expect(found).toBe(true);
          });
        } catch (error) {
          console.error("Search integration test failed:", error);
          throw error;
        }
      }
    );

    (hasTestDB ? test : test.skip)(
      "should perform real filtering operations",
      async () => {
        console.log("Testing real filter functionality...");

        try {
          // Test brand filter
          const brandResults = await RacketService.getFilteredRackets(
            { marca: "BULLPADEL" },
            undefined,
            0,
            10
          );

          expect(brandResults).toHaveProperty("data");
          expect(brandResults).toHaveProperty("pagination");
          expect(Array.isArray(brandResults.data)).toBe(true);

          console.log(
            `Brand filter returned ${brandResults.data.length} results for 'BULLPADEL'`
          );

          // Verify all results match the brand filter
          brandResults.data.forEach((racket) => {
            expect(racket.marca).toBe("BULLPADEL");
          });
        } catch (error) {
          console.error("Filter integration test failed:", error);
          throw error;
        }
      }
    );

    (hasTestDB ? test : test.skip)("should get real statistics", async () => {
      console.log("Testing real statistics functionality...");

      try {
        const stats = await RacketService.getStats();

        expect(stats).toHaveProperty("total");
        expect(stats).toHaveProperty("bestsellers");
        expect(stats).toHaveProperty("onSale");
        expect(stats).toHaveProperty("brands");

        expect(typeof stats.total).toBe("number");
        expect(typeof stats.bestsellers).toBe("number");
        expect(typeof stats.onSale).toBe("number");
        expect(typeof stats.brands).toBe("number");

        expect(stats.total).toBeGreaterThanOrEqual(0);
        expect(stats.bestsellers).toBeGreaterThanOrEqual(0);
        expect(stats.onSale).toBeGreaterThanOrEqual(0);
        expect(stats.brands).toBeGreaterThanOrEqual(0);

        console.log(
          `Statistics: ${stats.total} total, ${stats.bestsellers} bestsellers, ${stats.onSale} on sale, ${stats.brands} brands`
        );
      } catch (error) {
        console.error("Statistics integration test failed:", error);
        throw error;
      }
    });

    (hasTestDB ? test : test.skip)(
      "should handle pagination correctly with real data",
      async () => {
        console.log("Testing real pagination functionality...");

        try {
          const page1 = await RacketService.getRacketsWithPagination(0, 5);
          const page2 = await RacketService.getRacketsWithPagination(1, 5);

          expect(page1).toHaveProperty("data");
          expect(page1).toHaveProperty("pagination");
          expect(page2).toHaveProperty("data");
          expect(page2).toHaveProperty("pagination");

          expect(page1.pagination.page).toBe(0);
          expect(page2.pagination.page).toBe(1);
          expect(page1.pagination.limit).toBe(5);
          expect(page2.pagination.limit).toBe(5);

          // Verify pagination metadata is consistent
          expect(page1.pagination.total).toBeGreaterThan(0);
          expect(page2.pagination.total).toBe(page1.pagination.total);
          expect(page1.pagination.totalPages).toBeGreaterThan(0);
          expect(page2.pagination.totalPages).toBe(page1.pagination.totalPages);

          // If there's enough data, pages should have data
          if (page1.pagination.total > 5) {
            expect(page1.data.length).toBeGreaterThan(0);
            expect(page1.data.length).toBeLessThanOrEqual(5);

            if (page1.pagination.total > 10) {
              expect(page2.data.length).toBeGreaterThan(0);
              expect(page2.data.length).toBeLessThanOrEqual(5);
            }
          }

          console.log(
            `Pagination working: Page 1 has ${page1.data.length} items, Page 2 has ${page2.data.length} items, Total: ${page1.pagination.total}`
          );
        } catch (error) {
          console.error("Pagination integration test failed:", error);
          throw error;
        }
      }
    );
  });

  describe("API Endpoints Integration", () => {
    (hasTestDB ? test : test.skip)(
      "should handle full API workflow",
      async () => {
        console.log("Testing full API integration workflow...");

        // Test health endpoint
        const healthResponse = await request(app)
          .get("/api/v1/health")
          .expect(200);

        // FIX: Check for the 'status' property inside the 'data' object and expect 'OK' in uppercase.
        expect(healthResponse.body.data).toHaveProperty("status", "OK");

        // Test rackets list endpoint
        const racketsResponse = await request(app)
          .get("/api/v1/rackets?limit=10")
          .expect(200);

        expect(racketsResponse.body).toHaveProperty("success", true);
        expect(racketsResponse.body).toHaveProperty("data");
        expect(Array.isArray(racketsResponse.body.data)).toBe(true);

        // Test search endpoint if we have data
        if (racketsResponse.body.data.length > 0) {
          const searchResponse = await request(app)
            .get("/api/v1/rackets/search?q=NOX")
            .expect(200);

          expect(searchResponse.body).toHaveProperty("success", true);
          expect(Array.isArray(searchResponse.body.data)).toBe(true);
        }

        // Test stats endpoint
        const statsResponse = await request(app)
          .get("/api/v1/rackets/stats")
          .expect(200);

        expect(statsResponse.body).toHaveProperty("success", true);
        expect(statsResponse.body.data).toHaveProperty("total");

        console.log("Full API integration workflow completed successfully");
      }
    );

    (hasTestDB ? test : test.skip)(
      "should handle error cases properly",
      async () => {
        console.log("Testing API error handling...");

        // Test invalid search query
        await request(app).get("/api/v1/rackets/search?q=a").expect(400);

        // Test invalid racket ID
        await request(app).get("/api/v1/rackets/invalid-id").expect(400);

        // Test non-existent racket
        await request(app).get("/api/v1/rackets/999999").expect(404);

        console.log("Error handling integration tests passed");
      }
    );
  });
});
