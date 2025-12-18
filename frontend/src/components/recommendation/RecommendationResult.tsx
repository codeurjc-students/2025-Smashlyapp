import React from 'react';
import styled from 'styled-components';
import { RecommendationResult as ResultType } from '../../types/recommendation';
import { Link } from 'react-router-dom';

const ResultContainer = styled.div`
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: 0.5rem 1rem 2rem;
  overflow-x: hidden;

  @media (min-width: 768px) {
    padding: 0.5rem 2rem 2rem;
  }
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
  border-radius: 16px;
  padding: 0;
  margin-bottom: 3rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  border: 1px solid #e5e7eb;
  border-left: 4px solid #16a34a;
  overflow: hidden;
`;

const AnalysisHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1.5rem 2rem;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
`;

const IconWrapper = styled.div`
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  svg {
    width: 22px;
    height: 22px;
    color: white;
  }
`;

const AnalysisTitle = styled.h3`
  color: #1f2937;
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
`;

const AnalysisContent = styled.div`
  padding: 2rem;
`;

const AnalysisParagraph = styled.p`
  line-height: 1.8;
  color: #4b5563;
  margin-bottom: 1rem;
  font-size: 0.95rem;

  &:last-child {
    margin-bottom: 0;
  }

  strong {
    color: #1f2937;
    font-weight: 600;
  }
`;

const RacketsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 320px), 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;

  @media (min-width: 768px) {
    gap: 2rem;
  }
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
  align-items: flex-start;
  gap: 1rem;
`;

const RacketHeaderInfo = styled.div`
  flex: 1;
`;

const RacketName = styled.h4`
  font-size: 1.1rem;
  margin: 0 0 0.25rem 0;
  color: #1f2937;
  font-weight: 700;
  line-height: 1.3;
`;

const RacketBrand = styled.div`
  font-size: 0.85rem;
  color: #6b7280;
  margin-bottom: 0.5rem;
`;

const RacketPrice = styled.div`
  font-size: 1.3rem;
  font-weight: 700;
  color: #16a34a;
  margin-top: 0.5rem;
`;

const MatchScore = styled.div`
  background: #16a34a;
  color: white;
  padding: 0.4rem 0.9rem;
  border-radius: 20px;
  font-weight: bold;
  font-size: 0.9rem;
  white-space: nowrap;
`;

const RacketContent = styled.div`
  padding: 1.5rem;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const RacketImage = styled.img`
  width: 100%;
  max-width: 180px;
  height: auto;
  object-fit: contain;
  margin: 0 auto;
  border-radius: 8px;
`;

const Section = styled.div`
  margin-bottom: 1rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionTitle = styled.h5`
  font-size: 0.85rem;
  font-weight: 700;
  color: #16a34a;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0 0 0.75rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const SectionContent = styled.div`
  color: #4b5563;
  font-size: 0.9rem;
  line-height: 1.6;
`;

const MetricsBadges = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const MetricBadge = styled.div<{ $certified?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.5rem 0.75rem;
  background: ${props => (props.$certified ? '#f0fdf4' : '#f9fafb')};
  border: 1px solid ${props => (props.$certified ? '#16a34a' : '#e5e7eb')};
  border-radius: 8px;
  min-width: 70px;
`;

const MetricLabel = styled.div`
  font-size: 0.7rem;
  color: #6b7280;
  text-transform: uppercase;
  font-weight: 600;
  margin-bottom: 0.25rem;
`;

const MetricValue = styled.div<{ $certified?: boolean }>`
  font-size: 1.1rem;
  font-weight: 700;
  color: ${props => (props.$certified ? '#16a34a' : '#1f2937')};
`;

const SafetyBadge = styled.div<{ $safe: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: ${props => (props.$safe ? '#f0fdf4' : '#fef2f2')};
  border: 1px solid ${props => (props.$safe ? '#16a34a' : '#ef4444')};
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  color: ${props => (props.$safe ? '#15803d' : '#dc2626')};
`;

const CommunityRating = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: #6b7280;
`;

const Stars = styled.div`
  color: #fbbf24;
  font-size: 1rem;
`;

const CertificationNote = styled.div`
  font-size: 0.75rem;
  color: #6b7280;
  font-style: italic;
  margin-top: 0.5rem;
  padding: 0.5rem;
  background: #f9fafb;
  border-radius: 6px;
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
  margin-top: auto;

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
  background: ${props => (props.$primary ? '#16a34a' : 'white')};
  color: ${props => (props.$primary ? 'white' : '#4b5563')};
  border: ${props => (props.$primary ? 'none' : '1px solid #e5e7eb')};
  transition: all 0.2s;
  font-size: 1rem;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);

  &:hover {
    background: ${props => (props.$primary ? '#15803d' : '#f9fafb')};
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

export const RecommendationResult: React.FC<Props> = ({
  result,
  onSave,
  onReset,
  isSaving,
  canSave,
}) => {
  // Parse analysis text into paragraphs
  const formatAnalysis = (text: string) => {
    const cleanText = text.replace(/^[\"']|[\"']$/g, '');
    const paragraphs = cleanText
      .split(/\n\n+/)
      .map(p => p.trim())
      .filter(p => p.length > 0);
    return paragraphs;
  };

  const analysisParagraphs = formatAnalysis(result.analysis);

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    return '★'.repeat(fullStars) + (hasHalfStar ? '½' : '') + '☆'.repeat(5 - Math.ceil(rating));
  };

  return (
    <ResultContainer>
      <Header>
        <h2>Tu Selección Personalizada</h2>
        <p>Basado en tu perfil y preferencias, hemos seleccionado las mejores opciones para ti.</p>
      </Header>

      <AnalysisCard>
        <AnalysisHeader>
          <IconWrapper>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              fill='none'
              viewBox='0 0 24 24'
              strokeWidth={2}
              stroke='currentColor'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                d='M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18'
              />
            </svg>
          </IconWrapper>
          <AnalysisTitle>Análisis del Experto</AnalysisTitle>
        </AnalysisHeader>
        <AnalysisContent>
          {analysisParagraphs.map((paragraph, index) => (
            <AnalysisParagraph key={index}>{paragraph}</AnalysisParagraph>
          ))}
        </AnalysisContent>
      </AnalysisCard>

      <RacketsGrid>
        {result.rackets.map((racket, index) => (
          <RacketCard key={index}>
            <RacketHeader>
              <RacketHeaderInfo>
                {racket.brand && <RacketBrand>{racket.brand}</RacketBrand>}
                <RacketName>{racket.name}</RacketName>
                {racket.price && <RacketPrice>€{racket.price.toFixed(2)}</RacketPrice>}
              </RacketHeaderInfo>
              <MatchScore>{racket.match_score}% Match</MatchScore>
            </RacketHeader>

            <RacketContent>
              {racket.image && <RacketImage src={racket.image} alt={racket.name} />}

              {/* Biomechanical Safety */}
              {racket.biomechanical_safety && (
                <Section>
                  <SectionTitle>🛡️ Seguridad Biomecánica</SectionTitle>
                  <SafetyBadge $safe={racket.biomechanical_safety.is_safe}>
                    {racket.biomechanical_safety.is_safe
                      ? '✓ Segura para tu perfil'
                      : '⚠ Requiere precaución'}
                  </SafetyBadge>
                  {racket.biomechanical_safety.safety_notes && (
                    <SectionContent style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
                      {racket.biomechanical_safety.safety_notes}
                    </SectionContent>
                  )}
                </Section>
              )}

              {/* Testea Metrics */}
              {racket.testea_metrics && (
                <Section>
                  <SectionTitle>
                    🔬 Datos{' '}
                    {racket.testea_metrics.certificado ? 'Certificados Testea Pádel' : 'Estimados'}
                  </SectionTitle>
                  <MetricsBadges>
                    <MetricBadge $certified={racket.testea_metrics.certificado}>
                      <MetricLabel>Potencia</MetricLabel>
                      <MetricValue $certified={racket.testea_metrics.certificado}>
                        {racket.testea_metrics.potencia}/10
                      </MetricValue>
                    </MetricBadge>
                    <MetricBadge $certified={racket.testea_metrics.certificado}>
                      <MetricLabel>Control</MetricLabel>
                      <MetricValue $certified={racket.testea_metrics.certificado}>
                        {racket.testea_metrics.control}/10
                      </MetricValue>
                    </MetricBadge>
                    <MetricBadge $certified={racket.testea_metrics.certificado}>
                      <MetricLabel>Manejo</MetricLabel>
                      <MetricValue $certified={racket.testea_metrics.certificado}>
                        {racket.testea_metrics.manejabilidad}/10
                      </MetricValue>
                    </MetricBadge>
                    <MetricBadge $certified={racket.testea_metrics.certificado}>
                      <MetricLabel>Confort</MetricLabel>
                      <MetricValue $certified={racket.testea_metrics.certificado}>
                        {racket.testea_metrics.confort}/10
                      </MetricValue>
                    </MetricBadge>
                  </MetricsBadges>
                  {!racket.testea_metrics.certificado && (
                    <CertificationNote>
                      ℹ️ Métricas estimadas basadas en especificaciones físicas
                    </CertificationNote>
                  )}
                </Section>
              )}

              {/* Match Details */}
              {racket.match_details && (
                <>
                  {racket.match_details.priority_alignment && (
                    <Section>
                      <SectionTitle>🎯 Por qué es ideal para ti</SectionTitle>
                      <SectionContent>{racket.match_details.priority_alignment}</SectionContent>
                    </Section>
                  )}

                  {racket.match_details.biomechanical_fit &&
                    racket.match_details.biomechanical_fit !== 'Pala segura para tu perfil' && (
                      <Section>
                        <SectionTitle>💪 Ajuste Biomecánico</SectionTitle>
                        <SectionContent>{racket.match_details.biomechanical_fit}</SectionContent>
                      </Section>
                    )}

                  {racket.match_details.preference_match &&
                    racket.match_details.preference_match !== 'Compatible con tus preferencias' && (
                      <Section>
                        <SectionTitle>⚙️ Preferencias</SectionTitle>
                        <SectionContent>{racket.match_details.preference_match}</SectionContent>
                      </Section>
                    )}
                </>
              )}

              {/* Community Data */}
              {racket.community_data && racket.community_data.user_rating && (
                <Section>
                  <SectionTitle>👥 Valoración de la Comunidad</SectionTitle>
                  <CommunityRating>
                    <Stars>{renderStars(racket.community_data.user_rating)}</Stars>
                    <span>{racket.community_data.user_rating.toFixed(1)}/5</span>
                  </CommunityRating>
                </Section>
              )}

              <ViewButton to={`/racket-detail?id=${racket.id}`}>Ver Detalles Completos</ViewButton>
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
