import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import {
  FiCheck,
  FiFilter,
  FiSearch,
  FiStar,
  FiTag,
  FiTrendingUp,
  FiUsers,
  FiX,
} from "react-icons/fi";
import styled from "styled-components";
import { useComparison } from "../contexts/ComparisonContext";
import { useRackets } from "../contexts/RacketsContext";
import { Racket, RacketComparison } from "../types/racket";

const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #f8faf8 0%, #e8f5e8 100%);
  padding: 2rem 0;
`;

const HeroSection = styled.div`
  text-align: center;
  padding: 3rem 0;
  max-width: 800px;
  margin: 0 auto;
  padding-left: 1rem;
  padding-right: 1rem;
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

const MainContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
`;

const SearchSection = styled.div`
  background: white;
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 10px 30px rgba(22, 163, 74, 0.1);
  border: 1px solid rgba(22, 163, 74, 0.1);
`;

const SearchContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const SearchInputContainer = styled.div`
  flex: 1;
  position: relative;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 1rem 1rem 1rem 3rem;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 1rem;
  transition: border-color 0.2s ease;

  &:focus {
    outline: none;
    border-color: #16a34a;
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
  font-size: 1.25rem;
`;

const FilterContainer = styled.div`
  position: relative;
`;

const FilterButton = styled.button<{ active: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 1.5rem;
  border: 2px solid ${(props) => (props.active ? "#16a34a" : "#e5e7eb")};
  border-radius: 12px;
  background: ${(props) => (props.active ? "#f0f9ff" : "white")};
  color: ${(props) => (props.active ? "#16a34a" : "#6b7280")};
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;

  &:hover {
    border-color: #16a34a;
    color: #16a34a;
  }
`;

const BrandFilters = styled.div`
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
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

const RacketsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 6rem;
`;

const RacketCard = styled(motion.div)<{ selected: boolean }>`
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  border: 2px solid ${(props) => (props.selected ? "#16a34a" : "transparent")};
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  }
`;

const RacketImageContainer = styled.div`
  position: relative;
  height: 220px;
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

const SelectionIndicator = styled.div`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: #16a34a;
  color: white;
  border-radius: 50%;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
`;

const RacketInfo = styled.div`
  padding: 1.5rem;
`;

const RacketBrand = styled.div`
  font-size: 0.875rem;
  color: #16a34a;
  font-weight: 600;
  margin-bottom: 0.25rem;
`;

const RacketName = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1rem;
  line-height: 1.4;
`;

const PriceSection = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
`;

const CurrentPrice = styled.div`
  font-size: 1.25rem;
  font-weight: 700;
  color: #16a34a;
`;

const OriginalPrice = styled.div`
  font-size: 0.875rem;
  color: #6b7280;
  text-decoration: line-through;
`;

const DiscountBadge = styled.div`
  background: #ef4444;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
`;

const Badges = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

const Badge = styled.div<{ type: "bestseller" | "offer" }>`
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  background: ${(props) =>
    props.type === "bestseller" ? "#fbbf24" : "#10b981"};
  color: white;
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const Modal = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 1rem;
`;

const ModalContent = styled(motion.div)`
  background: white;
  border-radius: 24px;
  max-width: 900px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
`;

const ModalHeader = styled.div`
  padding: 2rem 2rem 1rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const ModalTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 8px;

  &:hover {
    background: #f3f4f6;
  }
`;

const ModalBody = styled.div`
  padding: 2rem;
`;

const AnalysisSection = styled.div`
  margin-bottom: 2rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

const AnalysisTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const AnalysisText = styled.p`
  color: #4b5563;
  line-height: 1.7;
  font-size: 1rem;
`;

const RacketAnalysisCard = styled.div`
  background: #f9fafb;
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  border: 1px solid #e5e7eb;
`;

const RacketAnalysisHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
`;

const RacketAnalysisImage = styled.img`
  width: 60px;
  height: 60px;
  object-fit: contain;
  border-radius: 8px;
  background: white;
  padding: 0.25rem;
`;

const RacketAnalysisInfo = styled.div`
  flex: 1;
`;

const RacketAnalysisName = styled.h4`
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.25rem;
`;

const RacketAnalysisBrand = styled.div`
  font-size: 0.875rem;
  color: #16a34a;
  font-weight: 500;
`;

const AnalysisDetail = styled.div`
  margin-bottom: 1rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

const DetailTitle = styled.h5`
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const DetailText = styled.p`
  color: #6b7280;
  line-height: 1.6;
  font-size: 0.875rem;
`;

const ProsConsContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-top: 1rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const ProsSection = styled.div`
  background: #f0f9ff;
  border-radius: 8px;
  padding: 1rem;
`;

const ConsSection = styled.div`
  background: #fef2f2;
  border-radius: 8px;
  padding: 1rem;
`;

const ProsConsTitle = styled.h6`
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  color: #374151;
`;

const ProsConsItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  margin-bottom: 0.5rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

const ProsConsText = styled.span`
  font-size: 0.875rem;
  color: #6b7280;
  line-height: 1.5;
`;

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  flex-direction: column;
  gap: 1rem;
`;

const LoadingSpinner = styled(motion.div)`
  width: 3rem;
  height: 3rem;
  border: 3px solid #e5e7eb;
  border-top-color: #16a34a;
  border-radius: 50%;
`;

const LoadingText = styled.p`
  color: #6b7280;
  font-size: 1rem;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem 1rem;
  color: #6b7280;
`;

const CompareRacketsPage: React.FC = () => {
  const { rackets, loading } = useRackets();
  const [filteredRackets, setFilteredRackets] = useState<Racket[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("Todas");
  const [showComparison, setShowComparison] = useState(false);
  const [comparisonResults, setComparisonResults] =
    useState<RacketComparison | null>(null);

  const {
    rackets: selectedRackets,
    addRacket,
    removeRacket,
    isRacketInComparison,
  } = useComparison();

  // Update filtered rackets when rackets change
  useEffect(() => {
    setFilteredRackets(rackets); // Usar todas las palas sin limitación
  }, [rackets]);

  // Filter rackets based on search and brand
  useEffect(() => {
    let filtered = rackets;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (racket: Racket) =>
          racket.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (racket.marca && racket.marca.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (racket.modelo && racket.modelo.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Filter by brand
    if (selectedBrand !== "Todas") {
      filtered = filtered.filter(
        (racket: Racket) => racket.marca === selectedBrand
      );
    }

    setFilteredRackets(filtered);
  }, [searchQuery, selectedBrand, rackets]);

  // Get unique brands
  const uniqueBrands: string[] = [
    "Todas",
    ...(Array.from(
      new Set(rackets.map((racket: Racket) => racket.marca))
    ) as string[]),
  ];

  // Handle racket selection
  const handleRacketSelection = (racket: Racket) => {
    if (isRacketInComparison(racket.nombre)) {
      removeRacket(racket.nombre);
    } else {
      addRacket(racket);
    }
  };

  // Close comparison modal
  const closeComparison = () => {
    setShowComparison(false);
    setComparisonResults(null);
  };

  if (loading) {
    return (
      <Container>
        <LoadingContainer>
          <LoadingSpinner
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <LoadingText>Cargando palas de pádel...</LoadingText>
        </LoadingContainer>
      </Container>
    );
  }

  return (
    <Container>
      <HeroSection>
        <Title>
          Comparador de <span className="highlight">Palas</span>
        </Title>
        <Subtitle>
          Selecciona hasta 3 palas para obtener un análisis detallado con IA y
          encuentra la perfecta para tu juego
        </Subtitle>
      </HeroSection>

      <MainContent>
        <SearchSection>
          <SearchContainer>
            <SearchInputContainer>
              <SearchIcon />
              <SearchInput
                type="text"
                placeholder="Buscar palas por nombre, marca o modelo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </SearchInputContainer>
            <FilterContainer>
              <FilterButton active={selectedBrand !== "Todas"}>
                <FiFilter />
                Filtros
              </FilterButton>
            </FilterContainer>
          </SearchContainer>

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
        </SearchSection>

        {filteredRackets.length === 0 ? (
          <EmptyState>
            <h3>No se encontraron palas</h3>
            <p>Prueba con otros términos de búsqueda o filtros</p>
          </EmptyState>
        ) : (
          <RacketsGrid>
            {filteredRackets.map((racket) => {
              const isSelected = isRacketInComparison(racket.nombre);

              return (
                <RacketCard
                  key={racket.nombre}
                  selected={isSelected}
                  onClick={() => handleRacketSelection(racket)}
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.2 }}
                >
                  <RacketImageContainer>
                    <RacketImage
                      src={racket.imagen || ""}
                      alt={racket.nombre}
                      onError={(e) => {
                        e.currentTarget.src =
                          "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=400&fit=crop";
                      }}
                    />
                    {isSelected && (
                      <SelectionIndicator>
                        <FiCheck />
                      </SelectionIndicator>
                    )}
                  </RacketImageContainer>

                  <RacketInfo>
                    <RacketBrand>{racket.marca}</RacketBrand>
                    <RacketName>{racket.modelo}</RacketName>

                    <PriceSection>
                      <div>
                        <CurrentPrice>€{racket.precio_actual}</CurrentPrice>
                        {racket.en_oferta &&
                          racket.precio_original &&
                          racket.precio_original > 0 && (
                            <OriginalPrice>
                              €{racket.precio_original}
                            </OriginalPrice>
                          )}
                      </div>
                      {racket.en_oferta && (
                        <DiscountBadge>
                          -{racket.descuento_porcentaje}%
                        </DiscountBadge>
                      )}
                    </PriceSection>

                    <Badges>
                      {racket.es_bestseller && (
                        <Badge type="bestseller">
                          <FiStar size={12} />
                          Top
                        </Badge>
                      )}
                      {racket.en_oferta && (
                        <Badge type="offer">
                          <FiTag size={12} />
                          Oferta
                        </Badge>
                      )}
                    </Badges>
                  </RacketInfo>
                </RacketCard>
              );
            })}
          </RacketsGrid>
        )}
      </MainContent>

      {/* Comparison Results Modal */}
      <AnimatePresence>
        {showComparison && comparisonResults && (
          <Modal
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeComparison}
          >
            <ModalContent
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <ModalHeader>
                <ModalTitle>Análisis Comparativo con IA</ModalTitle>
                <CloseButton onClick={closeComparison}>
                  <FiX size={24} />
                </CloseButton>
              </ModalHeader>

              <ModalBody>
                {/* General Analysis */}
                <AnalysisSection>
                  <AnalysisTitle>
                    <FiTrendingUp />
                    Análisis General
                  </AnalysisTitle>
                  <AnalysisText>
                    {comparisonResults.generalAnalysis}
                  </AnalysisText>
                </AnalysisSection>

                {/* Individual Racket Analysis */}
                {comparisonResults.racketAnalysis.map(
                  (analysis: any, index: number) => (
                    <RacketAnalysisCard key={index}>
                      <RacketAnalysisHeader>
                        <RacketAnalysisImage
                          src={selectedRackets[index]?.imagen || ""}
                          alt={analysis.name}
                          onError={(e) => {
                            e.currentTarget.src =
                              "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=120&h=120&fit=crop";
                          }}
                        />
                        <RacketAnalysisInfo>
                          <RacketAnalysisName>
                            {analysis.name}
                          </RacketAnalysisName>
                          <RacketAnalysisBrand>
                            {selectedRackets[index]?.marca}
                          </RacketAnalysisBrand>
                        </RacketAnalysisInfo>
                      </RacketAnalysisHeader>

                      <AnalysisDetail>
                        <DetailTitle>Características Clave</DetailTitle>
                        <DetailText>{analysis.keyAttributes}</DetailText>
                      </AnalysisDetail>

                      <AnalysisDetail>
                        <DetailTitle>Recomendado Para</DetailTitle>
                        <DetailText>{analysis.recommendedFor}</DetailText>
                      </AnalysisDetail>

                      <AnalysisDetail>
                        <DetailTitle>Por Qué Esta Pala</DetailTitle>
                        <DetailText>{analysis.whyThisRacket}</DetailText>
                      </AnalysisDetail>

                      <ProsConsContainer>
                        <ProsSection>
                          <ProsConsTitle>✅ Pros</ProsConsTitle>
                          {analysis.pros.map(
                            (pro: string, proIndex: number) => (
                              <ProsConsItem key={proIndex}>
                                <FiCheck
                                  size={16}
                                  style={{ color: "#16a34a", marginTop: "2px" }}
                                />
                                <ProsConsText>{pro}</ProsConsText>
                              </ProsConsItem>
                            )
                          )}
                        </ProsSection>

                        <ConsSection>
                          <ProsConsTitle>⚠️ Consideraciones</ProsConsTitle>
                          {analysis.cons.map(
                            (con: string, conIndex: number) => (
                              <ProsConsItem key={conIndex}>
                                <FiX
                                  size={16}
                                  style={{ color: "#ef4444", marginTop: "2px" }}
                                />
                                <ProsConsText>{con}</ProsConsText>
                              </ProsConsItem>
                            )
                          )}
                        </ConsSection>
                      </ProsConsContainer>
                    </RacketAnalysisCard>
                  )
                )}

                {/* Final Recommendation */}
                <AnalysisSection>
                  <AnalysisTitle>
                    <FiUsers />
                    Recomendación Final
                  </AnalysisTitle>
                  <AnalysisText>
                    <strong>Mejor en general:</strong> {comparisonResults.finalRecommendation.bestOverall}
                    <br /><br />
                    <strong>Mejor relación calidad-precio:</strong> {comparisonResults.finalRecommendation.bestValue}
                    {comparisonResults.finalRecommendation.bestForBeginners && (
                      <>
                        <br /><br />
                        <strong>Mejor para principiantes:</strong> {comparisonResults.finalRecommendation.bestForBeginners}
                      </>
                    )}
                    {comparisonResults.finalRecommendation.bestForAdvanced && (
                      <>
                        <br /><br />
                        <strong>Mejor para avanzados:</strong> {comparisonResults.finalRecommendation.bestForAdvanced}
                      </>
                    )}
                    <br /><br />
                    <strong>Razonamiento:</strong> {comparisonResults.finalRecommendation.reasoning}
                  </AnalysisText>
                </AnalysisSection>
              </ModalBody>
            </ModalContent>
          </Modal>
        )}
      </AnimatePresence>
    </Container>
  );
};

export default CompareRacketsPage;
