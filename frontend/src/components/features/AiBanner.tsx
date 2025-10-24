import { motion } from "framer-motion";
import React from "react";
import { FiTarget, FiTrendingUp, FiZap } from "react-icons/fi";
import styled from "styled-components";

const BannerContainer = styled(motion.div)`
  background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
  border-radius: 24px;
  padding: 3rem 2rem;
  margin: 4rem auto;
  max-width: 1000px;
  color: white;
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="white" opacity="0.1"/><circle cx="75" cy="75" r="1" fill="white" opacity="0.1"/><circle cx="75" cy="25" r="1" fill="white" opacity="0.05"/><circle cx="25" cy="75" r="1" fill="white" opacity="0.05"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
    opacity: 0.3;
  }

  @media (max-width: 768px) {
    margin: 2rem 1rem;
    padding: 2rem 1.5rem;
  }
`;

const BannerContent = styled.div`
  position: relative;
  z-index: 1;
  text-align: center;
`;

const BannerTitle = styled.h2`
  font-size: 2.5rem;
  font-weight: 800;
  margin-bottom: 1rem;
  line-height: 1.2;

  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const BannerSubtitle = styled.p`
  font-size: 1.25rem;
  margin-bottom: 2rem;
  opacity: 0.9;
  line-height: 1.5;

  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

const FeaturesRow = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
  margin: 3rem 0;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1.5rem;
    margin: 2rem 0;
  }
`;

const FeatureItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 1rem;
`;

const FeatureIcon = styled.div`
  width: 60px;
  height: 60px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
  color: white;
  font-size: 1.5rem;
`;

const FeatureText = styled.div`
  font-weight: 600;
  font-size: 1rem;
  opacity: 0.95;
`;

const CTASection = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
`;

const CTAButton = styled(motion.button)<{ variant?: "primary" | "secondary" }>`
  padding: 1rem 2rem;
  border-radius: 12px;
  border: ${(props) =>
    props.variant === "secondary"
      ? "2px solid rgba(255, 255, 255, 0.3)"
      : "none"};
  background: ${(props) =>
    props.variant === "secondary" ? "transparent" : "rgba(255, 255, 255, 0.2)"};
  color: white;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;

  &:hover {
    background: ${(props) =>
      props.variant === "secondary"
        ? "rgba(255, 255, 255, 0.1)"
        : "rgba(255, 255, 255, 0.3)"};
    transform: translateY(-2px);
  }
`;

const AiBanner: React.FC = () => {
  return (
    <BannerContainer
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
    >
      <BannerContent>
        <BannerTitle>🤖 Potenciado por Inteligencia Artificial</BannerTitle>
        <BannerSubtitle>
          Descubre la mejor pala para tu juego con análisis personalizado y
          comparaciones inteligentes
        </BannerSubtitle>

        <FeaturesRow>
          <FeatureItem>
            <FeatureIcon>
              <FiTarget />
            </FeatureIcon>
            <FeatureText>Recomendaciones Personalizadas</FeatureText>
          </FeatureItem>
          <FeatureItem>
            <FeatureIcon>
              <FiTrendingUp />
            </FeatureIcon>
            <FeatureText>Análisis Comparativo</FeatureText>
          </FeatureItem>
          <FeatureItem>
            <FeatureIcon>
              <FiZap />
            </FeatureIcon>
            <FeatureText>Resultados Instantáneos</FeatureText>
          </FeatureItem>
        </FeaturesRow>

        <CTASection>
          {/* <CTAButton
            variant="primary"
            onClick={() => navigate("/rackets")}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FiZap />
            Encontrar Mi Pala Ideal
            <FiChevronRight />
          </CTAButton>
          <CTAButton
            variant="secondary"
            onClick={() => navigate("/compare-rackets")}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FiTrendingUp />
            Comparar Palas
          </CTAButton> */}
          <CTAButton>
            <FiZap />
            Pronto Disponible
          </CTAButton>
        </CTASection>
      </BannerContent>
    </BannerContainer>
  );
};

export default AiBanner;
