import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { FiEye, FiTag, FiHeart } from 'react-icons/fi';
import styled from 'styled-components';
import { Racket } from '../../types/racket';
import { getLowestPrice } from '../../utils/priceUtils';

// Styled Components
const RacketCardContainer = styled(motion.li)<{ view: 'grid' | 'list' }>`
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid rgba(22, 163, 74, 0.1);

  display: ${props => (props.view === 'list' ? 'flex' : 'flex')};
  flex-direction: ${props => (props.view === 'list' ? 'row' : 'column')};
  height: ${props => (props.view === 'grid' ? '100%' : 'auto')};

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
    border-color: #16a34a;
  }
`;

const RacketImageContainer = styled.div<{ view: 'grid' | 'list' }>`
  position: relative;
  height: ${props => (props.view === 'grid' ? '220px' : '120px')};
  width: ${props => (props.view === 'list' ? '120px' : '100%')};
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  overflow: hidden;
`;

const ImageIndicator = styled.div`
  position: absolute;
  bottom: 0.5rem;
  right: 0.5rem;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  z-index: 2;
`;

const RacketImage = styled.img`
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
`;

const RacketBadge = styled.div<{ variant: 'bestseller' | 'offer' }>`
  position: absolute;
  top: 0.75rem;
  ${props => (props.variant === 'bestseller' ? 'right: 0.75rem;' : 'left: 0.75rem;')}
  background: ${props => (props.variant === 'bestseller' ? '#f59e0b' : '#ef4444')};
  color: white;
  padding: 0.375rem 0.75rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  z-index: 2;
`;

const RacketInfo = styled.div<{ view: 'grid' | 'list' }>`
  padding: ${props => (props.view === 'grid' ? '1.5rem' : '1rem')};
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 0.75rem;
`;

const RacketBrand = styled.div`
  font-size: 0.875rem;
  font-weight: 600;
  color: #16a34a;
  margin-bottom: 0.25rem;
`;

const RacketName = styled.h3<{ view: 'grid' | 'list' }>`
  font-size: ${props => (props.view === 'grid' ? '1.125rem' : '1rem')};
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.75rem;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const PriceContainer = styled.div<{ view: 'grid' | 'list' }>`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: ${props => (props.view === 'grid' ? '0.5rem' : '0.5rem')};
  flex-wrap: wrap;
  min-height: auto;
  margin-top: auto;
`;

const CurrentPrice = styled.div`
  font-size: 1.25rem;
  font-weight: 700;
  color: #16a34a;
`;

const OriginalPrice = styled.div`
  font-size: 0.875rem;
  color: #9ca3af;
  text-decoration: line-through;
`;

const DiscountBadge = styled.div`
  background: #ef4444;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
`;

const ActionButtons = styled.div<{ view: 'grid' | 'list' }>`
  display: flex;
  gap: 0.5rem;
  flex-direction: ${props => (props.view === 'list' ? 'row' : 'column')};

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const ViewDetailsButton = styled.button`
  flex: 1;
  background: #16a34a;
  color: white;
  border: none;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s ease;

  &:hover {
    background: #15803d;
    transform: translateY(-1px);
  }
`;

// Helper function to capitalize first letter of each word
const toTitleCase = (str: string): string => {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

interface RacketCardProps {
  racket: Racket;
  view: 'grid' | 'list';
  index: number;
  onClick: (racket: Racket) => void;
  onAddToList?: (racket: Racket) => void;
  isAuthenticated?: boolean;
}

const RacketCardComponent: React.FC<RacketCardProps> = memo(({
  racket,
  view,
  index,
  onClick,
  onAddToList,
  isAuthenticated = false
}) => {
  if (!racket || !racket.nombre) {
    return null;
  }

  const lowestPrice = getLowestPrice(racket);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    target.src = '/placeholder-racket.svg';
  };

  const handleAddToList = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToList?.(racket);
  };

  return (
    <RacketCardContainer
      view={view}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      onClick={() => onClick(racket)}
    >
      <RacketImageContainer view={view}>
        <RacketImage
          src={racket.imagenes?.[0]}
          alt={racket.modelo}
          onError={handleImageError}
        />
        {racket.imagenes && racket.imagenes.length > 1 && (
          <ImageIndicator>
            📷 {racket.imagenes.length}
          </ImageIndicator>
        )}
        {racket.view_count !== undefined && racket.view_count > 10 && (
          <RacketBadge variant='bestseller'>
            <FiEye size={12} />
            Popular
          </RacketBadge>
        )}
        {racket.en_oferta && (
          <RacketBadge variant='offer'>
            <FiTag size={12} />
            Oferta
          </RacketBadge>
        )}
      </RacketImageContainer>

      <RacketInfo view={view}>
        <div>
          <RacketBrand>{racket.marca}</RacketBrand>
          <RacketName view={view}>{toTitleCase(racket.modelo)}</RacketName>
        </div>

        <PriceContainer view={view}>
          {lowestPrice ? (
            <>
              <CurrentPrice>{lowestPrice.price.toFixed(2)}€</CurrentPrice>
              {lowestPrice.originalPrice > lowestPrice.price && (
                <>
                  <OriginalPrice>
                    €{lowestPrice.originalPrice.toFixed(2)}
                  </OriginalPrice>
                  {lowestPrice.discount > 0 && (
                    <DiscountBadge>-{lowestPrice.discount}%</DiscountBadge>
                  )}
                </>
              )}
            </>
          ) : (
            <CurrentPrice>€{racket.precio_actual}</CurrentPrice>
          )}
        </PriceContainer>

        <ActionButtons view={view}>
          <ViewDetailsButton onClick={() => onClick(racket)}>
            Ver detalles
          </ViewDetailsButton>
          {isAuthenticated && onAddToList && (
            <ViewDetailsButton
              onClick={handleAddToList}
              style={{ background: '#15803d' }}
            >
              <FiHeart size={14} />
              Mis listas
            </ViewDetailsButton>
          )}
        </ActionButtons>
      </RacketInfo>
    </RacketCardContainer>
  );
});

RacketCardComponent.displayName = 'RacketCard';

export default RacketCardComponent;
