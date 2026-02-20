import { AnimatePresence, motion } from 'framer-motion';
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { FiX, FiTag, FiGrid, FiBox } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useRackets } from '../../contexts/RacketsContext';
import { Racket } from '../../types/racket';
import { toTitleCase } from '../../utils/textUtils';

const SearchContainer = styled.div`
  position: relative;
  z-index: 1000;
  width: 100%;
`;

const SearchWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
`;

const SearchInputContainer = styled(motion.div)<{ $isInHeader?: boolean }>`
  position: relative;
  background: ${props => (props.$isInHeader ? 'rgba(255, 255, 255, 0.12)' : '#f8fafc')};
  border-radius: 24px;
  overflow: hidden;
  width: ${props => (props.$isInHeader ? '100%' : '280px')};
  border: 1px solid ${props => (props.$isInHeader ? 'rgba(255, 255, 255, 0.15)' : 'transparent')};
  transition: all 0.2s ease;

  &:hover {
    background: ${props => (props.$isInHeader ? 'rgba(255, 255, 255, 0.16)' : '#f1f5f9')};
  }

  &:focus-within {
    background: ${props => (props.$isInHeader ? 'rgba(255, 255, 255, 0.2)' : 'white')};
    border-color: ${props => (props.$isInHeader ? 'rgba(255, 255, 255, 0.25)' : '#16a34a20')};
    box-shadow: 0 0 0 3px ${props => (props.$isInHeader ? 'rgba(255, 255, 255, 0.1)' : '#16a34a10')};
  }

  @media (max-width: 600px) {
    border-radius: 16px;
    width: ${props => (props.$isInHeader ? '100%' : '100%')};
  }

  @media (max-width: 480px) {
    width: ${props => (props.$isInHeader ? '100%' : '100%')};
  }
`;

const SearchInput = styled.input<{ $isInHeader?: boolean }>`
  width: 100%;
  padding: 10px 44px 10px 16px;
  border: none;
  outline: none;
  font-size: 14px;
  color: ${props => (props.$isInHeader ? 'white' : '#1e293b')};
  background: transparent;
  font-weight: 400;

  &::placeholder {
    color: ${props => (props.$isInHeader ? 'rgba(255, 255, 255, 0.6)' : '#94a3b8')};
  }

  @media (max-width: 480px) {
    font-size: 15px;
    padding: 12px 40px 12px 14px;
  }
`;

const ClearButton = styled.button<{ $isInHeader?: boolean }>`
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: ${props => (props.$isInHeader ? 'rgba(255, 255, 255, 0.7)' : '#94a3b8')};
  cursor: pointer;
  padding: 4px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => (props.$isInHeader ? 'rgba(255, 255, 255, 0.15)' : '#f1f5f9')};
    color: ${props => (props.$isInHeader ? 'white' : '#64748b')};
  }

  @media (max-width: 480px) {
    right: 10px;
    padding: 6px;
  }
`;

const SearchResultsDropdown = styled(motion.div)`
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
  border: 1px solid #e2e8f0;
  max-height: 420px;
  overflow: hidden;
  z-index: 1001;

  @media (max-width: 600px) {
    position: fixed;
    top: auto;
    bottom: 0;
    left: 0;
    right: 0;
    max-height: 70vh;
    border-radius: 24px 24px 0 0;
    box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
  }
`;

const ResultsGroup = styled.div`
  &:not(:last-child) {
    border-bottom: 1px solid #f1f5f9;
  }
`;

const ResultsGroupHeader = styled.div`
  padding: 10px 16px 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  background: #fafbfc;
`;

const ResultsGroupTitle = styled.span`
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #94a3b8;
`;

const ResultsGroupCount = styled.span`
  font-size: 11px;
  color: #cbd5e1;
  margin-left: auto;
`;

const SearchResultsList = styled.div`
  max-height: 320px;
  overflow-y: auto;

  @media (max-width: 600px) {
    max-height: 50vh;
  }
`;

const SearchResultItem = styled(motion.div)<{ $variant?: 'racket' | 'brand' | 'category' }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  cursor: pointer;
  transition: background-color 0.15s ease;

  &:hover {
    background: #f8fafc;
  }

  &:last-child {
    border-bottom: none;
  }

  @media (max-width: 600px) {
    padding: 14px 16px;
    gap: 14px;
  }
`;

const ResultIcon = styled.div<{ $variant?: 'racket' | 'brand' | 'category' }>`
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: ${props => {
    switch (props.$variant) {
      case 'brand': return '#16a34a10';
      case 'category': return '#0d948810';
      default: return '#f1f5f9';
    }
  }};
  color: ${props => {
    switch (props.$variant) {
      case 'brand': return '#16a34a';
      case 'category': return '#0d9488';
      default: return 'transparent';
    }
  }};
  
  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    border-radius: 10px;
  }
`;

const ResultImage = styled.img`
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: #f8fafc;
  object-fit: contain;
  flex-shrink: 0;
`;

const ResultInfo = styled.div`
  flex: 1;
  min-width: 0;

  @media (max-width: 480px) {
    max-width: 140px;
  }
`;

const ResultName = styled.div<{ $variant?: 'racket' | 'brand' | 'category' }>`
  font-size: 14px;
  font-weight: 500;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  @media (max-width: 600px) {
    font-size: 15px;
  }
`;

const ResultSubtext = styled.div`
  font-size: 12px;
  color: #94a3b8;
  margin-top: 2px;

  @media (max-width: 600px) {
    font-size: 13px;
  }
`;

const ResultPrice = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: #16a34a;
  white-space: nowrap;

  @media (max-width: 480px) {
    font-size: 13px;
    position: absolute;
    right: 16px;
  }
`;

const NoResults = styled.div`
  padding: 24px 16px;
  text-align: center;

  @media (max-width: 600px) {
    padding: 32px 16px;
  }
`;

const NoResultsText = styled.p`
  font-size: 14px;
  color: #64748b;
  margin: 0 0 8px 0;
`;

const NoResultsHint = styled.span`
  font-size: 12px;
  color: #94a3b8;
`;

const ViewAllLink = styled.span`
  display: block;
  padding: 12px 16px;
  text-align: center;
  font-size: 13px;
  color: #16a34a;
  font-weight: 500;
  cursor: pointer;
  border-top: 1px solid #f1f5f9;
  transition: background 0.15s ease;

  &:hover {
    background: #f8fafc;
  }
`;

interface SearchResult {
  type: 'racket' | 'brand' | 'category';
  data: Racket | string;
}

interface GlobalSearchProps {
  onSearchToggle?: (isOpen: boolean) => void;
  isInHeader?: boolean;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({
  onSearchToggle,
  isInHeader = false,
}) => {
  const [isSearchOpen, setIsSearchOpen] = useState(isInHeader);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { rackets } = useRackets();

  const uniqueBrands = useMemo(
    () => Array.from(new Set(rackets.map(r => r.marca).filter(Boolean))).sort(),
    [rackets]
  );

  const uniqueShapes = useMemo(
    () => Array.from(
      new Set(
        rackets
          .map(r => r.caracteristicas_forma || r.especificaciones?.forma)
          .filter(Boolean)
      )
    ).sort(),
    [rackets]
  );

  useEffect(() => {
    if (isInHeader && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isInHeader]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);

    const timeoutId = setTimeout(() => {
      const query = searchQuery.toLowerCase().trim();
      const queryWords = query.split(/\s+/);

      const results: SearchResult[] = [];

      const brandResults = uniqueBrands.filter(brand => 
        brand.toLowerCase().includes(query)
      ).slice(0, 4);
      brandResults.forEach(brand => {
        results.push({ type: 'brand', data: brand });
      });

      const categoryResults = uniqueShapes.filter(shape => 
        shape.toLowerCase().includes(query)
      ).slice(0, 4);
      categoryResults.forEach(shape => {
        results.push({ type: 'category', data: shape });
      });

      const racketResults = rackets.filter((racket: Racket) => {
        const nombre = racket.nombre.toLowerCase();
        const marca = (racket.marca || '').toLowerCase();
        const modelo = (racket.modelo || '').toLowerCase();
        const combinedText = `${nombre} ${marca} ${modelo}`;
        return queryWords.every(word => combinedText.includes(word));
      }).slice(0, 6);

      racketResults.forEach(racket => {
        results.push({ type: 'racket', data: racket });
      });

      setSearchResults(results);
      setIsLoading(false);
    }, 200);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, rackets, uniqueBrands, uniqueShapes]);

  const toggleSearch = () => {
    if (isInHeader) {
      setSearchQuery('');
      setSearchResults([]);
      onSearchToggle?.(false);
      return;
    }

    const newIsOpen = !isSearchOpen;
    setIsSearchOpen(newIsOpen);

    if (newIsOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    } else {
      setSearchQuery('');
      setSearchResults([]);
    }

    onSearchToggle?.(newIsOpen);
  };

  const handleRacketSelect = (racket: Racket) => {
    if (isInHeader) {
      setSearchQuery('');
      setSearchResults([]);
      onSearchToggle?.(false);
    } else {
      toggleSearch();
    }
    navigate(`/racket-detail?id=${encodeURIComponent(racket.nombre)}`);
  };

  const handleBrandSelect = (brand: string) => {
    if (isInHeader) {
      setSearchQuery('');
      setSearchResults([]);
      onSearchToggle?.(false);
    } else {
      toggleSearch();
    }
    navigate(`/catalog?brand=${encodeURIComponent(brand)}`);
  };

  const handleCategorySelect = (shape: string) => {
    if (isInHeader) {
      setSearchQuery('');
      setSearchResults([]);
      onSearchToggle?.(false);
    } else {
      toggleSearch();
    }
    navigate(`/catalog?shape=${encodeURIComponent(shape)}`);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (isInHeader) {
        onSearchToggle?.(false);
      } else {
        toggleSearch();
      }
    } else if (e.key === 'Enter' && searchQuery.trim()) {
      if (isInHeader) {
        onSearchToggle?.(false);
      } else {
        toggleSearch();
      }
      navigate(`/catalog?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setSearchResults([]);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    searchInputRef.current?.focus();
  };

  const handleViewAll = () => {
    if (isInHeader) {
      onSearchToggle?.(false);
    } else {
      toggleSearch();
    }
    navigate(`/catalog?search=${encodeURIComponent(searchQuery.trim())}`);
    setSearchQuery('');
    setSearchResults([]);
  };

  const groupResults = () => {
    const groups: { [key: string]: SearchResult[] } = {
      racket: [],
      brand: [],
      category: []
    };

    searchResults.forEach(result => {
      groups[result.type].push(result);
    });

    return groups;
  };

  const groupedResults = groupResults();
  const hasResults = searchResults.length > 0;

  return (
    <SearchContainer>
      <SearchWrapper>
        <AnimatePresence>
          {(isSearchOpen || isInHeader) && (
            <SearchInputContainer
              $isInHeader={isInHeader}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <SearchInput
                ref={searchInputRef}
                placeholder={isInHeader ? 'Buscar palas, marcas, formas...' : 'Buscar...'}
                value={searchQuery}
                onChange={handleSearchChange}
                onKeyDown={handleKeyPress}
                $isInHeader={isInHeader}
              />
              {searchQuery && (
                <ClearButton onClick={clearSearch} $isInHeader={isInHeader}>
                  <FiX size={14} />
                </ClearButton>
              )}
            </SearchInputContainer>
          )}
        </AnimatePresence>
      </SearchWrapper>

      <AnimatePresence>
        {(isSearchOpen || isInHeader) && searchQuery.trim().length > 0 && (
          <SearchResultsDropdown
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            {!isLoading && !hasResults && (
              <NoResults>
                <NoResultsText>No encontrado</NoResultsText>
                <NoResultsHint>
                  Presiona <strong>Enter</strong> para buscar en el catálogo
                </NoResultsHint>
              </NoResults>
            )}

            {hasResults && (
              <>
                {groupedResults.brand.length > 0 && (
                  <ResultsGroup>
                    <ResultsGroupHeader>
                      <FiTag size={12} />
                      <ResultsGroupTitle>Marcas</ResultsGroupTitle>
                      <ResultsGroupCount>{groupedResults.brand.length}</ResultsGroupCount>
                    </ResultsGroupHeader>
                    <SearchResultsList>
                      {groupedResults.brand.map((result, index) => (
                        <SearchResultItem
                          key={`brand-${result.data}-${index}`}
                          $variant="brand"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.03 }}
                          onClick={() => handleBrandSelect(result.data as string)}
                        >
                          <ResultIcon $variant="brand">
                            <FiTag size={16} />
                          </ResultIcon>
                          <ResultInfo>
                            <ResultName $variant="brand">{toTitleCase(result.data as string)}</ResultName>
                          </ResultInfo>
                        </SearchResultItem>
                      ))}
                    </SearchResultsList>
                  </ResultsGroup>
                )}

                {groupedResults.category.length > 0 && (
                  <ResultsGroup>
                    <ResultsGroupHeader>
                      <FiGrid size={12} />
                      <ResultsGroupTitle>Formas</ResultsGroupTitle>
                      <ResultsGroupCount>{groupedResults.category.length}</ResultsGroupCount>
                    </ResultsGroupHeader>
                    <SearchResultsList>
                      {groupedResults.category.map((result, index) => (
                        <SearchResultItem
                          key={`category-${result.data}-${index}`}
                          $variant="category"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.03 }}
                          onClick={() => handleCategorySelect(result.data as string)}
                        >
                          <ResultIcon $variant="category">
                            <FiGrid size={16} />
                          </ResultIcon>
                          <ResultInfo>
                            <ResultName $variant="category">{result.data as string}</ResultName>
                            <ResultSubtext>Forma de pala</ResultSubtext>
                          </ResultInfo>
                        </SearchResultItem>
                      ))}
                    </SearchResultsList>
                  </ResultsGroup>
                )}

                {groupedResults.racket.length > 0 && (
                  <ResultsGroup>
                    <ResultsGroupHeader>
                      <FiBox size={12} />
                      <ResultsGroupTitle>Palas</ResultsGroupTitle>
                      <ResultsGroupCount>{groupedResults.racket.length}</ResultsGroupCount>
                    </ResultsGroupHeader>
                    <SearchResultsList>
                      {groupedResults.racket.map((result, index) => {
                        const racket = result.data as Racket;
                        return (
                          <SearchResultItem
                            key={`racket-${racket.nombre}-${index}`}
                            $variant="racket"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.03 }}
                            onClick={() => handleRacketSelect(racket)}
                          >
                            <ResultImage
                              src={racket.imagenes?.[0] || ''}
                              alt={racket.modelo || racket.nombre}
                              onError={e => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                              }}
                            />
                            <ResultIcon $variant="racket">
                              <FiBox size={16} />
                            </ResultIcon>
                            <ResultInfo>
                              <ResultName $variant="racket">{toTitleCase(racket.modelo || racket.nombre)}</ResultName>
                              <ResultSubtext>{toTitleCase(racket.marca)} • {racket.caracteristicas_forma || 'forma'}</ResultSubtext>
                            </ResultInfo>
                            {racket.precio_actual && (
                              <ResultPrice>€{racket.precio_actual}</ResultPrice>
                            )}
                          </SearchResultItem>
                        );
                      })}
                    </SearchResultsList>
                  </ResultsGroup>
                )}

                <ViewAllLink onClick={handleViewAll}>
                  Ver todos los resultados en catálogo →
                </ViewAllLink>
              </>
            )}
          </SearchResultsDropdown>
        )}
      </AnimatePresence>
    </SearchContainer>
  );
};

export default GlobalSearch;
