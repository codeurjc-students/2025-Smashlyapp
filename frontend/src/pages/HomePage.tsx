import { AnimatePresence, motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import { FiDatabase, FiDollarSign, FiSearch, FiTarget, FiZap } from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import AiBanner from '../components/features/AiBanner';
import { useAuth } from '../contexts/AuthContext';

const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #f8faf8 0%, #ffffff 100%);
`;

const HeroSection = styled.section`
  padding: clamp(60px, 10vw, 100px) 20px;
  text-align: center;
  background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
  color: white;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.05) 0%, transparent 50%),
                radial-gradient(circle at 80% 50%, rgba(255, 255, 255, 0.05) 0%, transparent 50%);
    pointer-events: none;
  }
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
  font-size: clamp(0.75rem, 2vw, 14px);
  margin-bottom: clamp(16px, 4vw, 24px);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const Title = styled(motion.h1)`
  font-size: clamp(2rem, 6vw, 4rem);
  font-weight: 800;
  margin-bottom: clamp(16px, 4vw, 24px);
  line-height: 1.2;
  text-align: center;
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
  padding: 0 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  position: relative;
`;

const TitleStaticBefore = styled.span`
  display: block;
  white-space: nowrap;

  @media (max-width: 600px) {
    white-space: normal;
  }
`;

const RotatingText = styled.span`
  color: #fbbf24;
  display: block;
  text-align: center;
  white-space: nowrap;

  @media (max-width: 640px) {
    font-size: 0.9em;
    white-space: normal;
    max-width: 90vw;
  }

  @media (max-width: 480px) {
    font-size: 0.85em;
  }
`;

const Subtitle = styled(motion.p)`
  font-size: clamp(1rem, 2.5vw, 1.25rem);
  margin-bottom: clamp(24px, 5vw, 40px);
  opacity: 0.9;
  line-height: 1.6;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
  padding: 0 20px;
`;

const CTAButtons = styled(motion.div)`
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
  padding: 0 20px;
`;

const PrimaryButton = styled(Link)`
  display: flex;
  align-items: center;
  gap: 8px;
  background: white;
  color: #16a34a;
  padding: clamp(12px, 3vw, 16px) clamp(20px, 4vw, 32px);
  border-radius: 12px;
  text-decoration: none;
  font-weight: 600;
  font-size: clamp(0.9rem, 2vw, 1.125rem);
  transition: all 0.2s ease;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  white-space: nowrap;

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
  padding: clamp(12px, 3vw, 16px) clamp(20px, 4vw, 32px);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  text-decoration: none;
  font-weight: 600;
  font-size: clamp(0.9rem, 2vw, 1.125rem);
  transition: all 0.2s ease;
  white-space: nowrap;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.5);
    text-decoration: none;
    color: white;
  }
`;

const FeaturesSection = styled.section`
  padding: clamp(48px, 8vw, 80px) 20px;
`;

const FeaturesContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const SectionTitle = styled.h2`
  text-align: center;
  font-size: clamp(1.75rem, 4vw, 2.5rem);
  font-weight: 800;
  margin-bottom: 16px;
  color: #1f2937;
`;

const SectionSubtitle = styled.p`
  text-align: center;
  font-size: clamp(1rem, 2vw, 1.25rem);
  color: #6b7280;
  margin-bottom: clamp(40px, 8vw, 64px);
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
`;

const FeaturesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: clamp(20px, 4vw, 32px);

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const FeatureCard = styled(motion.div)`
  background: white;
  padding: clamp(24px, 4vw, 32px);
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
  width: clamp(48px, 10vw, 64px);
  height: clamp(48px, 10vw, 64px);
  background: linear-gradient(135deg, #16a34a, #22c55e);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24px;
  color: white;
  font-size: clamp(18px, 4vw, 24px);
`;

const FeatureTitle = styled.h3`
  font-size: clamp(1rem, 2.5vw, 1.25rem);
  font-weight: 600;
  margin-bottom: 12px;
  color: #1f2937;
`;

const FeatureDescription = styled.p`
  color: #6b7280;
  line-height: 1.6;
  font-size: clamp(0.875rem, 1.5vw, 1rem);
`;

const StatsSection = styled.section`
  background: #f8faf8;
  padding: clamp(40px, 8vw, 60px) 20px;
`;

const StatsGrid = styled.div`
  max-width: 800px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: clamp(20px, 5vw, 32px);
  text-align: center;
`;

const StatItem = styled.div`
  h3 {
    font-size: clamp(2rem, 5vw, 2.5rem);
    font-weight: 800;
    color: #16a34a;
    margin-bottom: 8px;
  }

  p {
    color: #6b7280;
    font-weight: 500;
    font-size: clamp(0.875rem, 2vw, 1rem);
  }
`;

const HomePage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect authenticated users to their respective dashboards
  useEffect(() => {
    if (isAuthenticated && user?.role) {
      const role = user.role.toLowerCase();
      if (role === 'player') {
        navigate('/dashboard', { replace: true });
      } else if (role === 'admin') {
        navigate('/admin', { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  const phrases = [
    'conocer y mejorar mas sobre pádel',
    'encontrar la mejor pala para ti',
    'encontrar entrenadores cerca de ti',
    'comparar precios',
    'mejorar tu rendimiento en pista',
  ];

  const [phraseIndex, setPhraseIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setPhraseIndex(prev => (prev + 1) % phrases.length);
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
            <TitleStaticBefore>La aplicacion que te permite</TitleStaticBefore>
            <RotatingText aria-live='polite'>
              <AnimatePresence mode='wait'>
                <motion.span
                  key={phrases[phraseIndex]}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.35 }}
                  style={{ display: 'inline-block' }}
                >
                  {phrases[phraseIndex]}
                </motion.span>
              </AnimatePresence>
            </RotatingText>
          </Title>

          <Subtitle
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            En Smashly, tenemos como objetivo ayudarte a mejorar tu juego de forma sencilla y
            efectiva.
          </Subtitle>

          <CTAButtons
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <PrimaryButton to='/catalog'>
              <FiSearch size={20} />
              Explorar catálogo
            </PrimaryButton>
            <SecondaryButton to='/rackets'>
              <FiTarget size={20} />
              Encontrar mi pala ideal
            </SecondaryButton>
          </CTAButtons>
        </HeroContent>
      </HeroSection>

      <FeaturesSection>
        <FeaturesContent>
          <SectionTitle>¿Por qué elegir Smashly?</SectionTitle>
          <SectionSubtitle>La tecnología más avanzada para encontrar tu pala ideal</SectionSubtitle>

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
                Compara hasta 3 palas lado a lado con análisis detallado de pros y contras para cada
                modelo.
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
                Más de 800 modelos de las mejores marcas con precios actualizados en tiempo real.
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
                Encuentra cualquier pala al instante con nuestro buscador global avanzado y filtros
                inteligentes.
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
                Encuentra tu pala favorita y obtén el mejor precio entre todas las tiendas
              </FeatureDescription>
            </FeatureCard>
          </FeaturesGrid>
        </FeaturesContent>
      </FeaturesSection>

      <AiBanner />

      <StatsSection>
        <StatsGrid>
          <StatItem>
            <h3>+800</h3>
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
