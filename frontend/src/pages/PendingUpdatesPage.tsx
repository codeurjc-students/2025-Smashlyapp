import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import UpdateReviewCard from '../components/features/UpdateReviewCard';
import { getAuthToken } from '../utils/authUtils';

const API_URL = 'http://localhost:3000/api/v1';

interface PendingUpdate {
  id: number;
  racket_id: number | null;
  action_type: 'CREATE' | 'UPDATE' | 'DELETE';
  proposed_data: any;
  current_data: any;
  changes_summary: any;
  source_scraper: string;
  confidence_score: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

interface UpdateCounts {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}

const Container = styled.div`
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
`;

const Header = styled.div`
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.5rem;
`;

const Subtitle = styled.p`
  color: #6b7280;
  font-size: 1rem;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const StatCard = styled.div<{ color: string }>`
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border-left: 4px solid ${props => props.color};
`;

const StatLabel = styled.div`
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 0.5rem;
`;

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
`;

const FilterTabs = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  border-bottom: 2px solid #e5e7eb;
`;

const Tab = styled.button<{ active: boolean }>`
  padding: 0.75rem 1.5rem;
  background: none;
  border: none;
  border-bottom: 2px solid ${props => (props.active ? '#2563eb' : 'transparent')};
  color: ${props => (props.active ? '#2563eb' : '#6b7280')};
  font-weight: ${props => (props.active ? '600' : '400')};
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: -2px;

  &:hover {
    color: #2563eb;
  }
`;

const UpdatesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 4rem;
  color: #6b7280;
`;

const ErrorContainer = styled.div`
  background: #fee2e2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 1rem;
  color: #991b1b;
  margin-bottom: 1rem;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  color: #6b7280;

  h3 {
    font-size: 1.25rem;
    margin-bottom: 0.5rem;
    color: #1f2937;
  }
`;

const PendingUpdatesPage: React.FC = () => {
  const [updates, setUpdates] = useState<PendingUpdate[]>([]);
  const [counts, setCounts] = useState<UpdateCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'CREATE' | 'UPDATE' | 'DELETE'>('all');

  useEffect(() => {
    fetchData();
  }, [activeFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = getAuthToken();
      if (!token) {
        setError('No estás autenticado. Por favor, inicia sesión.');
        setLoading(false);
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };

      // Fetch counts
      const countsResponse = await axios.get(`${API_URL}/pending-updates/counts`, { headers });
      setCounts(countsResponse.data);

      // Fetch updates
      const params: any = { status: 'pending' };
      if (activeFilter !== 'all') {
        params.action_type = activeFilter;
      }

      const updatesResponse = await axios.get(`${API_URL}/pending-updates`, {
        headers,
        params,
      });
      setUpdates(updatesResponse.data);
    } catch (err: any) {
      console.error('Error fetching pending updates:', err);
      setError(err.response?.data?.error || 'Error al cargar las actualizaciones');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (updateId: number) => {
    try {
      const token = getAuthToken();
      if (!token) {
        alert('No estás autenticado');
        return;
      }

      await axios.post(
        `${API_URL}/pending-updates/${updateId}/approve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchData(); // Refresh data
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al aprobar');
    }
  };

  const handleReject = async (updateId: number) => {
    try {
      const token = getAuthToken();
      if (!token) {
        alert('No estás autenticado');
        return;
      }

      await axios.post(
        `${API_URL}/pending-updates/${updateId}/reject`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchData(); // Refresh data
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al rechazar');
    }
  };

  if (loading && !counts) {
    return (
      <Container>
        <LoadingContainer>Cargando actualizaciones pendientes...</LoadingContainer>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>📋 Actualizaciones Pendientes</Title>
        <Subtitle>Revisa y aprueba los cambios detectados por los scrapers</Subtitle>
      </Header>

      {error && <ErrorContainer>{error}</ErrorContainer>}

      {counts && (
        <StatsGrid>
          <StatCard color='#f59e0b'>
            <StatLabel>Pendientes</StatLabel>
            <StatValue>{counts.pending}</StatValue>
          </StatCard>
          <StatCard color='#10b981'>
            <StatLabel>Aprobadas</StatLabel>
            <StatValue>{counts.approved}</StatValue>
          </StatCard>
          <StatCard color='#ef4444'>
            <StatLabel>Rechazadas</StatLabel>
            <StatValue>{counts.rejected}</StatValue>
          </StatCard>
          <StatCard color='#6b7280'>
            <StatLabel>Total</StatLabel>
            <StatValue>{counts.total}</StatValue>
          </StatCard>
        </StatsGrid>
      )}

      <FilterTabs>
        <Tab active={activeFilter === 'all'} onClick={() => setActiveFilter('all')}>
          Todas
        </Tab>
        <Tab active={activeFilter === 'CREATE'} onClick={() => setActiveFilter('CREATE')}>
          Nuevas
        </Tab>
        <Tab active={activeFilter === 'UPDATE'} onClick={() => setActiveFilter('UPDATE')}>
          Actualizaciones
        </Tab>
        <Tab active={activeFilter === 'DELETE'} onClick={() => setActiveFilter('DELETE')}>
          Eliminaciones
        </Tab>
      </FilterTabs>

      {loading ? (
        <LoadingContainer>Cargando...</LoadingContainer>
      ) : updates.length === 0 ? (
        <EmptyState>
          <h3>✨ No hay actualizaciones pendientes</h3>
          <p>Todas las actualizaciones han sido revisadas</p>
        </EmptyState>
      ) : (
        <UpdatesList>
          {updates.map(update => (
            <UpdateReviewCard
              key={update.id}
              update={update}
              onApprove={() => handleApprove(update.id)}
              onReject={() => handleReject(update.id)}
              onUpdate={updatedUpdate => {
                // Update the local state with the edited update
                setUpdates(prev => prev.map(u => (u.id === updatedUpdate.id ? updatedUpdate : u)));
              }}
            />
          ))}
        </UpdatesList>
      )}
    </Container>
  );
};

export default PendingUpdatesPage;
