import React from 'react';
import styled from 'styled-components';
import { RecommendationResult as ResultType } from '../../types/recommendation';
import { Link } from 'react-router-dom';

const ResultContainer = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 3rem;

  h2 {
    font-size: 2.5rem;
    margin-bottom: 1rem;
    color: #1f2937;
    font-weight: 800;
  }

  p {
    color: #6b7280;
    font-size: 1.1rem;
    max-width: 600px;
    margin: 0 auto;
  }
`;

const AnalysisCard = styled.div`
  background: white;
  border-radius: 24px;
  padding: 2rem;
  margin-bottom: 3rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(22, 163, 74, 0.1);

  h3 {
    color: #16a34a;
    margin-bottom: 1rem;
    font-size: 1.5rem;
    font-weight: 700;
  }

  p {
    line-height: 1.6;
    color: #374151;
  }
`;

const RacketsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
`;

const RacketCard = styled.div`
  background: white;
  border-radius: 24px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);

  &:hover {
    transform: translateY(-5px);
    border-color: #16a34a;
    box-shadow: 0 20px 40px rgba(22, 163, 74, 0.15);
  }
`;

const RacketHeader = styled.div`
  padding: 1.5rem;
  background: #f0fdf4;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const RacketName = styled.h4`
  font-size: 1.2rem;
  margin: 0;
  color: #1f2937;
  font-weight: 700;
`;

const RacketPrice = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: #16a34a;
  margin-top: 0.5rem;
`;

const MatchScore = styled.div`
  background: #16a34a;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-weight: bold;
  font-size: 0.9rem;
`;

const RacketContent = styled.div`
  padding: 1.5rem;
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const RacketImage = styled.img`
  width: 100%;
  max-width: 200px;
  height: auto;
  object-fit: contain;
  margin: 0 auto 1.5rem;
  border-radius: 8px;
`;

const Reason = styled.p`
  color: #4b5563;
  font-size: 0.95rem;
  line-height: 1.5;
  margin-bottom: 1.5rem;
  flex: 1;
`;

const ViewButton = styled(Link)`
  display: block;
  text-align: center;
  background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
  color: white;
  padding: 0.75rem;
  border-radius: 12px;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 4px 6px rgba(22, 163, 74, 0.2);

  &:hover {
    background: linear-gradient(135deg, #15803d 0%, #14532d 100%);
    color: white;
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(22, 163, 74, 0.3);
    text-decoration: none;
  }
`;

const Actions = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
`;

const Button = styled.button<{ $primary?: boolean }>`
  padding: 0.75rem 2rem;
  border-radius: 12px;
  border: none;
  font-weight: 600;
  cursor: pointer;
  background: ${props => props.$primary ? '#16a34a' : 'white'};
  color: ${props => props.$primary ? 'white' : '#4b5563'};
  border: ${props => props.$primary ? 'none' : '1px solid #e5e7eb'};
  transition: all 0.2s;
  font-size: 1rem;
  box-shadow: 0 2px 5px rgba(0,0,0,0.05);

  &:hover {
    background: ${props => props.$primary ? '#15803d' : '#f9fafb'};
    transform: translateY(-1px);
  }
`;

interface Props {
  result: ResultType;
  onSave?: () => void;
  onReset: () => void;
  isSaving?: boolean;
  canSave?: boolean;
}

export const RecommendationResult: React.FC<Props> = ({ result, onSave, onReset, isSaving, canSave }) => {
  return (
    <ResultContainer>
      <Header>
        <h2>Tu Selección Personalizada</h2>
        <p>Basado en tu perfil y preferencias, hemos seleccionado las mejores opciones para ti.</p>
      </Header>

      <AnalysisCard>
        <h3>Análisis del Experto</h3>
        <p>{result.analysis}</p>
      </AnalysisCard>

      <RacketsGrid>
        {result.rackets.map((racket, index) => (
          <RacketCard key={index}>
            <RacketHeader>
              <div>
                <RacketName>{racket.name}</RacketName>
                {racket.price && (
                  <RacketPrice>€{racket.price.toFixed(2)}</RacketPrice>
                )}
              </div>
              <MatchScore>{racket.match_score}% Match</MatchScore>
            </RacketHeader>
            <RacketContent>
              {racket.image && (
                <RacketImage src={racket.image} alt={racket.name} />
              )}
              <Reason>{racket.reason}</Reason>
              <ViewButton to={`/racket-detail?id=${racket.id}`}>
                Ver Detalles
              </ViewButton>
            </RacketContent>
          </RacketCard>
        ))}
      </RacketsGrid>

      <Actions>
        <Button onClick={onReset}>Nueva Búsqueda</Button>
        {canSave && onSave && (
          <Button $primary onClick={onSave} disabled={isSaving}>
            {isSaving ? 'Guardando...' : 'Guardar Recomendación'}
          </Button>
        )}
      </Actions>
    </ResultContainer>
  );
};
