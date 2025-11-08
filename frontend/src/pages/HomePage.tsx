import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import {
  FiDatabase,
  FiDollarSign,
  FiSearch,
  FiTarget,
  FiZap,
} from "react-icons/fi";
import { Link } from "react-router-dom";
import styled from "styled-components";
import AiBanner from "../components/features/AiBanner";

const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #f8faf8 0%, #ffffff 100%);
`;

const HeroSection = styled.section`
  padding: 80px 20px;
  text-align: center;
  background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
  color: white;
`;

const HeroContent = styled.div`
  max-width: 1100px;
  margin: 0 auto;
`;

const Badge = styled(motion.div)`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.1);
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  margin-bottom: 24px;
  backdrop-filter: blur(10px);
`;

const Title = styled(motion.h1)`
  font-size: clamp(2.5rem, 5vw, 4rem);
  font-weight: 800;
  margin-bottom: 24px;
  line-height: 1.1;
  display: inline-flex;
  flex-wrap: wrap; /* allow wrapping between static and group */
  align-items: baseline;
  gap: 0.5rem;
`;

const TitleStaticBefore = styled.span`
  white-space: normal;
  display: inline-block;
  overflow-wrap: anywhere;
  flex: 0 1 auto;
  /* Limit the first part so the group can wrap to next line */
  @media (min-width: 900px) {
    max-inline-size: 22ch;
  }
`;

const TitleGroup = styled.span`
  display: inline-flex;
  align-items: baseline;
  gap: 0.5rem;
  white-space: nowrap; /* keep 'permite' + dynamic together */
  flex: 0 0 auto; /* keep group from shrinking and break as a whole */
`;

const RotatingText = styled.span`
  color: #fbbf24;
  white-space: nowrap;
  display: inline-flex;
  align-items: baseline;
`;

const Subtitle = styled(motion.p)`
  font-size: 1.25rem;
  margin-bottom: 40px;
  opacity: 0.9;
  line-height: 1.6;
`;

const CTAButtons = styled(motion.div)`
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
`;

const PrimaryButton = styled(Link)`
  display: flex;
  align-items: center;
  gap: 8px;
  background: white;
  color: #16a34a;
  padding: 16px 32px;
  border-radius: 12px;
  text-decoration: none;
  font-weight: 600;
  font-size: 1.125rem;
  transition: all 0.2s ease;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
    text-decoration: none;
    color: #15803d;
  }
`;

const SecondaryButton = styled(Link)`
  display: flex;
  align-items: center;
  gap: 8px;
  background: transparent;
  color: white;
  padding: 16px 32px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  text-decoration: none;
  font-weight: 600;
  font-size: 1.125rem;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.5);
    text-decoration: none;
    color: white;
  }
`;

const FeaturesSection = styled.section`
  padding: 80px 20px;
`;

const FeaturesContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const SectionTitle = styled.h2`
  text-align: center;
  font-size: 2.5rem;
  font-weight: 800;
  margin-bottom: 16px;
  color: #1f2937;
`;

const SectionSubtitle = styled.p`
  text-align: center;
  font-size: 1.25rem;
  color: #6b7280;
  margin-bottom: 64px;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
`;

const FeaturesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 32px;
`;

const FeatureCard = styled(motion.div)`
  background: white;
  padding: 32px;
  border-radius: 16px;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  }
`;

const FeatureIcon = styled.div`
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, #16a34a, #22c55e);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24px;
  color: white;
  font-size: 24px;
`;

const FeatureTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 12px;
  color: #1f2937;
`;

const FeatureDescription = styled.p`
  color: #6b7280;
  line-height: 1.6;
`;

const StatsSection = styled.section`
  background: #f8faf8;
  padding: 60px 20px;
`;

const StatsGrid = styled.div`
  max-width: 800px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 32px;
  text-align: center;
`;

const StatItem = styled.div`
  h3 {
    font-size: 2.5rem;
    font-weight: 800;
    color: #16a34a;
    margin-bottom: 8px;
  }

  p {
    color: #6b7280;
    font-weight: 500;
  }
`;

const HomePage: React.FC = () => {
  const phrases = [
    "conocer y mejorar mas sobre pádel",
    "encontrar la mejor pala para ti",
    "encontrar entrenadores cerca de ti",
    "comparar precios",
    "mejorar tu rendimiento en pista",
  ];

  const [phraseIndex, setPhraseIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setPhraseIndex((prev) => (prev + 1) % phrases.length);
    }, 2500);
    return () => clearInterval(id);
  }, [phrases.length]);
  return (
    <Container>
      <HeroSection>
        <HeroContent>
          <Badge
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <FiZap size={16} />
            Impulsado por IA
          </Badge>

          <Title
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <TitleStaticBefore>La aplicacion que te </TitleStaticBefore>
            <wbr />
            <TitleGroup>
              <span>permite</span>
              <RotatingText aria-live="polite">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={phrases[phraseIndex]}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.35 }}
                    style={{ display: "inline-block" }}
                  >
                    {phrases[phraseIndex]}
                  </motion.span>
                </AnimatePresence>
              </RotatingText>
            </TitleGroup>
          </Title>

          <Subtitle
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            En Smashly, tenemos como objetivo ayudarte a mejorar tu juego de
            forma sencilla y efectiva.
          </Subtitle>

          <CTAButtons
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <PrimaryButton to="/catalog">
              <FiSearch size={20} />
              Explorar catálogo
            </PrimaryButton>
            <SecondaryButton to="/rackets">
              <FiTarget size={20} />
              Encontrar mi pala ideal
            </SecondaryButton>
          </CTAButtons>
        </HeroContent>
      </HeroSection>

      <FeaturesSection>
        <FeaturesContent>
          <SectionTitle>¿Por qué elegir Smashly?</SectionTitle>
          <SectionSubtitle>
            La tecnología más avanzada para encontrar tu pala ideal
          </SectionSubtitle>

          <FeaturesGrid>
            <FeatureCard
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <FeatureIcon>
                <FiTarget />
              </FeatureIcon>
              <FeatureTitle>Comparador Inteligente</FeatureTitle>
              <FeatureDescription>
                Compara hasta 3 palas lado a lado con análisis detallado de pros
                y contras para cada modelo.
              </FeatureDescription>
            </FeatureCard>

            <FeatureCard
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
            >
              <FeatureIcon>
                <FiDatabase />
              </FeatureIcon>
              <FeatureTitle>Base de Datos Completa</FeatureTitle>
              <FeatureDescription>
                Más de 800 modelos de las mejores marcas con precios
                actualizados en tiempo real.
              </FeatureDescription>
            </FeatureCard>

            <FeatureCard
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              viewport={{ once: true }}
            >
              <FeatureIcon>
                <FiSearch />
              </FeatureIcon>
              <FeatureTitle>Búsqueda Inteligente</FeatureTitle>
              <FeatureDescription>
                Encuentra cualquier pala al instante con nuestro buscador global
                avanzado y filtros inteligentes.
              </FeatureDescription>
            </FeatureCard>

            <FeatureCard
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              viewport={{ once: true }}
            >
              <FeatureIcon>
                <FiDollarSign />
              </FeatureIcon>
              <FeatureTitle>Comparador de precios</FeatureTitle>
              <FeatureDescription>
                Encuentra tu pala favorita y obtén el mejor precio entre todas
                las tiendas
              </FeatureDescription>
            </FeatureCard>
          </FeaturesGrid>
        </FeaturesContent>
      </FeaturesSection>

      <AiBanner />

      <StatsSection>
        <StatsGrid>
          <StatItem>
            <h3>+1000</h3>
            <p>Palas analizadas</p>
          </StatItem>
          <StatItem>
            <h3>95%</h3>
            <p>Precisión IA</p>
          </StatItem>
          <StatItem>
            <h3>24/7</h3>
            <p>Disponibilidad</p>
          </StatItem>
        </StatsGrid>
      </StatsSection>
    </Container>
  );
};

export default HomePage;
