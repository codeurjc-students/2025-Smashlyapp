import { useRackets } from '@/contexts/RacketsContext';
import { useAuth } from '@/contexts/AuthContext';
import { Racket } from '@/types/racket';

import React, { useEffect, useState } from 'react';
import {
  FiExternalLink,
  FiLoader,
  FiStar,
  FiHeart,
  FiBell,
  FiTruck,
} from 'react-icons/fi';

import { Link, useSearchParams } from 'react-router-dom';
import styled from 'styled-components';
import { AddToListModal } from '../components/features/AddToListModal';
import { ProductReviews } from '../components/features/ProductReviews';
import { RacketService } from '../services/racketService';
import { RacketViewService } from '../services/racketViewService';
import { getLowestPrice, getAllStorePrices } from '../utils/priceUtils';
import { toTitleCase } from '../utils/textUtils';
import { EditRacketModal } from '../components/admin/EditRacketModal';
import { PriceHistoryChart } from '../components/features/PriceHistoryChart';

// --- Styled Components ---

const PageContainer = styled.div`
  min-height: 100vh;
  background: #f9fafb; // Clean light background
  padding-bottom: 4rem;
`;

const Breadcrumbs = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 1rem 2rem;
  color: #6b7280;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  a {
    color: #6b7280;
    text-decoration: none;
    &:hover { color: #1f2937; }
  }
`;

const MainGrid = styled.div`
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 3rem;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2rem;
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
`;

// Left Column: Gallery
const GallerySection = styled.div`
  background: white;
  border-radius: 24px;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  min-height: 600px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);

  @media (max-width: 768px) {
    min-height: 400px;
  }
`;

const MainImage = styled.img`
  width: 100%;
  height: 100%;
  max-height: 500px;
  object-fit: contain;
  transition: transform 0.3s ease;
  
  &:hover {
    transform: scale(1.05);
  }
`;

const ThumbnailsContainer = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-top: 1.5rem;
  justify-content: center;
  flex-wrap: wrap;
`;

const Thumbnail = styled.img<{ isActive: boolean }>`
  width: 80px;
  height: 80px;
  object-fit: contain;
  border-radius: 12px;
  border: 2px solid ${props => props.isActive ? '#16a34a' : '#e5e7eb'};
  background: ${props => props.isActive ? '#f0fdf4' : 'white'};
  cursor: pointer;
  transition: all 0.2s;
  padding: 0.5rem;

  &:hover {
    border-color: #16a34a;
    transform: scale(1.05);
  }
`;

const ImageCounter = styled.div`
  position: absolute;
  bottom: 1.5rem;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 600;
`;

const WishlistButton = styled.button`
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  background: white;
  border: none;
  border-radius: 50%;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.2s;
  color: #ef4444;

  &:hover {
    transform: scale(1.1);
    background: #fef2f2;
  }
`;

// Right Column: Info
const InfoSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const ProductTag = styled.span`
  background: #dcfce7;
  color: #166534;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  padding: 4px 12px;
  border-radius: 6px;
  align-self: flex-start;
  letter-spacing: 0.05em;
`;

const ProductTitle = styled.h1`
  font-size: 3rem;
  font-weight: 800;
  color: #111827;
  line-height: 1.1;
  margin: 0;
  
  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const RatingRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #f59e0b;
  font-weight: 600;
  font-size: 0.9rem;
  
  span { color: #6b7280; font-weight: 400; }
`;

const PriceCard = styled.div`
  background: white;
  border-radius: 20px;
  padding: 1.5rem;
  border: 1px solid #e5e7eb;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
`;

const BestPriceLabel = styled.div`
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
  margin-bottom: 0.5rem;
`;

const PriceRow = styled.div`
  display: flex;
  align-items: baseline;
  gap: 1rem;
  margin-bottom: 0.5rem;
`;

const BigPrice = styled.div`
  font-size: 2.5rem;
  font-weight: 800;
  color: #16a34a; // Green price
`;

const OldPrice = styled.div`
  font-size: 1.25rem;
  color: #9ca3af;
  text-decoration: line-through;
  font-weight: 500;
`;

const SaveBadge = styled.div`
  background: #fee2e2;
  color: #dc2626;
  font-weight: 700;
  font-size: 0.875rem;
  padding: 4px 10px;
  border-radius: 6px;
`;

const UpdatedTime = styled.div`
  font-size: 0.75rem;
  color: #9ca3af;
  margin-bottom: 1.5rem;
`;

const PrimaryButton = styled.a`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  width: 100%;
  padding: 1rem;
  background: #16a34a;
  color: white;
  border-radius: 12px;
  font-weight: 700;
  font-size: 1.125rem;
  text-decoration: none;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(22, 163, 74, 0.3);

  &:hover {
    background: #15803d;
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(22, 163, 74, 0.4);
    color: white;
  }
`;

const AlertButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  width: 100%;
  padding: 1rem;
  background: white;
  color: #374151;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 1rem;

  &:hover {
    background: #f9fafb;
    border-color: #d1d5db;
  }
`;

const Description = styled.p`
  color: #4b5563;
  line-height: 1.6;
  font-size: 1rem;
`;

// Lower Section layout
const LowerGrid = styled.div<{ $fullWidth?: boolean }>`
  display: grid;
  grid-template-columns: ${props => props.$fullWidth ? '1fr' : '1.2fr 0.8fr'};
  gap: 3rem;
  max-width: 1400px;
  margin: 3rem auto 0;
  padding: 0 2rem;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const SpecsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr); // 2 columns like in design example
  gap: 1rem;
  margin-top: 1rem;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const SpecCard = styled.div`
  background: white;
  padding: 1rem;
  border-radius: 12px;
  border: 1px solid #f3f4f6;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const SpecLabel = styled.span`
  font-size: 0.75rem;
  color: #9ca3af;
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.5px;
`;

const SpecValue = styled.span`
  font-size: 1rem;
  color: #1f2937;
  font-weight: 600;
`;

const H3 = styled.h3`
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const CompareTable = styled.div`
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  margin-top: 3rem;
`;

const CompareRow = styled.div`
  display: grid;
  grid-template-columns: 1.5fr 2fr 1fr 1fr;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #f3f4f6;
  gap: 1rem;

  &:last-child {
    border-bottom: none;
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1rem;
    padding: 1rem;
  }
`;

const StoreLogo = styled.span`
  font-weight: 700;
  font-size: 1.1rem;
  color: #111827;
`;

const ShippingInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #4b5563;
  font-size: 0.9rem;
  svg { color: #16a34a; }
`;

const PriceText = styled.div`
  font-weight: 700;
  font-size: 1.25rem;
  color: #1f2937;
  text-align: right;
`;

const ShopButton = styled.a`
  background: white;
  border: 1px solid #e5e7eb;
  color: #1f2937;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-weight: 600;
  text-decoration: none;
  text-align: center;
  font-size: 0.9rem;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;

  &:hover {
    background: #f9fafb;
    border-color: #d1d5db;
    color: #16a34a; 
  }
`;

const PremiumCTA = styled.div`
  max-width: 1400px;
  margin: 2rem auto;
  padding: 0 2rem;
`;

const CTACard = styled.div`
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  border: 1px solid #bbf7d0;
  border-radius: 16px;
  padding: 2rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
`;

const CTAText = styled.p`
  font-size: 1.125rem;
  color: #166534;
  font-weight: 600;
  margin: 0;
`;

const CTAButtons = styled.div`
  display: flex;
  gap: 1rem;
  
  @media (max-width: 480px) {
    flex-direction: column;
    width: 100%;
  }
`;

const CTAButton = styled(Link)`
  padding: 0.75rem 2rem;
  background: #16a34a;
  color: white;
  border-radius: 10px;
  font-weight: 700;
  text-decoration: none;
  transition: all 0.2s;
  
  &:hover {
    background: #15803d;
    transform: translateY(-2px);
    color: white;
  }
`;

const CTAButtonSecondary = styled(Link)`
  padding: 0.75rem 2rem;
  background: white;
  color: #16a34a;
  border: 2px solid #16a34a;
  border-radius: 10px;
  font-weight: 700;
  text-decoration: none;
  transition: all 0.2s;
  
  &:hover {
    background: #f0fdf4;
    color: #15803d;
  }
`;

// --- Component ---

const RacketDetailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { rackets } = useRackets();
  const { isAuthenticated } = useAuth();
  
  const [racket, setRacket] = useState<Racket | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddToListModal, setShowAddToListModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const racketId = searchParams.get('id');

  useEffect(() => {
    const loadRacket = async () => {
      if (!racketId) {
        setError('ID not specified');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const numericId = parseInt(racketId);
        let foundRacket: Racket | null = null;

        if (!isNaN(numericId)) {
          foundRacket = await RacketService.getRacketById(numericId);
        }

        if (!foundRacket) {
          const decodedRacketId = decodeURIComponent(racketId);
          foundRacket = rackets.find(pala => pala.nombre === decodedRacketId) || null;
          if (!foundRacket) {
            foundRacket = await RacketService.getRacketByName(decodedRacketId);
          }
        }

        if (foundRacket) {
          setRacket(foundRacket);
        } else {
          setError('Racket not found');
        }
      } catch (err) {
        setError('Error loading racket');
      } finally {
        setLoading(false);
      }
    };

    loadRacket();
  }, [racketId, rackets]);

  useEffect(() => {
    if (racket && racket.id && isAuthenticated) {
      RacketViewService.recordView(racket.id).catch(console.error);
    }
  }, [racket, isAuthenticated]);

  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <FiLoader className="animate-spin" size={40} color="#16a34a" />
    </div>
  );

  if (error || !racket) return <div>Error: {error}</div>;

  const lowestPrice = getLowestPrice(racket);
  const allPrices = getAllStorePrices(racket);
  const availablePrices = allPrices.filter(p => p.available);

  return (
    <PageContainer>
      <Breadcrumbs>
        <Link to="/">Home</Link> / <Link to="/catalog">Palas</Link> / {toTitleCase(racket.marca)} / <span style={{color: '#111827'}}>{toTitleCase(racket.modelo)}</span>
      </Breadcrumbs>

      <MainGrid>
        {/* Left: Gallery */}
        <GallerySection>
          <WishlistButton onClick={() => setShowAddToListModal(true)}>
             <FiHeart fill={showAddToListModal ? "#ef4444" : "none"} />
          </WishlistButton>
          <MainImage 
            src={racket.imagenes?.[selectedImageIndex] || racket.imagenes?.[0] || '/placeholder-racket.svg'} 
            alt={racket.modelo}
          />
          {racket.imagenes && racket.imagenes.length > 1 && (
            <>
              <ImageCounter>
                {selectedImageIndex + 1} / {racket.imagenes.length}
              </ImageCounter>
              <ThumbnailsContainer>
                {racket.imagenes.map((img, index) => (
                  <Thumbnail
                    key={index}
                    src={img}
                    alt={`${racket.modelo} - imagen ${index + 1}`}
                    isActive={index === selectedImageIndex}
                    onClick={() => setSelectedImageIndex(index)}
                  />
                ))}
              </ThumbnailsContainer>
            </>
          )}
        </GallerySection>

        {/* Right: Info */}
        <InfoSection>
          <ProductTag>{toTitleCase(racket.marca)}</ProductTag>
          <ProductTitle>{toTitleCase(racket.modelo)}</ProductTitle>
          
          <RatingRow>
             {[1,2,3,4,5].map(i => <FiStar key={i} fill="currentColor" />)}
             <span>128 reviews</span>
          </RatingRow>

          <PriceCard>
             <BestPriceLabel>Mejor Precio del Mercado</BestPriceLabel>
             <PriceRow>
                <BigPrice>{lowestPrice ? `${lowestPrice.price.toFixed(2)}€` : `${racket.precio_actual}€`}</BigPrice>
                {lowestPrice && lowestPrice.originalPrice > lowestPrice.price && (
                   <OldPrice>{lowestPrice.originalPrice.toFixed(2)}€</OldPrice>
                )}
                {lowestPrice && lowestPrice.discount > 0 && (
                   <SaveBadge>Ahorra {Math.round(lowestPrice.discount)}%</SaveBadge>
                )}
             </PriceRow>
             <UpdatedTime>Precio actualizado: hace un momento</UpdatedTime>

             <PrimaryButton 
               href={lowestPrice?.link || '#'} 
               target="_blank" 
               rel="noopener noreferrer"
             >
               Ver en {lowestPrice?.store || 'Tienda'}
               <FiExternalLink />
             </PrimaryButton>

             <AlertButton>
               <FiBell /> Crear Alerta de Precio
             </AlertButton>
          </PriceCard>


        </InfoSection>
      </MainGrid>

      <LowerGrid $fullWidth={!isAuthenticated}>
        {/* Lower Left: Specs */}
        <div>
          <H3>🛠 Especificaciones Técnicas</H3>
          <SpecsGrid>
             <SpecCard>
               <SpecLabel>Forma</SpecLabel>
               <SpecValue>{toTitleCase(racket.caracteristicas_forma || racket.especificaciones?.forma || 'N/A')}</SpecValue>
             </SpecCard>
             <SpecCard>
               <SpecLabel>Balance</SpecLabel>
               <SpecValue>{toTitleCase(racket.caracteristicas_balance || racket.especificaciones?.balance || 'Media')}</SpecValue>
             </SpecCard>
             <SpecCard>
               <SpecLabel>Peso</SpecLabel>
               <SpecValue>{racket.peso ? `${racket.peso}g` : '360-375g'}</SpecValue>
             </SpecCard>
             <SpecCard>
               <SpecLabel>Núcleo</SpecLabel>
               <SpecValue>{toTitleCase(racket.caracteristicas_nucleo || racket.especificaciones?.nucleo || 'EVA')}</SpecValue>
             </SpecCard>
             <SpecCard>
               <SpecLabel>Caras</SpecLabel>
               <SpecValue>{toTitleCase(racket.caracteristicas_cara || racket.especificaciones?.cara || 'Carbon')}</SpecValue>
             </SpecCard>
             <SpecCard>
               <SpecLabel>Nivel</SpecLabel>
               <SpecValue>{toTitleCase(racket.caracteristicas_nivel_de_juego || racket.especificaciones?.nivel_de_juego || 'Avanzado')}</SpecValue>
             </SpecCard>
          </SpecsGrid>
        </div>

        {/* Lower Right: Price History - Only show if authenticated */}
        {isAuthenticated && (
          <div>
            <PriceHistoryChart currentPrice={lowestPrice?.price || racket.precio_actual || 0} />
          </div>
        )}
      </LowerGrid>

      {/* Premium CTA for non-authenticated users */}
      {!isAuthenticated && (
        <PremiumCTA>
          <CTACard>
            <CTAText>🔓 Accede a comparación de precios, historial y reseñas</CTAText>
            <CTAButtons>
              <CTAButton to="/login">Iniciar Sesión</CTAButton>
              <CTAButtonSecondary to="/register">Crear Cuenta</CTAButtonSecondary>
            </CTAButtons>
          </CTACard>
        </PremiumCTA>
      )}

      {/* Price Comparison - Only show if authenticated */}
      {isAuthenticated && (
      <div style={{ maxWidth: '1400px', margin: '3rem auto', padding: '0 2rem' }}>
        <H3>Comparar Precios</H3>
        <CompareTable>
          {availablePrices.map((store, index) => (
            <CompareRow key={index}>
              <StoreLogo>{store.store}</StoreLogo>
              <ShippingInfo>
                <FiTruck /> Envío Gratis
                <span style={{ fontSize: '0.8rem', color: '#9ca3af', fontWeight: 400 }}>• En Stock</span>
              </ShippingInfo>
              <PriceText>{store.price?.toFixed(2)}€</PriceText>
              <ShopButton href={store.link || '#'} target="_blank">
                Ir a la tienda <FiExternalLink size={14} />
              </ShopButton>
            </CompareRow>
          ))}
        </CompareTable>
      </div>
      )}

      {/* Reviews - Only show if authenticated */}
      {isAuthenticated && (
      <div style={{ maxWidth: '1400px', margin: '3rem auto', padding: '0 2rem' }}>
        <ProductReviews racketId={racket.id!} />
      </div>
      )}

      {/* Modals */}
      <AddToListModal
        isOpen={showAddToListModal}
        onClose={() => setShowAddToListModal(false)}
        racketId={racket.id || 0}
        racketName={`${racket.marca} ${racket.modelo}`}
      />
      {showEditModal && (
        <EditRacketModal
           isOpen={showEditModal}
           onClose={() => setShowEditModal(false)}
           racket={racket}
           onUpdate={setRacket}
        />
      )}
    </PageContainer>
  );
};

export default RacketDetailPage;

