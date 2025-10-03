import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { vi, afterEach, beforeAll, afterAll } from "vitest";
import { fetch, Headers, Request, Response } from "undici";

// Mock fetch globally for tests
globalThis.fetch = fetch as any;
globalThis.Headers = Headers as any;
globalThis.Request = Request as any;
globalThis.Response = Response as any;

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Limpia después de cada test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Suprime warnings y errors esperados de React durante tests
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = (...args: any[]) => {
    // Silencia warnings de React sobre act()
    if (
      typeof args[0] === "string" &&
      (args[0].includes("Warning: An update to") ||
        args[0].includes("not wrapped in act"))
    ) {
      return;
    }
    // Silencia errors esperados de fetch en tests
    if (
      typeof args[0] === "string" &&
      args[0].includes("Error fetching rackets:")
    ) {
      return;
    }
    originalError.call(console, ...args);
  };

  console.warn = (...args: any[]) => {
    if (typeof args[0] === "string" && args[0].includes("ReactDOM.render")) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});
