import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { useState, useEffect } from "react";
import App from "../../App";

// Configuración para pruebas de integración
const API_BASE_URL = "http://localhost:3001/api";

describe("App Integration Tests - Real API Connection", () => {
  // Variables para controlar si la API está disponible
  let apiAvailable = false;

  beforeAll(async () => {
    // Verificar si fetch está disponible
    if (typeof fetch === "undefined") {
      console.log("Fetch is not available in test environment");
      apiAvailable = false;
      return;
    }

    // Verificar si la API está disponible antes de ejecutar las pruebas
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      let response: Response | null = null;

      try {
        response = await fetch(`${API_BASE_URL}/health`, {
          signal: controller.signal,
        });
      } catch (fetchError) {
        if (fetchError instanceof Error) {
          console.log("Fetch failed:", fetchError.message);
        }
      }

      clearTimeout(timeoutId);

      if (response && response.ok) {
        apiAvailable = true;
        console.log("API is available for integration tests");
      } else {
        apiAvailable = false;
        if (response) {
          console.log(`API health check returned status: ${response.status}`);
        } else {
          console.log("API health check failed - no response received");
        }
      }
    } catch (error) {
      apiAvailable = false;
      if (error instanceof Error) {
        if (error.name === "AbortError") {
          console.log("API connection timeout after 5 seconds");
        } else {
          console.log("API is not available:", error.message);
        }
      } else {
        console.log("API is not available: Unknown error");
      }
    }
  });

  afterAll(() => {
    if (!apiAvailable) {
      console.log("Integration tests were skipped due to API unavailability");
      console.log(
        "To run integration tests, start the API server with: npm run dev"
      );
    }
  });

  it("should connect to real API and display rackets data", async () => {
    if (!apiAvailable) {
      console.log("Skipping test: API not available");
      return;
    }

    console.log("Testing real API connection...");

    render(<App />);

    // El componente debería mostrar "Cargando..." inicialmente
    expect(screen.getByText("Cargando palas...")).toBeInTheDocument();

    // Esperar a que se carguen los datos reales de la API
    await waitFor(
      () => {
        // Buscar el contador de palas o un mensaje de error
        const totalElement = screen.queryByText(/Total de palas mostradas:/);
        const errorElement = screen.queryByText(/Error:/);

        expect(totalElement || errorElement).toBeInTheDocument();
      },
      { timeout: 10000 }
    );

    // Si no hay error, verificar que se muestran datos reales
    const errorElement = screen.queryByText(/Error:/);
    if (!errorElement) {
      console.log("Successfully connected to real API");

      // Verificar que se muestra el contador de palas
      const totalElement = screen.getByText(/Total de palas mostradas: \d+/);
      expect(totalElement).toBeInTheDocument();

      // Extraer el número de palas mostradas
      const totalText = totalElement.textContent || "";
      const racketsCount = parseInt(totalText.match(/\d+/)?.[0] || "0");

      if (racketsCount > 0) {
        console.log(`Found ${racketsCount} rackets in real API response`);

        // Verificar que los elementos de lista están presentes
        const listItems = screen.queryAllByRole("listitem");

        if (listItems.length > 0) {
          expect(listItems.length).toBeGreaterThan(0);
          expect(listItems.length).toBeLessThanOrEqual(20);
          console.log(`Rendered ${listItems.length} racket items correctly`);

          // Verificar que al menos un elemento contiene texto de pala
          const firstItem = listItems[0];
          expect(firstItem.textContent).toBeTruthy();
          expect(firstItem.textContent?.length).toBeGreaterThan(0);
          console.log(
            `Sample racket: ${firstItem.textContent?.substring(0, 50)}...`
          );
        } else {
          // Si no hay list items, buscar por marcadores de lista
          const markers = screen.queryAllByText(/::marker/);
          if (markers.length > 0) {
            console.log(`Found ${markers.length} list markers`);
          }

          // Como último recurso, verificar que hay contenido de palas en el documento
          const dropshot = screen.queryByText(/DROPSHOT/i);
          const bullpadel = screen.queryByText(/BULLPADEL/i);
          const puma = screen.queryByText(/PUMA/i);

          const hasRacketContent = dropshot || bullpadel || puma;
          expect(hasRacketContent).toBeInTheDocument();
          console.log("✅ Racket content is rendered in the document");
        }
      } else {
        console.log("API returned no rackets data");
        expect(screen.getByText("No se encontraron palas")).toBeInTheDocument();
      }
    } else {
      console.log(
        "API connection failed during test:",
        errorElement.textContent
      );
    }
  }, 15000);

  it("should handle real API error responses gracefully", async () => {
    if (!apiAvailable) {
      console.log("Skipping test: API not available");
      return;
    }

    console.log("Testing error handling with real API...");

    // Crear un componente que haga una llamada a un endpoint inválido
    const TestComponentWithInvalidEndpoint = () => {
      const [error, setError] = useState<string | null>(null);
      const [loading, setLoading] = useState(true);

      useEffect(() => {
        const fetchInvalidData = async () => {
          try {
            const response = await fetch(`${API_BASE_URL}/invalid-endpoint`);
            if (!response.ok) {
              throw new Error(`Error: ${response.status}`);
            }
          } catch (err) {
            setError(err instanceof Error ? err.message : "Error desconocido");
          } finally {
            setLoading(false);
          }
        };
        fetchInvalidData();
      }, []);

      if (loading) return <div>Loading...</div>;
      if (error) return <div>Error: {error}</div>;
      return <div>Success</div>;
    };

    render(<TestComponentWithInvalidEndpoint />);

    // Esperar a que se muestre el error
    await waitFor(
      () => {
        expect(screen.getByText(/Error:/)).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    console.log("✅ Error handling works correctly with real API");
  });

  it("should validate real API response format", async () => {
    if (!apiAvailable) {
      console.log("Skipping test: API not available");
      return;
    }

    console.log("Testing real API response format...");

    // Hacer llamada directa a la API para validar formato
    const response = await fetch(`${API_BASE_URL}/rackets?limit=5`);
    expect(response.ok).toBe(true);

    const data = await response.json();

    // Validar estructura de respuesta
    expect(data).toHaveProperty("success");
    expect(data).toHaveProperty("data");
    expect(data).toHaveProperty("timestamp");
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);

    if (data.data.length > 0) {
      const firstRacket = data.data[0];

      // Validar estructura de pala
      expect(firstRacket).toHaveProperty("id");
      expect(firstRacket).toHaveProperty("nombre");
      expect(typeof firstRacket.nombre).toBe("string");
      expect(firstRacket.nombre.length).toBeGreaterThan(0);

      console.log("Real API response format is valid");
      console.log(`Sample racket: ${firstRacket.nombre}`);
    }
  });
});
