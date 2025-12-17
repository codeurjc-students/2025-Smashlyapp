import { useRackets } from '@/contexts/RacketsContext';
import { useAuth } from '@/contexts/AuthContext';
import { Racket } from '@/types/racket';
import { motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import {
  FiArrowLeft,
  FiExternalLink,
  FiLoader,
  FiStar,
  FiTag,
  FiHeart,
} from 'react-icons/fi';
import { Link, useSearchParams } from 'react-router-dom';
import styled from 'styled-components';
import { AddToListModal } from '../components/features/AddToListModal';
import { RacketFeatures } from '../components/features/RacketFeatures';
import { RacketReviews } from '../components/features/RacketReviews';
import { StorePriceComparison } from '../components/features/StorePriceComparison';
import { RacketService } from '../services/racketService';
import { RacketViewService } from '../services/racketViewService';
import { getLowestPrice } from '../utils/priceUtils';
import { toTitleCase } from '../utils/textUtils';

// Styled Components
const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fdf8 0%, #f0f9f0 100%);
`;

const Header = styled.div`
  background: white;
  border-bottom: 1px solid #e5e7eb;
  padding: 1rem 0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const HeaderContent = styled.div`
  max-width: 1600px;
  margin: 0 auto;
  padding: 0 3rem;
  display: flex;
  align-items: center;
  gap: 1rem;

  @media (max-width: 1024px) {
    padding: 0 2rem;
  }
`;

const BackButton = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #16a34a;
  text-decoration: none;
  font-weight: 500;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  transition: all 0.2s ease;

  &:hover {
    background: #f0f9ff;
    text-decoration: none;
  }
`;

const HeaderTitle = styled.h1`
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
`;

const Content = styled.div`
  max-width: 1600px;
  margin: 0 auto;
  padding: 2rem 3rem;
  display: grid;
  gap: 2rem;

  @media (max-width: 1024px) {
    padding: 2rem;
  }
`;

const TopSection = styled.div`
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 2rem;
  align-items: start;

  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
  }
`;

const MainCard = styled(motion.div)`
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  display: grid;
  grid-template-columns: 1fr 1fr;
  height: 100%;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const CompactPriceCard = styled(motion.div)`
  background: white;
  border-radius: 16px;
  overflow: visible;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  height: 100%;
  position: sticky;
  top: 2rem;
  display: flex;
  flex-direction: column;

  @media (max-width: 1200px) {
    position: relative;
    top: 0;
    height: auto;
  }
`;

const ImageSection = styled.div`
  position: relative;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: white;
  min-height: 100%;
`;

const RacketImage = styled.img`
  width: 90%;
  height: 90%;
  max-width: 320px;
  max-height: 420px;
  object-fit: contain;
  object-position: center;
`;

const Badge = styled.div<{ variant: 'bestseller' | 'offer' }>`
  position: absolute;
  top: 1rem;
  ${props => (props.variant === 'bestseller' ? 'right: 1rem;' : 'left: 1rem;')}
  background: ${props => (props.variant === 'bestseller' ? '#f59e0b' : '#ef4444')};
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const InfoSection = styled.div`
  padding: 2rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`;

const BrandText = styled.div`
  font-size: 1rem;
  font-weight: 600;
  color: #16a34a;
  margin-bottom: 0.5rem;
`;

const ModelText = styled.h2`
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 1.5rem;
  line-height: 1.2;
`;

const PriceContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
`;

const CurrentPrice = styled.div`
  font-size: 2.5rem;
  font-weight: 700;
  color: #ef4444;
`;

const OriginalPrice = styled.div`
  font-size: 1.25rem;
  color: #9ca3af;
  text-decoration: line-through;
`;

const DiscountBadge = styled.div`
  background: #dc2626;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 600;
`;


const StoreBadge = styled.div`
  background: #f0f9ff;
  color: #16a34a;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 600;
  border: 1px solid #16a34a;
`;

const ActionButtons = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: auto;
`;

const PrimaryButton = styled.a`
  background: #16a34a;
  color: white;
  padding: 1rem 1.5rem;
  border-radius: 12px;
  text-decoration: none;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s ease;

  &:hover {
    background: #15803d;
    text-decoration: none;
    color: white;
    transform: translateY(-2px);
  }
`;

const SecondaryButton = styled.button<{ disabled?: boolean }>`
  background: ${props => (props.disabled ? '#f0f9ff' : 'white')};
  color: #16a34a;
  border: 2px solid #16a34a;
  padding: 1rem 1.5rem;
  border-radius: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  cursor: ${props => (props.disabled ? 'not-allowed' : 'pointer')};
  transition: all 0.2s ease;
  opacity: ${props => (props.disabled ? '0.7' : '1')};

  &:hover:not(:disabled) {
    background: #f0f9ff;
    transform: translateY(-2px);
  }
`;

const SectionTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const RecommendationCard = styled(motion.div)`
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  padding: 2rem;
  border-radius: 16px;
  border: 1px solid #bae6fd;
`;

const RecommendationText = styled.p`
  color: #0f172a;
  line-height: 1.6;
  margin-bottom: 1.5rem;
`;

const RecommendationButton = styled(Link)`
  background: white;
  color: #16a34a;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  border: 1px solid #16a34a;
  transition: all 0.2s ease;

  &:hover {
    background: #f0f9ff;
    text-decoration: none;
    transform: translateY(-2px);
  }
`;

const LoadingContainer = styled.div`
  min-height: 80vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
`;

const LoadingSpinner = styled(motion.div)`
  color: #16a34a;
`;

const LoadingText = styled.div`
  color: #6b7280;
  font-size: 1.125rem;
`;

const ErrorContainer = styled.div`
  min-height: 80vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  text-align: center;
  padding: 2rem;
`;

const ErrorIcon = styled.div`
  font-size: 4rem;
  color: #ef4444;
`;

const ErrorText = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: #374151;
`;

const ErrorDescription = styled.p`
  color: #6b7280;
  max-width: 500px;
`;

// Component
const RacketDetailPage: React.FC = () => {
  // Hooks
  const [searchParams] = useSearchParams();
  const { rackets } = useRackets();
  const { isAuthenticated } = useAuth();

  // State
  const [racket, setRacket] = useState<Racket | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddToListModal, setShowAddToListModal] = useState(false);

  // Get racket ID from URL params
  const racketId = searchParams.get('id');

  // Load racket data
  useEffect(() => {
    const loadRacket = async () => {
      if (!racketId) {
        setError('No se especificó el ID de la pala');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Try to parse as numeric ID first
        const numericId = parseInt(racketId);
        let foundRacket: Racket | null = null;

        if (!isNaN(numericId)) {
          // Load by ID from API
          foundRacket = await RacketService.getRacketById(numericId);
        }

        // If not found by numeric ID, try by name (backward compatibility)
        if (!foundRacket) {
          const decodedRacketId = decodeURIComponent(racketId);
          // First check in context (already loaded rackets)
          foundRacket = rackets.find(pala => pala.nombre === decodedRacketId) || null;

          // If still not found, try searching by name via API
          if (!foundRacket) {
            foundRacket = await RacketService.getRacketByName(decodedRacketId);
          }
        }

        if (!foundRacket) {
          setError('No se encontró la pala solicitada');
          setRacket(null);
        } else {
          setRacket(foundRacket);
          setError(null);
        }
      } catch (err: any) {
        console.error('Error loading racket:', err);
        setError(err.message || 'Error al cargar la información de la pala');
        setRacket(null);
      } finally {
        setLoading(false);
      }
    };

    loadRacket();
  }, [racketId, rackets]);

  // Record racket view when racket is loaded and user is authenticated
  useEffect(() => {
    if (racket && racket.id && isAuthenticated) {
      // Record the view asynchronously without blocking the UI
      RacketViewService.recordView(racket.id).catch((error) => {
        // Silently fail - viewing tracking is not critical
        console.debug('Could not record racket view:', error);
      });
    }
  }, [racket, isAuthenticated]);

  // Loading state (check if rackets are still loading from context)
  if (loading) {
    return (
      <Container>
        <LoadingContainer>
          <LoadingSpinner
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <FiLoader size={48} />
          </LoadingSpinner>
          <LoadingText>Cargando información de la pala...</LoadingText>
        </LoadingContainer>
      </Container>
    );
  }

  // Error state
  if (error || !racket) {
    return (
      <Container>
        <ErrorContainer>
          <ErrorIcon>⚠️</ErrorIcon>
          <ErrorText>Pala no encontrada</ErrorText>
          <ErrorDescription>
            {error || 'No se pudo encontrar la información de esta pala.'}
          </ErrorDescription>
          <BackButton to='/catalog'>
            <FiArrowLeft />
          </BackButton>
        </ErrorContainer>
      </Container>
    );
  }

  return (
    <Container>
      {/* Header */}
      <Header>
        <HeaderContent>
          <BackButton to='/catalog'>
            <FiArrowLeft />
          </BackButton>
          <HeaderTitle>Detalles de la Pala</HeaderTitle>
        </HeaderContent>
      </Header>

      {/* Content */}
      <Content>
        {/* Top Section: Main Info (left) + Price Comparison (right) */}
        <TopSection>
          {/* Left Column: Main Card */}
          <MainCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <ImageSection>
              <RacketImage
                src={racket.imagen || '/placeholder-racket.svg'}
                alt={racket.modelo || 'Pala de padel'}
                onError={e => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/placeholder-racket.svg';
                }}
              />
              {racket.es_bestseller && (
                <Badge variant='bestseller'>
                  <FiStar size={16} />
                  Top
                </Badge>
              )}
              {racket.en_oferta && (
                <Badge variant='offer'>
                  <FiTag size={16} />
                  Oferta
                </Badge>
              )}
            </ImageSection>

            <InfoSection>
              <div>
                <BrandText>{toTitleCase(racket.marca)}</BrandText>
                <ModelText>{toTitleCase(racket.modelo)}</ModelText>

                <PriceContainer>
                  {(() => {
                    const lowestPrice = getLowestPrice(racket);
                    if (lowestPrice) {
                      return (
                        <>
                          <CurrentPrice>{lowestPrice.price.toFixed(2)}€</CurrentPrice>
                          {lowestPrice.originalPrice > lowestPrice.price && (
                            <>
                              <OriginalPrice>{lowestPrice.originalPrice.toFixed(2)}€</OriginalPrice>
                              {lowestPrice.discount > 0 && (
                                <DiscountBadge>-{lowestPrice.discount}%</DiscountBadge>
                              )}
                            </>
                          )}
                          <StoreBadge>en {lowestPrice.store}</StoreBadge>
                        </>
                      );
                    }
                    return <CurrentPrice>{racket.precio_actual}€</CurrentPrice>;
                  })()}
                </PriceContainer>
              </div>

              <ActionButtons>
                <PrimaryButton
                  href={getLowestPrice(racket)?.link || racket.enlace}
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  <FiExternalLink />
                  {getLowestPrice(racket)?.store
                    ? `Ver en ${getLowestPrice(racket)?.store}`
                    : 'Ver en tienda'}
                </PrimaryButton>

                {isAuthenticated && (
                  <SecondaryButton onClick={() => setShowAddToListModal(true)}>
                    <FiHeart />
                    Añadir a mis listas
                  </SecondaryButton>
                )}
              </ActionButtons>
            </InfoSection>
          </MainCard>

          {/* Right Column: Compact Price Comparison */}
          <CompactPriceCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <StorePriceComparison racket={racket} isAuthenticated={isAuthenticated} compact />
          </CompactPriceCard>
        </TopSection>

        {/* Características Principales */}
        <RacketFeatures
          characteristics={{
            balance:
              racket.especificaciones?.balance || racket.caracteristicas_balance || undefined,
            core: racket.especificaciones?.nucleo || racket.caracteristicas_nucleo || undefined,
            face: racket.especificaciones?.cara || racket.caracteristicas_cara || undefined,
            hardness: racket.especificaciones?.dureza || racket.caracteristicas_dureza || undefined,
            shape: racket.especificaciones?.forma || racket.caracteristicas_forma || undefined,
            surface:
              racket.especificaciones?.superficie || racket.caracteristicas_superficie || undefined,
            game_type:
              racket.especificaciones?.tipo_de_juego ||
              racket.caracteristicas_tipo_de_juego ||
              undefined,
            game_level:
              racket.especificaciones?.nivel_de_juego ||
              racket.caracteristicas_nivel_de_juego ||
              undefined,
          }}
          specs={racket.specs}
        />

        {/* Sección de Reviews */}
        {racket.id && <RacketReviews racketId={racket.id} />}

        {/* Recommendation Card */}
        <RecommendationCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <SectionTitle>💡 ¿Necesitas más opciones?</SectionTitle>

          <RecommendationText>
            Si esta pala no es exactamente lo que buscas, puedes explorar nuestra colección completa
            de palas de pádel o usar nuestro sistema de recomendaciones con IA para encontrar la
            pala perfecta según tu perfil de jugador y estilo de juego.
          </RecommendationText>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <RecommendationButton to='/catalog'>🎾 Ver todas las palas</RecommendationButton>
            <RecommendationButton
              to='/best-racket'
              style={{
                background: '#16a34a',
                color: 'white',
                borderColor: '#16a34a',
              }}
            >
              ✨ Buscar mi pala ideal
            </RecommendationButton>
          </div>
        </RecommendationCard>
      </Content>

      {/* Modal para añadir a listas */}
      {racket && (
        <AddToListModal
          isOpen={showAddToListModal}
          onClose={() => setShowAddToListModal(false)}
          racketId={racket.id || 0}
          racketName={`${racket.marca} ${racket.modelo}`}
        />
      )}
    </Container>
  );
};

export default RacketDetailPage;
