import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import "@testing-library/jest-dom";
import App from "../App";

// Mock de fetch
globalThis.fetch = vi.fn();

describe("App Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("muestra el estado de carga inicialmente", () => {
    (globalThis.fetch as any).mockImplementation(
      () => new Promise(() => {}) // Promise que nunca se resuelve para mantener loading
    );

    render(<App />);
    expect(screen.getByText("Cargando palas...")).toBeInTheDocument();
  });

  it("muestra las palas correctamente cuando la API responde con éxito", async () => {
    const mockRackets = [
      { id: "1", nombre: "Pala Test 1", marca: "Marca A", precio_actual: 100 },
      { id: "2", nombre: "Pala Test 2", marca: "Marca B", precio_actual: 150 },
    ];

    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockRackets }),
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.queryByText("Cargando palas...")).not.toBeInTheDocument();
    });

    expect(
      screen.getByText("Smashly - Catálogo de Palas de Pádel")
    ).toBeInTheDocument();
    expect(screen.getByText("Pala Test 1")).toBeInTheDocument();
    expect(screen.getByText(/Marca A/)).toBeInTheDocument();
    expect(screen.getByText(/100€/)).toBeInTheDocument();

    expect(screen.getByText("Pala Test 2")).toBeInTheDocument();
    expect(screen.getByText(/Marca B/)).toBeInTheDocument();
    expect(screen.getByText(/150€/)).toBeInTheDocument();

    expect(screen.getByText("Total de palas mostradas: 2")).toBeInTheDocument();
  });

  it("limita los resultados a 20 palas máximo", async () => {
    const mockRackets = Array.from({ length: 30 }, (_, i) => ({
      id: `${i + 1}`,
      nombre: `Pala ${i + 1}`,
      marca: "Marca",
      precio_actual: 100,
    }));

    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockRackets }),
    });

    render(<App />);

    await waitFor(() => {
      expect(
        screen.getByText("Total de palas mostradas: 20")
      ).toBeInTheDocument();
    });
  });

  it("muestra error cuando la API responde con error", async () => {
    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("Error: Error: 500")).toBeInTheDocument();
    });
  });

  it("muestra error cuando el formato de respuesta es inválido", async () => {
    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: false }),
    });

    render(<App />);

    await waitFor(() => {
      expect(
        screen.getByText("Error: Formato de respuesta inválido")
      ).toBeInTheDocument();
    });
  });

  it("muestra error cuando data no es un array", async () => {
    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: "not an array" }),
    });

    render(<App />);

    await waitFor(() => {
      expect(
        screen.getByText("Error: Formato de respuesta inválido")
      ).toBeInTheDocument();
    });
  });

  it("muestra error cuando fetch lanza una excepción", async () => {
    (globalThis.fetch as any).mockRejectedValueOnce(new Error("Network error"));

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("Error: Network error")).toBeInTheDocument();
    });
  });

  it("muestra error desconocido cuando la excepción no es de tipo Error", async () => {
    (globalThis.fetch as any).mockRejectedValueOnce("String error");

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("Error: Error desconocido")).toBeInTheDocument();
    });
  });

  it("muestra mensaje cuando no hay palas disponibles", async () => {
    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: [] }),
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("No se encontraron palas.")).toBeInTheDocument();
    });

    expect(screen.getByText("Total de palas mostradas: 0")).toBeInTheDocument();
  });

  it("muestra palas sin marca ni precio", async () => {
    const mockRackets = [{ id: "1", nombre: "Pala Sin Datos" }];

    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockRackets }),
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("Pala Sin Datos")).toBeInTheDocument();
    });

    expect(screen.queryByText(/€/)).not.toBeInTheDocument();
  });

  it("usa index como key cuando no hay id", async () => {
    const mockRackets = [{ nombre: "Pala Sin ID" }];

    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockRackets }),
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("Pala Sin ID")).toBeInTheDocument();
    });
  });

  it("llama a console.error cuando hay un error", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const error = new Error("Test error");

    (globalThis.fetch as any).mockRejectedValueOnce(error);

    render(<App />);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error fetching rackets:",
        error
      );
    });

    consoleErrorSpy.mockRestore();
  });

  it("muestra palas con precio pero sin marca", async () => {
    const mockRackets = [
      { id: "1", nombre: "Pala Solo Precio", precio_actual: 200 },
    ];

    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockRackets }),
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("Pala Solo Precio")).toBeInTheDocument();
    });

    expect(screen.getByText(/200€/)).toBeInTheDocument();
  });

  it("muestra palas con marca pero sin precio", async () => {
    const mockRackets = [
      { id: "1", nombre: "Pala Solo Marca", marca: "Marca Test" },
    ];

    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockRackets }),
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("Pala Solo Marca")).toBeInTheDocument();
    });

    expect(screen.getByText(/Marca Test/)).toBeInTheDocument();
    expect(screen.queryByText(/€/)).not.toBeInTheDocument();
  });
});
