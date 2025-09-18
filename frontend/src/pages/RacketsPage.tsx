import { motion } from "framer-motion";
import React from "react";
import {
  FiChevronRight,
  FiLayers,
  FiSearch,
  FiStar,
  FiTarget,
  FiTrendingUp,
  FiZap
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";

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

const MainTitle = styled.h1`
  font-size: 3rem;
  font-weight: 800;
  color: #1f2937;
  margin-bottom: 1rem;
  line-height: 1.2;

  @media (max-width: 768px) {
    font-size: 2.5rem;
  }
`;

const HighlightText = styled.span`
  color: #16a34a;
`;

const Subtitle = styled.p`
  font-size: 1.25rem;
  color: #6b7280;
  margin-bottom: 2rem;
  line-height: 1.6;
  padding: 0 2rem;

  @media (max-width: 768px) {
    font-size: 1rem;
    padding: 0 1rem;
  }
`;

const FeaturesGrid = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 2rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    padding: 0 1rem;
    gap: 1.5rem;
  }
`;

const FeatureCard = styled(motion.div)<{ isRecommended?: boolean }>`
  background: white;
  border-radius: 24px;
  padding: 2rem;
  box-shadow: 0 20px 60px rgba(22, 163, 74, 0.1);
  border: ${(props) =>
    props.isRecommended
      ? "2px solid #16a34a"
      : "1px solid rgba(22, 163, 74, 0.1)"};
  position: relative;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 30px 80px rgba(22, 163, 74, 0.15);
  }
`;

const RecommendedBadge = styled.div`
  position: absolute;
  top: -12px;
  right: 2rem;
  background: #16a34a;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 600;
  z-index: 1;
`;

const IconContainer = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.5rem;
  color: #16a34a;
`;

const FeatureTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.5rem;
`;

const FeatureDescription = styled.p`
  font-size: 1rem;
  color: #6b7280;
  margin-bottom: 1rem;
  font-weight: 500;
`;

const FeatureDetailText = styled.p`
  font-size: 0.875rem;
  color: #4b5563;
  line-height: 1.6;
  margin-bottom: 2rem;
`;

const ActionButton = styled(motion.button)`
  width: 100%;
  background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
  color: white;
  border: none;
  padding: 1rem 1.5rem;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s ease;

  &:hover {
    background: linear-gradient(135deg, #15803d 0%, #166534 100%);
    transform: translateY(-2px);
  }
`;

const StatsSection = styled.div`
  max-width: 800px;
  margin: 4rem auto 0;
  padding: 0 2rem;
  text-align: center;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
  margin-top: 2rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
`;

const StatCard = styled.div`
  background: white;
  padding: 1.5rem;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(22, 163, 74, 0.1);
`;

const StatNumber = styled.div`
  font-size: 2rem;
  font-weight: 800;
  color: #16a34a;
  margin-bottom: 0.5rem;
`;

const StatLabel = styled.div`
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
`;

const RacketsPage: React.FC = () => {
  const navigate = useNavigate();

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  const features = [
    {
      id: 1,
      icon: <FiTrendingUp size={32} />,
      title: "Palas más vendidas",
      description: "Descubre las palas favoritas de la comunidad",
      detail:
        "Explora el ranking de las palas más populares entre los jugadores de pádel amateur, con valoraciones reales y opiniones verificadas.",
      action: "Ver catálogo completo",
      path: "/catalog",
      available: true,
    },
    {
      id: 2,
      icon: <FiSearch size={32} />,
      title: "La mejor pala para ti",
      description: "Recomendaciones personalizadas según tu perfil",
      detail:
        "Responde a unas sencillas preguntas sobre tu nivel, estilo de juego y preferencias para recibir recomendaciones personalizadas con IA.",
      action: "Encontrar mi pala ideal",
      path: "/best-racket",
      isRecommended: true,
      available: true,
    },
    {
      id: 3,
      icon: <FiLayers size={32} />,
      title: "Compara palas",
      description: "Analiza las diferencias entre modelos",
      detail:
        "Selecciona hasta 3 modelos diferentes para comparar sus características técnicas, precios y recibir un análisis completo con IA.",
      action: "Comparar palas",
      path: "/compare-rackets",
      available: true,
    },
  ];

  return (
    <Container>
      <HeroSection>
        <MainTitle>
          Comparador de <HighlightText>Palas de Pádel</HighlightText>
        </MainTitle>
        <Subtitle>
          Encuentra la pala perfecta para tu estilo de juego, compara modelos y
          descubre las mejores opciones del mercado con inteligencia artificial.
        </Subtitle>
      </HeroSection>

      <FeaturesGrid>
        {features.map((feature, index) => (
          <FeatureCard
            key={feature.id}
            isRecommended={feature.isRecommended}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            onClick={() => feature.available && handleNavigate(feature.path)}
            style={{
              cursor: feature.available ? "pointer" : "default",
              opacity: feature.available ? 1 : 0.7,
            }}
          >
            {feature.isRecommended && (
              <RecommendedBadge>
                <FiStar size={14} style={{ marginRight: "0.25rem" }} />
                Recomendado
              </RecommendedBadge>
            )}

            <IconContainer>{feature.icon}</IconContainer>

            <FeatureTitle>{feature.title}</FeatureTitle>
            <FeatureDescription>{feature.description}</FeatureDescription>
            <FeatureDetailText>{feature.detail}</FeatureDetailText>

            <ActionButton
              whileHover={{ scale: feature.available ? 1.02 : 1 }}
              whileTap={{ scale: feature.available ? 0.98 : 1 }}
              disabled={!feature.available}
              style={{
                background: feature.available
                  ? "linear-gradient(135deg, #16a34a 0%, #15803d 100%)"
                  : "#9ca3af",
                cursor: feature.available ? "pointer" : "not-allowed",
              }}
            >
              {feature.available ? (
                <>
                  {feature.isRecommended ? (
                    <FiZap size={16} />
                  ) : (
                    <FiTarget size={16} />
                  )}
                  {feature.action}
                  <FiChevronRight size={16} />
                </>
              ) : (
                <>
                  <FiTarget size={16} />
                  Próximamente
                </>
              )}
            </ActionButton>
          </FeatureCard>
        ))}
      </FeaturesGrid>

      <StatsSection>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <h3
            style={{
              fontSize: "1.5rem",
              fontWeight: "700",
              color: "#1f2937",
              marginBottom: "0.5rem",
            }}
          >
            ¿Por qué elegir nuestro comparador?
          </h3>
          <p
            style={{
              fontSize: "1rem",
              color: "#6b7280",
              marginBottom: "2rem",
            }}
          >
            Datos actualizados y análisis con inteligencia artificial
          </p>

          <StatsGrid>
            <StatCard>
              <StatNumber>800+</StatNumber>
              <StatLabel>Palas analizadas</StatLabel>
            </StatCard>
            <StatCard>
              <StatNumber>AI</StatNumber>
              <StatLabel>Análisis con IA</StatLabel>
            </StatCard>
            <StatCard>
              <StatNumber>24/7</StatNumber>
              <StatLabel>Disponible siempre</StatLabel>
            </StatCard>
          </StatsGrid>
        </motion.div>
      </StatsSection>
    </Container>
  );
};

export default RacketsPage;
