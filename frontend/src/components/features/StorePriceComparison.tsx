import { motion } from 'framer-motion';
import React from 'react';
import { FiExternalLink, FiTrendingDown, FiStar } from 'react-icons/fi';
import { useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { Racket } from '@/types/racket';
import { getAllStorePrices } from '@/utils/priceUtils';

const Card = styled(motion.div)<{ $compact?: boolean }>`
  background: ${props =>
    props.$compact
      ? 'linear-gradient(135deg, #ffffff 0%, #f8fdf8 100%)'
      : 'white'};
  padding: ${props => (props.$compact ? '1.5rem' : '2rem')};
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  height: ${props => (props.$compact ? '100%' : 'auto')};
  border: ${props => (props.$compact ? '2px solid #d1fae5' : 'none')};
`;

const Title = styled.h3<{ $compact?: boolean }>`
  font-size: ${props => (props.$compact ? '1.125rem' : '1.25rem')};
  font-weight: 700;
  color: ${props => (props.$compact ? '#16a34a' : '#1f2937')};
  margin-bottom: ${props => (props.$compact ? '1rem' : '1.5rem')};
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding-bottom: ${props => (props.$compact ? '0.75rem' : '0')};
  border-bottom: ${props => (props.$compact ? '2px solid #d1fae5' : 'none')};
`;

const ChartContainer = styled.div<{ $compact?: boolean }>`
  margin-bottom: ${props => (props.$compact ? '0' : '2rem')};
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: ${props => (props.$compact ? 'space-between' : 'flex-start')};
  gap: ${props => (props.$compact ? '0.75rem' : '0')};
`;

const StoreRow = styled.div<{ $compact?: boolean; $isLowest?: boolean }>`
  margin-bottom: ${props => (props.$compact ? '0' : '1.5rem')};
  padding: ${props => {
    if (props.$isLowest) {
      return props.$compact ? '1rem 1.25rem' : '1.25rem 1.5rem';
    }
    return props.$compact ? '0.75rem 1rem' : '1rem';
  }};
  background: ${props => {
    if (props.$isLowest) {
      return props.$compact
        ? 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)'
        : 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)';
    }
    return props.$compact
      ? 'linear-gradient(135deg, #ffffff 0%, #fafffe 100%)'
      : '#f9fafb';
  }};
  border-radius: ${props => (props.$compact ? '10px' : '12px')};
  transition: all 0.3s ease;
  flex: ${props => (props.$compact ? '1' : 'none')};
  display: flex;
  flex-direction: column;
  justify-content: center;
  border: ${props => {
    if (props.$isLowest) {
      return props.$compact ? '3px solid #16a34a' : '3px solid #16a34a';
    }
    return props.$compact ? '1.5px solid #e5e7eb' : 'none';
  }};
  box-shadow: ${props => {
    if (props.$isLowest) {
      return props.$compact
        ? '0 6px 20px rgba(22, 163, 74, 0.3), 0 0 0 4px rgba(22, 163, 74, 0.08)'
        : '0 8px 24px rgba(22, 163, 74, 0.35), 0 0 0 4px rgba(22, 163, 74, 0.1)';
    }
    return props.$compact ? '0 2px 8px rgba(0, 0, 0, 0.04)' : 'none';
  }};
  position: relative;
  overflow: visible;
  transform: ${props => (props.$isLowest ? 'scale(1.03)' : 'scale(1)')};
  z-index: ${props => (props.$isLowest ? '2' : '1')};

  ${props =>
    props.$isLowest &&
    `
    &::before {
      content: '';
      position: absolute;
      top: -3px;
      left: -3px;
      right: -3px;
      bottom: -3px;
      background: linear-gradient(135deg, #16a34a, #22c55e, #10b981, #16a34a);
      background-size: 200% 200%;
      border-radius: ${props.$compact ? '13px' : '15px'};
      z-index: -1;
      opacity: 0.2;
      animation: gradientShift 3s ease infinite, glow 2s ease-in-out infinite;
    }

    @keyframes gradientShift {
      0% {
        background-position: 0% 50%;
      }
      50% {
        background-position: 100% 50%;
      }
      100% {
        background-position: 0% 50%;
      }
    }

    @keyframes glow {
      0%, 100% {
        opacity: 0.2;
        filter: blur(8px);
      }
      50% {
        opacity: 0.35;
        filter: blur(12px);
      }
    }
  `}

  &:hover {
    background: ${props => {
      if (props.$isLowest) {
        return props.$compact
          ? 'linear-gradient(135deg, #d1fae5 0%, #bbf7d0 100%)'
          : 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)';
      }
      return props.$compact
        ? 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)'
        : '#f3f4f6';
    }};
    transform: ${props =>
      props.$isLowest
        ? props.$compact
          ? 'translateY(-4px) scale(1.05)'
          : 'translateX(6px) scale(1.04)'
        : props.$compact
        ? 'translateY(-2px) scale(1.01)'
        : 'translateX(4px)'};
    border-color: ${props => (props.$compact || props.$isLowest ? '#16a34a' : 'transparent')};
    box-shadow: ${props => {
      if (props.$isLowest) {
        return props.$compact
          ? '0 8px 24px rgba(22, 163, 74, 0.4), 0 0 0 5px rgba(22, 163, 74, 0.12)'
          : '0 10px 30px rgba(22, 163, 74, 0.45), 0 0 0 5px rgba(22, 163, 74, 0.15)';
      }
      return props.$compact ? '0 4px 12px rgba(22, 163, 74, 0.15)' : 'none';
    }};
  }

  &:last-child {
    margin-bottom: 0;
  }
`;

const StoreHeader = styled.div<{ $compact?: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => (props.$compact ? '0.5rem' : '0.75rem')};
`;

const StoreName = styled.div<{ $compact?: boolean }>`
  font-weight: 700;
  color: #1f2937;
  font-size: ${props => (props.$compact ? '0.9375rem' : '1rem')};
  letter-spacing: 0.2px;
  display: inline-flex;
  align-items: center;
  gap: ${props => (props.$compact ? '0.4rem' : '0.5rem')};
`;

const Medal = styled.span<{ $compact?: boolean; $rank?: number }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: ${props => (props.$compact ? '1rem' : '1.125rem')};
  line-height: 1;
`;

const PriceInfo = styled.div<{ $compact?: boolean }>`
  display: flex;
  align-items: center;
  gap: ${props => (props.$compact ? '0.5rem' : '0.75rem')};
  flex-wrap: wrap;
`;

const Price = styled.div<{ isLowest?: boolean; $compact?: boolean }>`
  font-size: ${props => {
    if (props.isLowest) {
      return props.$compact ? '1.375rem' : '1.5rem';
    }
    return props.$compact ? '1.125rem' : '1.25rem';
  }};
  font-weight: 800;
  color: ${props => (props.isLowest ? '#16a34a' : '#1f2937')};
  text-shadow: ${props =>
    props.isLowest
      ? '0 2px 4px rgba(22, 163, 74, 0.2)'
      : 'none'
  };
  position: relative;

  ${props =>
    props.isLowest &&
    `
    animation: priceGlow 2s ease-in-out infinite;

    @keyframes priceGlow {
      0%, 100% {
        text-shadow: 0 2px 4px rgba(22, 163, 74, 0.2);
      }
      50% {
        text-shadow: 0 2px 8px rgba(22, 163, 74, 0.4), 0 0 12px rgba(22, 163, 74, 0.2);
      }
    }
  `}
`;


const LowestBadge = styled.div`
  background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.8125rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  box-shadow: 0 4px 12px rgba(22, 163, 74, 0.4);
  letter-spacing: 0.5px;
  text-transform: uppercase;
  animation: badgePulse 2s ease-in-out infinite;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
    animation: shine 3s infinite;
  }

  @keyframes badgePulse {
    0%, 100% {
      box-shadow: 0 4px 12px rgba(22, 163, 74, 0.4);
      transform: scale(1);
    }
    50% {
      box-shadow: 0 6px 16px rgba(22, 163, 74, 0.6);
      transform: scale(1.05);
    }
  }

  @keyframes shine {
    0% {
      left: -100%;
    }
    50%, 100% {
      left: 100%;
    }
  }
`;


const StoreLink = styled.a<{ $compact?: boolean; $isLowest?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  color: white;
  text-decoration: none;
  font-size: ${props => {
    if (props.$isLowest) {
      return props.$compact ? '0.8125rem' : '0.9375rem';
    }
    return props.$compact ? '0.75rem' : '0.875rem';
  }};
  font-weight: ${props => (props.$isLowest ? '700' : '600')};
  padding: ${props => {
    if (props.$isLowest) {
      return props.$compact ? '0.625rem 1rem' : '0.75rem 1.25rem';
    }
    return props.$compact ? '0.5rem 0.875rem' : '0.5rem 1rem';
  }};
  background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
  border: none;
  border-radius: ${props => (props.$compact ? '7px' : '8px')};
  transition: all 0.3s ease;
  box-shadow: ${props =>
    props.$isLowest
      ? '0 4px 12px rgba(22, 163, 74, 0.35)'
      : '0 2px 6px rgba(22, 163, 74, 0.25)'
  };
  letter-spacing: 0.2px;
  position: relative;
  overflow: hidden;

  ${props =>
    props.$isLowest &&
    `
    &::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 0;
      height: 0;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.3);
      transform: translate(-50%, -50%);
      transition: width 0.6s, height 0.6s;
    }

    &:hover::after {
      width: 300px;
      height: 300px;
    }
  `}

  &:hover {
    background: linear-gradient(135deg, #15803d 0%, #14532d 100%);
    text-decoration: none;
    transform: ${props => (props.$isLowest ? 'translateY(-3px) scale(1.02)' : 'translateY(-2px)')};
    box-shadow: ${props =>
      props.$isLowest
        ? '0 6px 18px rgba(22, 163, 74, 0.45)'
        : '0 4px 10px rgba(22, 163, 74, 0.35)'
    };
  }
`;

const UnavailableText = styled.div`
  color: #9ca3af;
  font-size: 0.875rem;
  font-style: italic;
`;

const PriceDiff = styled.div<{ $compact?: boolean; $isLowest?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-size: ${props => (props.$compact ? '0.75rem' : '0.8125rem')};
  color: ${props => (props.$isLowest ? '#16a34a' : '#374151')};
  font-weight: 700;
  margin-top: ${props => (props.$compact ? '0.25rem' : '0.375rem')};
`;

const GuestMessage = styled.div`
  padding: 3rem 2rem;
  background: linear-gradient(135deg, #16a34a 0%, #107a37 100%);
  border-radius: 12px;
  text-align: center;
  margin: 2rem 0;
  box-shadow: 0 4px 12px rgba(22, 163, 74, 0.2);
`;

const GuestIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 1rem;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
`;

const GuestTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
  margin-bottom: 1rem;
`;

const GuestText = styled.p`
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.95);
  line-height: 1.6;
  max-width: 600px;
  margin: 0 auto;
`;

const GuestLink = styled.a`
  color: white;
  font-weight: 600;
  text-decoration: none;
  border-bottom: 2px solid rgba(255, 255, 255, 0.5);
  transition: all 0.2s;
  padding-bottom: 2px;

  &:hover {
    border-bottom-color: white;
    opacity: 0.9;
  }
`;


interface StorePriceComparisonProps {
  racket: Racket;
  isAuthenticated: boolean;
  compact?: boolean;
}

export const StorePriceComparison: React.FC<StorePriceComparisonProps> = ({
  racket,
  isAuthenticated,
  compact = false,
}) => {
  const location = useLocation();
  const storePrices = getAllStorePrices(racket);
  const availablePrices = storePrices.filter(store => store.available && store.price);

  if (availablePrices.length === 0) {
    return null;
  }

  // Encontrar el precio más bajo para resaltarlo
  const lowestPrice = Math.min(...availablePrices.map(store => store.price || Infinity));

  // UI simplificada: sin barra de precio

  // Generate redirect URL for login with current page
  const loginRedirect = `/login?redirect=${encodeURIComponent(location.pathname + location.search)}`;

  // Ordenar por precio ascendente y preparar ranking para medallas
  const displayedStores = compact
    ? storePrices.filter(s => s.available)
    : storePrices;

  const rankedStores = displayedStores
    .filter(s => s.available && typeof s.price === 'number')
    .sort((a, b) => (a.price || Infinity) - (b.price || Infinity));

  const storeRankMap = new Map(rankedStores.map((s, idx) => [s.store, idx]));

  const sortedDisplayedStores = [...displayedStores].sort((a, b) => {
    const rankA = storeRankMap.get(a.store);
    const rankB = storeRankMap.get(b.store);
    if (rankA !== undefined && rankB !== undefined) return rankA - rankB;
    if (rankA !== undefined) return -1;
    if (rankB !== undefined) return 1;
    // Ambos sin ranking (no disponibles), mantener orden alfabético estable
    return a.store.localeCompare(b.store);
  });

  const getMedalEmoji = (rank: number) => {
    switch (rank) {
      case 0:
        return '🥇';
      case 1:
        return '🥈';
      case 2:
        return '🥉';
      case 3:
        return '🏅';
      default:
        return null;
    }
  };

  return (
    <Card
      $compact={compact}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <Title $compact={compact}>
        <FiTrendingDown />
        {compact ? 'Comparar Precios' : 'Comparación de Precios por Tienda'}
      </Title>

      {/* Mensaje para usuarios no autenticados */}
      {!isAuthenticated ? (
        <GuestMessage>
          <GuestIcon>🔒</GuestIcon>
          <GuestTitle>Inicia sesión para ver el comparador de precios</GuestTitle>
          <GuestText>
            Compara los precios de esta pala en diferentes tiendas y encuentra la mejor oferta.
            <GuestLink href={loginRedirect}> Inicia sesión</GuestLink> o
            <GuestLink href='/register'> regístrate</GuestLink> para acceder al comparador de
            precios.
          </GuestText>
        </GuestMessage>
      ) : (
        <ChartContainer $compact={compact}>
          {sortedDisplayedStores.map((store) => {
              const isLowest = store.price === lowestPrice && store.available;
              const rank = storeRankMap.get(store.store);
              const medal = rank !== undefined && rank < 4 ? getMedalEmoji(rank) : null;

              return (
                <StoreRow key={store.store} $compact={compact} $isLowest={isLowest}>
                  <StoreHeader $compact={compact}>
                    <StoreName $compact={compact}>
                      {medal && <Medal $compact={compact} $rank={rank}>{medal}</Medal>}
                      {store.store}
                    </StoreName>
                    {store.available && store.price ? (
                      <PriceInfo $compact={compact}>
                        <Price isLowest={isLowest} $compact={compact}>
                          €{store.price.toFixed(2)}
                        </Price>
                        {isLowest && (
                          <LowestBadge>
                            <FiStar size={14} />
                            Mejor precio
                          </LowestBadge>
                        )}
                      </PriceInfo>
                    ) : (
                      <UnavailableText>No disponible</UnavailableText>
                    )}
                  </StoreHeader>

                  {store.available && store.price && (
                    <>
                      <PriceDiff $compact={compact} $isLowest={isLowest}>
                        {isLowest
                          ? 'Más barato'
                          : `+€${(store.price - lowestPrice).toFixed(2)} sobre el más barato`}
                      </PriceDiff>
                      {store.link && (
                        <StoreLink
                          $compact={compact}
                          $isLowest={isLowest}
                          href={store.link}
                          target='_blank'
                          rel='noopener noreferrer'
                        >
                          {isLowest ? '🎯 ' : ''}Ver en {store.store}
                          <FiExternalLink size={compact ? 12 : 14} />
                        </StoreLink>
                      )}
                    </>
                  )}
                </StoreRow>
              );
            })}
        </ChartContainer>
      )}
    </Card>
  );
};
