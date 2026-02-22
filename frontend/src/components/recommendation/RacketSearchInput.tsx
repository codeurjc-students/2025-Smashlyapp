import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiX } from 'react-icons/fi';
import { useRackets } from '../../contexts/RacketsContext';

const SearchContainer = styled.div`
  position: relative;
  width: 100%;
`;

const SearchInputWrapper = styled.div<{ $isFocused: boolean }>`
  display: flex;
  align-items: center;
  border: 2px solid ${props => (props.$isFocused ? '#16a34a' : '#e5e7eb')};
  border-radius: 12px;
  background: white;
  transition: all 0.2s;
  overflow: hidden;

  &:hover {
    border-color: ${props => (props.$isFocused ? '#16a34a' : '#d1d5db')};
  }
`;

const SearchIcon = styled.div`
  padding-left: 1rem;
  color: #9ca3af;
  display: flex;
  align-items: center;
`;

const Input = styled.input`
  flex: 1;
  padding: 1rem;
  border: none;
  outline: none;
  font-size: 1rem;
  color: #1f2937;
  background: transparent;

  &::placeholder {
    color: #9ca3af;
  }
`;

const ClearButton = styled.button`
  padding: 0.75rem 1rem;
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: color 0.2s;

  &:hover {
    color: #6b7280;
  }
`;

const ResultsDropdown = styled(motion.div)`
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  border: 1px solid #e5e7eb;
  max-height: 320px;
  overflow-y: auto;
  z-index: 100;
`;

const ResultItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: background 0.15s;
  border-bottom: 1px solid #f3f4f6;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: #f9fafb;
  }
`;

const ResultImage = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 8px;
  object-fit: contain;
  background: #f3f4f6;
`;

const ResultPlaceholder = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  font-size: 0.75rem;
`;

const ResultInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const ResultName = styled.div`
  font-weight: 500;
  color: #1f2937;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ResultBrand = styled.div`
  font-size: 0.85rem;
  color: #6b7280;
`;

const NoResults = styled.div`
  padding: 1.5rem;
  text-align: center;
  color: #6b7280;
`;

const ManualEntryHint = styled.div`
  padding: 0.75rem 1rem;
  font-size: 0.85rem;
  color: #6b7280;
  background: #f9fafb;
  border-top: 1px solid #e5e7eb;
  text-align: center;
`;

export interface RacketSearchResult {
  id: number;
  name: string;
  marca: string;
  imagenes?: string[] | null;
}

interface RacketSearchInputProps {
  value: RacketSearchResult | null;
  onChange: (racket: RacketSearchResult | null) => void;
  placeholder?: string;
}

export const RacketSearchInput: React.FC<RacketSearchInputProps> = ({
  value,
  onChange,
  placeholder = 'Buscar una pala...',
}) => {
  const { searchRackets } = useRackets();
  const [query, setQuery] = useState(value ? `${value.marca} ${value.name}` : '');
  const [isFocused, setIsFocused] = useState(false);
  const [results, setResults] = useState<RacketSearchResult[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.trim().length >= 2) {
      const searchResults = searchRackets(query);
      const mappedResults: RacketSearchResult[] = searchResults.slice(0, 5).map(r => ({
        id: r.id || 0,
        name: r.nombre,
        marca: r.marca || '',
        imagenes: r.imagenes,
      }));
      setResults(mappedResults);
    } else {
      setResults([]);
    }
  }, [query, searchRackets]);

  const handleSelect = (racket: RacketSearchResult) => {
    onChange(racket);
    setQuery(`${racket.marca} ${racket.name}`);
    setIsFocused(false);
  };

  const handleClear = () => {
    onChange(null);
    setQuery('');
    setResults([]);
  };

  const handleManualEntry = () => {
    if (query.trim()) {
      onChange({
        id: 0,
        name: query.trim(),
        marca: '',
      });
      setIsFocused(false);
    }
  };

  return (
    <SearchContainer ref={containerRef}>
      <SearchInputWrapper $isFocused={isFocused}>
        <SearchIcon>
          <FiSearch size={18} />
        </SearchIcon>
        <Input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          placeholder={placeholder}
        />
        {query && (
          <ClearButton onClick={handleClear}>
            <FiX size={18} />
          </ClearButton>
        )}
      </SearchInputWrapper>

      <AnimatePresence>
        {isFocused && results.length > 0 && (
          <ResultsDropdown
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            {results.map(racket => (
              <ResultItem key={racket.id} onClick={() => handleSelect(racket)}>
                {racket.imagenes && racket.imagenes[0] ? (
                  <ResultImage src={racket.imagenes[0]} alt={racket.name} />
                ) : (
                  <ResultPlaceholder>🎾</ResultPlaceholder>
                )}
                <ResultInfo>
                  <ResultName>{racket.name}</ResultName>
                  <ResultBrand>{racket.marca}</ResultBrand>
                </ResultInfo>
              </ResultItem>
            ))}
          </ResultsDropdown>
        )}

        {isFocused && query.length >= 2 && results.length === 0 && (
          <ResultsDropdown
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            <NoResults>No se encontraron palas</NoResults>
            <ManualEntryHint onClick={handleManualEntry} style={{ cursor: 'pointer' }}>
              + Añadir "{query}" manualmente
            </ManualEntryHint>
          </ResultsDropdown>
        )}

        {isFocused && query.length > 0 && results.length > 0 && (
          <ResultsDropdown
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            style={{ maxHeight: 'none' }}
          >
            <ManualEntryHint onClick={handleManualEntry} style={{ cursor: 'pointer' }}>
              + O añadir manualmente: "{query}"
            </ManualEntryHint>
          </ResultsDropdown>
        )}
      </AnimatePresence>
    </SearchContainer>
  );
};

export default RacketSearchInput;
