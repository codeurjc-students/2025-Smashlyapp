import { AnimatePresence, motion } from "framer-motion";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    FiCheck,
    FiGrid,
    FiList,
    FiSearch,
    FiStar,
    FiTag,
    FiTrendingUp,
    FiX,
} from "react-icons/fi";
import styled from "styled-components";

// Datos estáticos de ejemplo
const staticRackets = [
  {
    nombre: "pala-adidas-metalbone-2024",
    marca: "Adidas",
    modelo: "Metalbone 2024",
    precio_actual: 289.95,
    precio_original: 339.95,
    en_oferta: true,
    descuento_porcentaje: 15,
    es_bestseller: true,
    imagen: "/images/palas/adidas-metalbone.jpg"
  },
  {
    nombre: "pala-wilson-bela-pro-2024",
    marca: "Wilson",
    modelo: "Bela Pro 2024",
    precio_actual: 195.00,
    precio_original: null,
    en_oferta: false,
    descuento_porcentaje: 0,
    es_bestseller: true,
    imagen: "/images/palas/wilson-bela-pro.jpg"
  },
  {
    nombre: "pala-head-delta-hybrid",
    marca: "Head",
    modelo: "Delta Hybrid",
    precio_actual: 159.99,
    precio_original: 199.99,
    en_oferta: true,
    descuento_porcentaje: 20,
    es_bestseller: false,
    imagen: "/images/palas/head-delta-hybrid.jpg"
  }
];

const staticBrands = ["Todas", "Adidas", "Wilson", "Head"];

// Styled Components
const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #f8faf8 0%, #e8f5e8 100%);
`;

const Header = styled.div`
  background: white;
  border-bottom: 1px solid #e5e7eb;
  padding: 2rem 0;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
`;

const HeaderContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  text-align: center;
`;

const Title = styled.h1`
  font-size: 3rem;
  font-weight: 800;
  color: #1f2937;
  margin-bottom: 1rem;

  .highlight {
    color: #16a34a;
  }

  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const Subtitle = styled.p`
  font-size: 1.25rem;
  color: #6b7280;
  margin-bottom: 2rem;
  line-height: 1.6;

  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

const StatsContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-top: 1rem;

  @media (max-width: 768px) {
    gap: 1rem;
    flex-wrap: wrap;
  }
`;

const StatItem = styled.div`
  text-align: center;
`;

const StatNumber = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: #16a34a;
`;

const StatLabel = styled.div`
  font-size: 0.875rem;
  color: #6b7280;
`;

const MainContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
`;

const FiltersSection = styled.div`
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(22, 163, 74, 0.1);
`;

const FiltersRow = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const SearchContainer = styled.div`
  flex: 1;
  position: relative;
  min-width: 300px;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 0.875rem 1rem 0.875rem 2.75rem;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 0.875rem;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: #16a34a;
    box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.1);
  }

  &::placeholder {
    color: #9ca3af;
  }
`;

const SearchIcon = styled(FiSearch)`
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #6b7280;
`;

const FilterButton = styled.button<{ active?: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 1rem;
  border: 2px solid ${(props) => (props.active ? "#16a34a" : "#e5e7eb")};
  border-radius: 12px;
  background: ${(props) => (props.active ? "#f0f9ff" : "white")};
  color: ${(props) => (props.active ? "#16a34a" : "#6b7280")};
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: #16a34a;
    color: #16a34a;
  }
`;

const BrandFilters = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-top: 1rem;
`;

const BrandFilter = styled.button<{ active: boolean }>`
  padding: 0.5rem 1rem;
  border: 1px solid ${(props) => (props.active ? "#16a34a" : "#e5e7eb")};
  border-radius: 8px;
  background: ${(props) => (props.active ? "#16a34a" : "white")};
  color: ${(props) => (props.active ? "white" : "#6b7280")};
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: #16a34a;
    color: ${(props) => (props.active ? "white" : "#16a34a")};
  }
`;

const ResultsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
`;

const ResultsCount = styled.div`
  font-size: 1rem;
  color: #6b7280;
`;

const ViewToggle = styled.div`
  display: flex;
  gap: 0.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 0.25rem;
  background: white;
`;

const ViewButton = styled.button<{ active: boolean }>`
  padding: 0.5rem;
  border: none;
  border-radius: 6px;
  background: ${(props) => (props.active ? "#16a34a" : "transparent")};
  color: ${(props) => (props.active ? "white" : "#6b7280")};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    color: ${(props) => (props.active ? "white" : "#16a34a")};
  }
`;

const SortSelect = styled.select`
  padding: 0.5rem 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: white;
  font-size: 0.875rem;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: #16a34a;
  }
`;

const RacketsGrid = styled.div<{ view: "grid" | "list" }>`
  display: grid;
  grid-template-columns: ${(props) =>
    props.view === "grid" ? "repeat(auto-fill, minmax(280px, 1fr))" : "1fr"};
  gap: ${(props) => (props.view === "grid" ? "1.5rem" : "1rem")};
`;

const RacketCard = styled(motion.div)<{ view: "grid" | "list" }>`
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid rgba(22, 163, 74, 0.1);

  display: ${(props) => (props.view === "list" ? "flex" : "block")};

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
    border-color: #16a34a;
  }
`;

const RacketImageContainer = styled.div<{ view: "grid" | "list" }>`
  position: relative;
  height: ${(props) => (props.view === "grid" ? "220px" : "120px")};
  width: ${(props) => (props.view === "list" ? "120px" : "100%")};
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  overflow: hidden;
`;

const RacketImage = styled.img`
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
`;

const RacketBadge = styled.div<{ variant: "bestseller" | "offer" }>`
  position: absolute;
  top: 0.75rem;
  ${(props) =>
    props.variant === "bestseller" ? "right: 0.75rem;" : "left: 0.75rem;"}
  background: ${(props) =>
    props.variant === "bestseller" ? "#f59e0b" : "#ef4444"};
  color: white;
  padding: 0.375rem 0.75rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  z-index: 2;
`;

const RacketInfo = styled.div<{ view: "grid" | "list" }>`
  padding: ${(props) => (props.view === "grid" ? "1.5rem" : "1rem")};
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`;

const RacketBrand = styled.div`
  font-size: 0.875rem;
  font-weight: 600;
  color: #16a34a;
  margin-bottom: 0.25rem;
`;

const RacketName = styled.h3<{ view: "grid" | "list" }>`
  font-size: ${(props) => (props.view === "grid" ? "1.125rem" : "1rem")};
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.75rem;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const PriceContainer = styled.div<{ view: "grid" | "list" }>`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: ${(props) => (props.view === "grid" ? "1rem" : "0.75rem")};
  flex-wrap: wrap;
`;

const CurrentPrice = styled.div`
  font-size: 1.25rem;
  font-weight: 700;
  color: #16a34a;
`;

const OriginalPrice = styled.div`
  font-size: 0.875rem;
  color: #9ca3af;
  text-decoration: line-through;
`;

const DiscountBadge = styled.div`
  background: #ef4444;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
`;

const ActionButtons = styled.div<{ view: "grid" | "list" }>`
  display: flex;
  gap: 0.5rem;
  flex-direction: ${(props) => (props.view === "list" ? "row" : "column")};

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const ViewDetailsButton = styled.button`
  flex: 1;
  background: #16a34a;
  color: white;
  border: none;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s ease;

  &:hover {
    background: #15803d;
    transform: translateY(-1px);
  }
`;

const AddToCompareButton = styled.button<{ disabled?: boolean }>`
  flex: 1;
  background: ${(props) => (props.disabled ? "#f3f4f6" : "white")};
  color: ${(props) => (props.disabled ? "#9ca3af" : "#16a34a")};
  border: 2px solid ${(props) => (props.disabled ? "#e5e7eb" : "#16a34a")};
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: ${(props) => (props.disabled ? "not-allowed" : "pointer")};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
  opacity: ${(props) => (props.disabled ? "0.6" : "1")};

  &:hover:not(:disabled) {
    background: #f0f9ff;
    transform: translateY(-1px);
  }
`;

const LoadMoreButton = styled(motion.button)`
  display: block;
  margin: 3rem auto 0;
  background: white;
  color: #16a34a;
  border: 2px solid #16a34a;
  padding: 1rem 2rem;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #f0f9ff;
    transform: translateY(-2px);
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  color: #6b7280;
`;

const EmptyIcon = styled.div`
  font-size: 4rem;
  margin-bottom: 1rem;
`;

const EmptyTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
`;

const EmptyDescription = styled.p`
  font-size: 1rem;
  color: #6b7280;
  margin-bottom: 2rem;
`;

const ClearFiltersButton = styled.button`
  background: #16a34a;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #15803d;
  }
`;

// Floating comparison panel
const FloatingPanel = styled(motion.div)`
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  background: white;
  border-radius: 16px;
  padding: 1rem 1.5rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  border: 2px solid #16a34a;
  z-index: 50;

  @media (max-width: 768px) {
    bottom: 1rem;
    right: 1rem;
    left: 1rem;
  }
`;

const PanelContent = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const PanelText = styled.div`
  font-size: 0.875rem;
  font-weight: 600;
  color: #1f2937;
`;

const CompareButton = styled.button`
  background: #16a34a;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #15803d;
  }
`;

// Component
const CatalogPage: React.FC = () => {
  // Hook para navegación
  const navigate = useNavigate();
  
  // Estados estáticos para el diseño
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("Todas");
  const [sortBy, setSortBy] = useState("name");
  const [showBestsellers, setShowBestsellers] = useState(false);
  const [showOffers, setShowOffers] = useState(false);
  const [comparisonRackets, setComparisonRackets] = useState<string[]>([]);

  // Valores estáticos
  const totalRackets = 3;
  const bestsellersCount = 2;
  const offersCount = 2;
  const uniqueBrands = staticBrands;
  const filteredRackets = staticRackets;
  const displayedRackets = staticRackets;

  // Funciones simplificadas (solo para diseño)
  const clearFilters = () => {
    setSearchQuery("");
    setSelectedBrand("Todas");
    setShowBestsellers(false);
    setShowOffers(false);
  };

  const handleRacketClick = (racket: any) => {
    // Navegar a la página de detalles
    navigate(`/racket-detail?id=${encodeURIComponent(racket.nombre)}`);
  };

  const handleAddToComparison = (racket: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (comparisonRackets.includes(racket.nombre)) return;
    
    if (comparisonRackets.length < 3) {
      setComparisonRackets([...comparisonRackets, racket.nombre]);
    }
  };

  const isRacketInComparison = (racketName: string) => {
    return comparisonRackets.includes(racketName);
  };

  const handleLoadMore = () => {
    console.log("Cargar más palas");
  };

  const goToComparison = () => {
    console.log("Ir a comparación con:", comparisonRackets);
  };

  return (
    <Container>
      {/* Header */}
      <Header>
        <HeaderContent>
          <Title>
            Catálogo de <span className="highlight">Palas</span>
          </Title>
          <Subtitle>
            Descubre nuestra colección completa de palas de pádel con las
            mejores marcas y precios
          </Subtitle>
          <StatsContainer>
            <StatItem>
              <StatNumber>{totalRackets}</StatNumber>
              <StatLabel>Palas</StatLabel>
            </StatItem>
            <StatItem>
              <StatNumber>{bestsellersCount}</StatNumber>
              <StatLabel>Bestsellers</StatLabel>
            </StatItem>
            <StatItem>
              <StatNumber>{offersCount}</StatNumber>
              <StatLabel>En Oferta</StatLabel>
            </StatItem>
            <StatItem>
              <StatNumber>{uniqueBrands.length - 1}</StatNumber>
              <StatLabel>Marcas</StatLabel>
            </StatItem>
          </StatsContainer>
        </HeaderContent>
      </Header>

      {/* Main Content */}
      <MainContent>
        {/* Filters */}
        <FiltersSection>
          <FiltersRow>
            <SearchContainer>
              <SearchIcon />
              <SearchInput
                type="text"
                placeholder="Buscar por nombre, marca o modelo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </SearchContainer>

            <FilterButton
              active={showBestsellers}
              onClick={() => setShowBestsellers(!showBestsellers)}
            >
              <FiStar />
              Bestsellers
            </FilterButton>

            <FilterButton
              active={showOffers}
              onClick={() => setShowOffers(!showOffers)}
            >
              <FiTag />
              Ofertas
            </FilterButton>

            <FilterButton onClick={clearFilters}>
              <FiX />
              Limpiar
            </FilterButton>
          </FiltersRow>

          <BrandFilters>
            {uniqueBrands.map((brand) => (
              <BrandFilter
                key={brand}
                active={selectedBrand === brand}
                onClick={() => setSelectedBrand(brand)}
              >
                {brand}
              </BrandFilter>
            ))}
          </BrandFilters>
        </FiltersSection>

        {/* Results Header */}
        <ResultsHeader>
          <ResultsCount>
            {filteredRackets.length} palas encontradas
          </ResultsCount>

          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <SortSelect
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="name">Ordenar por nombre</option>
              <option value="brand">Ordenar por marca</option>
              <option value="price-low">Precio: menor a mayor</option>
              <option value="price-high">Precio: mayor a menor</option>
              <option value="bestseller">Bestsellers primero</option>
              <option value="offer">Ofertas primero</option>
            </SortSelect>

            <ViewToggle>
              <ViewButton
                active={viewMode === "grid"}
                onClick={() => setViewMode("grid")}
              >
                <FiGrid />
              </ViewButton>
              <ViewButton
                active={viewMode === "list"}
                onClick={() => setViewMode("list")}
              >
                <FiList />
              </ViewButton>
            </ViewToggle>
          </div>
        </ResultsHeader>

        {/* Results */}
        {filteredRackets.length === 0 ? (
          <EmptyState>
            <EmptyIcon>🎾</EmptyIcon>
            <EmptyTitle>No se encontraron palas</EmptyTitle>
            <EmptyDescription>
              Prueba ajustando los filtros o términos de búsqueda
            </EmptyDescription>
            <ClearFiltersButton onClick={clearFilters}>
              Limpiar filtros
            </ClearFiltersButton>
          </EmptyState>
        ) : (
          <>
            <RacketsGrid view={viewMode}>
              {displayedRackets.map((racket, index) => (
                <RacketCard
                  key={racket.nombre}
                  view={viewMode}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  onClick={() => handleRacketClick(racket)}
                >
                  <RacketImageContainer view={viewMode}>
                    <RacketImage
                      src={racket.imagen}
                      alt={racket.modelo}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "/placeholder-racket.svg";
                      }}
                    />
                    {racket.es_bestseller && (
                      <RacketBadge variant="bestseller">
                        <FiStar size={12} />
                        Top
                      </RacketBadge>
                    )}
                    {racket.en_oferta && (
                      <RacketBadge variant="offer">
                        <FiTag size={12} />
                        Oferta
                      </RacketBadge>
                    )}
                  </RacketImageContainer>

                  <RacketInfo view={viewMode}>
                    <div>
                      <RacketBrand>{racket.marca}</RacketBrand>
                      <RacketName view={viewMode}>{racket.modelo}</RacketName>

                      <PriceContainer view={viewMode}>
                        <CurrentPrice>€{racket.precio_actual}</CurrentPrice>
                        {racket.en_oferta &&
                          racket.precio_original &&
                          racket.precio_original > 0 && (
                            <>
                              <OriginalPrice>
                                €{racket.precio_original}
                              </OriginalPrice>
                              <DiscountBadge>
                                -{racket.descuento_porcentaje}%
                              </DiscountBadge>
                            </>
                          )}
                      </PriceContainer>
                    </div>

                    <ActionButtons view={viewMode}>
                      <ViewDetailsButton
                        onClick={() => handleRacketClick(racket)}
                      >
                        Ver detalles
                      </ViewDetailsButton>
                      <AddToCompareButton
                        disabled={isRacketInComparison(racket.nombre)}
                        onClick={(e) => handleAddToComparison(racket, e)}
                      >
                        {isRacketInComparison(racket.nombre) ? (
                          <>
                            <FiCheck />
                            En comparador
                          </>
                        ) : (
                          <>
                            <FiTrendingUp />
                            Comparar
                          </>
                        )}
                      </AddToCompareButton>
                    </ActionButtons>
                  </RacketInfo>
                </RacketCard>
              ))}
            </RacketsGrid>

            {displayedRackets.length < filteredRackets.length && (
              <LoadMoreButton
                onClick={handleLoadMore}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Cargar más palas (
                {filteredRackets.length - displayedRackets.length} restantes)
              </LoadMoreButton>
            )}
          </>
        )}
      </MainContent>

      {/* Floating Comparison Panel */}
      <AnimatePresence>
        {comparisonRackets.length > 0 && (
          <FloatingPanel
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
          >
            <PanelContent>
              <PanelText>
                {comparisonRackets.length} pala{comparisonRackets.length > 1 ? "s" : ""} seleccionada
                {comparisonRackets.length > 1 ? "s" : ""} para comparar
              </PanelText>
              <CompareButton onClick={goToComparison}>
                Comparar ahora
              </CompareButton>
            </PanelContent>
          </FloatingPanel>
        )}
      </AnimatePresence>
    </Container>
  );
};

export default CatalogPage;
