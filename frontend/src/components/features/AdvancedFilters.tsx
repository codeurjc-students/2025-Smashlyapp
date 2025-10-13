import React, { useEffect, useState } from "react";
import { FiFilter, FiX } from "react-icons/fi";
import styled from "styled-components";
import { Racket, RacketCharacteristics } from "../../types/racket";

const FilterContainer = styled.div`
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  margin-bottom: 1.5rem;
`;

const FilterHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
`;

const FilterTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ClearFiltersButton = styled.button`
  background: #f3f4f6;
  color: #6b7280;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  transition: all 0.2s ease;

  &:hover {
    background: #e5e7eb;
    color: #374151;
  }
`;

const FilterGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
`;

const FilterGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

const FilterLabel = styled.label`
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
`;

const FilterSelect = styled.select`
  padding: 0.75rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.875rem;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: #16a34a;
    box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.1);
  }

  &:hover {
    border-color: #d1d5db;
  }
`;

const FilterChip = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: #16a34a;
  color: white;
  padding: 0.5rem 0.75rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
  margin: 0.25rem;
`;

const ChipRemove = styled.button`
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;

  &:hover {
    opacity: 0.8;
  }
`;

const ActiveFiltersContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
`;

interface AdvancedFiltersProps {
  rackets: Racket[];
  onFiltersChange: (filteredRackets: Racket[]) => void;
}

interface FilterState {
  marca: string;
  forma: string;
  balance: string;
  nivel_jugador: string;
  tipo_juego: string;
  priceRange: string;
  onSale: boolean;
  bestseller: boolean;
}

const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  rackets,
  onFiltersChange,
}) => {
  const [filters, setFilters] = useState<FilterState>({
    marca: "",
    forma: "",
    balance: "",
    nivel_jugador: "",
    tipo_juego: "",
    priceRange: "",
    onSale: false,
    bestseller: false,
  });

  // Extraer opciones únicas de las características
  const getUniqueValues = (key: keyof RacketCharacteristics): string[] => {
    const values = new Set<string>();
    rackets.forEach((racket) => {
      const value = racket.caracteristicas?.[key];
      if (value && typeof value === "string") {
        values.add(value);
      }
    });
    return Array.from(values).sort();
  };

  const uniqueMarcas = Array.from(new Set(rackets.map((r) => r.marca))).sort();
  const uniqueFormas = getUniqueValues("forma");
  const uniqueBalance = getUniqueValues("balance");
  const uniqueNivelJugador = getUniqueValues("nivel_jugador");
  const uniqueTipoJuego = getUniqueValues("tipo_juego");

  // Aplicar filtros
  useEffect(() => {
    let filtered = [...rackets];

    // Filtro por marca
    if (filters.marca) {
      filtered = filtered.filter((r) => r.marca === filters.marca);
    }

    // Filtro por forma
    if (filters.forma) {
      filtered = filtered.filter(
        (r) => r.caracteristicas?.forma === filters.forma
      );
    }

    // Filtro por balance
    if (filters.balance) {
      filtered = filtered.filter(
        (r) => r.caracteristicas?.balance === filters.balance
      );
    }

    // Filtro por nivel del jugador
    if (filters.nivel_jugador) {
      filtered = filtered.filter(
        (r) => r.caracteristicas?.nivel_jugador === filters.nivel_jugador
      );
    }

    // Filtro por tipo de juego
    if (filters.tipo_juego) {
      filtered = filtered.filter(
        (r) => r.caracteristicas?.tipo_juego === filters.tipo_juego
      );
    }

    // Filtro por rango de precio
    if (filters.priceRange) {
      const [min, max] = filters.priceRange.split("-").map(Number);
      filtered = filtered.filter((r) => {
        const price = r.precio_actual;
        if (max) {
          return price >= min && price <= max;
        } else {
          return price >= min;
        }
      });
    }

    // Filtro por oferta
    if (filters.onSale) {
      filtered = filtered.filter((r) => r.en_oferta);
    }

    // Filtro por bestseller
    if (filters.bestseller) {
      filtered = filtered.filter((r) => r.es_bestseller);
    }

    onFiltersChange(filtered);
  }, [filters, rackets, onFiltersChange]);

  const handleFilterChange = (
    key: keyof FilterState,
    value: string | boolean
  ) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      marca: "",
      forma: "",
      balance: "",
      nivel_jugador: "",
      tipo_juego: "",
      priceRange: "",
      onSale: false,
      bestseller: false,
    });
  };

  const getActiveFilters = () => {
    const active = [];
    if (filters.marca)
      active.push({ key: "marca", value: filters.marca, label: "Marca" });
    if (filters.forma)
      active.push({ key: "forma", value: filters.forma, label: "Forma" });
    if (filters.balance)
      active.push({ key: "balance", value: filters.balance, label: "Balance" });
    if (filters.nivel_jugador)
      active.push({
        key: "nivel_jugador",
        value: filters.nivel_jugador,
        label: "Nivel",
      });
    if (filters.tipo_juego)
      active.push({
        key: "tipo_juego",
        value: filters.tipo_juego,
        label: "Tipo de Juego",
      });
    if (filters.priceRange)
      active.push({
        key: "priceRange",
        value: filters.priceRange,
        label: "Precio",
      });
    if (filters.onSale)
      active.push({ key: "onSale", value: "En Oferta", label: "Estado" });
    if (filters.bestseller)
      active.push({ key: "bestseller", value: "Bestseller", label: "Estado" });
    return active;
  };

  const activeFilters = getActiveFilters();

  return (
    <FilterContainer>
      <FilterHeader>
        <FilterTitle>
          <FiFilter />
          Filtros Avanzados
        </FilterTitle>
        {activeFilters.length > 0 && (
          <ClearFiltersButton onClick={clearFilters}>
            <FiX size={16} />
            Limpiar Filtros
          </ClearFiltersButton>
        )}
      </FilterHeader>

      <FilterGrid>
        <FilterGroup>
          <FilterLabel>Marca</FilterLabel>
          <FilterSelect
            value={filters.marca}
            onChange={(e) => handleFilterChange("marca", e.target.value)}
          >
            <option value="">Todas las marcas</option>
            {uniqueMarcas.map((marca) => (
              <option key={marca} value={marca}>
                {marca}
              </option>
            ))}
          </FilterSelect>
        </FilterGroup>

        {uniqueFormas.length > 0 && (
          <FilterGroup>
            <FilterLabel>Forma</FilterLabel>
            <FilterSelect
              value={filters.forma}
              onChange={(e) => handleFilterChange("forma", e.target.value)}
            >
              <option value="">Todas las formas</option>
              {uniqueFormas.map((forma) => (
                <option key={forma} value={forma}>
                  {forma}
                </option>
              ))}
            </FilterSelect>
          </FilterGroup>
        )}

        {uniqueBalance.length > 0 && (
          <FilterGroup>
            <FilterLabel>Balance</FilterLabel>
            <FilterSelect
              value={filters.balance}
              onChange={(e) => handleFilterChange("balance", e.target.value)}
            >
              <option value="">Todos los balances</option>
              {uniqueBalance.map((balance) => (
                <option key={balance} value={balance}>
                  {balance}
                </option>
              ))}
            </FilterSelect>
          </FilterGroup>
        )}

        {uniqueNivelJugador.length > 0 && (
          <FilterGroup>
            <FilterLabel>Nivel del Jugador</FilterLabel>
            <FilterSelect
              value={filters.nivel_jugador}
              onChange={(e) =>
                handleFilterChange("nivel_jugador", e.target.value)
              }
            >
              <option value="">Todos los niveles</option>
              {uniqueNivelJugador.map((nivel) => (
                <option key={nivel} value={nivel}>
                  {nivel}
                </option>
              ))}
            </FilterSelect>
          </FilterGroup>
        )}

        {uniqueTipoJuego.length > 0 && (
          <FilterGroup>
            <FilterLabel>Tipo de Juego</FilterLabel>
            <FilterSelect
              value={filters.tipo_juego}
              onChange={(e) => handleFilterChange("tipo_juego", e.target.value)}
            >
              <option value="">Todos los tipos</option>
              {uniqueTipoJuego.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {tipo}
                </option>
              ))}
            </FilterSelect>
          </FilterGroup>
        )}

        <FilterGroup>
          <FilterLabel>Rango de Precio</FilterLabel>
          <FilterSelect
            value={filters.priceRange}
            onChange={(e) => handleFilterChange("priceRange", e.target.value)}
          >
            <option value="">Cualquier precio</option>
            <option value="0-100">€0 - €100</option>
            <option value="100-200">€100 - €200</option>
            <option value="200-300">€200 - €300</option>
            <option value="300-400">€300 - €400</option>
            <option value="400">€400+</option>
          </FilterSelect>
        </FilterGroup>
      </FilterGrid>

      {activeFilters.length > 0 && (
        <ActiveFiltersContainer>
          {activeFilters.map((filter) => (
            <FilterChip key={`${filter.key}-${filter.value}`}>
              {filter.label}: {filter.value}
              <ChipRemove
                onClick={() =>
                  handleFilterChange(
                    filter.key as keyof FilterState,
                    filter.key === "onSale" || filter.key === "bestseller"
                      ? false
                      : ""
                  )
                }
              >
                <FiX size={14} />
              </ChipRemove>
            </FilterChip>
          ))}
        </ActiveFiltersContainer>
      )}
    </FilterContainer>
  );
};

export default AdvancedFilters;
