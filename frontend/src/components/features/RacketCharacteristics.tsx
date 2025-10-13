import { motion } from "framer-motion";
import React from "react";
import styled from "styled-components";
import { RacketCharacteristics as RacketCharacteristicsType } from "../../types/racket";
import { shouldDisplayCharacteristic } from "../../utils/characteristicsUtils";

const CharacteristicsContainer = styled(motion.div)`
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  margin-bottom: 1.5rem;
`;

const SectionTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &:before {
    content: "";
    width: 4px;
    height: 20px;
    background: linear-gradient(135deg, #16a34a, #22c55e);
    border-radius: 2px;
  }
`;

const CharacteristicsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
`;

const CharacteristicItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: #f8fafc;
  border-radius: 8px;
  border-left: 3px solid #16a34a;
`;

const CharacteristicLabel = styled.span`
  font-weight: 500;
  color: #374151;
  text-transform: capitalize;
`;

const CharacteristicValue = styled.span`
  font-weight: 600;
  color: #16a34a;
`;

const DescriptionContainer = styled.div`
  background: #f8fafc;
  border-radius: 12px;
  padding: 1.25rem;
  margin-top: 1rem;
  border-left: 4px solid #16a34a;
`;

const DescriptionTitle = styled.h4`
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.75rem;
`;

const DescriptionText = styled.p`
  color: #4b5563;
  line-height: 1.6;
  margin: 0;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 2rem;
  color: #6b7280;
  font-style: italic;
`;

interface RacketCharacteristicsProps {
  características?: RacketCharacteristicsType;
  descripcion?: string;
}

// Mapeo de nombres técnicos a nombres amigables
const characteristicLabels: Record<string, string> = {
  marca: "Marca",
  color: "Color",
  color_secundario: "Color Secundario",
  balance: "Balance",
  nucleo: "Núcleo",
  dureza: "Dureza",
  acabado: "Acabado",
  superficie: "Superficie",
  forma: "Forma",
  tipo_juego: "Tipo de Juego",
  nivel_jugador: "Nivel del Jugador",
  nivel_juego: "Nivel de Juego",
  peso: "Peso",
  grosor: "Grosor",
  material: "Material",
  material_cara: "Material de la Cara",
  material_marco: "Material del Marco",
};

const RacketCharacteristics: React.FC<RacketCharacteristicsProps> = ({
  características,
  descripcion,
}) => {
  const hasCharacteristics =
    características && Object.keys(características).length > 0;
  const hasDescription = descripcion && descripcion.trim().length > 0;

  if (!hasCharacteristics && !hasDescription) {
    return (
      <CharacteristicsContainer
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <SectionTitle>Características Técnicas</SectionTitle>
        <EmptyState>
          No hay características técnicas disponibles para esta pala.
        </EmptyState>
      </CharacteristicsContainer>
    );
  }

  return (
    <CharacteristicsContainer
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <SectionTitle>Características Técnicas</SectionTitle>

      {hasCharacteristics && (
        <CharacteristicsGrid>
          {Object.entries(características!).map(([key, value]) => {
            if (!shouldDisplayCharacteristic(key, value)) return null;

            const label = characteristicLabels[key] || key.replace(/_/g, " ");

            return (
              <CharacteristicItem key={key}>
                <CharacteristicLabel>{label}</CharacteristicLabel>
                <CharacteristicValue>{value}</CharacteristicValue>
              </CharacteristicItem>
            );
          })}
        </CharacteristicsGrid>
      )}

      {hasDescription && (
        <DescriptionContainer>
          <DescriptionTitle>Descripción</DescriptionTitle>
          <DescriptionText>{descripcion}</DescriptionText>
        </DescriptionContainer>
      )}
    </CharacteristicsContainer>
  );
};

export default RacketCharacteristics;
