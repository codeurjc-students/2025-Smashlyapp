import { useRackets } from '@/contexts/RacketsContext';
import { useAuth } from '@/contexts/AuthContext';
import { Racket } from '@/types/racket';

import React, { useEffect, useState, useRef } from 'react';
import {
  FiExternalLink,
  FiLoader,
  FiStar,
  FiHeart,
  FiBell,
  FiChevronLeft,
  FiChevronRight,
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
import { RacketDetailSkeleton } from '../components/common/SkeletonLoader';
import { ImageLightbox } from '../components/common/ImageLightbox';
import { BlurTeaser } from '../components/common/BlurTeaser';
import {
  FormaIcon,
  BalanceIcon,
  PesoIcon,
  NucleoIcon,
  CarasIcon,
  NivelIcon,
  StoreLabel,
} from '../components/common/SpecIcons';

// --- Styled Components ---

const PageContainer = styled.div`
  min-height: 100vh;
  background: var(--color-gray-50);
  padding-bottom: 4rem;
  animation: fadeIn 0.4s ease-out;

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const Breadcrumbs = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 1rem 2rem;
  color: var(--color-gray-500);
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  a {
    color: var(--color-gray-500);
    text-decoration: none;
    transition: color 0.2s;
    &:hover {
      color: var(--color-gray-800);
    }
  }
`;

const MainGrid = styled.div`
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 3rem;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2rem;

  @media (max-width: 1200px) {
    grid-template-columns: 1fr 1fr;
    gap: 2.5rem;
  }

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
  transition: box-shadow 0.3s ease;

  &:hover {
    box-shadow: 0 10px 20px -5px rgba(0, 0, 0, 0.08);
  }

  @media (max-width: 768px) {
    min-height: 400px;
  }
`;

const MainImage = styled.img`
  width: 100%;
  height: 100%;
  max-height: 450px;
  object-fit: contain;
  margin-bottom: 2rem;
  cursor: zoom-in;
  transition:
    transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.3s ease;

  &:hover {
    transform: scale(1.02);
    opacity: 0.95;
  }
`;

const CarouselWrapper = styled.div`
  position: relative;
  width: 100%;
  max-width: 500px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
`;

const CarouselTrack = styled.div`
  display: flex;
  gap: 1rem;
  overflow-x: auto;
  scroll-behavior: smooth;
  padding: 0.5rem;
  width: 100%;
  scrollbar-width: none; // Hide scrollbar Firefox
  -ms-overflow-style: none; // Hide scrollbar IE/Edge
  -webkit-overflow-scrolling: touch; // Smooth touch scrolling iOS
  scroll-snap-type: x mandatory; // Snap scrolling on mobile

  &::-webkit-scrollbar {
    display: none; // Hide scrollbar Chrome/Safari
  }
`;

const ScrollButton = styled.button`
  background: white;
  border: 1px solid var(--color-gray-200);
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--color-gray-700);
  transition: all 0.2s;
  flex-shrink: 0;
  box-shadow: var(--shadow-sm);

  &:hover {
    background: var(--color-gray-50);
    border-color: var(--color-gray-300);
    color: var(--color-gray-900);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Thumbnail = styled.img<{ isActive: boolean }>`
  width: 70px;
  height: 70px;
  object-fit: contain;
  border-radius: 12px;
  border: 2px solid ${props => (props.isActive ? 'var(--color-primary)' : 'var(--color-gray-200)')};
  background: ${props => (props.isActive ? '#f0fdf4' : 'white')};
  cursor: pointer;
  transition: all 0.2s;
  padding: 0.25rem;
  flex-shrink: 0;
  scroll-snap-align: center; // Snap to center on mobile

  &:hover {
    border-color: var(--color-primary);
    transform: scale(1.05);
  }
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
  box-shadow: var(--shadow-md);
  cursor: pointer;
  transition: all 0.2s;
  color: var(--color-error);

  &:hover {
    transform: scale(1.1);
    background: #fef2f2;
  }
`;

// Dots indicator for carousel
const DotsContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  align-items: center;
  margin-top: 1rem;
`;

const Dot = styled.button<{ isActive: boolean }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: none;
  background: ${props => (props.isActive ? 'var(--color-primary)' : 'var(--color-gray-300)')};
  cursor: pointer;
  transition: all 0.2s;
  padding: 0;

  &:hover {
    background: ${props =>
      props.isActive ? 'var(--color-primary-dark)' : 'var(--color-gray-400)'};
    transform: scale(1.2);
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
  font-weight: 600;
  text-transform: uppercase;
  padding: 6px 12px;
  border-radius: 6px;
  align-self: flex-start;
  letter-spacing: 0.05em;
  opacity: 0.9;
`;

const ProductTitle = styled.h1`
  font-size: 2.25rem;
  font-weight: 700;
  color: var(--color-gray-900);
  line-height: 1.2;
  margin: 0;

  @media (max-width: 768px) {
    font-size: 1.75rem;
  }
`;

const RatingRow = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-sm);
  margin-bottom: var(--spacing-md);
  padding: var(--spacing-sm) var(--spacing-md);
  background: linear-gradient(135deg, rgba(255, 193, 7, 0.05) 0%, rgba(255, 193, 7, 0.1) 100%);
  border-radius: var(--border-radius-lg);
  border: 1px solid rgba(255, 193, 7, 0.2);
  width: fit-content;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  svg {
    color: var(--color-warning);
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }

  &:hover {
    border-color: var(--color-warning);
    box-shadow: 0 4px 12px rgba(255, 193, 7, 0.15);
    transform: translateY(-1px);

    svg {
      transform: scale(1.1);
    }
  }

  span {
    color: var(--color-gray-700);
    font-weight: var(--font-weight-medium);
    margin-left: var(--spacing-xs);
  }
`;

const PriceCard = styled.div`
  background: white;
  border-radius: 20px;
  padding: 1.5rem;
  border: 1px solid var(--color-gray-200);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
`;

const BestPriceLabel = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
  color: #166534;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 6px 12px;
  border-radius: 6px;
  margin-bottom: 1rem;
  align-self: flex-start;

  &::before {
    content: '⚡';
    font-size: 1rem;
  }
`;

const PriceRow = styled.div`
  display: flex;
  align-items: baseline;
  gap: 1rem;
  margin-bottom: 0.5rem;
`;

const BigPrice = styled.div`
  font-size: 3rem;
  font-weight: 800;
  color: var(--color-primary);
  line-height: 1;
`;

const OldPrice = styled.div`
  font-size: 1.25rem;
  color: var(--color-gray-400);
  text-decoration: line-through;
  font-weight: 500;
`;

const SaveBadge = styled.div`
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  color: #dc2626;
  font-weight: 700;
  font-size: 0.875rem;
  padding: 6px 12px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 4px;
  box-shadow: 0 2px 4px rgba(220, 38, 38, 0.1);
`;

const UpdatedTime = styled.div`
  font-size: 0.75rem;
  color: var(--color-gray-400);
  margin-bottom: 1.5rem;
`;

const PrimaryButton = styled.a`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  width: 100%;
  padding: 1rem 1.25rem;
  background: var(--color-primary);
  color: white;
  border-radius: 12px;
  font-weight: 700;
  font-size: 1.125rem;
  text-decoration: none;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(22, 163, 74, 0.3);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.5s;
  }

  &:hover {
    background: var(--color-primary-dark);
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(22, 163, 74, 0.4);
    color: white;
    text-decoration: none;

    &::before {
      left: 100%;
    }
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
  color: var(--color-gray-700);
  border: 1px solid var(--color-gray-200);
  border-radius: 12px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  margin-top: 1rem;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    border-radius: 50%;
    background: var(--color-gray-100);
    transform: translate(-50%, -50%);
    transition:
      width 0.6s ease,
      height 0.6s ease;
  }

  &:hover {
    background: var(--color-gray-50);
    border-color: var(--color-primary);
    color: var(--color-primary);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);

    &::before {
      width: 300px;
      height: 300px;
    }
  }

  &:active {
    transform: translateY(0);
  }
`;

// Lower Section layout
const LowerGrid = styled.div<{ $fullWidth?: boolean }>`
  display: grid;
  grid-template-columns: ${props => (props.$fullWidth ? '1fr' : '1.2fr 0.8fr')};
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

const SpecIconWrapper = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: var(--color-gray-50);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: var(--color-primary);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
`;

const SpecCard = styled.div`
  background: white;
  padding: 1rem;
  border-radius: 12px;
  border: 1px solid var(--color-gray-100);
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.75rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: default;

  &:hover {
    border-color: var(--color-primary);
    box-shadow: 0 4px 12px rgba(22, 163, 74, 0.12);
    transform: translateY(-2px);

    ${SpecIconWrapper} {
      background: var(--color-primary);
      color: white;
      transform: scale(1.05);
    }
  }
`;

const SpecContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
`;

const SpecLabel = styled.span`
  font-size: 0.75rem;
  color: var(--color-gray-500);
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.5px;
`;

const SpecValue = styled.span`
  font-size: 1rem;
  color: var(--color-gray-800);
  font-weight: 600;
`;

const H3 = styled.h3`
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-gray-900);
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;

  &::before {
    content: '';
    width: 4px;
    height: 24px;
    background: var(--color-primary);
    border-radius: 2px;
  }
`;

const CompareTable = styled.div`
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  margin-top: 3rem;
`;

const CompareRow = styled.div<{ $isBestPrice?: boolean }>`
  display: grid;
  grid-template-columns: 1.5fr 2fr 1fr 1fr;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid var(--color-gray-100);
  gap: 1rem;
  background: ${props =>
    props.$isBestPrice ? 'linear-gradient(90deg, #f0fdf4 0%, #dcfce7 100%)' : 'transparent'};
  position: relative;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: default;

  &:hover {
    background: ${props =>
      props.$isBestPrice
        ? 'linear-gradient(90deg, #dcfce7 0%, #bbf7d0 100%)'
        : 'var(--color-gray-50)'};
    transform: translateX(4px);
    box-shadow: inset 4px 0 0 var(--color-primary);
  }

  &:last-child {
    border-bottom: none;
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1rem;
    padding: 1rem;
  }
`;

const BestPriceBadge = styled.span`
  position: absolute;
  top: 0.75rem;
  right: 1rem;
  background: linear-gradient(135deg, #166534 0%, #16a34a 100%);
  color: white;
  font-size: 0.625rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 4px 8px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(22, 163, 74, 0.3);

  @media (max-width: 768px) {
    position: static;
    margin-bottom: 0.5rem;
  }
`;

const ShippingInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--color-gray-600);
  font-size: 0.9rem;
  svg {
    color: var(--color-primary);
  }
`;

const PriceText = styled.div<{ $isBestPrice?: boolean }>`
  font-weight: 700;
  font-size: ${props => (props.$isBestPrice ? '1.5rem' : '1.25rem')};
  color: ${props => (props.$isBestPrice ? 'var(--color-primary)' : 'var(--color-gray-800)')};
  text-align: right;
  transition: all 0.2s;
`;

const ShopButton = styled.a`
  background: white;
  border: 1px solid var(--color-gray-200);
  color: var(--color-gray-800);
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
    background: var(--color-gray-50);
    border-color: var(--color-gray-300);
    color: var(--color-primary);
    text-decoration: none;
  }
`;

// Sticky Price Bar for Mobile
const StickyPriceBar = styled.div<{ $show: boolean }>`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  border-top: 1px solid var(--color-gray-200);
  padding: 1rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.08);
  z-index: 999;
  transform: translateY(${props => (props.$show ? '0' : '100%')});
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  @media (min-width: 769px) {
    display: none; // Only show on mobile
  }
`;

const StickyPriceInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const StickyPrice = styled.div`
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--color-primary);
  line-height: 1;
`;

const StickyStore = styled.div`
  font-size: 0.75rem;
  color: var(--color-gray-500);
  font-weight: 500;
`;

const StickyCTA = styled.a`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.875rem 1.5rem;
  background: var(--color-primary);
  color: white;
  border-radius: 10px;
  font-weight: 700;
  font-size: 0.95rem;
  text-decoration: none;
  white-space: nowrap;
  flex-shrink: 0;
  transition: all 0.2s;

  &:hover {
    background: var(--color-primary-dark);
    transform: scale(1.02);
    text-decoration: none;
    color: white;
  }

  &:active {
    transform: scale(0.98);
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
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);
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

  // Keyboard navigation for gallery
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!racket?.imagenes || racket.imagenes.length <= 1) return;

      if (e.key === 'ArrowLeft' && selectedImageIndex > 0) {
        setSelectedImageIndex(prev => prev - 1);
      } else if (e.key === 'ArrowRight' && selectedImageIndex < racket.imagenes.length - 1) {
        setSelectedImageIndex(prev => prev + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImageIndex, racket]);

  // Sticky price bar on scroll (mobile only)
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const priceCardPosition = 600; // Approximate position where price card is off screen

      if (scrollY > priceCardPosition && window.innerWidth <= 768) {
        setShowStickyBar(true);
      } else {
        setShowStickyBar(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollAmount = direction === 'left' ? -100 : 100;
      carouselRef.current.scrollLeft += scrollAmount;
    }
  };

  if (loading) return <RacketDetailSkeleton />;

  if (error || !racket) return <div>Error: {error}</div>;

  const lowestPrice = getLowestPrice(racket);
  const allPrices = getAllStorePrices(racket);
  const availablePrices = allPrices.filter(p => p.available);

  return (
    <PageContainer>
      <Breadcrumbs>
        <Link to='/'>Home</Link> / <Link to='/catalog'>Palas</Link> / {toTitleCase(racket.marca)} /{' '}
        <span style={{ color: 'var(--color-gray-900)' }}>{toTitleCase(racket.modelo)}</span>
      </Breadcrumbs>

      <MainGrid>
        {/* Left: Gallery */}
        <GallerySection>
          <WishlistButton onClick={() => setShowAddToListModal(true)}>
            <FiHeart fill={showAddToListModal ? 'currentColor' : 'none'} />
          </WishlistButton>
          <MainImage
            src={
              racket.imagenes?.[selectedImageIndex] ||
              racket.imagenes?.[0] ||
              '/placeholder-racket.svg'
            }
            alt={racket.modelo}
            onClick={() => setShowLightbox(true)}
            loading='eager'
          />
          {racket.imagenes && racket.imagenes.length > 1 && (
            <>
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'center',
                }}
              >
                <CarouselWrapper>
                  <ScrollButton
                    onClick={() => scrollCarousel('left')}
                    style={{ position: 'absolute', left: '-40px', zIndex: 10 }}
                  >
                    <FiChevronLeft size={20} />
                  </ScrollButton>

                  <CarouselTrack ref={carouselRef}>
                    {racket.imagenes.map((img, index) => (
                      <Thumbnail
                        key={index}
                        src={img}
                        alt={`${racket.modelo} - imagen ${index + 1}`}
                        isActive={index === selectedImageIndex}
                        onClick={() => setSelectedImageIndex(index)}
                        loading='lazy'
                      />
                    ))}
                  </CarouselTrack>

                  <ScrollButton
                    onClick={() => scrollCarousel('right')}
                    style={{ position: 'absolute', right: '-40px', zIndex: 10 }}
                  >
                    <FiChevronRight size={20} />
                  </ScrollButton>
                </CarouselWrapper>
              </div>

              {/* Dots indicator */}
              {racket.imagenes.length > 1 && racket.imagenes.length <= 10 && (
                <DotsContainer>
                  {racket.imagenes.map((_, index) => (
                    <Dot
                      key={index}
                      isActive={index === selectedImageIndex}
                      onClick={() => setSelectedImageIndex(index)}
                      aria-label={`Ver imagen ${index + 1}`}
                    />
                  ))}
                </DotsContainer>
              )}
            </>
          )}
        </GallerySection>

        {/* Right: Info */}
        <InfoSection>
          <ProductTag>{toTitleCase(racket.marca)}</ProductTag>
          <ProductTitle>{toTitleCase(racket.modelo)}</ProductTitle>

          <RatingRow>
            {[1, 2, 3, 4, 5].map(i => (
              <FiStar key={i} fill='currentColor' />
            ))}
            <span>128 reviews</span>
          </RatingRow>

          <PriceCard>
            <BestPriceLabel>Mejor Precio del Mercado</BestPriceLabel>
            <PriceRow>
              <BigPrice>
                {lowestPrice ? `${lowestPrice.price.toFixed(2)}€` : `${racket.precio_actual}€`}
              </BigPrice>
              {lowestPrice && lowestPrice.originalPrice > lowestPrice.price && (
                <OldPrice>{lowestPrice.originalPrice.toFixed(2)}€</OldPrice>
              )}
              {lowestPrice && lowestPrice.discount > 0 && (
                <SaveBadge>-{Math.round(lowestPrice.discount)}%</SaveBadge>
              )}
            </PriceRow>
            <UpdatedTime>Precio actualizado: hace un momento</UpdatedTime>

            <PrimaryButton
              href={lowestPrice?.link || '#'}
              target='_blank'
              rel='noopener noreferrer'
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
          <H3>Especificaciones Técnicas</H3>
          <SpecsGrid>
            <SpecCard>
              <SpecIconWrapper>
                <FormaIcon size={20} />
              </SpecIconWrapper>
              <SpecContent>
                <SpecLabel>Forma</SpecLabel>
                <SpecValue>
                  {toTitleCase(
                    racket.caracteristicas_forma || racket.especificaciones?.forma || 'N/A'
                  )}
                </SpecValue>
              </SpecContent>
            </SpecCard>
            <SpecCard>
              <SpecIconWrapper>
                <BalanceIcon size={20} />
              </SpecIconWrapper>
              <SpecContent>
                <SpecLabel>Balance</SpecLabel>
                <SpecValue>
                  {toTitleCase(
                    racket.caracteristicas_balance || racket.especificaciones?.balance || 'Media'
                  )}
                </SpecValue>
              </SpecContent>
            </SpecCard>
            <SpecCard>
              <SpecIconWrapper>
                <PesoIcon size={20} />
              </SpecIconWrapper>
              <SpecContent>
                <SpecLabel>Peso</SpecLabel>
                <SpecValue>{racket.peso ? `${racket.peso}g` : '360-375g'}</SpecValue>
              </SpecContent>
            </SpecCard>
            <SpecCard>
              <SpecIconWrapper>
                <NucleoIcon size={20} />
              </SpecIconWrapper>
              <SpecContent>
                <SpecLabel>Núcleo</SpecLabel>
                <SpecValue>
                  {toTitleCase(
                    racket.caracteristicas_nucleo || racket.especificaciones?.nucleo || 'EVA'
                  )}
                </SpecValue>
              </SpecContent>
            </SpecCard>
            <SpecCard>
              <SpecIconWrapper>
                <CarasIcon size={20} />
              </SpecIconWrapper>
              <SpecContent>
                <SpecLabel>Caras</SpecLabel>
                <SpecValue>
                  {toTitleCase(
                    racket.caracteristicas_cara || racket.especificaciones?.cara || 'Carbon'
                  )}
                </SpecValue>
              </SpecContent>
            </SpecCard>
            <SpecCard>
              <SpecIconWrapper>
                <NivelIcon size={20} />
              </SpecIconWrapper>
              <SpecContent>
                <SpecLabel>Nivel</SpecLabel>
                <SpecValue>
                  {toTitleCase(
                    racket.caracteristicas_nivel_de_juego ||
                      racket.especificaciones?.nivel_de_juego ||
                      'Avanzado'
                  )}
                </SpecValue>
              </SpecContent>
            </SpecCard>
          </SpecsGrid>
        </div>

        {/* Lower Right: Price History - Show with blur teaser for non-authenticated */}
        {isAuthenticated ? (
          <div>
            <PriceHistoryChart currentPrice={lowestPrice?.price || racket.precio_actual || 0} />
          </div>
        ) : (
          <BlurTeaser
            title='Historial de precios'
            description='Visualiza la evolución del precio y encuentra el mejor momento para comprar'
          >
            <div>
              <PriceHistoryChart currentPrice={lowestPrice?.price || racket.precio_actual || 0} />
            </div>
          </BlurTeaser>
        )}
      </LowerGrid>

      {/* Price Comparison - Show with blur teaser for non-authenticated */}
      {isAuthenticated ? (
        <div style={{ maxWidth: '1400px', margin: '3rem auto', padding: '0 2rem' }}>
          <H3>Comparar Precios</H3>
          <CompareTable>
            {availablePrices.map((store, index) => {
              const isBestPrice =
                lowestPrice &&
                store.store === lowestPrice.store &&
                store.price === lowestPrice.price;

              return (
                <CompareRow key={index} $isBestPrice={isBestPrice}>
                  {isBestPrice && <BestPriceBadge>⚡ Mejor Precio</BestPriceBadge>}
                  <StoreLabel storeName={store.store} variant='compact' />
                  <ShippingInfo>
                    <FiTruck /> Envío Gratis
                    <span
                      style={{
                        fontSize: '0.8rem',
                        color: 'var(--color-gray-400)',
                        fontWeight: 400,
                      }}
                    >
                      • En Stock
                    </span>
                  </ShippingInfo>
                  <PriceText $isBestPrice={isBestPrice}>{store.price?.toFixed(2)}€</PriceText>
                  <ShopButton href={store.link || '#'} target='_blank' rel='noopener noreferrer'>
                    Ir a la tienda <FiExternalLink size={14} />
                  </ShopButton>
                </CompareRow>
              );
            })}
          </CompareTable>
        </div>
      ) : (
        <BlurTeaser
          title='Compara precios en tiempo real'
          description='Accede a la comparación completa de precios entre todas las tiendas y encuentra el mejor descuento'
        >
          <div style={{ maxWidth: '1400px', margin: '3rem auto', padding: '0 2rem' }}>
            <H3>Comparar Precios</H3>
            <CompareTable>
              {availablePrices.slice(0, 3).map((store, index) => {
                return (
                  <CompareRow key={index}>
                    <StoreLabel storeName={store.store} variant='compact' />
                    <ShippingInfo>
                      <FiTruck /> Envío Gratis
                      <span
                        style={{
                          fontSize: '0.8rem',
                          color: 'var(--color-gray-400)',
                          fontWeight: 400,
                        }}
                      >
                        • En Stock
                      </span>
                    </ShippingInfo>
                    <PriceText>{store.price?.toFixed(2)}€</PriceText>
                    <ShopButton href='#' onClick={e => e.preventDefault()}>
                      Ir a la tienda <FiExternalLink size={14} />
                    </ShopButton>
                  </CompareRow>
                );
              })}
            </CompareTable>
          </div>
        </BlurTeaser>
      )}

      {/* Reviews - Show with blur teaser for non-authenticated */}
      {isAuthenticated ? (
        <div style={{ maxWidth: '1400px', margin: '3rem auto', padding: '0 2rem' }}>
          <ProductReviews racketId={racket.id!} />
        </div>
      ) : (
        <BlurTeaser
          title='Lee opiniones de jugadores reales'
          description='Accede a cientos de reseñas verificadas y descubre qué dicen otros jugadores sobre esta pala'
        >
          <div style={{ maxWidth: '1400px', margin: '3rem auto', padding: '0 2rem' }}>
            <ProductReviews racketId={racket.id!} />
          </div>
        </BlurTeaser>
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

      {/* Image Lightbox */}
      {showLightbox && racket.imagenes && (
        <ImageLightbox
          images={racket.imagenes}
          currentIndex={selectedImageIndex}
          onClose={() => setShowLightbox(false)}
          onNavigate={setSelectedImageIndex}
          alt={racket.modelo}
        />
      )}

      {/* Sticky Price Bar for Mobile */}
      <StickyPriceBar $show={showStickyBar}>
        <StickyPriceInfo>
          <StickyPrice>{lowestPrice?.price?.toFixed(2)}€</StickyPrice>
          <StickyStore>en {lowestPrice?.store || 'Tienda'}</StickyStore>
        </StickyPriceInfo>
        <StickyCTA href={lowestPrice?.link || '#'} target='_blank' rel='noopener noreferrer'>
          Ver Oferta <FiExternalLink size={16} />
        </StickyCTA>
      </StickyPriceBar>
    </PageContainer>
  );
};

export default RacketDetailPage;
