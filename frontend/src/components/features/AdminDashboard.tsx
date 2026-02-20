import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import {
  FiUsers,
  FiShoppingBag,
  FiPackage,
  FiTrendingUp,
  FiActivity,
  FiStar,
  FiAlertTriangle,
  FiArrowRight,
  FiCheck,
  FiClock,
  FiSettings,
} from 'react-icons/fi';
import { sileo } from 'sileo';
import { Link } from 'react-router-dom';
import { AdminService, AdminMetrics, Activity } from '../../services/adminService';

const DashboardContainer = styled.div`
  padding: 2rem;
  max-width: 1600px;
  margin: 0 auto;

  @media (max-width: 768px) {
    padding: 1rem 1rem 3rem 1rem;
  }
`;

const WelcomeSection = styled.div`
  margin-bottom: 2rem;
`;

const WelcomeTitle = styled.h1`
  font-size: 1.75rem;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 0.5rem;
  letter-spacing: -0.025em;

  @media (max-width: 768px) {
    font-size: 1.5rem;
  }
`;

const WelcomeSubtitle = styled.p`
  color: #64748b;
  font-size: 1rem;
`;

const StatsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
  margin-bottom: 2rem;

  @media (max-width: 1200px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const StatCard = styled.div<{ $accent?: string }>`
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  border: 1px solid #e2e8f0;
  position: relative;
  overflow: hidden;
  transition: all 0.2s ease;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: ${props => props.$accent || '#16a34a'};
  }

  &:hover {
    border-color: ${props => props.$accent || '#16a34a'}40;
    transform: translateY(-2px);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
  }
`;

const StatHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
`;

const StatIcon = styled.div<{ color: string }>`
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: ${props => props.color}15;
  color: ${props => props.color};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
`;

const StatTrend = styled.div<{ positive: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: ${props => (props.positive ? '#16a34a' : '#ef4444')};
  background: ${props => (props.positive ? '#16a34a10' : '#ef444410')};
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
`;

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: #0f172a;
  letter-spacing: -0.025em;
  line-height: 1.2;
`;

const StatLabel = styled.div`
  font-size: 0.875rem;
  color: #64748b;
  margin-top: 0.25rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.125rem;
  font-weight: 600;
  color: #0f172a;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Grid2Col = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1.5rem;
  margin-bottom: 2rem;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const Card = styled.div`
  background: white;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
`;

const CardHeader = styled.div`
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const CardTitle = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  color: #0f172a;
`;

const CardContent = styled.div`
  padding: 1.5rem;
`;

const ActivityList = styled.div`
  display: flex;
  flex-direction: column;
`;

const ActivityItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem 0;
  border-bottom: 1px solid #f1f5f9;

  &:last-child {
    border-bottom: none;
  }
`;

const ActivityIcon = styled.div<{ type: string }>`
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  flex-shrink: 0;
  
  ${props => {
    switch (props.type) {
      case 'user':
        return 'background: #3b82f615; color: #3b82f6;';
      case 'racket':
        return 'background: #8b5cf615; color: #8b5cf6;';
      case 'review':
        return 'background: #f59e0b15; color: #f59e0b;';
      case 'store':
        return 'background: #16a34a15; color: #16a34a;';
      default:
        return 'background: #64748b15; color: #64748b;';
    }
  }}
`;

const ActivityContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const ActivityTitle = styled.div`
  font-size: 0.9375rem;
  font-weight: 500;
  color: #0f172a;
  margin-bottom: 0.25rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ActivityTime = styled.div`
  font-size: 0.8125rem;
  color: #94a3b8;
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const QuickActions = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
`;

const QuickActionCard = styled(Link)<{ $color: string }>`
  background: white;
  border-radius: 12px;
  padding: 1.25rem;
  border: 1px solid #e2e8f0;
  text-decoration: none;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 1rem;

  &:hover {
    border-color: ${props => props.$color};
    background: ${props => props.$color}08;
    transform: translateY(-2px);
  }
`;

const QuickActionIcon = styled.div<{ color: string }>`
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: ${props => props.color}15;
  color: ${props => props.color};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.125rem;
  flex-shrink: 0;
`;

const QuickActionText = styled.div`
  flex: 1;
`;

const QuickActionTitle = styled.div`
  font-size: 0.9375rem;
  font-weight: 600;
  color: #0f172a;
  margin-bottom: 0.125rem;
`;

const QuickActionDesc = styled.div`
  font-size: 0.8125rem;
  color: #64748b;
`;

const AlertBadge = styled.div<{ count: number }>`
  background: #ef4444;
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.125rem 0.5rem;
  border-radius: 10px;
  margin-left: 0.5rem;
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 4rem;
  color: #64748b;
`;

const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Ahora';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}m`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days}d`;
  }
};

const AdminDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [conflictsCount, setConflictsCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [metricsData, activitiesData, conflictsData] = await Promise.all([
        AdminService.getDashboardMetrics(),
        AdminService.getRecentActivity(10),
        AdminService.getRacketConflicts(),
      ]);

      setMetrics(metricsData);
      setActivities(activitiesData);
      setConflictsCount(conflictsData.length);
    } catch (error: any) {
      console.error('Error loading dashboard data:', error);

      if (error.message.includes('404')) {
        sileo.error({
          title: 'Error',
          description:
            'El servidor backend necesita reiniciarse para cargar las nuevas rutas de administración',
        });
      } else {
        sileo.error({
          title: 'Error',
          description:
            'Error al cargar los datos del dashboard. Verifica que el backend esté corriendo.',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingContainer>Cargando métricas...</LoadingContainer>;
  }

  if (!metrics) {
    return <LoadingContainer>No se pudieron cargar las métricas</LoadingContainer>;
  }

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'user':
        return <FiUsers />;
      case 'racket':
        return <FiPackage />;
      case 'review':
        return <FiStar />;
      case 'store':
        return <FiShoppingBag />;
      default:
        return <FiActivity />;
    }
  };

  return (
    <DashboardContainer>
      <WelcomeSection>
        <WelcomeTitle>Panel de Control</WelcomeTitle>
        <WelcomeSubtitle>
          Gestiona usuarios, palas y tiendas desde un solo lugar
        </WelcomeSubtitle>
      </WelcomeSection>

      <StatsRow>
        <StatCard $accent="#3b82f6">
          <StatHeader>
            <StatIcon color="#3b82f6">
              <FiUsers />
            </StatIcon>
            <StatTrend positive={metrics.usersChange > 0}>
              <FiTrendingUp size={12} />
              {metrics.usersChange > 0 ? '+' : ''}
              {metrics.usersChange}%
            </StatTrend>
          </StatHeader>
          <StatValue>{metrics.totalUsers.toLocaleString()}</StatValue>
          <StatLabel>Total Usuarios</StatLabel>
        </StatCard>

        <StatCard $accent="#8b5cf6">
          <StatHeader>
            <StatIcon color="#8b5cf6">
              <FiPackage />
            </StatIcon>
            <StatTrend positive={metrics.racketsChange > 0}>
              <FiTrendingUp size={12} />
              {metrics.racketsChange > 0 ? '+' : ''}
              {metrics.racketsChange}%
            </StatTrend>
          </StatHeader>
          <StatValue>{metrics.totalRackets.toLocaleString()}</StatValue>
          <StatLabel>Palas Registradas</StatLabel>
        </StatCard>

        <StatCard $accent="#16a34a">
          <StatHeader>
            <StatIcon color="#16a34a">
              <FiShoppingBag />
            </StatIcon>
          </StatHeader>
          <StatValue>{metrics.totalStores}</StatValue>
          <StatLabel>Tiendas Asociadas</StatLabel>
        </StatCard>

        <StatCard $accent={conflictsCount > 0 ? '#f59e0b' : '#10b981'}>
          <StatHeader>
            <StatIcon color={conflictsCount > 0 ? '#f59e0b' : '#10b981'}>
              {conflictsCount > 0 ? <FiAlertTriangle /> : <FiCheck />}
            </StatIcon>
          </StatHeader>
          <StatValue style={{ color: conflictsCount > 0 ? '#f59e0b' : '#0f172a' }}>
            {conflictsCount > 0 ? conflictsCount : 'Todo OK'}
          </StatValue>
          <StatLabel>
            {conflictsCount > 0 ? 'Conflictos Pendientes' : 'Sin Conflictos'}
          </StatLabel>
        </StatCard>
      </StatsRow>

      <Grid2Col>
        <Card>
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
            <Link
              to="/admin/activity"
              style={{
                fontSize: '0.875rem',
                color: '#16a34a',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}
            >
              Ver todo <FiArrowRight size={14} />
            </Link>
          </CardHeader>
          <CardContent>
            <ActivityList>
              {activities.slice(0, 6).map(activity => (
                <ActivityItem key={activity.id}>
                  <ActivityIcon type={activity.type}>
                    {getActivityIcon(activity.type)}
                  </ActivityIcon>
                  <ActivityContent>
                    <ActivityTitle>{activity.title}</ActivityTitle>
                    <ActivityTime>
                      <FiClock size={12} />
                      {formatRelativeTime(activity.time)}
                    </ActivityTime>
                  </ActivityContent>
                </ActivityItem>
              ))}
            </ActivityList>
          </CardContent>
        </Card>

        <div>
          <SectionTitle>Acciones Rápidas</SectionTitle>
          <QuickActions>
            <QuickActionCard to="/admin/rackets" $color="#8b5cf6">
              <QuickActionIcon color="#8b5cf6">
                <FiPackage />
              </QuickActionIcon>
              <QuickActionText>
                <QuickActionTitle>Gestionar Palas</QuickActionTitle>
                <QuickActionDesc>CRUD completo</QuickActionDesc>
              </QuickActionText>
              <FiArrowRight size={16} color="#8b5cf6" />
            </QuickActionCard>

            <QuickActionCard to="/admin/rackets/review" $color="#f59e0b">
              <QuickActionIcon color="#f59e0b">
                <FiAlertTriangle />
              </QuickActionIcon>
              <QuickActionText>
                <QuickActionTitle>
                  Revisar Conflictos
                  {conflictsCount > 0 && (
                    <AlertBadge count={conflictsCount}>{conflictsCount}</AlertBadge>
                  )}
                </QuickActionTitle>
                <QuickActionDesc>Duplicados y errores</QuickActionDesc>
              </QuickActionText>
              <FiArrowRight size={16} color="#f59e0b" />
            </QuickActionCard>

            <QuickActionCard to="/admin/users" $color="#3b82f6">
              <QuickActionIcon color="#3b82f6">
                <FiUsers />
              </QuickActionIcon>
              <QuickActionText>
                <QuickActionTitle>Usuarios</QuickActionTitle>
                <QuickActionDesc>Gestión de cuentas</QuickActionDesc>
              </QuickActionText>
              <FiArrowRight size={16} color="#3b82f6" />
            </QuickActionCard>

            <QuickActionCard to="/admin/stores" $color="#16a34a">
              <QuickActionIcon color="#16a34a">
                <FiShoppingBag />
              </QuickActionIcon>
              <QuickActionText>
                <QuickActionTitle>Tiendas</QuickActionTitle>
                <QuickActionDesc>Asociaciones</QuickActionDesc>
              </QuickActionText>
              <FiArrowRight size={16} color="#16a34a" />
            </QuickActionCard>

            <QuickActionCard to="/admin/settings" $color="#64748b">
              <QuickActionIcon color="#64748b">
                <FiSettings />
              </QuickActionIcon>
              <QuickActionText>
                <QuickActionTitle>Configuración</QuickActionTitle>
                <QuickActionDesc>Marcas, categorías</QuickActionDesc>
              </QuickActionText>
              <FiArrowRight size={16} color="#64748b" />
            </QuickActionCard>
          </QuickActions>

          <Card style={{ marginTop: '1.5rem' }}>
            <CardHeader>
              <CardTitle>Métricas Adicionales</CardTitle>
            </CardHeader>
            <CardContent>
              <StatsRow style={{ marginBottom: 0 }}>
                <StatCard $accent="#ec4899" style={{ padding: '1rem' }}>
                  <StatValue style={{ fontSize: '1.5rem' }}>
                    {metrics.totalReviews.toLocaleString()}
                  </StatValue>
                  <StatLabel>Reviews</StatLabel>
                </StatCard>
                <StatCard $accent="#10b981" style={{ padding: '1rem' }}>
                  <StatValue style={{ fontSize: '1.5rem' }}>
                    {metrics.activeUsers.toLocaleString()}
                  </StatValue>
                  <StatLabel>Activos</StatLabel>
                </StatCard>
                <StatCard $accent="#f43f5e" style={{ padding: '1rem' }}>
                  <StatValue style={{ fontSize: '1.5rem' }}>
                    {metrics.totalFavorites.toLocaleString()}
                  </StatValue>
                  <StatLabel>Favoritos</StatLabel>
                </StatCard>
                <StatCard $accent="#f59e0b" style={{ padding: '1rem' }}>
                  <StatValue style={{ fontSize: '1.5rem' }}>
                    {metrics.pendingRequests}
                  </StatValue>
                  <StatLabel>Pendientes</StatLabel>
                </StatCard>
              </StatsRow>
            </CardContent>
          </Card>
        </div>
      </Grid2Col>
    </DashboardContainer>
  );
};

export default AdminDashboard;
