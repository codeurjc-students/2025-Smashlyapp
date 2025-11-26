import React, { useState, useEffect, useRef, useCallback } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiArrowLeft,
  FiTrash2,
  FiEye,
  FiClock,
  FiLayers,
  FiSearch,
  FiX,
  FiShare2,
  FiCopy,
  FiCheck,
} from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import { ComparisonService, SavedComparison } from '../services/comparisonService';
import { RacketService } from '../services/racketService';
import { Racket } from '../types/racket';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import RacketRadarChart from '../components/features/RacketRadarChart';

const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #f8faf8 0%, #e8f5e8 100%);
`;

const Header = styled.div`
  background: white;
  border-bottom: 1px solid #e5e7eb;
  padding: 1.5rem 0;
  margin-bottom: 2rem;
`;

const HeaderContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
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
    background: #f0fdf4;
    color: #15803d;
  }
`;

const Title = styled.h1`
  font-size: 1.75rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;

  @media (max-width: 768px) {
    font-size: 1.5rem;
  }
`;

const Stats = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #6b7280;
  padding: 0.5rem 1rem;
  background: #f9fafb;
  border-radius: 8px;
`;

const Content = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem 2rem;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
`;

const EmptyIcon = styled.div`
  font-size: 4rem;
  color: #d1d5db;
  margin-bottom: 1rem;
`;

const EmptyTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 0.5rem;
`;

const EmptyText = styled.p`
  font-size: 1rem;
  color: #6b7280;
  margin: 0 0 2rem;
`;

const CompareButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #16a34a 0%, #059669 100%);
  color: white;
  text-decoration: none;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.3s ease;

  &:hover {
    color: white;
    text-decoration: none;
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(22, 163, 74, 0.4);
  }

  &:active {
    transform: translateY(0);
  }
`;

const ComparisonsList = styled.div`
  display: grid;
  gap: 1.5rem;
`;

const ComparisonCard = styled(motion.div)`
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(22, 163, 74, 0.1);
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 8px 30px rgba(22, 163, 74, 0.15);
    border-color: #16a34a;
  }
`;

const ComparisonHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
  gap: 1rem;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const ComparisonInfo = styled.div`
  flex: 1;
`;

const ComparisonDate = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 0.5rem;
`;

const RacketsPreview = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const RacketTag = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.75rem;
  background: #f0fdf4;
  color: #16a34a;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
`;

const ComparisonActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ActionButton = styled.button<{ variant?: 'primary' | 'danger' }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  background: ${props =>
    props.variant === 'danger'
      ? '#fef2f2'
      : props.variant === 'primary'
        ? 'linear-gradient(135deg, #16a34a 0%, #059669 100%)'
        : '#f9fafb'};
  color: ${props =>
    props.variant === 'danger' ? '#dc2626' : props.variant === 'primary' ? 'white' : '#374151'};

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px
      ${props =>
        props.variant === 'danger'
          ? 'rgba(220, 38, 38, 0.3)'
          : props.variant === 'primary'
            ? 'rgba(22, 163, 74, 0.4)'
            : 'rgba(0, 0, 0, 0.1)'};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const ComparisonPreview = styled.div`
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem;
  max-height: 200px;
  overflow: hidden;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 40px;
    background: linear-gradient(to bottom, transparent, #f9fafb);
  }
`;

const PreviewText = styled.div`
  font-size: 0.875rem;
  color: #4b5563;
  line-height: 1.6;

  h1,
  h2,
  h3,
  h4 {
    font-size: 1rem;
    font-weight: 600;
    margin: 0.5rem 0;
    color: #1f2937;
  }

  p {
    margin: 0.5rem 0;
  }

  ul,
  ol {
    margin: 0.5rem 0;
    padding-left: 1.5rem;
  }
`;

const LoadingState = styled.div`
  text-align: center;
  padding: 4rem 2rem;
`;

const Spinner = styled.div`
  width: 50px;
  height: 50px;
  border: 4px solid #e5e7eb;
  border-top-color: #16a34a;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const Modal = styled(motion.div)`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
`;

const ModalContent = styled(motion.div)`
  background: white;
  border-radius: 16px;
  max-width: 900px;
  width: 100%;
  max-height: 90vh;
  overflow: auto;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
`;

const ModalHeader = styled.div`
  position: sticky;
  top: 0;
  background: white;
  border-bottom: 1px solid #e5e7eb;
  padding: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 10;
`;

const ModalTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
`;

const CloseButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: #f3f4f6;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #e5e7eb;
  }
`;

const ModalBody = styled.div`
  padding: 2rem;

  h1,
  h2,
  h3 {
    color: #1f2937;
    margin-top: 1.5rem;
    margin-bottom: 1rem;
  }

  h1 {
    font-size: 1.75rem;
  }

  h2 {
    font-size: 1.5rem;
  }

  h3 {
    font-size: 1.25rem;
  }

  p {
    color: #4b5563;
    line-height: 1.7;
    margin: 1rem 0;
  }

  ul,
  ol {
    color: #4b5563;
    line-height: 1.7;
    margin: 1rem 0;
    padding-left: 1.5rem;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin: 1.5rem 0;
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
    color: #1f2937;
  }

  td {
    color: #4b5563;
  }

  code {
    background: #f3f4f6;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.875em;
  }

  strong {
    color: #16a34a;
    font-weight: 600;
  }
`;

const MyComparisonsPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [allComparisons, setAllComparisons] = useState<SavedComparison[]>([]);
  const [displayedComparisons, setDisplayedComparisons] = useState<SavedComparison[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedComparison, setSelectedComparison] = useState<SavedComparison | null>(null);
  const [racketsCache, setRacketsCache] = useState<Record<number, Racket>>({});
  const [sharingId, setSharingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const observerTarget = useRef<HTMLDivElement>(null);
  
  const ITEMS_PER_PAGE = 9;

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    loadComparisons();
  }, [isAuthenticated, navigate]);

  const loadComparisons = async () => {
    try {
      setLoading(true);
      const data = await ComparisonService.getUserComparisons();
      setAllComparisons(data);
      
      // Mostrar las primeras 9
      const initialBatch = data.slice(0, ITEMS_PER_PAGE);
      setDisplayedComparisons(initialBatch);
      setCurrentIndex(ITEMS_PER_PAGE);
      setHasMore(data.length > ITEMS_PER_PAGE);

      // Load racket names
      const allRacketIds = [...new Set(data.flatMap(c => c.racket_ids))];
      const rackets = await Promise.all(
        allRacketIds.map(async id => {
          try {
            const racket = await RacketService.getRacketById(id);
            return { id, racket };
          } catch {
            return null;
          }
        })
      );

      const cache: Record<number, Racket> = {};
      rackets.forEach(item => {
        if (item && item.racket) {
          cache[item.id] = item.racket;
        }
      });
      setRacketsCache(cache);
    } catch (error: any) {
      console.error('Error loading comparisons:', error);
      toast.error('Error al cargar las comparaciones');
    } finally {
      setLoading(false);
    }
  };

  const loadMoreComparisons = useCallback(() => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    
    // Simular un pequeño delay para mejor UX
    setTimeout(() => {
      const nextBatch = allComparisons.slice(currentIndex, currentIndex + ITEMS_PER_PAGE);
      
      if (nextBatch.length > 0) {
        setDisplayedComparisons(prev => [...prev, ...nextBatch]);
        setCurrentIndex(prev => prev + ITEMS_PER_PAGE);
        setHasMore(currentIndex + ITEMS_PER_PAGE < allComparisons.length);
      } else {
        setHasMore(false);
      }
      
      setLoadingMore(false);
    }, 300);
  }, [loadingMore, hasMore, allComparisons, currentIndex]);

  // Intersection Observer para scroll infinito
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMoreComparisons();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loadingMore, loadMoreComparisons]);

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta comparación?')) {
      return;
    }

    try {
      setDeletingId(id);
      await ComparisonService.deleteComparison(id);
      setAllComparisons(prev => prev.filter(c => c.id !== id));
      setDisplayedComparisons(prev => prev.filter(c => c.id !== id));
      toast.success('Comparación eliminada correctamente');
    } catch (error: any) {
      console.error('Error deleting comparison:', error);
      toast.error('Error al eliminar la comparación');
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRacketName = (id: number): string => {
    return racketsCache[id]?.nombre || `Pala #${id}`;
  };

  const handleShare = async (id: string) => {
    try {
      setSharingId(id);
      const shareToken = await ComparisonService.shareComparison(id);
      const shareUrl = `${window.location.origin}/shared/${shareToken}`;

      // Update local state
      setAllComparisons(prev =>
        prev.map(c => (c.id === id ? { ...c, is_public: true, share_token: shareToken } : c))
      );
      setDisplayedComparisons(prev =>
        prev.map(c => (c.id === id ? { ...c, is_public: true, share_token: shareToken } : c))
      );

      // Copy to clipboard
      await navigator.clipboard.writeText(shareUrl);
      setCopiedId(id);
      toast.success('Enlace copiado al portapapeles');

      setTimeout(() => setCopiedId(null), 3000);
    } catch (error: any) {
      console.error('Error sharing comparison:', error);
      toast.error('Error al compartir la comparación');
    } finally {
      setSharingId(null);
    }
  };

  const handleCopyLink = async (shareToken: string, id: string) => {
    try {
      const shareUrl = `${window.location.origin}/shared/${shareToken}`;
      await navigator.clipboard.writeText(shareUrl);
      setCopiedId(id);
      toast.success('Enlace copiado al portapapeles');
      setTimeout(() => setCopiedId(null), 3000);
    } catch (error) {
      toast.error('Error al copiar el enlace');
    }
  };

  if (loading) {
    return (
      <Container>
        <LoadingState>
          <Spinner />
          <p>Cargando tus comparaciones...</p>
        </LoadingState>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <HeaderContent>
          <HeaderLeft>
            <BackButton to='/'>
              <FiArrowLeft />
            </BackButton>
            <Title>Mis Comparaciones</Title>
          </HeaderLeft>
          <Stats>
            <FiLayers />
            {allComparisons.length} {allComparisons.length === 1 ? 'comparación' : 'comparaciones'}
          </Stats>
        </HeaderContent>
      </Header>

      <Content>
        {allComparisons.length === 0 ? (
          <EmptyState>
            <EmptyIcon>
              <FiSearch />
            </EmptyIcon>
            <EmptyTitle>No tienes comparaciones guardadas</EmptyTitle>
            <EmptyText>
              Empieza a comparar palas y guarda tus análisis para consultarlos más tarde
            </EmptyText>
            <CompareButton to='/compare-rackets'>
              <FiLayers />
              Comparar Palas
            </CompareButton>
          </EmptyState>
        ) : (
          <ComparisonsList>
            {displayedComparisons.map(comparison => (
              <ComparisonCard
                key={comparison.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <ComparisonHeader>
                  <ComparisonInfo>
                    <ComparisonDate>
                      <FiClock />
                      {formatDate(comparison.created_at)}
                    </ComparisonDate>
                    <RacketsPreview>
                      {comparison.racket_ids.map(id => (
                        <RacketTag key={id}>
                          <FiLayers size={12} />
                          {getRacketName(id)}
                        </RacketTag>
                      ))}
                    </RacketsPreview>
                  </ComparisonInfo>
                  <ComparisonActions>
                    <ActionButton
                      variant='primary'
                      onClick={() => setSelectedComparison(comparison)}
                    >
                      <FiEye />
                      Ver
                    </ActionButton>
                    {comparison.is_public && comparison.share_token ? (
                      <ActionButton onClick={() => handleCopyLink(comparison.share_token!, comparison.id)}>
                        {copiedId === comparison.id ? <FiCheck /> : <FiCopy />}
                        {copiedId === comparison.id ? 'Copiado' : 'Copiar link'}
                      </ActionButton>
                    ) : (
                      <ActionButton onClick={() => handleShare(comparison.id)}>
                        <FiShare2 />
                        Compartir
                      </ActionButton>
                    )}
                    <ActionButton
                      variant='danger'
                      onClick={() => handleDelete(comparison.id)}
                      disabled={deletingId === comparison.id}
                    >
                      <FiTrash2 />
                      {deletingId === comparison.id ? 'Eliminando...' : 'Eliminar'}
                    </ActionButton>
                  </ComparisonActions>
                </ComparisonHeader>
                <ComparisonPreview>
                  <PreviewText>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {comparison.comparison_text.substring(0, 300)}
                    </ReactMarkdown>
                  </PreviewText>
                </ComparisonPreview>
              </ComparisonCard>
            ))}
            
            {/* Elemento observador para scroll infinito */}
            <div ref={observerTarget} style={{ height: '20px', margin: '2rem 0' }} />
            
            {/* Indicador de carga */}
            {loadingMore && (
              <div style={{ 
                textAlign: 'center', 
                padding: '2rem',
                color: '#6b7280',
                fontSize: '0.875rem'
              }}>
                Cargando más comparaciones...
              </div>
            )}
            
            {/* Mensaje de fin */}
            {!hasMore && displayedComparisons.length > 0 && (
              <div style={{ 
                textAlign: 'center', 
                padding: '2rem',
                color: '#9ca3af',
                fontSize: '0.875rem'
              }}>
                Has visto todas tus comparaciones
              </div>
            )}
          </ComparisonsList>
        )}
      </Content>

      <AnimatePresence>
        {selectedComparison && (
          <Modal
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedComparison(null)}
          >
            <ModalContent
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
            >
              <ModalHeader>
                <ModalTitle>Comparación de Palas</ModalTitle>
                <CloseButton onClick={() => setSelectedComparison(null)}>
                  <FiX />
                </CloseButton>
              </ModalHeader>
              <ModalBody>
                <ComparisonDate>
                  <FiClock />
                  {formatDate(selectedComparison.created_at)}
                </ComparisonDate>
                <RacketsPreview style={{ marginTop: '1rem', marginBottom: '1.5rem' }}>
                  {selectedComparison.racket_ids.map(id => (
                    <RacketTag key={id}>
                      <FiLayers size={12} />
                      {getRacketName(id)}
                    </RacketTag>
                  ))}
                </RacketsPreview>
                {selectedComparison.metrics && selectedComparison.metrics.length > 0 && (
                  <RacketRadarChart metrics={selectedComparison.metrics} />
                )}
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {selectedComparison.comparison_text}
                </ReactMarkdown>
              </ModalBody>
            </ModalContent>
          </Modal>
        )}
      </AnimatePresence>
    </Container>
  );
};

export default MyComparisonsPage;
