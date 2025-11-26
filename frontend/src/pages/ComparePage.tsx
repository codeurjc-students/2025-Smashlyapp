import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FiCpu, FiLayers, FiArrowRight } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #f8faf8 0%, #e8f5e8 100%);
  padding-bottom: 4rem;
`;

const Header = styled.div`
  background: white;
  border-bottom: 1px solid #e5e7eb;
  padding: 3rem 0;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
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
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;
`;

const MainContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 4rem 2rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 2rem;
`;

const Card = styled(motion.div)`
  background: white;
  border-radius: 24px;
  padding: 3rem 2rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(22, 163, 74, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;

  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 20px 40px rgba(22, 163, 74, 0.15);
    border-color: #16a34a;

    .icon-container {
      background: #16a34a;
      color: white;
      transform: scale(1.1);
    }

    .arrow-icon {
      transform: translateX(4px);
      opacity: 1;
    }
  }
`;

const IconContainer = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 20px;
  background: #f0fdf4;
  color: #16a34a;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  margin-bottom: 2rem;
  transition: all 0.3s ease;
`;

const CardTitle = styled.h2`
  font-size: 1.75rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 1rem;
`;

const CardDescription = styled.p`
  font-size: 1rem;
  color: #6b7280;
  margin-bottom: 2rem;
  line-height: 1.6;
  flex-grow: 1;
`;

const ActionButton = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: #16a34a;
  font-size: 1.125rem;
`;

const ArrowIcon = styled(FiArrowRight)`
  transition: all 0.3s ease;
  opacity: 0.7;
`;

const ComparePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Container>
      <Header>
        <Title>
          Encuentra tu <span className='highlight'>Pala Ideal</span>
        </Title>
        <Subtitle>
          Utiliza nuestras herramientas avanzadas para encontrar la pala perfecta para tu estilo de
          juego o compara diferentes modelos
        </Subtitle>
      </Header>

      <MainContent>
        <Card
          onClick={() => navigate('/best-racket')}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <IconContainer className='icon-container'>
            <FiCpu />
          </IconContainer>
          <CardTitle>Mejor pala para ti</CardTitle>
          <CardDescription>
            Nuestro algoritmo de IA analiza tu estilo de juego, nivel y preferencias para
            recomendarte las palas que mejor se adaptan a ti.
          </CardDescription>
          <ActionButton>
            Descubrir ahora <ArrowIcon className='arrow-icon' />
          </ActionButton>
        </Card>

        <Card
          onClick={() => navigate('/compare-rackets')} // Assuming this route exists or will be created, or maybe this page IS the compare page but leads to a specific tool?
          // Wait, the user said "No hagas la seccion de palas mas vendidas, solo la de mejor pala para ti y la de compara palas".
          // If I am IN the compare page, maybe these should open modals or navigate to specific tools?
          // For now I'll assume they navigate to specific routes or sections.
          // Actually, if this IS the compare page, maybe I should implement the functionality here?
          // But the design looks like a landing for these tools.
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <IconContainer className='icon-container'>
            <FiLayers />
          </IconContainer>
          <CardTitle>Comparar palas</CardTitle>
          <CardDescription>
            Selecciona y compara detalladamente las características técnicas, precios y opiniones de
            hasta 3 palas simultáneamente.
          </CardDescription>
          <ActionButton>
            Empezar a comparar <ArrowIcon className='arrow-icon' />
          </ActionButton>
        </Card>
      </MainContent>
    </Container>
  );
};

export default ComparePage;
