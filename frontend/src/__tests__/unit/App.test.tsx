/**
 * PRUEBAS UNITARIAS - CLIENTE
 *
 * Requisitos del TFG:
 * ✅ Prueba de la funcionalidad del componente con un doble de los servicios y un DOM virtual
 *
 * Estas pruebas verifican que el componente App funciona correctamente
 * usando mocks para simular las llamadas a la API.
 */

import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import App from "../../App";

// Mock de fetch para simular respuestas de la API
const mockFetch = vi.fn();
(globalThis as any).fetch = mockFetch;

// Datos mock que simulan la respuesta de la API
const mockRacketsData = {
  success: true,
  data: [
    {
      id: 1,
      nombre: "NOX AT10 GENIUS 18K AGUSTIN TAPIA 2024",
      marca: "NOX",
      precio_actual: 169.95,
      precio_original: 324.95,
      es_bestseller: false,
      en_oferta: true,
      imagen: "https://example.com/image1.jpg",
    },
    {
      id: 2,
      nombre: "BULLPADEL HACK 03 24 - PAQUITO NAVARRO",
      marca: "BULLPADEL",
      precio_actual: 299.95,
      precio_original: 299.95,
      es_bestseller: true,
      en_oferta: false,
      imagen: "https://example.com/image2.jpg",
    },
  ],
  timestamp: new Date().toISOString(),
};

describe("App Component - Unit Tests", () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it("should render loading state initially", () => {
    // Mock que simula una respuesta lenta
    mockFetch.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: () => Promise.resolve(mockRacketsData),
              }),
            100
          )
        )
    );

    render(<App />);

    expect(screen.getByText("Cargando palas...")).toBeInTheDocument();
  });

  it("should display rackets data when API call succeeds", async () => {
    // Mock de respuesta exitosa de la API
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockRacketsData),
    });

    render(<App />);

    // Esperar a que se carguen los datos
    await waitFor(() => {
      expect(
        screen.getByText("Total de palas mostradas: 2")
      ).toBeInTheDocument();
    });

    // Verificar que se muestran las palas
    expect(
      screen.getByText("NOX AT10 GENIUS 18K AGUSTIN TAPIA 2024")
    ).toBeInTheDocument();
    expect(
      screen.getByText("BULLPADEL HACK 03 24 - PAQUITO NAVARRO")
    ).toBeInTheDocument();

    // Verificar que se muestran las marcas (buscar en span específico)
    expect(screen.getByText((content, element) => {
      return element?.tagName === 'SPAN' && content.includes('NOX');
    })).toBeInTheDocument();
    expect(screen.getByText((content, element) => {
      return element?.tagName === 'SPAN' && content.includes('BULLPADEL');
    })).toBeInTheDocument();

    // Verificar que se muestran los precios
    expect(screen.getByText("169.95€", { exact: false })).toBeInTheDocument();
    expect(screen.getByText("299.95€", { exact: false })).toBeInTheDocument();
  });

  it("should display error message when API call fails", async () => {
    // Mock de respuesta de error de la API
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    render(<App />);

    // Esperar a que se muestre el error
    await waitFor(() => {
      expect(screen.getByText(/Error:/)).toBeInTheDocument();
    });

    expect(screen.getByText("Error: Network error")).toBeInTheDocument();
  });

  it("should display error when API returns non-ok status", async () => {
    // Mock de respuesta con status de error
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({}),
    });

    render(<App />);

    // Esperar a que se muestre el error
    await waitFor(() => {
      expect(screen.getByText(/Error.*500/)).toBeInTheDocument();
    });
  });

  it("should display error when API returns invalid format", async () => {
    // Mock de respuesta con formato inválido
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: false, data: null }),
    });

    render(<App />);

    // Esperar a que se muestre el error
    await waitFor(() => {
      expect(
        screen.getByText("Error: Formato de respuesta inválido")
      ).toBeInTheDocument();
    });
  });

  it('should display "No rackets found" when API returns empty array', async () => {
    // Mock de respuesta vacía pero exitosa
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, data: [] }),
    });

    render(<App />);

    // Esperar a que se muestre el mensaje de no datos
    await waitFor(() => {
      expect(screen.getByText("No se encontraron palas.")).toBeInTheDocument();
    });

    expect(screen.getByText("Total de palas mostradas: 0")).toBeInTheDocument();
  });

  it("should limit displayed rackets to maximum 20", async () => {
    // Crear datos mock con más de 20 elementos
    const manyRackets = Array.from({ length: 25 }, (_, index) => ({
      id: index + 1,
      nombre: `Pala ${index + 1}`,
      marca: "Test Brand",
      precio_actual: 100 + index,
      precio_original: 150 + index,
      es_bestseller: false,
      en_oferta: true,
      imagen: `https://example.com/image${index + 1}.jpg`,
    }));

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, data: manyRackets }),
    });

    render(<App />);

    // Esperar a que se carguen los datos
    await waitFor(() => {
      expect(
        screen.getByText("Total de palas mostradas: 20")
      ).toBeInTheDocument();
    });

    // Verificar que solo se muestran 20 elementos
    expect(screen.getByText("Pala 1")).toBeInTheDocument();
    expect(screen.getByText("Pala 20")).toBeInTheDocument();
    expect(screen.queryByText("Pala 21")).not.toBeInTheDocument();
  });

  it("should call API with correct parameters", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockRacketsData),
    });

    render(<App />);

    // Verificar que fetch se llamó con los parámetros correctos
    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:3001/api/rackets?limit=20"
    );
  });
});
