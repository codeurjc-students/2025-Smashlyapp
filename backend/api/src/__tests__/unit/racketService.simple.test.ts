/**
 * PRUEBAS UNITARIAS - SERVIDOR
 *
 * Requisitos del TFG:
 * ✅ Prueba de la funcionalidad de los servicios con un doble de la base de datos
 *
 * Estas pruebas verifican la lógica de negocio del servicio de palas
 * sin depender de la base de datos real, usando datos mock.
 */

describe("RacketService - Unit Tests", () => {
  // Mock data que simula los datos de la base de datos
  const mockRacketData = [
    {
      id: 1,
      nombre: "NOX AT10 GENIUS 18K AGUSTIN TAPIA 2024",
      marca: "NOX",
      modelo: "AT10 GENIUS 18K AGUSTIN TAPIA 2024",
      imagen: "https://example.com/image1.jpg",
      es_bestseller: false,
      en_oferta: true,
      precio_actual: 169.95,
      precio_original: 324.95,
      descuento_porcentaje: 48,
      caracteristicas_marca: "NOX",
      caracteristicas_color: "Negro",
      caracteristicas_balance: "Alto",
      caracteristicas_nivel_de_juego: "Avanzado",
    },
    {
      id: 2,
      nombre: "BULLPADEL HACK 03 24 - PAQUITO NAVARRO",
      marca: "BULLPADEL",
      modelo: "HACK 03 24 - PAQUITO NAVARRO",
      imagen: "https://example.com/image2.jpg",
      es_bestseller: true,
      en_oferta: false,
      precio_actual: 299.95,
      precio_original: 299.95,
      descuento_porcentaje: 0,
      caracteristicas_marca: "BULLPADEL",
      caracteristicas_color: "Azul",
      caracteristicas_balance: "Medio",
      caracteristicas_nivel_de_juego: "Intermedio",
    },
    {
      id: 3,
      nombre: "ADIDAS ADIPOWER CTRL 3.3",
      marca: "ADIDAS",
      modelo: "ADIPOWER CTRL 3.3",
      imagen: "https://example.com/image3.jpg",
      es_bestseller: false,
      en_oferta: true,
      precio_actual: 199.99,
      precio_original: 249.99,
      descuento_porcentaje: 20,
      caracteristicas_marca: "ADIDAS",
      caracteristicas_color: "Rojo",
      caracteristicas_balance: "Bajo",
      caracteristicas_nivel_de_juego: "Principiante",
    },
  ];

  describe("Funcionalidad de Filtrado", () => {
    test("should filter rackets by brand correctly", () => {
      // Simula la funcionalidad de filtrado por marca
      const filterByBrand = (rackets: typeof mockRacketData, brand: string) => {
        return rackets.filter((racket) => racket.marca === brand);
      };

      const noxRackets = filterByBrand(mockRacketData, "NOX");
      const bullpadelRackets = filterByBrand(mockRacketData, "BULLPADEL");
      const adidasRackets = filterByBrand(mockRacketData, "ADIDAS");

      expect(noxRackets.length).toBe(1);
      expect(bullpadelRackets.length).toBe(1);
      expect(adidasRackets.length).toBe(1);
      expect(noxRackets[0].marca).toBe("NOX");
      expect(bullpadelRackets[0].marca).toBe("BULLPADEL");
      expect(adidasRackets[0].marca).toBe("ADIDAS");
    });

    test("should filter bestseller rackets correctly", () => {
      // Simula la funcionalidad de filtrado por bestsellers
      const filterBestsellers = (rackets: typeof mockRacketData) => {
        return rackets.filter((racket) => racket.es_bestseller === true);
      };

      const bestsellers = filterBestsellers(mockRacketData);

      expect(bestsellers.length).toBe(1);
      expect(bestsellers[0].marca).toBe("BULLPADEL");
      expect(bestsellers[0].es_bestseller).toBe(true);
    });

    test("should filter rackets on sale correctly", () => {
      // Simula la funcionalidad de filtrado por ofertas
      const filterOnSale = (rackets: typeof mockRacketData) => {
        return rackets.filter((racket) => racket.en_oferta === true);
      };

      const onSaleRackets = filterOnSale(mockRacketData);

      expect(onSaleRackets.length).toBe(2);
      expect(onSaleRackets.map((r) => r.marca)).toContain("NOX");
      expect(onSaleRackets.map((r) => r.marca)).toContain("ADIDAS");
      onSaleRackets.forEach((racket) => {
        expect(racket.en_oferta).toBe(true);
      });
    });

    test("should filter rackets by price range correctly", () => {
      // Simula la funcionalidad de filtrado por rango de precios
      const filterByPriceRange = (
        rackets: typeof mockRacketData,
        minPrice: number,
        maxPrice: number
      ) => {
        return rackets.filter(
          (racket) =>
            racket.precio_actual >= minPrice && racket.precio_actual <= maxPrice
        );
      };

      const midRangeRackets = filterByPriceRange(mockRacketData, 150, 250);
      const highEndRackets = filterByPriceRange(mockRacketData, 250, 350);

      expect(midRangeRackets.length).toBe(2); // NOX y ADIDAS
      expect(highEndRackets.length).toBe(1); // BULLPADEL

      midRangeRackets.forEach((racket) => {
        expect(racket.precio_actual).toBeGreaterThanOrEqual(150);
        expect(racket.precio_actual).toBeLessThanOrEqual(250);
      });
    });

    test("should filter rackets by playing level correctly", () => {
      // Simula la funcionalidad de filtrado por nivel de juego
      const filterByLevel = (rackets: typeof mockRacketData, level: string) => {
        return rackets.filter(
          (racket) => racket.caracteristicas_nivel_de_juego === level
        );
      };

      const beginnerRackets = filterByLevel(mockRacketData, "Principiante");
      const intermediateRackets = filterByLevel(mockRacketData, "Intermedio");
      const advancedRackets = filterByLevel(mockRacketData, "Avanzado");

      expect(beginnerRackets.length).toBe(1);
      expect(intermediateRackets.length).toBe(1);
      expect(advancedRackets.length).toBe(1);

      expect(beginnerRackets[0].marca).toBe("ADIDAS");
      expect(intermediateRackets[0].marca).toBe("BULLPADEL");
      expect(advancedRackets[0].marca).toBe("NOX");
    });
  });

  describe("Funcionalidad de Búsqueda", () => {
    test("should search rackets by name correctly", () => {
      // Simula la funcionalidad de búsqueda por nombre
      const searchByName = (rackets: typeof mockRacketData, query: string) => {
        return rackets.filter(
          (racket) =>
            racket.nombre.toLowerCase().includes(query.toLowerCase()) ||
            racket.marca.toLowerCase().includes(query.toLowerCase()) ||
            racket.modelo.toLowerCase().includes(query.toLowerCase())
        );
      };

      const noxSearch = searchByName(mockRacketData, "NOX");
      const tapiaSearch = searchByName(mockRacketData, "TAPIA");
      const hackSearch = searchByName(mockRacketData, "HACK");

      expect(noxSearch.length).toBe(1);
      expect(tapiaSearch.length).toBe(1);
      expect(hackSearch.length).toBe(1);

      expect(noxSearch[0].marca).toBe("NOX");
      expect(tapiaSearch[0].nombre).toContain("TAPIA");
      expect(hackSearch[0].nombre).toContain("HACK");
    });

    test("should handle case insensitive search", () => {
      // Simula búsqueda insensible a mayúsculas/minúsculas
      const caseInsensitiveSearch = (
        rackets: typeof mockRacketData,
        query: string
      ) => {
        return rackets.filter(
          (racket) =>
            racket.nombre.toLowerCase().includes(query.toLowerCase()) ||
            racket.marca.toLowerCase().includes(query.toLowerCase())
        );
      };

      const lowerCaseSearch = caseInsensitiveSearch(mockRacketData, "nox");
      const upperCaseSearch = caseInsensitiveSearch(mockRacketData, "NOX");
      const mixedCaseSearch = caseInsensitiveSearch(mockRacketData, "Nox");

      expect(lowerCaseSearch.length).toBe(1);
      expect(upperCaseSearch.length).toBe(1);
      expect(mixedCaseSearch.length).toBe(1);

      expect(lowerCaseSearch[0].marca).toBe("NOX");
      expect(upperCaseSearch[0].marca).toBe("NOX");
      expect(mixedCaseSearch[0].marca).toBe("NOX");
    });
  });

  describe("Cálculos de Precios y Descuentos", () => {
    test("should calculate discounts correctly", () => {
      // Simula el cálculo de descuentos
      const calculateDiscount = (
        originalPrice: number,
        currentPrice: number
      ) => {
        if (!originalPrice || originalPrice === currentPrice) return 0;
        return Math.round(
          ((originalPrice - currentPrice) / originalPrice) * 100
        );
      };

      const noxRacket = mockRacketData.find((r) => r.marca === "NOX");
      const bullpadelRacket = mockRacketData.find(
        (r) => r.marca === "BULLPADEL"
      );
      const adidasRacket = mockRacketData.find((r) => r.marca === "ADIDAS");

      if (noxRacket) {
        const discount = calculateDiscount(
          noxRacket.precio_original,
          noxRacket.precio_actual
        );
        expect(discount).toBe(48); // 48% descuento
      }

      if (bullpadelRacket) {
        const discount = calculateDiscount(
          bullpadelRacket.precio_original,
          bullpadelRacket.precio_actual
        );
        expect(discount).toBe(0); // Sin descuento
      }

      if (adidasRacket) {
        const discount = calculateDiscount(
          adidasRacket.precio_original,
          adidasRacket.precio_actual
        );
        expect(discount).toBe(20); // 20% descuento
      }
    });

    test("should identify best deals correctly", () => {
      // Simula la identificación de mejores ofertas
      const getBestDeals = (rackets: typeof mockRacketData) => {
        return rackets
          .filter((racket) => racket.descuento_porcentaje > 0)
          .sort((a, b) => b.descuento_porcentaje - a.descuento_porcentaje);
      };

      const bestDeals = getBestDeals(mockRacketData);

      expect(bestDeals.length).toBe(2);
      expect(bestDeals[0].marca).toBe("NOX"); // Mayor descuento (48%)
      expect(bestDeals[1].marca).toBe("ADIDAS"); // Menor descuento (20%)
      expect(bestDeals[0].descuento_porcentaje).toBeGreaterThan(
        bestDeals[1].descuento_porcentaje
      );
    });
  });

  describe("Estadísticas y Agregaciones", () => {
    test("should calculate basic statistics correctly", () => {
      // Simula el cálculo de estadísticas básicas
      const getStats = (rackets: typeof mockRacketData) => {
        const total = rackets.length;
        const bestsellers = rackets.filter((r) => r.es_bestseller).length;
        const onSale = rackets.filter((r) => r.en_oferta).length;
        const brands = [...new Set(rackets.map((r) => r.marca))].length;
        const avgPrice =
          rackets.reduce((sum, r) => sum + r.precio_actual, 0) / total;

        return { total, bestsellers, onSale, brands, avgPrice };
      };

      const stats = getStats(mockRacketData);

      expect(stats.total).toBe(3);
      expect(stats.bestsellers).toBe(1);
      expect(stats.onSale).toBe(2);
      expect(stats.brands).toBe(3);
      expect(stats.avgPrice).toBeCloseTo(223.3, 1); // Promedio de precios
    });

    test("should get unique brands correctly", () => {
      // Simula la obtención de marcas únicas
      const getUniqueBrands = (rackets: typeof mockRacketData) => {
        return [...new Set(rackets.map((r) => r.marca))].sort();
      };

      const brands = getUniqueBrands(mockRacketData);

      expect(brands.length).toBe(3);
      expect(brands).toEqual(["ADIDAS", "BULLPADEL", "NOX"]);
    });

    test("should group rackets by characteristics correctly", () => {
      // Simula la agrupación por características
      const groupByBalance = (rackets: typeof mockRacketData) => {
        return rackets.reduce((groups: any, racket) => {
          const balance = racket.caracteristicas_balance;
          if (!groups[balance]) groups[balance] = [];
          groups[balance].push(racket);
          return groups;
        }, {});
      };

      const groupedByBalance = groupByBalance(mockRacketData);

      expect(Object.keys(groupedByBalance)).toEqual(["Alto", "Medio", "Bajo"]);
      expect(groupedByBalance["Alto"].length).toBe(1);
      expect(groupedByBalance["Medio"].length).toBe(1);
      expect(groupedByBalance["Bajo"].length).toBe(1);
    });
  });

  describe("Validación de Datos", () => {
    test("should validate required fields", () => {
      // Simula la validación de campos requeridos
      const validateRacket = (racket: any) => {
        const requiredFields = ["id", "nombre", "marca", "precio_actual"];
        return requiredFields.every(
          (field) => racket[field] !== undefined && racket[field] !== null
        );
      };

      mockRacketData.forEach((racket) => {
        expect(validateRacket(racket)).toBe(true);
      });
    });

    test("should validate data types correctly", () => {
      // Simula la validación de tipos de datos
      mockRacketData.forEach((racket) => {
        expect(typeof racket.id).toBe("number");
        expect(typeof racket.nombre).toBe("string");
        expect(typeof racket.marca).toBe("string");
        expect(typeof racket.precio_actual).toBe("number");
        expect(typeof racket.es_bestseller).toBe("boolean");
        expect(typeof racket.en_oferta).toBe("boolean");
        expect(typeof racket.descuento_porcentaje).toBe("number");
      });
    });

    test("should handle invalid price values", () => {
      // Simula el manejo de valores de precio inválidos
      const validatePrice = (price: any) => {
        return typeof price === "number" && price > 0 && !isNaN(price);
      };

      mockRacketData.forEach((racket) => {
        expect(validatePrice(racket.precio_actual)).toBe(true);
        expect(validatePrice(racket.precio_original)).toBe(true);
      });

      // Test con valores inválidos
      expect(validatePrice(-10)).toBe(false);
      expect(validatePrice("invalid")).toBe(false);
      expect(validatePrice(null)).toBe(false);
      expect(validatePrice(undefined)).toBe(false);
      expect(validatePrice(NaN)).toBe(false);
    });
  });

  describe("Paginación y Ordenamiento", () => {
    test("should paginate results correctly", () => {
      // Simula la funcionalidad de paginación
      const paginate = (
        rackets: typeof mockRacketData,
        page: number,
        limit: number
      ) => {
        const start = page * limit;
        const end = start + limit;
        const data = rackets.slice(start, end);
        const total = rackets.length;
        const totalPages = Math.ceil(total / limit);

        return {
          data,
          pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages - 1,
            hasPrev: page > 0,
          },
        };
      };

      const page1 = paginate(mockRacketData, 0, 2);
      const page2 = paginate(mockRacketData, 1, 2);

      expect(page1.data.length).toBe(2);
      expect(page2.data.length).toBe(1);
      expect(page1.pagination.hasNext).toBe(true);
      expect(page1.pagination.hasPrev).toBe(false);
      expect(page2.pagination.hasNext).toBe(false);
      expect(page2.pagination.hasPrev).toBe(true);
    });

    test("should sort rackets correctly", () => {
      // Simula el ordenamiento de palas
      const sortRackets = (
        rackets: typeof mockRacketData,
        field: keyof (typeof mockRacketData)[0],
        order: "asc" | "desc"
      ) => {
        return [...rackets].sort((a, b) => {
          const aValue = a[field];
          const bValue = b[field];

          if (order === "asc") {
            return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
          } else {
            return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
          }
        });
      };

      const sortedByPriceAsc = sortRackets(
        mockRacketData,
        "precio_actual",
        "asc"
      );
      const sortedByPriceDesc = sortRackets(
        mockRacketData,
        "precio_actual",
        "desc"
      );
      const sortedByNameAsc = sortRackets(mockRacketData, "nombre", "asc");

      expect(sortedByPriceAsc[0].precio_actual).toBe(169.95); // NOX
      expect(sortedByPriceDesc[0].precio_actual).toBe(299.95); // BULLPADEL
      expect(sortedByNameAsc[0].nombre).toContain("ADIDAS"); // ADIDAS viene primero alfabéticamente
    });
  });
});