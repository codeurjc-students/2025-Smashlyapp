import { AnimatePresence, motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import { FiGrid, FiList, FiSearch, FiStar, FiTag, FiX, FiHeart } from 'react-icons/fi';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styled from 'styled-components';
import { useComparison } from '../contexts/ComparisonContext';
import { useRackets } from '../contexts/RacketsContext';
import { RacketService } from '../services/racketService';
import { useAuth } from '../contexts/AuthContext';
import { Racket } from '../types/racket';
import { AddToListModal } from '../components/features/AddToListModal';
import { getLowestPrice } from '../utils/priceUtils';

// Styled Components
const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #f8faf8 0%, #e8f5e8 100%);
`;

const Header = styled.div`
  background: white;
  border-bottom: 1px solid #e5e7eb;
  padding: 2rem 0;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
`;

const HeaderContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  text-align: center;
`;

const Title = styled.h1`
  font-size: 3rem;
  font-weight: 800;
  color: #1f2937;
  margin-bottom: 1rem;

  .highlight {
    color: #16a34a;
  }

  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const Subtitle = styled.p`
  font-size: 1.25rem;
  color: #6b7280;
  margin-bottom: 2rem;
  line-height: 1.6;

  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

const StatsContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-top: 1rem;

  @media (max-width: 768px) {
    gap: 1rem;
    flex-wrap: wrap;
  }
`;

const StatItem = styled.div`
  text-align: center;
`;

const StatNumber = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: #16a34a;
`;

const StatLabel = styled.div`
  font-size: 0.875rem;
  color: #6b7280;
`;

const MainContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
`;

const FiltersSection = styled.div`
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(22, 163, 74, 0.1);
`;

const FiltersRow = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const SearchContainer = styled.div`
  flex: 1;
  position: relative;
  min-width: 300px;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 0.875rem 1rem 0.875rem 2.75rem;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 0.875rem;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: #16a34a;
    box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.1);
  }

  &::placeholder {
    color: #9ca3af;
  }
`;

const SearchIcon = styled(FiSearch)`
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #6b7280;
`;

const FilterButton = styled.button<{ active?: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 1rem;
  border: 2px solid ${props => (props.active ? '#16a34a' : '#e5e7eb')};
  border-radius: 12px;
  background: ${props => (props.active ? '#f0f9ff' : 'white')};
  color: ${props => (props.active ? '#16a34a' : '#6b7280')};
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: #16a34a;
    color: #16a34a;
  }
`;

const FilterSelect = styled.select`
  padding: 0.875rem 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  background: white;
  color: #6b7280;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  /* Custom arrow to control its position */
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 1rem center; /* move arrow a bit left */
  background-size: 20px;
  padding-right: 2.5rem; /* ensure text doesn't overlap the arrow */

  &:hover {
    border-color: #16a34a;
    color: #16a34a;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%2316a34a' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
  }

  &:focus {
    outline: none;
    border-color: #16a34a;
    box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.1);
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%2316a34a' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
  }
`;

const ResultsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
`;

const ResultsCount = styled.div`
  font-size: 1rem;
  color: #6b7280;
`;

const ViewToggle = styled.div`
  display: flex;
  gap: 0.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 0.25rem;
  background: white;
`;

const ViewButton = styled.button<{ active: boolean }>`
  padding: 0.5rem;
  border: none;
  border-radius: 6px;
  background: ${props => (props.active ? '#16a34a' : 'transparent')};
  color: ${props => (props.active ? 'white' : '#6b7280')};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    color: ${props => (props.active ? 'white' : '#16a34a')};
  }
`;

const SortSelect = styled.select`
  padding: 0.5rem 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: white;
  font-size: 0.875rem;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: #16a34a;
  }
`;

const RacketsGrid = styled.ul<{ view: 'grid' | 'list' }>`
  display: grid;
  grid-template-columns: ${props =>
    props.view === 'grid' ? 'repeat(auto-fill, minmax(280px, 1fr))' : '1fr'};
  gap: ${props => (props.view === 'grid' ? '1.5rem' : '1rem')};
  list-style: none;
  padding: 0;
  margin: 0;
`;

const RacketCard = styled(motion.li)<{ view: 'grid' | 'list' }>`
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid rgba(22, 163, 74, 0.1);

  display: ${props => (props.view === 'list' ? 'flex' : 'block')};

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
  margin-bottom: ${props => (props.view === 'grid' ? '1rem' : '0.75rem')};
  flex-wrap: wrap;
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

const BestPriceBadge = styled.div`
  background: #16a34a;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.25rem;
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

const LoadMoreButton = styled(motion.button)`
  display: block;
  margin: 3rem auto 0;
  background: white;
  color: #16a34a;
  border: 2px solid #16a34a;
  padding: 1rem 2rem;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #f0f9ff;
    transform: translateY(-2px);
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  color: #6b7280;
`;

const EmptyIcon = styled.div`
  font-size: 4rem;
  margin-bottom: 1rem;
`;

const EmptyTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
`;

const EmptyDescription = styled.p`
  font-size: 1rem;
  color: #6b7280;
  margin-bottom: 2rem;
`;

const ClearFiltersButton = styled.button`
  background: #16a34a;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #15803d;
  }
`;

// Floating comparison panel
const FloatingPanel = styled(motion.div)`
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  background: white;
  border-radius: 16px;
  padding: 1rem 1.5rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  border: 2px solid #16a34a;
  z-index: 50;

  @media (max-width: 768px) {
    bottom: 1rem;
    right: 1rem;
    left: 1rem;
  }
`;

const PanelContent = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const PanelText = styled.div`
  font-size: 0.875rem;
  font-weight: 600;
  color: #1f2937;
`;

const CompareButton = styled.button`
  background: #16a34a;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #15803d;
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

// Component
const CatalogPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { rackets, loading } = useRackets();
  const { count } = useComparison();
  const { isAuthenticated } = useAuth();

  // State
  const [filteredRackets, setFilteredRackets] = useState<Racket[]>([]);
  const [displayedRackets, setDisplayedRackets] = useState<Racket[]>([]);
  const [serverTotal, setServerTotal] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('Todas');
  const [showBestsellers, setShowBestsellers] = useState(false);
  const [showOffers, setShowOffers] = useState(false);
  const [sortBy, setSortBy] = useState('bestseller');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [displayCount, setDisplayCount] = useState(10);
  const [showAddToListModal, setShowAddToListModal] = useState(false);
  const [selectedRacket, setSelectedRacket] = useState<Racket | null>(null);

  // Initialize search from URL params
  useEffect(() => {
    const queryParam = searchParams.get('search');
    if (queryParam) {
      setSearchQuery(queryParam);
    }
  }, [searchParams]);

  // Fetch server-side total count
  useEffect(() => {
    (async () => {
      try {
        const stats = await RacketService.getStats();
        setServerTotal(stats.total);
      } catch (e) {
        // Ignorar errores; fallback al total del contexto
      }
    })();
  }, []);

  // Filter and search effect
  useEffect(() => {
    let filtered = [...rackets];

    // Apply search filter - flexible word-based search
    if (searchQuery.trim()) {
      const searchWords = searchQuery.toLowerCase().trim().split(/\s+/);
      filtered = filtered.filter(racket => {
        const nombre = (racket.nombre || '').toLowerCase();
        const marca = (racket.marca || '').toLowerCase();
        const modelo = (racket.modelo || '').toLowerCase();
        const combinedText = `${nombre} ${marca} ${modelo}`;

        // Check if ALL search words are present in the racket's text
        return searchWords.every(word => combinedText.includes(word));
      });
    }

    // Apply brand filter
    if (selectedBrand !== 'Todas') {
      filtered = filtered.filter(racket => racket.marca === selectedBrand);
    }

    // Apply bestsellers filter
    if (showBestsellers) {
      filtered = filtered.filter(racket => racket.es_bestseller);
    }

    // Apply offers filter
    if (showOffers) {
      filtered = filtered.filter(racket => racket.en_oferta);
    }

    // Apply sorting
    try {
      filtered.sort((a, b) => {
        switch (sortBy) {
          case 'price-low':
            const priceA = getLowestPrice(a)?.price || a.precio_actual || 0;
            const priceB = getLowestPrice(b)?.price || b.precio_actual || 0;
            return priceA - priceB;
          case 'price-high':
            const priceHighA = getLowestPrice(a)?.price || a.precio_actual || 0;
            const priceHighB = getLowestPrice(b)?.price || b.precio_actual || 0;
            return priceHighB - priceHighA;
          case 'brand':
            const brandA = a.marca || '';
            const brandB = b.marca || '';
            return brandA.localeCompare(brandB);
          case 'bestseller':
            // Bestsellers primero (true > false)
            if (a.es_bestseller && !b.es_bestseller) return -1;
            if (!a.es_bestseller && b.es_bestseller) return 1;
            return 0;
          case 'offer':
            // Ofertas primero (true > false)
            if (a.en_oferta && !b.en_oferta) return -1;
            if (!a.en_oferta && b.en_oferta) return 1;
            return 0;
          default:
            const modelA = a.modelo || '';
            const modelB = b.modelo || '';
            return modelA.localeCompare(modelB);
        }
      });
    } catch (error) {
      console.error('Error sorting rackets:', error);
    }

    setFilteredRackets(filtered);
  }, [rackets, searchQuery, selectedBrand, showBestsellers, showOffers, sortBy]);

  // Update displayed rackets when filters change
  useEffect(() => {
    setDisplayedRackets(filteredRackets.slice(0, displayCount));
  }, [filteredRackets, displayCount]);

  // Get unique brands
  const uniqueBrands: string[] = [
    'Todas',
    ...Array.from(new Set(rackets.map(racket => racket.marca))).sort(),
  ];

  // Get stats
  const totalRackets = serverTotal ?? rackets.length;
  const bestsellersCount = rackets.filter(r => r.es_bestseller).length;
  const offersCount = rackets.filter(r => r.en_oferta).length;

  // Handlers
  const handleRacketClick = (racket: Racket) => {
    navigate(`/racket-detail?id=${encodeURIComponent(racket.nombre)}`);
  };

  const handleLoadMore = () => {
    setDisplayCount(prev => prev + 10);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedBrand('Todas');
    setShowBestsellers(false);
    setShowOffers(false);
    setSortBy('bestseller');
  };

  const goToComparison = () => {
    navigate('/compare-rackets');
  };

  if (loading) {
    return (
      <Container>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '80vh',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            style={{ color: '#16a34a' }}
          >
            <FiGrid size={48} />
          </motion.div>
          <div style={{ color: '#6b7280', fontSize: '1.125rem' }}>Cargando catálogo...</div>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      {/* Header */}
      <Header>
        <HeaderContent>
          <Title>
            Catálogo de <span className='highlight'>Palas</span>
          </Title>
          <Subtitle>
            Descubre nuestra colección completa de palas de pádel con las mejores marcas y precios
          </Subtitle>
          <StatsContainer>
            <StatItem>
              <StatNumber>{totalRackets}</StatNumber>
              <StatLabel>Palas</StatLabel>
            </StatItem>
            <StatItem>
              <StatNumber>{bestsellersCount}</StatNumber>
              <StatLabel>Bestsellers</StatLabel>
            </StatItem>
            <StatItem>
              <StatNumber>{offersCount}</StatNumber>
              <StatLabel>En Oferta</StatLabel>
            </StatItem>
            <StatItem>
              <StatNumber>{uniqueBrands.length - 1}</StatNumber>
              <StatLabel>Marcas</StatLabel>
            </StatItem>
          </StatsContainer>
        </HeaderContent>
      </Header>
      {/* Main Content */}
      <MainContent>
        {/* Filters */}
        <FiltersSection>
          <FiltersRow>
            <SearchContainer>
              <SearchIcon />
              <SearchInput
                type='text'
                placeholder='Buscar por nombre, marca o modelo...'
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </SearchContainer>

            <FilterButton
              active={showBestsellers}
              onClick={() => setShowBestsellers(!showBestsellers)}
            >
              <FiStar />
              Bestsellers
            </FilterButton>

            <FilterButton active={showOffers} onClick={() => setShowOffers(!showOffers)}>
              <FiTag />
              Ofertas
            </FilterButton>

            {/* Filtro de marca como desplegable con estilo de FilterButton */}
            <FilterSelect value={selectedBrand} onChange={e => setSelectedBrand(e.target.value)}>
              {uniqueBrands.map(brand => (
                <option key={brand} value={brand}>
                  {brand === 'Todas' ? 'Todas las marcas' : brand}
                </option>
              ))}
            </FilterSelect>

            <FilterButton onClick={clearFilters}>
              <FiX />
              Limpiar
            </FilterButton>
          </FiltersRow>
        </FiltersSection>

        {/* Results Header */}
        <ResultsHeader>
          <ResultsCount>
            Mostrando {displayedRackets.length} de {totalRackets} palas
          </ResultsCount>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <SortSelect value={sortBy} onChange={e => setSortBy(e.target.value)}>
              <option value='bestseller'>Bestsellers primero</option>
              <option value='name'>Ordenar por nombre</option>
              <option value='brand'>Ordenar por marca</option>
              <option value='price-low'>Precio: menor a mayor</option>
              <option value='price-high'>Precio: mayor a menor</option>
              <option value='offer'>Ofertas primero</option>
            </SortSelect>

            <ViewToggle>
              <ViewButton active={viewMode === 'grid'} onClick={() => setViewMode('grid')}>
                <FiGrid />
              </ViewButton>
              <ViewButton active={viewMode === 'list'} onClick={() => setViewMode('list')}>
                <FiList />
              </ViewButton>
            </ViewToggle>
          </div>
        </ResultsHeader>

        {/* Results */}
        {filteredRackets.length === 0 ? (
          <EmptyState>
            <EmptyIcon>🎾</EmptyIcon>
            <EmptyTitle>No se encontraron palas</EmptyTitle>
            <EmptyDescription>Prueba ajustando los filtros o términos de búsqueda</EmptyDescription>
            <ClearFiltersButton onClick={clearFilters}>Limpiar filtros</ClearFiltersButton>
          </EmptyState>
        ) : (
          <>
            <RacketsGrid view={viewMode}>
              {displayedRackets.map((racket, index) => {
                if (!racket || !racket.nombre) {
                  console.error('Invalid racket data:', racket);
                  return null;
                }
                return (
                  <RacketCard
                    key={`${racket.id}-${racket.nombre}-${index}`}
                    view={viewMode}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    onClick={() => handleRacketClick(racket)}
                  >
                    <RacketImageContainer view={viewMode}>
                      <RacketImage
                        src={racket.imagen}
                        alt={racket.modelo}
                        onError={e => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/placeholder-racket.svg';
                        }}
                      />
                      {racket.es_bestseller && (
                        <RacketBadge variant='bestseller'>
                          <FiStar size={12} />
                          Top
                        </RacketBadge>
                      )}
                      {racket.en_oferta && (
                        <RacketBadge variant='offer'>
                          <FiTag size={12} />
                          Oferta
                        </RacketBadge>
                      )}
                    </RacketImageContainer>

                    <RacketInfo view={viewMode}>
                      <div>
                        <RacketBrand>{racket.marca}</RacketBrand>
                        <RacketName view={viewMode}>{toTitleCase(racket.modelo)}</RacketName>

                        <PriceContainer view={viewMode}>
                          {(() => {
                            const lowestPrice = getLowestPrice(racket);
                            if (lowestPrice) {
                              return (
                                <>
                                  <CurrentPrice>€{lowestPrice.price.toFixed(2)}</CurrentPrice>
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
                                  <BestPriceBadge>
                                    <FiTag size={10} />
                                    Mejor precio
                                  </BestPriceBadge>
                                </>
                              );
                            }
                            return <CurrentPrice>€{racket.precio_actual}</CurrentPrice>;
                          })()}
                        </PriceContainer>
                      </div>

                      <ActionButtons view={viewMode}>
                        <ViewDetailsButton onClick={() => handleRacketClick(racket)}>
                          Ver detalles
                        </ViewDetailsButton>
                        {isAuthenticated && (
                          <ViewDetailsButton
                            onClick={e => {
                              e.stopPropagation();
                              setSelectedRacket(racket);
                              setShowAddToListModal(true);
                            }}
                            style={{ background: '#15803d' }}
                          >
                            <FiHeart size={14} />
                            Mis listas
                          </ViewDetailsButton>
                        )}
                        {/* <AddToCompareButton
                        disabled={isRacketInComparison(racket.nombre)}
                        onClick={(e) => handleAddToComparison(racket, e)}
                      >
                        {isRacketInComparison(racket.nombre) ? (
                          <>
                            <FiCheck />
                            En comparador
                          </>
                        ) : (
                          <>
                            <FiTrendingUp />
                            Comparar
                          </>
                        )}
                      </AddToCompareButton> */}
                      </ActionButtons>
                    </RacketInfo>
                  </RacketCard>
                );
              })}
            </RacketsGrid>

            {/* Counter for E2E tests - visually hidden but accessible to screen readers and Selenium */}
            <p
              data-testid='rackets-count'
              style={{
                clip: 'rect(0 0 0 0)',
                clipPath: 'inset(50%)',
                height: '1px',
                overflow: 'hidden',
                position: 'absolute',
                whiteSpace: 'nowrap',
                width: '1px',
              }}
            >
              Total de palas mostradas: {displayedRackets.length}
            </p>

            {displayedRackets.length < (serverTotal ?? filteredRackets.length) && (
              <LoadMoreButton
                onClick={handleLoadMore}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Cargar más palas ({
                  (serverTotal ?? filteredRackets.length) - displayedRackets.length
                } restantes)
              </LoadMoreButton>
            )}
          </>
        )}
      </MainContent>
      <AnimatePresence>
        {count > 0 && (
          <FloatingPanel
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
          >
            <PanelContent>
              <PanelText>
                {count} pala{count > 1 ? 's' : ''} seleccionada
                {count > 1 ? 's' : ''} para comparar
              </PanelText>
              <CompareButton onClick={goToComparison}>Comparar ahora</CompareButton>
            </PanelContent>
          </FloatingPanel>
        )}
      </AnimatePresence>
      {/* Modal para añadir a listas */}
      {selectedRacket && (
        <AddToListModal
          isOpen={showAddToListModal}
          onClose={() => {
            setShowAddToListModal(false);
            setSelectedRacket(null);
          }}
          racketId={selectedRacket.id || 0}
          racketName={`${selectedRacket.marca} ${selectedRacket.modelo}`}
        />
      )}
    </Container>
  );
};

export default CatalogPage;
