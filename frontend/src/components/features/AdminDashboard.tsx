import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { FiUsers, FiShoppingBag, FiPackage, FiTrendingUp, FiActivity, FiStar, FiHeart, FiAlertTriangle } from "react-icons/fi";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { AdminService, AdminMetrics, Activity } from "../../services/adminService";

const DashboardContainer = styled.div`
  display: grid;
  gap: 2rem;
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
`;

const MetricCard = styled.div`
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  }
`;

const MetricIcon = styled.div<{ color: string }>`
  width: 60px;
  height: 60px;
  border-radius: 12px;
  background: ${(props) => props.color}15;
  color: ${(props) => props.color};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.75rem;
`;

const MetricInfo = styled.div`
  flex: 1;
`;

const MetricLabel = styled.div`
  color: #666;
  font-size: 0.875rem;
  margin-bottom: 0.25rem;
`;

const MetricValue = styled.div`
  color: #333;
  font-size: 1.75rem;
  font-weight: 700;
`;

const MetricChange = styled.div<{ positive: boolean }>`
  color: ${(props) => (props.positive ? "#16a34a" : "#dc2626")};
  font-size: 0.875rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-top: 0.25rem;
`;

const ChartsSection = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 2rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const ChartCard = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
`;

const ChartTitle = styled.h3`
  margin: 0 0 1.5rem 0;
  font-size: 1.25rem;
  color: #333;
  font-weight: 600;
`;

const ActivityList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const ActivityItem = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
  border-left: 3px solid #16a34a;
`;

const ActivityIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: #16a34a15;
  color: #16a34a;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
`;

const ActivityContent = styled.div`
  flex: 1;
`;

const ActivityTitle = styled.div`
  color: #333;
  font-weight: 600;
  margin-bottom: 0.25rem;
`;

const ActivityTime = styled.div`
  color: #666;
  font-size: 0.875rem;
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 3rem;
  color: #666;
`;

// Helper function to format relative time
const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Hace unos segundos';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `Hace ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `Hace ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `Hace ${days} ${days === 1 ? 'día' : 'días'}`;
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
      // Cargar métricas y actividades en paralelo
      const [metricsData, activitiesData, conflictsData] = await Promise.all([
        AdminService.getDashboardMetrics(),
        AdminService.getRecentActivity(10),
        AdminService.getRacketConflicts()
      ]);
      
      setMetrics(metricsData);
      setActivities(activitiesData);
      setConflictsCount(conflictsData.length);
    } catch (error: any) {
      console.error('Error loading dashboard data:', error);
      
      // Mostrar error más específico
      if (error.message.includes('404')) {
        toast.error('El servidor backend necesita reiniciarse para cargar las nuevas rutas de administración');
      } else {
        toast.error('Error al cargar los datos del dashboard. Verifica que el backend esté corriendo.');
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
    }
  };

  return (
    <DashboardContainer>
      <MetricsGrid>
        <MetricCard>
          <MetricIcon color="#16a34a">
            <FiUsers />
          </MetricIcon>
          <MetricInfo>
            <MetricLabel>Total Usuarios</MetricLabel>
            <MetricValue>{metrics.totalUsers.toLocaleString()}</MetricValue>
            <MetricChange positive={metrics.usersChange > 0}>
              <FiTrendingUp />
              +{metrics.usersChange}% este mes
            </MetricChange>
          </MetricInfo>
        </MetricCard>

        <MetricCard>
          <MetricIcon color="#3b82f6">
            <FiPackage />
          </MetricIcon>
          <MetricInfo>
            <MetricLabel>Total Palas</MetricLabel>
            <MetricValue>{metrics.totalRackets.toLocaleString()}</MetricValue>
            <MetricChange positive={metrics.racketsChange > 0}>
              <FiTrendingUp />
              +{metrics.racketsChange}% este mes
            </MetricChange>
          </MetricInfo>
        </MetricCard>

        {/* Conflicts Card - Detailed */}
        <Link to="/admin/rackets/review" style={{ textDecoration: 'none' }}>
          <MetricCard style={{ border: conflictsCount > 0 ? '2px solid #f59e0b' : 'none' }}>
            <MetricIcon color="#f59e0b">
              <FiAlertTriangle />
            </MetricIcon>
            <MetricInfo>
              <MetricLabel>Conflictos / Duplicados</MetricLabel>
              <MetricValue>{conflictsCount}</MetricValue>
              {conflictsCount > 0 && (
                <MetricChange positive={false} style={{ color: '#f59e0b' }}>
                  Requiere revisión
                </MetricChange>
              )}
            </MetricInfo>
          </MetricCard>
        </Link>

        <MetricCard>
          <MetricIcon color="#f59e0b">
            <FiShoppingBag />
          </MetricIcon>
          <MetricInfo>
            <MetricLabel>Tiendas Asociadas</MetricLabel>
            <MetricValue>{metrics.totalStores}</MetricValue>
          </MetricInfo>
        </MetricCard>

        <MetricCard>
          <MetricIcon color="#8b5cf6">
            <FiStar />
          </MetricIcon>
          <MetricInfo>
            <MetricLabel>Total Reviews</MetricLabel>
            <MetricValue>{metrics.totalReviews.toLocaleString()}</MetricValue>
          </MetricInfo>
        </MetricCard>

        <MetricCard>
          <MetricIcon color="#ef4444">
            <FiActivity />
          </MetricIcon>
          <MetricInfo>
            <MetricLabel>Solicitudes Pendientes</MetricLabel>
            <MetricValue>{metrics.pendingRequests}</MetricValue>
          </MetricInfo>
        </MetricCard>

        <MetricCard>
          <MetricIcon color="#10b981">
            <FiTrendingUp />
          </MetricIcon>
          <MetricInfo>
            <MetricLabel>Usuarios Activos</MetricLabel>
            <MetricValue>{metrics.activeUsers.toLocaleString()}</MetricValue>
          </MetricInfo>
        </MetricCard>

        <MetricCard>
          <MetricIcon color="#ec4899">
            <FiHeart />
          </MetricIcon>
          <MetricInfo>
            <MetricLabel>Palas Favoritas</MetricLabel>
            <MetricValue>{metrics.totalFavorites.toLocaleString()}</MetricValue>
          </MetricInfo>
        </MetricCard>
      </MetricsGrid>

      <ChartsSection>
        <ChartCard>
          <ChartTitle>Actividad Reciente</ChartTitle>
          <ActivityList>
            {activities.map((activity) => (
              <ActivityItem key={activity.id}>
                <ActivityIcon>{getActivityIcon(activity.type)}</ActivityIcon>
                <ActivityContent>
                  <ActivityTitle>{activity.title}</ActivityTitle>
                  <ActivityTime>{formatRelativeTime(activity.time)}</ActivityTime>
                </ActivityContent>
              </ActivityItem>
            ))}
          </ActivityList>
        </ChartCard>
      </ChartsSection>
    </DashboardContainer>
  );
};

export default AdminDashboard;
