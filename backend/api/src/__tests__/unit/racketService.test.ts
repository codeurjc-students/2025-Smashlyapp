import {
  calculateBestPrice,
  processRacketData,
  mapToFrontendFormat,
  RacketService,
} from "../../../src/services/racketService";
import { supabase } from "../../../src/config/supabase";

jest.mock("../../../src/config/supabase", () => ({
  supabase: {
    from: jest.fn(),
  },
}));

const baseRacketRow = () => ({
  id: 1,
  name: "Adidas Pro",
  brand: "Adidas",
  model: "Pro",
  image: "img.jpg",
  description: "desc",
  on_offer: false,
  created_at: "2025-01-01T00:00:00.000Z",
  updated_at: "2025-01-02T00:00:00.000Z",
  // store price fields
  padelnuestro_actual_price: null,
  padelnuestro_original_price: null,
  padelnuestro_discount_percentage: 0,
  padelnuestro_link: "",
  padelmarket_actual_price: null,
  padelmarket_original_price: null,
  padelmarket_discount_percentage: 0,
  padelmarket_link: "",
  padelproshop_actual_price: null,
  padelproshop_original_price: null,
  padelproshop_discount_percentage: 0,
  padelproshop_link: "",
});

describe("racketService helpers", () => {
  it("calculateBestPrice returns defaults when no valid prices", () => {
    const racket = baseRacketRow();
    const result = calculateBestPrice(racket as any);
    expect(result).toEqual({
      precio_actual: 0,
      precio_original: null,
      descuento_porcentaje: 0,
      enlace: "",
      fuente: "No price available",
    });
  });

  it("calculateBestPrice picks lowest current price across stores", () => {
    const racket = {
      ...baseRacketRow(),
      padelnuestro_actual_price: 120,
      padelnuestro_original_price: 150,
      padelnuestro_discount_percentage: 20,
      padelnuestro_link: "pn",
      padelmarket_actual_price: 99,
      padelmarket_original_price: 130,
      padelmarket_discount_percentage: 24,
      padelmarket_link: "pm",
    };
    const result = calculateBestPrice(racket as any);
    expect(result.precio_actual).toBe(99);
    expect(result.precio_original).toBe(130);
    expect(result.descuento_porcentaje).toBe(24);
    expect(result.enlace).toBe("pm");
    expect(result.fuente).toBe("padelmarket");
  });

  it("processRacketData attaches computed best price and scrape timestamp", () => {
    const raw = [
      {
        ...baseRacketRow(),
        scraped_at: "2025-01-03T00:00:00.000Z",
        padelnuestro_actual_price: 200,
        padelmarket_actual_price: 180,
      },
    ];
    const [processed] = processRacketData(raw as any);
    const p: any = processed;
    expect(p.precio_actual).toBe(180);
    expect(p.fuente).toBe("padelmarket");
    expect(p.scrapeado_en).toBe("2025-01-03T00:00:00.000Z");
  });

  it("mapToFrontendFormat maps core fields and computed prices", () => {
    const withComputed = {
      ...baseRacketRow(),
      precio_actual: 180,
      precio_original: 200,
      descuento_porcentaje: 10,
      enlace: "pm",
      fuente: "padelmarket",
    };
    const mapped = mapToFrontendFormat(withComputed as any);
    expect(mapped.nombre).toBe("Adidas Pro");
    expect(mapped.marca).toBe("Adidas");
    expect(mapped.modelo).toBe("Pro");
    expect(mapped.imagen).toBe("img.jpg");
    expect(mapped.en_oferta).toBe(false);
    expect(mapped.precio_actual).toBe(180);
    expect(mapped.fuente).toBe("padelmarket");
  });
});

describe("RacketService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("getAllRackets returns mapped data without extra pagination", async () => {
    const rows = [
      { ...baseRacketRow(), padelmarket_actual_price: 100 },
      { ...baseRacketRow(), id: 2, name: "Bullpadel X", brand: "Bullpadel", padelmarket_actual_price: 150 },
    ];
    (supabase.from as jest.Mock).mockImplementation(() => ({
      select: () => ({
        range: () => ({
          order: () => Promise.resolve({ data: rows, error: null, count: rows.length }),
        }),
        order: () => ({
          range: () => Promise.resolve({ data: rows, error: null, count: rows.length }),
        }),
      }),
    }));

    const result: any = await RacketService.getAllRackets();
    expect(result.length).toBe(2);
    expect(result[0].nombre).toBe("Adidas Pro");
    expect(result[1].marca).toBe("Bullpadel");
  });

  it("getRacketsWithPagination returns paginated response", async () => {
    const rows = [
      { ...baseRacketRow(), padelmarket_actual_price: 100 },
      { ...baseRacketRow(), id: 2, name: "Bullpadel X", brand: "Bullpadel", padelmarket_actual_price: 150 },
    ];
    (supabase.from as jest.Mock).mockImplementation(() => ({
      select: () => ({
        order: () => ({
          range: () => Promise.resolve({ data: rows, error: null, count: 2 }),
        }),
      }),
    }));

    const result: any = await RacketService.getRacketsWithPagination(0, 2);
    expect(result.data.length).toBe(2);
    expect(result.pagination.total).toBe(2);
    expect(result.pagination.hasNext).toBe(false);
    expect(result.pagination.hasPrev).toBe(false);
  });

  it("getRacketById returns null on PGRST116", async () => {
    (supabase.from as jest.Mock).mockImplementation(() => ({
      select: () => ({
        eq: () => ({ single: jest.fn().mockResolvedValue({ error: { code: "PGRST116", message: "no rows" } }) }),
      }),
    }));

    const result = await RacketService.getRacketById(999);
    expect(result).toBeNull();
  });

  it("getRacketById returns mapped item when found", async () => {
    const row = { ...baseRacketRow(), padelmarket_actual_price: 120 };
    (supabase.from as jest.Mock).mockImplementation(() => ({
      select: () => ({
        eq: () => ({ single: jest.fn().mockResolvedValue({ data: row, error: null }) }),
      }),
    }));

    const result: any = await RacketService.getRacketById(1);
    expect(result?.nombre).toBe("Adidas Pro");
    expect(result?.precio_actual).toBe(120);
  });

  it("searchRackets maps results", async () => {
    const rows = [
      { ...baseRacketRow(), name: "Adidas Alpha" },
      { ...baseRacketRow(), id: 2, name: "Alpha Plus" },
    ];
    (supabase.from as jest.Mock).mockImplementation(() => ({
      select: () => ({
        or: () => ({
          order: () => ({
            limit: () => Promise.resolve({ data: rows, error: null }),
          }),
        }),
      }),
    }));

    const result: any = await RacketService.searchRackets("Alpha");
    expect(result.length).toBe(2);
    expect(result[0].nombre).toContain("Adidas");
  });

  it("getFilteredRackets applies DB filters, sorting and price filters", async () => {
    const rows = [
      { ...baseRacketRow(), id: 1, brand: "Adidas", padelmarket_actual_price: 80, on_offer: true },
      { ...baseRacketRow(), id: 2, brand: "Adidas", padelmarket_actual_price: 140, on_offer: true },
      { ...baseRacketRow(), id: 3, brand: "Adidas", padelmarket_actual_price: 95, on_offer: true },
    ];
    (supabase.from as jest.Mock).mockImplementation(() => {
      const chain: any = {
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnValue(Promise.resolve({ data: rows, error: null })),
      };
      return {
        select: () => chain,
      };
    });

    const { data, pagination }: any = await RacketService.getFilteredRackets(
      { brand: "Adidas", on_offer: true, min_price: 50, max_price: 100 },
      undefined,
      0,
      50
    );
    expect(data.length).toBe(2);
    expect(data.map((d: any) => d.id)).toEqual([1, 3]);
    expect(pagination.total).toBe(2);
    expect(pagination.hasNext).toBe(false);
  });

  it("getRacketsByBrand returns mapped rackets", async () => {
    const rows = [
      { ...baseRacketRow(), brand: "Bullpadel" },
      { ...baseRacketRow(), id: 2, brand: "Bullpadel" },
    ];
    (supabase.from as jest.Mock).mockImplementation(() => ({
      select: () => ({
        eq: () => ({
          order: () => ({ limit: () => Promise.resolve({ data: rows, error: null }) }),
        }),
      }),
    }));

    const result: any = await RacketService.getRacketsByBrand("Bullpadel");
    expect(result.length).toBe(2);
    expect(result[0].marca).toBe("Bullpadel");
  });

  it("getBestsellerRackets returns empty array (not supported)", async () => {
    const result = await RacketService.getBestsellerRackets();
    expect(result).toEqual([]);
  });

  it("getRacketsOnSale returns mapped rackets", async () => {
    const rows = [
      { ...baseRacketRow(), on_offer: true },
      { ...baseRacketRow(), id: 2, on_offer: true },
    ];
    (supabase.from as jest.Mock).mockImplementation(() => ({
      select: () => ({
        eq: () => ({
          order: () => ({ limit: () => Promise.resolve({ data: rows, error: null }) }),
        }),
      }),
    }));

    const result: any = await RacketService.getRacketsOnSale();
    expect(result.length).toBe(2);
    expect(result.every((r: any) => r.en_oferta === true)).toBe(true);
  });

  it("getBrands returns unique sorted list", async () => {
    const rows = [{ brand: "Adidas" }, { brand: "Bullpadel" }, { brand: "Adidas" }];
    (supabase.from as jest.Mock).mockImplementation(() => ({
      select: (columns: string) => ({
        not: () => Promise.resolve({ data: rows, error: null }),
      }),
    }));

    const brands = await RacketService.getBrands();
    expect(brands).toEqual(["Adidas", "Bullpadel"]);
  });

  it("getStats aggregates counts and unique brands", async () => {
    (supabase.from as jest.Mock).mockImplementation(() => ({
      select: (columns: string, options?: any) => {
        if (columns === "id" && options?.head) {
          // Support chaining for onSale count
          return {
            count: 3,
            eq: () => ({ count: 2 }),
          } as any;
        }
        if (columns === "brand") {
          return { data: [{ brand: "Adidas" }, { brand: "Bullpadel" }, { brand: "Adidas" }] } as any;
        }
        return { data: [], error: null } as any;
      },
    }));

    const stats = await RacketService.getStats();
    expect(stats.total).toBe(3);
    expect(stats.onSale).toBe(2);
    expect(stats.brands).toBe(2);
    expect(stats.bestsellers).toBe(0);
  });
});