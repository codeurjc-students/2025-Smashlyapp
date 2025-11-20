import { motion } from 'framer-motion';
import React from 'react';
import {
  FiActivity,
  FiAward,
  FiCircle,
  FiCrosshair,
  FiLayers,
  FiShield,
  FiTarget,
  FiTrendingUp,
  FiZap,
} from 'react-icons/fi';
import { GiWeightScale } from 'react-icons/gi';
import { TbDiamond } from 'react-icons/tb';
import styled from 'styled-components';

interface RacketFeaturesProps {
  characteristics: {
    balance?: string;
    core?: string;
    face?: string;
    hardness?: string;
    shape?: string;
    surface?: string;
    game_type?: string;
    game_level?: string;
  };
  specs?: {
    peso?: string;
    marco?: string;
    tecnologias?: string[];
  };
}

const FeaturesContainer = styled(motion.div)`
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
`;

const SectionTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 2rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const FeaturesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const FeatureCard = styled(motion.div)`
  background: linear-gradient(135deg, #f8fdf8 0%, #f0f9f0 100%);
  border: 1px solid #d1fae5;
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 20px rgba(22, 163, 74, 0.15);
    border-color: #16a34a;
  }
`;

const FeatureHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const FeatureIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.25rem;
  box-shadow: 0 4px 12px rgba(22, 163, 74, 0.3);
`;

const FeatureInfo = styled.div`
  flex: 1;
`;

const FeatureLabel = styled.div`
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const FeatureValue = styled.div`
  font-size: 1.125rem;
  font-weight: 700;
  color: #1f2937;
  margin-top: 0.25rem;
`;

const TechnologiesSection = styled.div`
  margin-top: 1rem;
  padding-top: 1.5rem;
  border-top: 2px solid #e5e7eb;
`;

const TechnologiesTitle = styled.h4`
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const TechnologiesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.75rem;
`;

const TechnologyBadge = styled(motion.div)`
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border: 1px solid #bae6fd;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #0c4a6e;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;

  &:hover {
    background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
    border-color: #0ea5e9;
    transform: translateX(4px);
  }
`;

const TechnologyIcon = styled.div`
  width: 24px;
  height: 24px;
  border-radius: 6px;
  background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 0.75rem;
  flex-shrink: 0;
`;

// Función helper para obtener el icono según la característica
const getFeatureIcon = (key: string) => {
  const icons: Record<string, React.ReactNode> = {
    balance: <FiActivity />,
    core: <FiLayers />,
    face: <FiShield />,
    hardness: <TbDiamond />,
    shape: <FiCircle />,
    surface: <FiTarget />,
    game_type: <FiZap />,
    game_level: <FiAward />,
    peso: <GiWeightScale />,
    marco: <FiCrosshair />,
  };
  return icons[key] || <FiActivity />;
};

// Función helper para obtener la etiqueta en español
const getFeatureLabel = (key: string): string => {
  const labels: Record<string, string> = {
    balance: 'Balance',
    core: 'Núcleo',
    face: 'Cara',
    hardness: 'Dureza',
    shape: 'Forma',
    surface: 'Superficie',
    game_type: 'Tipo de Juego',
    game_level: 'Nivel de Juego',
    peso: 'Peso',
    marco: 'Marco',
  };
  return labels[key] || key;
};

export const RacketFeatures: React.FC<RacketFeaturesProps> = ({ characteristics, specs }) => {
  // Crear array de características principales para mostrar
  const mainFeatures = [
    { key: 'shape', value: characteristics.shape },
    { key: 'balance', value: characteristics.balance },
    { key: 'hardness', value: characteristics.hardness },
    { key: 'game_type', value: characteristics.game_type },
    { key: 'core', value: characteristics.core },
    { key: 'face', value: characteristics.face },
    { key: 'surface', value: characteristics.surface },
    { key: 'game_level', value: characteristics.game_level },
  ].filter(feature => feature.value);

  // Agregar specs si están disponibles
  if (specs) {
    if (specs.peso) {
      mainFeatures.push({ key: 'peso', value: specs.peso });
    }
    if (specs.marco) {
      mainFeatures.push({ key: 'marco', value: specs.marco });
    }
  }

  return (
    <FeaturesContainer
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <SectionTitle>
        <FiTrendingUp />
        Características Principales
      </SectionTitle>

      <FeaturesGrid>
        {mainFeatures.map((feature, index) => (
          <FeatureCard
            key={feature.key}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.1 * index }}
          >
            <FeatureHeader>
              <FeatureIcon>{getFeatureIcon(feature.key)}</FeatureIcon>
              <FeatureInfo>
                <FeatureLabel>{getFeatureLabel(feature.key)}</FeatureLabel>
                <FeatureValue>{feature.value}</FeatureValue>
              </FeatureInfo>
            </FeatureHeader>
          </FeatureCard>
        ))}
      </FeaturesGrid>

      {/* Sección de tecnologías si están disponibles */}
      {specs?.tecnologias && specs.tecnologias.length > 0 && (
        <TechnologiesSection>
          <TechnologiesTitle>
            <FiZap />
            Tecnologías Incorporadas
          </TechnologiesTitle>
          <TechnologiesGrid>
            {specs.tecnologias.map((tech, index) => (
              <TechnologyBadge
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2, delay: 0.05 * index }}
              >
                <TechnologyIcon>✓</TechnologyIcon>
                {tech}
              </TechnologyBadge>
            ))}
          </TechnologiesGrid>
        </TechnologiesSection>
      )}
    </FeaturesContainer>
  );
};
