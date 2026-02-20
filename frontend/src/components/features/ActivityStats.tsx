import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FiStar, FiList, FiGitBranch, FiClock } from 'react-icons/fi';
import { Link } from 'react-router-dom';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const StatCard = styled(motion.div)<{ $color: string }>`
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  border: 1px solid #e2e8f0;
  text-align: center;
  transition: all 0.2s ease;
  cursor: pointer;

  &:hover {
    border-color: ${props => props.$color};
    transform: translateY(-2px);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
  }
`;

const StatIcon = styled.div<{ color: string }>`
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: ${props => props.color}15;
  color: ${props => props.color};
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
  font-size: 1.5rem;
`;

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: #16a34a;
  line-height: 1;
`;

const StatLabel = styled.div`
  font-size: 0.875rem;
  color: #64748b;
  margin-top: 0.5rem;
`;

const SectionTitle = styled.h3`
  font-size: 1.0625rem;
  font-weight: 600;
  color: #16a34a;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const RecentList = styled.div`
  background: white;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
`;

const RecentItem = styled(Link)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #f1f5f9;
  text-decoration: none;
  transition: all 0.2s ease;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: #f8fafc;
  }
`;

const RecentItemInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.875rem;
`;

const RecentItemIcon = styled.div<{ color: string }>`
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: ${props => props.color}15;
  color: ${props => props.color};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const RecentItemText = styled.div`
  flex: 1;
`;

const RecentItemTitle = styled.div`
  font-weight: 600;
  color: #16a34a;
  font-size: 0.9375rem;
`;

const RecentItemMeta = styled.div`
  font-size: 0.8125rem;
  color: #64748b;
  margin-top: 0.125rem;
`;

const ViewAllLink = styled(Link)`
  display: block;
  padding: 1rem;
  text-align: center;
  color: #16a34a;
  text-decoration: none;
  font-weight: 600;
  font-size: 0.875rem;
  border-top: 1px solid #f1f5f9;

  &:hover {
    background: #f8fafc;
  }
`;

const EmptyState = styled.div`
  padding: 2rem;
  text-align: center;
  color: #94a3b8;
`;

interface ActivityStatsProps {
  stats: {
    reviewsCount: number;
    listsCount: number;
    comparisonsCount: number;
  };
  recentReviews?: Array<{
    id: number;
    rating: number;
    created_at: string;
    rackets?: { nombre: string; marca: string };
  }>;
  recentLists?: Array<{
    id: string;
    name: string;
    is_public: boolean;
    created_at: string;
  }>;
  recentComparisons?: Array<{
    id: string;
    name: string;
    is_public: boolean;
    created_at: string;
  }>;
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Hoy';
  if (diffDays === 1) return 'Ayer';
  if (diffDays < 7) return `Hace ${diffDays} días`;
  if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`;
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
};

const ActivityStats: React.FC<ActivityStatsProps> = ({
  stats,
  recentReviews = [],
  recentLists = [],
  recentComparisons = [],
}) => {
  return (
    <Container>
      <StatsGrid>
        <StatCard
          $color="#f59e0b"
          whileHover={{ y: -4 }}
        >
          <StatIcon color="#f59e0b">
            <FiStar />
          </StatIcon>
          <StatValue>{stats.reviewsCount}</StatValue>
          <StatLabel>Reviews escritas</StatLabel>
        </StatCard>

        <StatCard
          $color="#8b5cf6"
          whileHover={{ y: -4 }}
        >
          <StatIcon color="#8b5cf6">
            <FiList />
          </StatIcon>
          <StatValue>{stats.listsCount}</StatValue>
          <StatLabel>Listas creadas</StatLabel>
        </StatCard>

        <StatCard
          $color="#06b6d4"
          whileHover={{ y: -4 }}
        >
          <StatIcon color="#06b6d4">
            <FiGitBranch />
          </StatIcon>
          <StatValue>{stats.comparisonsCount}</StatValue>
          <StatLabel>Comparaciones</StatLabel>
        </StatCard>
      </StatsGrid>

      {recentReviews.length > 0 && (
        <>
          <SectionTitle>
            <FiStar size={18} /> Reviews Recientes
          </SectionTitle>
          <RecentList>
            {recentReviews.slice(0, 3).map(review => (
              <RecentItem key={review.id} to={`/racket/${review.rackets?.nombre?.toLowerCase().replace(/\s+/g, '-')}`}>
                <RecentItemInfo>
                  <RecentItemIcon color="#f59e0b">
                    <FiStar size={16} />
                  </RecentItemIcon>
                  <RecentItemText>
                    <RecentItemTitle>{review.rackets?.marca} {review.rackets?.nombre}</RecentItemTitle>
                    <RecentItemMeta>{review.rating} estrellas • {formatDate(review.created_at)}</RecentItemMeta>
                  </RecentItemText>
                </RecentItemInfo>
              </RecentItem>
            ))}
            <ViewAllLink to="/profile?tab=reviews">Ver todas las reviews</ViewAllLink>
          </RecentList>
        </>
      )}

      {recentLists.length > 0 && (
        <>
          <SectionTitle>
            <FiList size={18} /> Listas Recientes
          </SectionTitle>
          <RecentList>
            {recentLists.slice(0, 3).map(list => (
              <RecentItem key={list.id} to={`/lists/${list.id}`}>
                <RecentItemInfo>
                  <RecentItemIcon color="#8b5cf6">
                    <FiList size={16} />
                  </RecentItemIcon>
                  <RecentItemText>
                    <RecentItemTitle>{list.name}</RecentItemTitle>
                    <RecentItemMeta>{list.is_public ? 'Pública' : 'Privada'} • {formatDate(list.created_at)}</RecentItemMeta>
                  </RecentItemText>
                </RecentItemInfo>
              </RecentItem>
            ))}
            <ViewAllLink to="/profile?tab=lists">Ver todas las listas</ViewAllLink>
          </RecentList>
        </>
      )}

      {recentComparisons.length > 0 && (
        <>
          <SectionTitle>
            <FiGitBranch size={18} /> Comparaciones Recientes
          </SectionTitle>
          <RecentList>
            {recentComparisons.slice(0, 3).map(comp => (
              <RecentItem key={comp.id} to={`/compare/${comp.id}`}>
                <RecentItemInfo>
                  <RecentItemIcon color="#06b6d4">
                    <FiGitBranch size={16} />
                  </RecentItemIcon>
                  <RecentItemText>
                    <RecentItemTitle>{comp.name || 'Comparación'}</RecentItemTitle>
                    <RecentItemMeta>{comp.is_public ? 'Compartida' : 'Privada'} • {formatDate(comp.created_at)}</RecentItemMeta>
                  </RecentItemText>
                </RecentItemInfo>
              </RecentItem>
            ))}
            <ViewAllLink to="/profile?tab=comparisons">Ver todas las comparaciones</ViewAllLink>
          </RecentList>
        </>
      )}

      {stats.reviewsCount === 0 && stats.listsCount === 0 && stats.comparisonsCount === 0 && (
        <EmptyState>
          <FiClock size={32} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
          <p>No hay actividad reciente. ¡Explora y descubre palas!</p>
        </EmptyState>
      )}
    </Container>
  );
};

export default ActivityStats;
