import React, { useState, useMemo, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiX, FiPlus, FiCpu, FiDownload, FiSave, FiCheck, FiHeart } from 'react-icons/fi';
import { useRackets } from '../contexts/RacketsContext';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { ComparisonService } from '../services/comparisonService';
import { ListService } from '../services/listService';
import { NotificationService } from '../services/notificationService';
import { Racket, ComparisonResult, RacketComparisonData } from '../types/racket';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { sileo } from 'sileo';
import Fuse from 'fuse.js';
// Importamos el nuevo servicio
import { RacketPdfGenerator } from '../services/pdfGenerator';
import RacketRadarChart from '../components/features/RacketRadarChart';
import ComparisonTable from '../components/features/ComparisonTable';

const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #f8faf8 0%, #e8f5e8 100%);
  padding: 2rem;
  padding-bottom: 6rem;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 3rem;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  font-weight: 800;
  color: #1f2937;
  margin-bottom: 1rem;

  .highlight {
    color: #16a34a;
  }
`;

const Subtitle = styled.p`
  font-size: 1.125rem;
  color: #6b7280;
  max-width: 600px;
  margin: 0 auto;
`;

const SelectionSection = styled.div`
  max-width: 1000px;
  margin: 0 auto 3rem;
  background: white;
  border-radius: 24px;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
`;

const SearchContainer = styled.div`
  position: relative;
  margin-bottom: 1.5rem;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 1rem 1rem 1rem 3rem;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: #16a34a;
    box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.1);
  }
`;

const SearchIcon = styled(FiSearch)`
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
  font-size: 1.25rem;
`;

const SearchResults = styled.ul`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  max-height: 300px;
  overflow-y: auto;
  z-index: 50;
  margin-top: 0.5rem;
  border: 1px solid #e5e7eb;
  list-style: none;
  padding: 0;
`;

const SearchResultItem = styled.li`
  padding: 0.75rem 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: background 0.2s;

  &:hover {
    background: #f0fdf4;
  }

  img {
    width: 40px;
    height: 40px;
    object-fit: contain;
  }
`;

const SelectedRacketsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const SelectedRacketCard = styled(motion.div)`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 1rem;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
`;

const RemoveButton = styled.button`
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ef4444;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #fee2e2;
    transform: scale(1.1);
  }
`;

const RacketImage = styled.img`
  width: 100px;
  height: 100px;
  object-fit: contain;
  margin-bottom: 1rem;
`;

const RacketName = styled.h3`
  font-size: 0.875rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.25rem;
`;

const RacketBrand = styled.span`
  font-size: 0.75rem;
  color: #6b7280;
`;

const EmptySlot = styled.div`
  border: 2px dashed #e5e7eb;
  border-radius: 16px;
  height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  gap: 0.5rem;
`;

const CompareButton = styled.button`
  width: 100%;
  background: #16a34a;
  color: white;
  border: none;
  padding: 1rem;
  border-radius: 12px;
  font-size: 1.125rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;

  &:disabled {
    background: #d1d5db;
    cursor: not-allowed;
  }

  &:not(:disabled):hover {
    background: #15803d;
    transform: translateY(-2px);
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

const ActionButtons = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  justify-content: flex-start;

  @media (max-width: 480px) {
    flex-direction: column;
    gap: 0.75rem;
    
    & > button {
      width: 100%;
      justify-content: center;
    }
  }
`;

const ActionButton = styled.button<{ variant?: 'secondary' }>`
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

  @media (max-width: 480px) {
    padding: 0.75rem 1rem;
    font-size: 0.8125rem;
  }

  ${props =>
    props.variant === 'secondary'
      ? `
    background: white;
    border: 1px solid #e5e7eb;
    color: #4b5563;
    &:hover { background: #f9fafb; border-color: #d1d5db; }
  `
      : `
    background: #f0fdf4;
    border: 1px solid #16a34a;
    color: #16a34a;
    &:hover { background: #dcfce7; }
  `}
`;

const MarkdownContent = styled.div`
  line-height: 1.7;
  color: #374151;

  h1,
  h2,
  h3 {
    color: #1f2937;
    margin-top: 1.5rem;
    margin-bottom: 1rem;
  }

  h3 {
    font-size: 1.25rem;
    color: #16a34a;
  }

  ul,
  ol {
    padding-left: 1.5rem;
    margin-bottom: 1rem;
  }

  li {
    margin-bottom: 0.5rem;
  }

  strong {
    color: #111827;
    font-weight: 700;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin: 2rem 0;
    font-size: 0.95rem;
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
    color: #374151;
  }

  tr:nth-child(even) {
    background: #f9fafb;
  }
`;

const ModalOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.65);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
`;

const ModalContent = styled(motion.div)`
  background: white;
  border-radius: 24px;
  width: 100%;
  max-width: 900px;
  max-height: 85vh;
  overflow-y: auto;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.2);
  position: relative;
  display: flex;
  flex-direction: column;
  /* Optimización de scroll */
  will-change: transform;
  transform: translateZ(0);
  -webkit-overflow-scrolling: touch;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background-color: rgba(0, 0, 0, 0.1);
    border-radius: 4px;
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  background: #f3f4f6;
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #4b5563;
  transition: all 0.2s;
  z-index: 10;

  &:hover {
    background: #e5e7eb;
    color: #1f2937;
    transform: rotate(90deg);
  }
`;

const FavoritesSection = styled.div`
  margin-bottom: 1.5rem;
`;

const FavoritesTitle = styled.h3`
  font-size: 0.6875rem;
  font-weight: 600;
  color: #9ca3af;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const FavoritesGrid = styled.div`
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  padding: 0.125rem 0;

  /* Hide scrollbar but keep functionality */
  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const FavoriteRacketCard = styled(motion.div)<{ $isSelected?: boolean }>`
  background: ${props => (props.$isSelected ? '#f3f4f6' : 'white')};
  border: 1.5px solid ${props => (props.$isSelected ? '#d1d5db' : '#e5e7eb')};
  border-radius: 6px;
  padding: 0.375rem 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.375rem;
  cursor: ${props => (props.$isSelected ? 'not-allowed' : 'pointer')};
  transition: all 0.2s ease;
  opacity: ${props => (props.$isSelected ? 0.5 : 1)};
  white-space: nowrap;
  flex-shrink: 0;
  width: 300px;
  min-width: 300px;

  &:hover {
    ${props =>
      !props.$isSelected &&
      `
      border-color: #16a34a;
      background: #f0fdf4;
      transform: translateY(-1px);
      box-shadow: 0 2px 6px rgba(22, 163, 74, 0.12);
    `}
  }

  img {
    width: 24px;
    height: 24px;
    object-fit: contain;
  }
`;

const FavoriteRacketInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.0625rem;
  flex: 1;
  min-width: 0;
`;

const FavoriteRacketName = styled.div`
  font-size: 0.6875rem;
  font-weight: 600;
  color: #1f2937;
  line-height: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const FavoriteRacketBrand = styled.div`
  font-size: 0.5625rem;
  color: #6b7280;
  line-height: 1;
`;

const EmptyFavorites = styled.div`
  padding: 0.75rem;
  text-align: center;
  color: #9ca3af;
  font-size: 0.6875rem;
  background: #f9fafb;
  border-radius: 6px;
  border: 1px dashed #e5e7eb;
`;

const CompareRacketsPage: React.FC = () => {
  const { rackets } = useRackets();
  const { user, isAuthenticated } = useAuth();
  const { addNotification } = useNotifications();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRackets, setSelectedRackets] = useState<Racket[]>([]);
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);
  const [comparisonMetrics, setComparisonMetrics] = useState<RacketComparisonData[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showChart, setShowChart] = useState(false);
  const [favoriteRackets, setFavoriteRackets] = useState<Racket[]>([]);
  const [loadingFavorites, setLoadingFavorites] = useState(false);

  // Cargar comparación guardada desde sessionStorage al iniciar (viene de notificación)
  useEffect(() => {
    const savedComparison = sessionStorage.getItem('smashly_last_comparison');
    if (savedComparison) {
      try {
        const parsed = JSON.parse(savedComparison);
        if (parsed.comparison && parsed.rackets) {
          setComparisonResult(parsed.comparison);
          setComparisonMetrics(parsed.metrics || null);
          setSelectedRackets(parsed.rackets);
          sessionStorage.removeItem('smashly_last_comparison');
        }
      } catch (error) {
        console.error('Error loading saved comparison:', error);
      }
    }
  }, []);

  // Configure Fuse.js con búsqueda mejorada
  const fuse = new Fuse(rackets, {
    keys: [
      { name: 'nombre', weight: 0.5 }, // Mayor peso al nombre
      { name: 'marca', weight: 0.3 }, // Peso medio a la marca
      { name: 'modelo', weight: 0.2 }, // Menor peso al modelo
    ],
    threshold: 0.4, // Más flexible para encontrar coincidencias
    distance: 200, // Permite coincidencias más lejanas
    minMatchCharLength: 1, // Permite búsquedas desde 1 carácter
    ignoreLocation: true, // No importa dónde aparezca la coincidencia
    findAllMatches: true, // Encuentra todas las coincidencias posibles
    useExtendedSearch: false, // Búsqueda simple pero efectiva
  });

  const filteredRackets = searchQuery
    ? fuse
        .search(searchQuery)
        .map(result => result.item)
        .filter(r => !selectedRackets.find(sr => sr.id === r.id))
        .slice(0, 8)
    : [];

  // Lazy loading del gráfico - renderizar después de que el modal esté abierto
  useEffect(() => {
    if (comparisonResult) {
      // Pequeño delay para permitir que el modal se abra primero
      const timer = setTimeout(() => setShowChart(true), 150);
      return () => clearTimeout(timer);
    } else {
      setShowChart(false);
    }
  }, [comparisonResult]);

  // Cargar favoritos del usuario
  useEffect(() => {
    const loadFavorites = async () => {
      if (!isAuthenticated) {
        setFavoriteRackets([]);
        return;
      }

      try {
        setLoadingFavorites(true);
        const lists = await ListService.getUserLists();
        const favoritasList = lists.find(list => list.name === 'Favoritas');

        if (favoritasList && favoritasList.racket_count && favoritasList.racket_count > 0) {
          const listWithRackets = await ListService.getListById(favoritasList.id);
          // Limitar a 6 favoritos para mostrar
          setFavoriteRackets(listWithRackets.rackets?.slice(0, 6) || []);
        } else {
          setFavoriteRackets([]);
        }
      } catch (error) {
        console.error('Error loading favorites:', error);
        setFavoriteRackets([]);
      } finally {
        setLoadingFavorites(false);
      }
    };

    loadFavorites();
  }, [isAuthenticated]);

  // Memoizar el contenido de la comparación estructurada
  const memoizedComparisonDisplay = useMemo(() => {
    if (!comparisonResult) return null;
    return (
      <>
        {/* Resumen Ejecutivo */}
        {comparisonResult.executiveSummary && (
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ color: '#16a34a', marginBottom: '1rem' }}>Resumen Ejecutivo</h3>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {comparisonResult.executiveSummary}
            </ReactMarkdown>
          </div>
        )}

        {/* Tabla Comparativa */}
        {comparisonResult.comparisonTable && Array.isArray(comparisonResult.comparisonTable) ? (
          <ComparisonTable
            data={comparisonResult.comparisonTable}
            metrics={comparisonMetrics || []}
          />
        ) : (
          comparisonResult.comparisonTable && (
            <div style={{ marginBottom: '2rem' }}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {comparisonResult.comparisonTable as string}
              </ReactMarkdown>
            </div>
          )
        )}

        {/* Análisis Técnico */}
        {comparisonResult.technicalAnalysis && comparisonResult.technicalAnalysis.length > 0 && (
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ color: '#16a34a', marginBottom: '1rem' }}>Análisis Técnico</h3>
            {comparisonResult.technicalAnalysis.map((section, index) => (
              <div key={index} style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ color: '#1f2937', marginBottom: '0.5rem' }}>{section.title}</h4>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{section.content}</ReactMarkdown>
              </div>
            ))}
          </div>
        )}

        {/* Perfiles Recomendados */}
        {comparisonResult.recommendedProfiles && (
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ color: '#16a34a', marginBottom: '1rem' }}>Perfiles Recomendados</h3>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {comparisonResult.recommendedProfiles}
            </ReactMarkdown>
          </div>
        )}

        {/* Consideraciones Biomecánicas */}
        {comparisonResult.biomechanicalConsiderations && (
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ color: '#16a34a', marginBottom: '1rem' }}>Consideraciones Biomecánicas</h3>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {comparisonResult.biomechanicalConsiderations}
            </ReactMarkdown>
          </div>
        )}

        {/* Conclusión */}
        {comparisonResult.conclusion && (
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ color: '#16a34a', marginBottom: '1rem' }}>Conclusión</h3>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{comparisonResult.conclusion}</ReactMarkdown>
          </div>
        )}
      </>
    );
  }, [comparisonResult]);

  const handleAddRacket = (racket: Racket) => {
    if (selectedRackets.length < 3) {
      setSelectedRackets([...selectedRackets, racket]);
      setSearchQuery('');
      setShowSearchResults(false);
    }
  };

  const handleAddFavoriteRacket = (racket: Racket) => {
    // No agregar si ya está seleccionada o si ya hay 3
    if (selectedRackets.find(r => r.id === racket.id) || selectedRackets.length >= 3) {
      return;
    }
    setSelectedRackets([...selectedRackets, racket]);
  };

  const handleRemoveRacket = (id: number) => {
    setSelectedRackets(selectedRackets.filter(r => r.id !== id));
  };

  const handleCompare = async () => {
    if (selectedRackets.length < 2) return;

    setLoading(true);
    setComparisonResult(null);

    try {
      // Prepare user profile if authenticated
      let userProfile = undefined;

      if (isAuthenticated && user) {
        // Calculate age from birthdate if available
        let age = undefined;
        if (user.birthdate) {
          const birthDate = new Date(user.birthdate);
          const today = new Date();
          age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }
        }

        userProfile = {
          weight: user.weight?.toString() || undefined,
          height: user.height?.toString() || undefined,
          age: age?.toString() || undefined,
          gameLevel: user.game_level || undefined,
          playingStyle: undefined,
          experience: undefined,
          preferences: user.limitations?.join(', ') || undefined,
        };
      }

      const racketIds = selectedRackets.map(r => r.id!);
      const response = await ComparisonService.compareRackets(racketIds, userProfile);

      setComparisonResult(response.comparison);
      setComparisonMetrics(response.comparison.metrics || null);

      sessionStorage.setItem('smashly_last_comparison', JSON.stringify({
        comparison: response.comparison,
        metrics: response.comparison.metrics,
        rackets: selectedRackets,
        timestamp: Date.now()
      }));

      const notification = await NotificationService.createNotification(
        'comparison_complete',
        'Comparación completada',
        'Tu comparación de palas está lista. ¡Descúbrela!',
        { racketCount: selectedRackets.length }
      );
      
      if (notification) {
        addNotification(notification);
      } else {
        console.error('Error: No se pudo crear la notificación');
      }
      
      sileo.success({ 
        title: '¡Comparación lista!', 
        description: 'Tu comparación de palas está lista. ¡Descúbrela!'
      });
    } catch (error: any) {
      console.error('Error comparing rackets:', error);

      // Mostrar mensaje de error más específico
      const errorMessage = error?.message || '';
      if (errorMessage.includes('503') || errorMessage.includes('overloaded')) {
        sileo.error({
          title: 'Error',
          description:
            'El servicio de IA está temporalmente sobrecargado. Por favor, inténtalo de nuevo en unos segundos.',
        });
      } else if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
        sileo.error({
          title: 'Error',
          description:
            'Has alcanzado el límite de comparaciones. Por favor, espera un momento e inténtalo de nuevo.',
        });
      } else {
        sileo.error({
          title: 'Error',
          description: 'Error al realizar la comparación. Por favor, inténtalo de nuevo.',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!comparisonResult || selectedRackets.length === 0) return;

    sileo.show({
      title: 'Generando PDF',
      description: 'Diseñando tu comparativa profesional...',
    });

    try {
      const generator = new RacketPdfGenerator();

      await generator.generatePDF({
        rackets: selectedRackets,
        comparison: comparisonResult,
        // Asegúrate de que esta URL base sea correcta para tu entorno
        proxyUrlBase: import.meta.env.VITE_API_URL || '',
      });

      sileo.success({ title: 'Éxito', description: 'PDF descargado con éxito' });
    } catch (error) {
      console.error('Error generating PDF:', error);
      sileo.error({ title: 'Error', description: 'Hubo un problema al generar el diseño' });
    }
  };

  const handleSaveComparison = async () => {
    if (!isAuthenticated) {
      sileo.error({
        title: 'Error',
        description: 'Debes iniciar sesión para guardar comparaciones',
      });
      return;
    }
    if (!comparisonResult) return;

    try {
      await ComparisonService.saveComparison(
        selectedRackets.map(r => r.id!),
        comparisonResult
      );
      sileo.success({ title: 'Éxito', description: 'Comparación guardada en tu perfil' });
    } catch (error) {
      sileo.error({ title: 'Error', description: 'Error al guardar la comparación' });
    }
  };

  return (
    <Container>
      <Header>
        <Title>
          Comparador de <span className='highlight'>Palas IA</span>
        </Title>
        <Subtitle>
          Selecciona hasta 3 palas y deja que nuestra Inteligencia Artificial analice sus
          diferencias, pros y contras para encontrar tu compañera perfecta.
        </Subtitle>
      </Header>

      <SelectionSection>
        <SearchContainer>
          <SearchIcon />
          <SearchInput
            placeholder='Buscar pala para añadir (ej. Nox AT10, Bullpadel Vertex...)'
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value);
              setShowSearchResults(true);
            }}
            onFocus={() => setShowSearchResults(true)}
            disabled={selectedRackets.length >= 3}
          />
          {showSearchResults && searchQuery && (
            <SearchResults>
              {filteredRackets.map(racket => (
                <SearchResultItem key={racket.id} onClick={() => handleAddRacket(racket)}>
                  <img
                    src={racket.imagenes?.[0] || '/placeholder-racket.png'}
                    alt={racket.nombre}
                  />
                  <div>
                    <div style={{ fontWeight: 600 }}>{racket.nombre}</div>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>{racket.marca}</div>
                  </div>
                </SearchResultItem>
              ))}
              {filteredRackets.length === 0 && (
                <div style={{ padding: '1rem', textAlign: 'center', color: '#6b7280' }}>
                  No se encontraron palas
                </div>
              )}
            </SearchResults>
          )}
        </SearchContainer>

        {/* Favorites Quick Selection */}
        {isAuthenticated && !loadingFavorites && favoriteRackets.length > 0 && (
          <FavoritesSection>
            <FavoritesTitle>
              <FiHeart /> Tus Favoritas
            </FavoritesTitle>
            <FavoritesGrid>
              {favoriteRackets.map(racket => {
                const isSelected = selectedRackets.some(r => r.id === racket.id);
                return (
                  <FavoriteRacketCard
                    key={racket.id}
                    $isSelected={isSelected}
                    onClick={() => handleAddFavoriteRacket(racket)}
                    whileHover={!isSelected ? { scale: 1.05 } : {}}
                    whileTap={!isSelected ? { scale: 0.95 } : {}}
                  >
                    <img
                      src={racket.imagenes?.[0] || '/placeholder-racket.png'}
                      alt={racket.nombre}
                    />
                    <FavoriteRacketInfo>
                      <FavoriteRacketName>{racket.nombre}</FavoriteRacketName>
                      <FavoriteRacketBrand>{racket.marca}</FavoriteRacketBrand>
                    </FavoriteRacketInfo>
                  </FavoriteRacketCard>
                );
              })}
            </FavoritesGrid>
          </FavoritesSection>
        )}

        {isAuthenticated && !loadingFavorites && favoriteRackets.length === 0 && (
          <FavoritesSection>
            <FavoritesTitle>
              <FiHeart /> Tus Favoritas
            </FavoritesTitle>
            <EmptyFavorites>
              No tienes palas favoritas aún. Añade palas a tu lista de favoritas desde el catálogo.
            </EmptyFavorites>
          </FavoritesSection>
        )}

        <SelectedRacketsContainer>
          {selectedRackets.map(racket => (
            <SelectedRacketCard
              key={racket.id}
              data-racket-card
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <RemoveButton onClick={() => handleRemoveRacket(racket.id!)}>
                <FiX />
              </RemoveButton>
              <RacketImage
                src={racket.imagenes?.[0] || '/placeholder-racket.png'}
                alt={racket.nombre}
              />
              <RacketName>{racket.nombre}</RacketName>
              <RacketBrand>{racket.marca}</RacketBrand>
            </SelectedRacketCard>
          ))}
          {[...Array(3 - selectedRackets.length)].map((_, i) => (
            <EmptySlot key={i}>
              <FiPlus size={24} />
              <span>Añadir pala</span>
            </EmptySlot>
          ))}
        </SelectedRacketsContainer>

        {!loading && (
          <CompareButton onClick={handleCompare} disabled={selectedRackets.length < 2}>
            <FiCpu /> Comparar con IA
          </CompareButton>
        )}
      </SelectionSection>

      <AnimatePresence>
        {comparisonResult && (
          <ModalOverlay
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={() => {
              setComparisonResult(null);
              setComparisonMetrics(null);
              setSelectedRackets([]);
            }}
          >
            <ModalContent
              onClick={e => e.stopPropagation()}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <CloseButton
                onClick={e => {
                  e.stopPropagation();
                  setComparisonResult(null);
                  setComparisonMetrics(null);
                  setSelectedRackets([]);
                }}
              >
                <FiX size={24} />
              </CloseButton>

              <ResultSection
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ margin: 0, boxShadow: 'none', padding: '3rem' }}
              >
                <ResultHeader>
                  <ResultTitle>
                    <FiCheck color='#16a34a' /> Análisis Comparativo
                  </ResultTitle>
                  <ActionButtons className='no-pdf'>
                    {isAuthenticated && (
                      <ActionButton variant='secondary' onClick={handleSaveComparison}>
                        <FiSave /> Guardar
                      </ActionButton>
                    )}
                    <ActionButton onClick={handleDownloadPDF}>
                      <FiDownload /> Descargar PDF
                    </ActionButton>
                  </ActionButtons>
                </ResultHeader>

                {showChart && comparisonMetrics && comparisonMetrics.length > 0 && (
                  <RacketRadarChart metrics={comparisonMetrics} />
                )}

                <MarkdownContent>{memoizedComparisonDisplay}</MarkdownContent>
              </ResultSection>
            </ModalContent>
          </ModalOverlay>
        )}
      </AnimatePresence>
    </Container>
  );
};

export default CompareRacketsPage;
