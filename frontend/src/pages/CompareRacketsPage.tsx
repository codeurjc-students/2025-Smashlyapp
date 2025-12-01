import React, { useState, useRef } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiX, FiPlus, FiCpu, FiDownload, FiSave, FiCheck } from 'react-icons/fi';
import { useRackets } from '../contexts/RacketsContext';
import { useAuth } from '../contexts/AuthContext';
import { useBackgroundTasks } from '../contexts/BackgroundTasksContext';
import { ComparisonService } from '../services/comparisonService';
import { Racket } from '../types/racket';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import toast from 'react-hot-toast';
import Fuse from 'fuse.js';
// Importamos el nuevo servicio
import { RacketPdfGenerator } from '../services/pdfGenerator';
import RacketRadarChart, { RacketMetrics } from '../components/features/RacketRadarChart';

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
  margin-bottom: 2rem;
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
`;

const ResultHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 1rem;
`;

const ResultTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 1rem;
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
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(5px);
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

const CompareRacketsPage: React.FC = () => {
  const { rackets } = useRackets();
  const { user, isAuthenticated } = useAuth();
  const { addTask, updateTaskProgress, completeTask, failTask } = useBackgroundTasks();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRackets, setSelectedRackets] = useState<Racket[]>([]);
  const [comparisonResult, setComparisonResult] = useState<string | null>(null);
  const [comparisonMetrics, setComparisonMetrics] = useState<RacketMetrics[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  // Configure Fuse.js
  const fuse = new Fuse(rackets, {
    keys: ['nombre', 'marca', 'modelo'],
    threshold: 0.3, // Adjust for sensitivity (0.0 = exact match, 1.0 = match anything)
    distance: 100,
    minMatchCharLength: 2,
  });

  const filteredRackets = searchQuery
    ? fuse
      .search(searchQuery)
      .map(result => result.item)
      .filter(r => !selectedRackets.find(sr => sr.id === r.id))
      .slice(0, 5)
    : [];

  const handleAddRacket = (racket: Racket) => {
    if (selectedRackets.length < 3) {
      setSelectedRackets([...selectedRackets, racket]);
      setSearchQuery('');
      setShowSearchResults(false);
    }
  };

  const handleRemoveRacket = (id: number) => {
    setSelectedRackets(selectedRackets.filter(r => r.id !== id));
  };

  const handleCompare = async () =>{
    if (selectedRackets.length < 2) return;

    setLoading(true);
    setComparisonResult(null);

    // Crear tarea en segundo plano
    const taskId = addTask('comparison', {
      racketNames: selectedRackets.map(r => r.nombre)
    });

    // Simular progreso
    const progressInterval = setInterval(() => {
      updateTaskProgress(taskId, Math.min(90, Math.random() * 20 + 70));
    }, 500);

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
          playingStyle: undefined, // Not available in current user profile
          experience: undefined, // Not available in current user profile
          preferences: user.limitations?.join(', ') || undefined,
        };
      }

      const racketIds = selectedRackets.map(r => r.id!);
      const response = await ComparisonService.compareRackets(racketIds, userProfile);

      clearInterval(progressInterval);
      completeTask(taskId, { comparison: response.comparison, metrics: response.metrics });

      setComparisonResult(response.comparison);
      setComparisonMetrics(response.metrics || null);
    } catch (error) {
      clearInterval(progressInterval);
      failTask(taskId, 'Error al realizar la comparación');
      console.error('Error comparing rackets:', error);
      toast.error('Error al realizar la comparación. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!comparisonResult || selectedRackets.length === 0) return;

    const toastId = toast.loading('Diseñando tu comparativa profesional...');

    try {
      const generator = new RacketPdfGenerator();

      await generator.generatePDF({
        rackets: selectedRackets,
        comparisonText: comparisonResult,
        // Asegúrate de que esta URL base sea correcta para tu entorno
        proxyUrlBase: import.meta.env.VITE_API_URL || '',
      });

      toast.success('PDF descargado con éxito', { id: toastId });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Hubo un problema al generar el diseño', { id: toastId });
    }
  };

  const handleSaveComparison = async () => {
    if (!isAuthenticated) {
      toast.error('Debes iniciar sesión para guardar comparaciones');
      return;
    }
    if (!comparisonResult) return;

    try {
      await ComparisonService.saveComparison(
        selectedRackets.map(r => r.id!),
        comparisonResult,
        comparisonMetrics || undefined
      );
      toast.success('Comparación guardada en tu perfil');
    } catch (error) {
      toast.error('Error al guardar la comparación');
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
                  <img src={racket.imagen || '/placeholder-racket.png'} alt={racket.nombre} />
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
              <RacketImage src={racket.imagen || '/placeholder-racket.png'} alt={racket.nombre} />
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

        <CompareButton onClick={handleCompare} disabled={selectedRackets.length < 2 || loading}>
          {loading ? (
            <>Analizando palas...</>
          ) : (
            <>
              <FiCpu /> Comparar con IA
            </>
          )}
        </CompareButton>
      </SelectionSection>

      <AnimatePresence>
        {comparisonResult && (
          <ModalOverlay
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setComparisonResult(null)}
          >
            <ModalContent
              onClick={e => e.stopPropagation()}
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              <CloseButton onClick={() => setComparisonResult(null)}>
                <FiX size={24} />
              </CloseButton>

              <ResultSection
                ref={resultRef}
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

                {comparisonMetrics && comparisonMetrics.length > 0 && (
                  <RacketRadarChart metrics={comparisonMetrics} />
                )}

                <MarkdownContent>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{comparisonResult}</ReactMarkdown>
                </MarkdownContent>
              </ResultSection>
            </ModalContent>
          </ModalOverlay>
        )}
      </AnimatePresence>
    </Container>
  );
};

export default CompareRacketsPage;
