import { useComparison } from "../contexts/ComparisonContext";
import { useRackets } from "../contexts/RacketsContext";
import { Racket } from "../types/racket";
import { shouldDisplayCharacteristic } from "../utils/characteristicsUtils";
import { motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
    FiArrowLeft,
    FiExternalLink,
    FiInfo,
    FiLoader,
    FiStar,
    FiTag,
    FiTrendingUp,
} from "react-icons/fi";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import styled from "styled-components";

// Styled Components
const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fdf8 0%, #f0f9f0 100%);
`;

const Header = styled.div`
  background: white;
  border-bottom: 1px solid #e5e7eb;
  padding: 1rem 0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const HeaderContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const BackButton = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #16a34a;
  text-decoration: none;
  font-weight: 500;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  transition: all 0.2s ease;

  &:hover {
    background: #f0f9ff;
    text-decoration: none;
  }
`;

const HeaderTitle = styled.h1`
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
`;

const Content = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  display: grid;
  gap: 2rem;
`;

const MainCard = styled(motion.div)`
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);

  @media (min-width: 768px) {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }
`;

const ImageSection = styled.div`
  position: relative;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: white;
`;

const RacketImage = styled.img`
  width: 100%;
  max-width: 300px;
  height: 350px;
  object-fit: contain;
  border-radius: 12px;
  margin-bottom: 1rem;
`;

const Badge = styled.div<{ variant: "bestseller" | "offer" }>`
  position: absolute;
  top: 1rem;
  ${(props) =>
    props.variant === "bestseller" ? "right: 1rem;" : "left: 1rem;"}
  background: ${(props) =>
    props.variant === "bestseller" ? "#f59e0b" : "#ef4444"};
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const InfoSection = styled.div`
  padding: 2rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`;

const BrandText = styled.div`
  font-size: 1rem;
  font-weight: 600;
  color: #16a34a;
  margin-bottom: 0.5rem;
`;

const ModelText = styled.h2`
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 1.5rem;
  line-height: 1.2;
`;

const PriceContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
`;

const CurrentPrice = styled.div`
  font-size: 2.5rem;
  font-weight: 700;
  color: #ef4444;
`;

const OriginalPrice = styled.div`
  font-size: 1.25rem;
  color: #9ca3af;
  text-decoration: line-through;
`;

const DiscountBadge = styled.div`
  background: #dc2626;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 600;
`;

const ActionButtons = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: auto;
`;

const PrimaryButton = styled.a`
  background: #16a34a;
  color: white;
  padding: 1rem 1.5rem;
  border-radius: 12px;
  text-decoration: none;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s ease;

  &:hover {
    background: #15803d;
    text-decoration: none;
    color: white;
    transform: translateY(-2px);
  }
`;

const SecondaryButton = styled.button<{ disabled?: boolean }>`
  background: ${(props) => (props.disabled ? "#f0f9ff" : "white")};
  color: #16a34a;
  border: 2px solid #16a34a;
  padding: 1rem 1.5rem;
  border-radius: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  cursor: ${(props) => (props.disabled ? "not-allowed" : "pointer")};
  transition: all 0.2s ease;
  opacity: ${(props) => (props.disabled ? "0.7" : "1")};

  &:hover:not(:disabled) {
    background: #f0f9ff;
    transform: translateY(-2px);
  }
`;

const FeaturesCard = styled(motion.div)`
  background: white;
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
`;

const SectionTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const FeatureGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
`;

const FeatureItem = styled.div`
  background: #f9fafb;
  padding: 1.5rem;
  border-radius: 12px;
  text-align: center;
  transition: all 0.2s ease;

  &:hover {
    background: #f3f4f6;
    transform: translateY(-2px);
  }
`;

const FeatureIcon = styled.div<{ color?: string }>`
  font-size: 1.5rem;
  color: ${(props) => props.color || "#16a34a"};
  margin-bottom: 0.5rem;
  display: flex;
  justify-content: center;
`;

const FeatureLabel = styled.div`
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 0.25rem;
`;

const FeatureValue = styled.div<{ color?: string }>`
  font-size: 1rem;
  font-weight: 600;
  color: ${(props) => props.color || "#1f2937"};
`;

const RecommendationCard = styled(motion.div)`
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  padding: 2rem;
  border-radius: 16px;
  border: 1px solid #bae6fd;
`;

const RecommendationText = styled.p`
  color: #0f172a;
  line-height: 1.6;
  margin-bottom: 1.5rem;
`;

const RecommendationButton = styled(Link)`
  background: white;
  color: #16a34a;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  border: 1px solid #16a34a;
  transition: all 0.2s ease;

  &:hover {
    background: #f0f9ff;
    text-decoration: none;
    transform: translateY(-2px);
  }
`;


const CharacteristicsCard = styled(motion.div)`
  background: white;
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
`;

const CharacteristicsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
`;

const CharacteristicCard = styled.div`
  background: linear-gradient(135deg, #f8fdf8 0%, #f0f9f0 100%);
  padding: 1.5rem;
  border-radius: 12px;
  border: 1px solid #e5f3e5;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, #16a34a, #22c55e);
  }

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 25px rgba(22, 163, 74, 0.15);
    border-color: #16a34a;
  }
`;

const CharacteristicHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
`;

const CharacteristicIcon = styled.div<{ color?: string }>`
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: ${(props) => props.color || "#16a34a"};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  font-weight: bold;
  box-shadow: 0 4px 12px ${(props) => props.color || "#16a34a"}33;
`;

const CharacteristicLabel = styled.span`
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const CharacteristicValue = styled.div<{ color?: string }>`
  font-size: 1.125rem;
  font-weight: 700;
  color: ${(props) => props.color || "#1f2937"};
  text-transform: capitalize;
`;

// Specifications styled components
const SpecificationsCard = styled(motion.div)`
  background: white;
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
`;

const SpecificationsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
`;

const SpecificationItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 8px;
  border-left: 3px solid #16a34a;
  transition: all 0.2s ease;

  &:hover {
    background: #f1f5f9;
    transform: translateX(4px);
  }
`;

const SpecificationLabel = styled.span`
  font-weight: 500;
  color: #374151;
  font-size: 0.875rem;
`;

const SpecificationValue = styled.span`
  font-weight: 600;
  color: #16a34a;
  font-size: 0.875rem;
`;

// Helper functions for characteristics
const getCharacteristicsFromRacket = (racket: Racket): Record<string, string> => {
  const characteristics: Record<string, string> = {};
  
  // Map individual characteristic properties to a characteristics object
  if (racket.caracteristicas_marca) characteristics.marca = racket.caracteristicas_marca;
  if (racket.caracteristicas_color) characteristics.color = racket.caracteristicas_color;
  if (racket.caracteristicas_color_2) characteristics.color_2 = racket.caracteristicas_color_2;
  if (racket.caracteristicas_balance) characteristics.balance = racket.caracteristicas_balance;
  if (racket.caracteristicas_nucleo) characteristics.nucleo = racket.caracteristicas_nucleo;
  if (racket.caracteristicas_cara) characteristics.cara = racket.caracteristicas_cara;
  if (racket.caracteristicas_dureza) characteristics.dureza = racket.caracteristicas_dureza;
  if (racket.caracteristicas_nivel_de_juego) characteristics.nivel_de_juego = racket.caracteristicas_nivel_de_juego;
  if (racket.caracteristicas_acabado) characteristics.acabado = racket.caracteristicas_acabado;
  if (racket.caracteristicas_forma) characteristics.forma = racket.caracteristicas_forma;
  if (racket.caracteristicas_superficie) characteristics.superficie = racket.caracteristicas_superficie;
  if (racket.caracteristicas_tipo_de_juego) characteristics.tipo_de_juego = racket.caracteristicas_tipo_de_juego;
  if (racket.caracteristicas_coleccion_jugadores) characteristics.coleccion_jugadores = racket.caracteristicas_coleccion_jugadores;
  if (racket.caracteristicas_jugador) characteristics.jugador = racket.caracteristicas_jugador;
  
  return characteristics;
};

const getCharacteristicLabel = (key: string): string => {
  const labels: Record<string, string> = {
    marca: "Marca",
    color: "Color Principal",
    color_2: "Color Secundario",
    balance: "Balance",
    nucleo: "Núcleo",
    cara: "Material de las Caras",
    dureza: "Dureza",
    nivel_de_juego: "Nivel de Juego",
    acabado: "Acabado",
    forma: "Forma",
    superficie: "Superficie",
    tipo_de_juego: "Tipo de Juego",
    coleccion_jugadores: "Colección",
    jugador: "Jugador",
    nivel_jugador: "Nivel Jugador",
    peso: "Peso",
    grosor: "Grosor",
    material: "Material",
    material_cara: "Material Cara",
    material_marco: "Material Marco",
  };
  return (
    labels[key] ||
    key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
  );
};

const getCharacteristicIcon = (
  key: string,
  value: string
): { icon: string; color: string } => {
  const icons: Record<string, { icon: string; color: string }> = {
    marca: { icon: "🏷️", color: "#16a34a" },
    color: { icon: "🎨", color: "#f59e0b" },
    color_2: { icon: "🌈", color: "#8b5cf6" },
    balance: {
      icon: value.toLowerCase().includes("alto")
        ? "⚡"
        : value.toLowerCase().includes("bajo")
        ? "🛡️"
        : "⚖️",
      color: value.toLowerCase().includes("alto")
        ? "#ef4444"
        : value.toLowerCase().includes("bajo")
        ? "#3b82f6"
        : "#16a34a",
    },
    nucleo: { icon: "🔧", color: "#6b7280" },
    cara: { icon: "💎", color: "#0ea5e9" },
    formato: { icon: "📐", color: "#8b5cf6" },
    dureza: {
      icon: value.toLowerCase().includes("dura")
        ? "🔨"
        : value.toLowerCase().includes("blanda")
        ? "🧽"
        : "🎯",
      color: value.toLowerCase().includes("dura")
        ? "#dc2626"
        : value.toLowerCase().includes("blanda")
        ? "#059669"
        : "#f59e0b",
    },
    nivel_de_juego: { icon: "🏆", color: "#f59e0b" },
    acabado: { icon: "✨", color: "#ec4899" },
    forma: {
      icon: value.toLowerCase().includes("lágrima")
        ? "💧"
        : value.toLowerCase().includes("diamante")
        ? "💎"
        : value.toLowerCase().includes("redonda")
        ? "⭕"
        : "🔷",
      color: "#16a34a",
    },
    superficie: { icon: "🏗️", color: "#6b7280" },
    tipo_de_juego: {
      icon: value.toLowerCase().includes("potencia")
        ? "⚡"
        : value.toLowerCase().includes("control")
        ? "🎯"
        : "🔄",
      color: value.toLowerCase().includes("potencia")
        ? "#ef4444"
        : value.toLowerCase().includes("control")
        ? "#3b82f6"
        : "#16a34a",
    },
    coleccion_jugadores: { icon: "👨‍🎾", color: "#8b5cf6" },
    jugador: { icon: "🎾", color: "#16a34a" },
    nivel_jugador: { icon: "📊", color: "#f59e0b" },
    peso: { icon: "⚖️", color: "#6b7280" },
    grosor: { icon: "📏", color: "#6b7280" },
    material: { icon: "🔧", color: "#6b7280" },
    material_cara: { icon: "💎", color: "#0ea5e9" },
    material_marco: { icon: "🏗️", color: "#6b7280" },
  };

  return icons[key] || { icon: "🔹", color: "#16a34a" };
};

const LoadingContainer = styled.div`
  min-height: 80vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
`;

const LoadingSpinner = styled(motion.div)`
  color: #16a34a;
`;

const LoadingText = styled.div`
  color: #6b7280;
  font-size: 1.125rem;
`;

const ErrorContainer = styled.div`
  min-height: 80vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  text-align: center;
  padding: 2rem;
`;

const ErrorIcon = styled.div`
  font-size: 4rem;
  color: #ef4444;
`;

const ErrorText = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: #374151;
`;

const ErrorDescription = styled.p`
  color: #6b7280;
  max-width: 500px;
`;

// Component
const RacketDetailPage: React.FC = () => {
  // Hooks
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addRacket, isRacketInComparison, count } = useComparison();
  const { rackets, loading } = useRackets();

  // State
  const [racket, setRacket] = useState<Racket | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Get racket ID from URL params
  const racketId = searchParams.get("id");

  // Load racket data
  useEffect(() => {
    if (!racketId) {
      setError("No se especificó el ID de la pala");
      return;
    }

    // Find racket by name (for backward compatibility with existing URLs)
    const decodedRacketId = decodeURIComponent(racketId);
    const foundRacket = rackets.find((pala) => pala.nombre === decodedRacketId);

    if (!foundRacket) {
      setError("No se encontró la pala solicitada");
      return;
    }

    setRacket(foundRacket);
  }, [racketId, rackets]);

  // Handle add to comparison
  const handleAddToComparison = () => {
    if (!racket) return;

    // Check if already in comparison
    if (isRacketInComparison(racket.nombre)) {
      toast.error("Esta pala ya está en el comparador");
      return;
    }

    // Try to add
    const success = addRacket(racket);

    if (!success) {
      if (count >= 3) {
        toast.error(
          "Ya tienes 3 palas en el comparador. Elimina una para añadir esta."
        );
      }
      return;
    }

    // Success
    toast.success(
      `${racket.marca} ${racket.modelo} añadida al comparador (${count + 1}/3)`
    );
  };

  // Handle navigation to comparison
  const handleGoToComparison = () => {
    navigate("/compare-rackets");
  };

  // Loading state (check if rackets are still loading from context)
  if (loading) {
    return (
      <Container>
        <LoadingContainer>
          <LoadingSpinner
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <FiLoader size={48} />
          </LoadingSpinner>
          <LoadingText>Cargando información de la pala...</LoadingText>
        </LoadingContainer>
      </Container>
    );
  }

  // Error state
  if (error || !racket) {
    return (
      <Container>
        <ErrorContainer>
          <ErrorIcon>⚠️</ErrorIcon>
          <ErrorText>Pala no encontrada</ErrorText>
          <ErrorDescription>
            {error || "No se pudo encontrar la información de esta pala."}
          </ErrorDescription>
          <BackButton to="/catalog">
            <FiArrowLeft />
            Volver al catálogo
          </BackButton>
        </ErrorContainer>
      </Container>
    );
  }

  return (
    <Container>
      {/* Header */}
      <Header>
        <HeaderContent>
          <BackButton to="/catalog">
            <FiArrowLeft />
            Volver
          </BackButton>
          <HeaderTitle>Detalles de la Pala</HeaderTitle>
        </HeaderContent>
      </Header>

      {/* Content */}
      <Content>
        {/* Main Card */}
        <MainCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <ImageSection>
            <RacketImage
              src={racket.imagen || "/placeholder-racket.svg"}
              alt={racket.modelo || "Pala de padel"}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "/placeholder-racket.svg";
              }}
            />
            {racket.es_bestseller && (
              <Badge variant="bestseller">
                <FiStar size={16} />
                Top
              </Badge>
            )}
            {racket.en_oferta && (
              <Badge variant="offer">
                <FiTag size={16} />
                Oferta
              </Badge>
            )}
          </ImageSection>

          <InfoSection>
            <div>
              <BrandText>{racket.marca}</BrandText>
              <ModelText>{racket.modelo}</ModelText>

              <PriceContainer>
                <CurrentPrice>€{racket.precio_actual}</CurrentPrice>
                {racket.en_oferta &&
                  racket.precio_original &&
                  racket.precio_original > 0 && (
                    <>
                      <OriginalPrice>€{racket.precio_original}</OriginalPrice>
                      <DiscountBadge>
                        -{racket.descuento_porcentaje}%
                      </DiscountBadge>
                    </>
                  )}
              </PriceContainer>
            </div>

            <ActionButtons>
              <PrimaryButton
                href={racket.enlace}
                target="_blank"
                rel="noopener noreferrer"
              >
                <FiExternalLink />
                Ver en Padel Nuestro
              </PrimaryButton>

              <SecondaryButton
                onClick={handleAddToComparison}
                disabled={isRacketInComparison(racket.nombre)}
              >
                {isRacketInComparison(racket.nombre) ? (
                  <>
                    <FiTrendingUp />
                    En el Comparador
                  </>
                ) : (
                  <>
                    <FiTrendingUp />
                    Añadir al Comparador ({count}/3)
                  </>
                )}
              </SecondaryButton>

              {count > 0 && (
                <SecondaryButton onClick={handleGoToComparison}>
                  Ir al Comparador ({count})
                </SecondaryButton>
              )}
            </ActionButtons>
          </InfoSection>
        </MainCard>

        {/* Racket Characteristics */}
        {(() => {
          const characteristics = getCharacteristicsFromRacket(racket);
          return Object.keys(characteristics).length > 0 && (
            <CharacteristicsCard
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <SectionTitle>
                <FiStar />
                Características Técnicas
              </SectionTitle>
              <CharacteristicsGrid>
                {Object.entries(characteristics).map(([key, value]) => {
                  if (!shouldDisplayCharacteristic(key, value)) return null;

                  const label = getCharacteristicLabel(key);
                  const { icon, color } = getCharacteristicIcon(key, value);

                  return (
                    <CharacteristicCard key={key}>
                      <CharacteristicHeader>
                        <CharacteristicIcon color={color}>
                          {icon}
                        </CharacteristicIcon>
                        <CharacteristicLabel>{label}</CharacteristicLabel>
                      </CharacteristicHeader>
                      <CharacteristicValue color={color}>
                        {value}
                      </CharacteristicValue>
                    </CharacteristicCard>
                  );
                })}
              </CharacteristicsGrid>
            </CharacteristicsCard>
          );
        })()}

        {/* Features Card - Now focusing on status and metadata */}
        <FeaturesCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <SectionTitle>
            <FiTag />
            Estado y Disponibilidad
          </SectionTitle>

          <FeatureGrid>
            <FeatureItem>
              <FeatureIcon color={racket.es_bestseller ? "#f59e0b" : "#9ca3af"}>
                🏆
              </FeatureIcon>
              <FeatureLabel>Bestseller</FeatureLabel>
              <FeatureValue
                color={racket.es_bestseller ? "#16a34a" : "#9ca3af"}
              >
                {racket.es_bestseller ? "Sí" : "No"}
              </FeatureValue>
            </FeatureItem>

            <FeatureItem>
              <FeatureIcon color={racket.en_oferta ? "#ef4444" : "#9ca3af"}>
                🏷️
              </FeatureIcon>
              <FeatureLabel>En Oferta</FeatureLabel>
              <FeatureValue color={racket.en_oferta ? "#ef4444" : "#9ca3af"}>
                {racket.en_oferta ? "Sí" : "No"}
              </FeatureValue>
            </FeatureItem>

            <FeatureItem>
              <FeatureIcon>🏪</FeatureIcon>
              <FeatureLabel>Tienda</FeatureLabel>
              <FeatureValue>Padel Nuestro</FeatureValue>
            </FeatureItem>

            <FeatureItem>
              <FeatureIcon color="#9ca3af">⏰</FeatureIcon>
              <FeatureLabel>Actualizado</FeatureLabel>
              <FeatureValue>
                {racket.scrapeado_en
                  ? new Date(racket.scrapeado_en).toLocaleDateString("es-ES")
                  : "N/A"}
              </FeatureValue>
            </FeatureItem>
          </FeatureGrid>
        </FeaturesCard>

        {/* Racket Specifications (if available) */}
        {racket.especificaciones &&
          Object.keys(racket.especificaciones).length > 0 && (
            <SpecificationsCard
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.35 }}
            >
              <SectionTitle>
                <FiInfo />
                Especificaciones Técnicas
              </SectionTitle>
              <SpecificationsGrid>
                {Object.entries(racket.especificaciones).map(([key, value]) => {
                  if (!value) return null;

                  return (
                    <SpecificationItem key={key}>
                      <SpecificationLabel>
                        {getCharacteristicLabel(key)}
                      </SpecificationLabel>
                      <SpecificationValue>{String(value)}</SpecificationValue>
                    </SpecificationItem>
                  );
                })}
              </SpecificationsGrid>
            </SpecificationsCard>
          )}

        {/* Recommendation Card */}
        <RecommendationCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <SectionTitle>💡 ¿Necesitas más opciones?</SectionTitle>

          <RecommendationText>
            Si esta pala no es exactamente lo que buscas, puedes explorar
            nuestra colección completa de palas de pádel o usar nuestro sistema
            de recomendaciones con IA para encontrar la pala perfecta según tu
            perfil de jugador y estilo de juego.
          </RecommendationText>

          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <RecommendationButton to="/catalog">
              🎾 Ver todas las palas
            </RecommendationButton>
            <RecommendationButton
              to="/best-racket"
              style={{
                background: "#16a34a",
                color: "white",
                borderColor: "#16a34a",
              }}
            >
              ✨ Buscar mi pala ideal
            </RecommendationButton>
          </div>
        </RecommendationCard>
      </Content>
    </Container>
  );
};

export default RacketDetailPage;
