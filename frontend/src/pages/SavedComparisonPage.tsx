import React, { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiShare2, FiLock, FiGlobe, FiDownload, FiCalendar } from 'react-icons/fi';
import { ComparisonService, SavedComparison } from '../services/comparisonService';
import { RacketService } from '../services/racketService';
import { Racket } from '../types/racket';
import { ComparisonResult } from '../types/racket';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import RacketRadarChart from '../components/features/RacketRadarChart';
import ComparisonTable from '../components/features/ComparisonTable';
import { RacketPdfGenerator } from '../services/pdfGenerator';

const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #f8faf8 0%, #e8f5e8 100%);
  padding: 2rem;
  padding-bottom: 6rem;

  @media (max-width: 768px) {
    padding: 1rem;
    padding-bottom: 4rem;
  }
`;

const Header = styled.div`
  max-width: 1000px;
  margin: 0 auto 2rem;
  display: flex;
  align-items: center;
  gap: 1rem;

  @media (max-width: 480px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  color: #4b5563;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #f9fafb;
    border-color: #d1d5db;
  }

  @media (max-width: 480px) {
    padding: 0.5rem 0.75rem;
    font-size: 0.8125rem;
  }
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-left: auto;

  @media (max-width: 480px) {
    width: 100%;
    justify-content: flex-start;
  }
`;

const ActionButton = styled.button<{ variant?: 'primary' }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;

  ${props => props.variant === 'primary' ? `
    background: #16a34a;
    border: none;
    color: white;
    &:hover { background: #15803d; }
  ` : `
    background: white;
    border: 1px solid #e5e7eb;
    color: #4b5563;
    &:hover { background: #f9fafb; border-color: #d1d5db; }
  `}

  @media (max-width: 480px) {
    padding: 0.5rem 0.75rem;
    font-size: 0.8125rem;
  }
`;

const ResultSection = styled(motion.div)`
  max-width: 1000px;
  margin: 0 auto;
  background: white;
  border-radius: 24px;
  padding: 3rem;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow-x: hidden;

  @media (max-width: 768px) {
    padding: 1.5rem;
    border-radius: 16px;
    margin: 0 0.5rem;
  }

  @media (max-width: 480px) {
    padding: 1rem;
    border-radius: 12px;
    margin: 0 0.25rem;
  }
`;

const ResultHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 1rem;
  gap: 1rem;
  flex-wrap: wrap;

  @media (max-width: 480px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
    padding-bottom: 0.75rem;
  }
`;

const ResultTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 0.75rem;

  @media (max-width: 480px) {
    font-size: 1.125rem;
    gap: 0.5rem;
  }
`;

const MetaInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #6b7280;
  font-size: 0.875rem;

  @media (max-width: 480px) {
    font-size: 0.75rem;
  }
`;

const Section = styled.div`
  margin-bottom: 2rem;

  @media (max-width: 480px) {
    margin-bottom: 1.5rem;
  }
`;

const SectionTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 700;
  color: #16a34a;
  margin-bottom: 1rem;

  @media (max-width: 480px) {
    font-size: 1rem;
  }
`;

const SectionContent = styled.div`
  color: #374151;
  line-height: 1.7;
  font-size: 0.95rem;

  @media (max-width: 480px) {
    font-size: 0.875rem;
    line-height: 1.6;
  }

  p {
    margin-bottom: 0.75rem;
  }

  ul, ol {
    padding-left: 1.5rem;
    margin-bottom: 0.75rem;
  }

  li {
    margin-bottom: 0.5rem;
  }
`;

const LoadingContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f8faf8 0%, #e8f5e8 100%);
`;

const LoadingSpinner = styled.div`
  width: 48px;
  height: 48px;
  border: 4px solid #e5e7eb;
  border-top-color: #16a34a;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const ErrorContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f8faf8 0%, #e8f5e8 100%);
  padding: 2rem;
  text-align: center;
`;

const ErrorTitle = styled.h2`
  font-size: 1.5rem;
  color: #1f2937;
  margin-bottom: 1rem;
`;

const ErrorMessage = styled.p`
  color: #6b7280;
  margin-bottom: 1.5rem;
`;

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

const SavedComparisonPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [comparison, setComparison] = useState<SavedComparison | null>(null);
  const [rackets, setRackets] = useState<Racket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadComparison = async () => {
      if (!id) {
        setError('ID de comparación no proporcionado');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Cargar comparación
        const comparisonData = await ComparisonService.getComparisonById(id);
        setComparison(comparisonData);

        // Cargar información de las palas
        const racketsData = await Promise.all(
          comparisonData.racket_ids.map(async (racketId: number) => {
            try {
              return await RacketService.getRacketById(racketId);
            } catch {
              return null;
            }
          })
        );
        setRackets(racketsData.filter((r): r is Racket => r !== null));
        
      } catch (err: any) {
        console.error('Error loading comparison:', err);
        setError(err.message || 'Error al cargar la comparación');
      } finally {
        setLoading(false);
      }
    };

    loadComparison();
  }, [id]);

  const comparisonResult: ComparisonResult | null = useMemo(() => {
    if (!comparison?.comparison_text) return null;

    try {
      // Intentar parsear como JSON
      const parsed = JSON.parse(comparison.comparison_text);
      if (parsed.executiveSummary || parsed.comparisonTable) {
        return parsed as ComparisonResult;
      }
    } catch {
      // Si falla, es markdown legacy
      return null;
    }
    return null;
  }, [comparison]);

  const handleShare = async () => {
    if (!comparison) return;
    
    try {
      const shareToken = await ComparisonService.shareComparison(comparison.id);
      const shareUrl = `${window.location.origin}/shared/${shareToken}`;
      
      await navigator.clipboard.writeText(shareUrl);
      alert('Enlace compartido copiado al portapapeles');
    } catch (err) {
      console.error('Error sharing:', err);
      alert('Error al compartir la comparación');
    }
  };

  const handleDownloadPDF = async () => {
    if (!comparisonResult || !rackets.length || !comparison) return;

    try {
      const generator = new RacketPdfGenerator();
      await generator.generatePDF({
        rackets: rackets,
        comparison: comparisonResult,
        proxyUrlBase: import.meta.env.VITE_API_URL || '',
      });
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Error al generar el PDF');
    }
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/profile?tab=activity');
    }
  };

  if (loading) {
    return (
      <LoadingContainer>
        <LoadingSpinner />
      </LoadingContainer>
    );
  }

  if (error || !comparison) {
    return (
      <ErrorContainer>
        <ErrorTitle>Error</ErrorTitle>
        <ErrorMessage>{error || 'Comparación no encontrada'}</ErrorMessage>
        <ActionButton onClick={handleBack}>
          <FiArrowLeft /> Volver
        </ActionButton>
      </ErrorContainer>
    );
  }

  return (
    <Container>
      <Header>
        <BackButton onClick={handleBack}>
          <FiArrowLeft /> Volver
        </BackButton>
        
        <HeaderActions>
          <ActionButton onClick={handleShare}>
            <FiShare2 /> Compartir
          </ActionButton>
          <ActionButton variant="primary" onClick={handleDownloadPDF}>
            <FiDownload /> Descargar PDF
          </ActionButton>
        </HeaderActions>
      </Header>

      <ResultSection
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <ResultHeader>
          <ResultTitle>
            Comparación de Palas
          </ResultTitle>
          <MetaInfo>
            <FiCalendar />
            {formatDate(comparison.created_at)}
            {comparison.is_public ? <FiGlobe /> : <FiLock />}
            {comparison.is_public ? 'Pública' : 'Privada'}
          </MetaInfo>
        </ResultHeader>

        {comparisonResult ? (
          <>
            {/* Resumen Ejecutivo */}
            {comparisonResult.executiveSummary && (
              <Section>
                <SectionTitle>Resumen Ejecutivo</SectionTitle>
                <SectionContent>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {comparisonResult.executiveSummary}
                  </ReactMarkdown>
                </SectionContent>
              </Section>
            )}

            {/* Gráfico de radar */}
            {comparison.metrics && comparison.metrics.length > 0 && (
              <Section>
                <RacketRadarChart metrics={comparison.metrics} />
              </Section>
            )}

            {/* Tabla Comparativa */}
            {comparisonResult.comparisonTable && Array.isArray(comparisonResult.comparisonTable) && (
              <Section>
                <ComparisonTable
                  data={comparisonResult.comparisonTable}
                  metrics={comparison.metrics || []}
                />
              </Section>
            )}

            {/* Análisis Técnico */}
            {comparisonResult.technicalAnalysis && comparisonResult.technicalAnalysis.length > 0 && (
              <Section>
                <SectionTitle>Análisis Técnico</SectionTitle>
                {comparisonResult.technicalAnalysis.map((section, index) => (
                  <SectionContent key={index}>
                    <h4 style={{ color: '#1f2937', marginBottom: '0.5rem' }}>{section.title}</h4>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {section.content}
                    </ReactMarkdown>
                  </SectionContent>
                ))}
              </Section>
            )}

            {/* Perfiles Recomendados */}
            {comparisonResult.recommendedProfiles && (
              <Section>
                <SectionTitle>Perfiles Recomendados</SectionTitle>
                <SectionContent>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {comparisonResult.recommendedProfiles}
                  </ReactMarkdown>
                </SectionContent>
              </Section>
            )}

            {/* Consideraciones Biomecánicas */}
            {comparisonResult.biomechanicalConsiderations && (
              <Section>
                <SectionTitle>Consideraciones Biomecánicas</SectionTitle>
                <SectionContent>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {comparisonResult.biomechanicalConsiderations}
                  </ReactMarkdown>
                </SectionContent>
              </Section>
            )}

            {/* Conclusión */}
            {comparisonResult.conclusion && (
              <Section>
                <SectionTitle>Conclusión</SectionTitle>
                <SectionContent>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {comparisonResult.conclusion}
                  </ReactMarkdown>
                </SectionContent>
              </Section>
            )}
          </>
        ) : (
          // Fallback: mostrar como markdown legacy
          <Section>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {comparison.comparison_text}
            </ReactMarkdown>
          </Section>
        )}
      </ResultSection>
    </Container>
  );
};

export default SavedComparisonPage;
