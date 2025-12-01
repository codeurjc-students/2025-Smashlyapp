import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FiClock, FiLayers, FiAlertCircle } from 'react-icons/fi';
import { useParams, Link } from 'react-router-dom';
import { ComparisonService, SavedComparison } from '../services/comparisonService';
import { RacketService } from '../services/racketService';
import { Racket } from '../types/racket';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #f8faf8 0%, #e8f5e8 100%);
  padding: 2rem 0;
`;

const ContentWrapper = styled.div`
  max-width: 900px;
  margin: 0 auto;
  padding: 0 2rem;
`;

const Card = styled.div`
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  overflow: hidden;
`;

const Header = styled.div`
  background: linear-gradient(135deg, #16a34a 0%, #059669 100%);
  color: white;
  padding: 2rem;
  text-align: center;
`;

const Logo = styled.div`
  font-size: 1.5rem;
  font-weight: 800;
  margin-bottom: 0.5rem;
`;

const HeaderTitle = styled.h1`
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0;
`;

const HeaderSubtitle = styled.p`
  font-size: 0.875rem;
  opacity: 0.9;
  margin: 0.5rem 0 0;
`;

const Body = styled.div`
  padding: 2rem;
`;

const Meta = styled.div`
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  flex-wrap: wrap;
`;

const MetaItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #6b7280;
`;

const RacketsPreview = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 2rem;
`;

const RacketTag = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem 1rem;
  background: #f0fdf4;
  color: #16a34a;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
`;

const MarkdownContent = styled.div`
  h1,
  h2,
  h3 {
    color: #1f2937;
    margin-top: 1.5rem;
    margin-bottom: 1rem;
  }

  h1 {
    font-size: 1.75rem;
  }

  h2 {
    font-size: 1.5rem;
  }

  h3 {
    font-size: 1.25rem;
  }

  p {
    color: #4b5563;
    line-height: 1.7;
    margin: 1rem 0;
  }

  ul,
  ol {
    color: #4b5563;
    line-height: 1.7;
    margin: 1rem 0;
    padding-left: 1.5rem;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin: 1.5rem 0;
    overflow-x: auto;
    display: block;
  }

  thead {
    display: table;
    width: 100%;
    table-layout: fixed;
  }

  tbody {
    display: table;
    width: 100%;
    table-layout: fixed;
  }

  th,
  td {
    border: 1px solid #e5e7eb;
    padding: 0.75rem;
    text-align: left;
  }

  th {
    background: #f9fafb;
    font-weight: 600;
    color: #1f2937;
  }

  td {
    color: #4b5563;
  }

  code {
    background: #f3f4f6;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.875em;
  }

  strong {
    color: #16a34a;
    font-weight: 600;
  }
`;

const Footer = styled.div`
  background: #f9fafb;
  padding: 1.5rem 2rem;
  border-top: 1px solid #e5e7eb;
  text-align: center;
`;

const FooterText = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0 0 0.5rem;
`;

const FooterLink = styled(Link)`
  color: #16a34a;
  text-decoration: none;
  font-weight: 600;
  transition: color 0.2s ease;

  &:hover {
    color: #15803d;
  }
`;

const LoadingState = styled.div`
  text-align: center;
  padding: 4rem 2rem;
`;

const Spinner = styled.div`
  width: 50px;
  height: 50px;
  border: 4px solid #e5e7eb;
  border-top-color: #16a34a;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const ErrorState = styled.div`
  text-align: center;
  padding: 4rem 2rem;
`;

const ErrorIcon = styled.div`
  font-size: 4rem;
  color: #ef4444;
  margin-bottom: 1rem;
`;

const ErrorTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 0.5rem;
`;

const ErrorText = styled.p`
  font-size: 1rem;
  color: #6b7280;
  margin: 0 0 2rem;
`;

const BackButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #16a34a 0%, #059669 100%);
  color: white;
  text-decoration: none;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.3s ease;

  &:hover {
    color: white;
    text-decoration: none;
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(22, 163, 74, 0.4);
  }
`;

const SharedComparisonPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [comparison, setComparison] = useState<SavedComparison | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [racketsCache, setRacketsCache] = useState<Record<number, Racket>>({});

  useEffect(() => {
    if (!token) {
      setError('Token de comparación no válido');
      setLoading(false);
      return;
    }

    loadSharedComparison();
  }, [token]);

  const loadSharedComparison = async () => {
    try {
      setLoading(true);
      const data = await ComparisonService.getSharedComparison(token!);
      setComparison(data);

      // Load racket names
      const rackets = await Promise.all(
        data.racket_ids.map(async id => {
          try {
            const racket = await RacketService.getRacketById(id);
            return { id, racket };
          } catch {
            return null;
          }
        })
      );

      const cache: Record<number, Racket> = {};
      rackets.forEach(item => {
        if (item && item.racket) {
          cache[item.id] = item.racket;
        }
      });
      setRacketsCache(cache);
    } catch (error: any) {
      console.error('Error loading shared comparison:', error);
      setError('No se pudo cargar la comparación. Puede que el enlace haya expirado o no exista.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getRacketName = (id: number): string => {
    return racketsCache[id]?.nombre || `Pala #${id}`;
  };

  if (loading) {
    return (
      <Container>
        <ContentWrapper>
          <LoadingState>
            <Spinner />
            <p>Cargando comparación compartida...</p>
          </LoadingState>
        </ContentWrapper>
      </Container>
    );
  }

  if (error || !comparison) {
    return (
      <Container>
        <ContentWrapper>
          <Card>
            <ErrorState>
              <ErrorIcon>
                <FiAlertCircle />
              </ErrorIcon>
              <ErrorTitle>Comparación no disponible</ErrorTitle>
              <ErrorText>{error || 'No se pudo encontrar la comparación solicitada'}</ErrorText>
              <BackButton to='/'>Ir a Smashly</BackButton>
            </ErrorState>
          </Card>
        </ContentWrapper>
      </Container>
    );
  }

  return (
    <Container>
      <ContentWrapper>
        <Card>
          <Header>
            <Logo>Smashly</Logo>
            <HeaderTitle>Comparación de Palas</HeaderTitle>
            <HeaderSubtitle>Compartido por un usuario de Smashly</HeaderSubtitle>
          </Header>

          <Body>
            <Meta>
              <MetaItem>
                <FiClock />
                {formatDate(comparison.created_at)}
              </MetaItem>
              <MetaItem>
                <FiLayers />
                {comparison.racket_ids.length} palas comparadas
              </MetaItem>
            </Meta>

            <RacketsPreview>
              {comparison.racket_ids.map(id => (
                <RacketTag key={id}>
                  <FiLayers size={14} />
                  {getRacketName(id)}
                </RacketTag>
              ))}
            </RacketsPreview>

            <MarkdownContent>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{comparison.comparison_text}</ReactMarkdown>
            </MarkdownContent>
          </Body>

          <Footer>
            <FooterText>
              Compara y descubre las mejores palas de pádel con inteligencia artificial
            </FooterText>
            <FooterLink to='/'>Prueba Smashly gratis</FooterLink>
          </Footer>
        </Card>
      </ContentWrapper>
    </Container>
  );
};

export default SharedComparisonPage;
