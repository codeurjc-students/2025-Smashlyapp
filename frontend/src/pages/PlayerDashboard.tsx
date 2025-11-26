import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { QuickActionCard } from '../components/dashboard/QuickActionCard';
import { ProfileCompletionBar } from '../components/dashboard/ProfileCompletionBar';
import { calculateProfileCompletion } from '../utils/profileUtils';
import { FaLightbulb, FaBalanceScale, FaHeart, FaChartBar } from 'react-icons/fa';
import { RacketService } from '../services/racketService';
import { RacketViewService, RecentlyViewedRacket } from '../services/racketViewService';
import { Racket } from '../types/racket';
import { ListService } from '../services/listService';

const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%);
  padding: 2rem;

  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const MaxWidth = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const HeroSection = styled.div`
  background: white;
  border-radius: 24px;
  padding: 3rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(22, 163, 74, 0.1);

  @media (max-width: 768px) {
    padding: 2rem 1.5rem;
  }
`;

const Greeting = styled.h1`
  font-size: 2.5rem;
  font-weight: 800;
  color: #1f2937;
  margin: 0 0 0.5rem 0;

  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const SubGreeting = styled.p`
  font-size: 1.125rem;
  color: #6b7280;
  margin: 0 0 1.5rem 0;
`;

const Stats = styled.div`
  display: flex;
  gap: 2rem;
  flex-wrap: wrap;
`;

const Stat = styled.div`
  display: flex;
  flex-direction: column;
`;

const StatValue = styled.span`
  font-size: 2rem;
  font-weight: 700;
  color: #16a34a;
`;

const StatLabel = styled.span`
  font-size: 0.875rem;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const Section = styled.section`
  margin-bottom: 2rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 1.5rem 0;
`;

const QuickActionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const RacketsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
`;

const RacketCard = styled.div`
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(22, 163, 74, 0.1);
  transition: all 0.3s ease;
  cursor: pointer;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 24px rgba(22, 163, 74, 0.15);
    border-color: #16a34a;
  }
`;

const RacketImage = styled.img`
  width: 100%;
  height: 200px;
  object-fit: contain;
  margin-bottom: 1rem;
  border-radius: 8px;
`;

const RacketName = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
`;

const RacketBrand = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0 0 0.5rem 0;
`;

const RacketPrice = styled.p`
  font-size: 1.25rem;
  font-weight: 700;
  color: #16a34a;
  margin: 0;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem;
  color: #6b7280;
`;

const ViewAllButton = styled.button`
  margin-top: 1rem;
  padding: 0.75rem 1.5rem;
  background: #f0fdf4;
  border: 1px solid #16a34a;
  color: #16a34a;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #dcfce7;
  }
`;

export const PlayerDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<Racket[]>([]);
  const [favoritesCount, setFavoritesCount] = useState<number>(0);
  const [recommendations, setRecommendations] = useState<Racket[]>([]);
  const [offers, setOffers] = useState<Racket[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewedRacket[]>([]);
  const [loading, setLoading] = useState(true);

  const profileCompletion = calculateProfileCompletion(user);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Fetch favorites count from "Favoritas" list
        const lists = await ListService.getUserLists();
        const favoritasList = lists.find(list => list.name === 'Favoritas');
        if (favoritasList) {
          setFavoritesCount(favoritasList.racket_count || 0);
          
          // If we want to show the rackets, fetch the list with details
          if (favoritasList.racket_count && favoritasList.racket_count > 0) {
            const listWithRackets = await ListService.getListById(favoritasList.id);
            if (listWithRackets?.rackets) {
              setFavorites(listWithRackets.rackets.slice(0, 4));
            }
          }
        }

        // Fetch recommendations based on user profile
        // const recs = await racketService.getRecommendedRackets(user?.game_level);
        // setRecommendations(recs.slice(0, 3));

        // Fetch offers and recently viewed in parallel
        const [allRackets, recentlyViewedData] = await Promise.all([
          RacketService.getAllRackets(),
          RacketViewService.getRecentlyViewed(6).catch(() => []), // Si falla, devolver array vacío
        ]);

        // Filter offers and shuffle them to show different ones each time
        const onOffer = allRackets.filter((r: Racket) => r.en_oferta);
        
        // Shuffle array using Fisher-Yates algorithm
        const shuffled = [...onOffer].sort(() => Math.random() - 0.5);
        
        setOffers(shuffled.slice(0, 4));
        setRecentlyViewed(recentlyViewedData);

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  const quickActions = [
    {
      icon: FaLightbulb,
      title: 'Mejor pala para ti',
      description: 'Encuentra tu pala ideal con IA',
      onClick: () => navigate('/best-racket'),
    },
    {
      icon: FaBalanceScale,
      title: 'Comparar palas',
      description: 'Compara hasta 3 palas',
      onClick: () => navigate('/compare-rackets'),
    },
    {
      icon: FaHeart,
      title: 'Mis favoritos',
      description: 'Ver palas guardadas',
      onClick: () => navigate('/favorites'),
    },
    {
      icon: FaChartBar,
      title: 'Mis comparaciones',
      description: 'Historial de comparaciones',
      onClick: () => navigate('/comparisons'),
    },
  ];

  return (
    <Container>
      <MaxWidth>
        {/* Hero Section */}
        <HeroSection>
          <Greeting>¡Hola, {user?.full_name || 'Jugador'}! 👋</Greeting>
          <SubGreeting>Bienvenido de vuelta a Smashly</SubGreeting>
          <Stats>
            <Stat>
              <StatValue>{favoritesCount}</StatValue>
              <StatLabel>Favoritas</StatLabel>
            </Stat>
            <Stat>
              <StatValue>{user?.game_level || 'Intermedio'}</StatValue>
              <StatLabel>Nivel</StatLabel>
            </Stat>
          </Stats>
        </HeroSection>

        {/* Profile Completion */}
        <Section>
          <ProfileCompletionBar
            percentage={profileCompletion.percentage}
            suggestions={profileCompletion.suggestions}
          />
        </Section>

        {/* Quick Actions */}
        <Section>
          <SectionTitle>🎯 Accesos Rápidos</SectionTitle>
          <QuickActionsGrid>
            {quickActions.map((action, index) => (
              <QuickActionCard key={index} {...action} />
            ))}
          </QuickActionsGrid>
        </Section>

        {/* Recently Viewed Rackets */}
        {recentlyViewed.length > 0 && (
          <Section>
            <SectionTitle>👁️ Últimas Palas Vistas</SectionTitle>
            <RacketsGrid>
              {recentlyViewed.map((racket) => (
                <RacketCard key={racket.id} onClick={() => navigate(`/racket-detail?id=${racket.id}`)}>
                  {racket.imagen && <RacketImage src={racket.imagen} alt={racket.nombre} />}
                  <RacketName>{racket.nombre}</RacketName>
                  <RacketBrand>{racket.marca}</RacketBrand>
                  {racket.precio_actual && (
                    <RacketPrice>{racket.precio_actual}€</RacketPrice>
                  )}
                </RacketCard>
              ))}
            </RacketsGrid>
          </Section>
        )}

        {/* Personalized Recommendations */}
        {recommendations.length > 0 && (
          <Section>
            <SectionTitle>💡 Recomendadas para ti</SectionTitle>
            <RacketsGrid>
              {recommendations.map((racket) => (
                <RacketCard key={racket.id} onClick={() => navigate(`/racket-detail?id=${racket.id}`)}>
                  {racket.imagen && <RacketImage src={racket.imagen} alt={racket.nombre} />}
                  <RacketName>{racket.nombre}</RacketName>
                  <RacketBrand>{racket.marca}</RacketBrand>
                  {racket.precio_actual && (
                    <RacketPrice>{racket.precio_actual}€</RacketPrice>
                  )}
                </RacketCard>
              ))}
            </RacketsGrid>
          </Section>
        )}

        {/* Favorites Preview */}
        {favorites.length > 0 && (
          <Section>
            <SectionTitle>❤️ Tus Favoritas</SectionTitle>
            <RacketsGrid>
              {favorites.map((racket) => (
                <RacketCard key={racket.id} onClick={() => navigate(`/racket-detail?id=${racket.id}`)}>
                  {racket.imagen && <RacketImage src={racket.imagen} alt={racket.nombre} />}
                  <RacketName>{racket.nombre}</RacketName>
                  <RacketBrand>{racket.marca}</RacketBrand>
                  {racket.precio_actual && (
                    <RacketPrice>{racket.precio_actual}€</RacketPrice>
                  )}
                </RacketCard>
              ))}
            </RacketsGrid>
            <ViewAllButton onClick={() => navigate('/favorites')}>
              Ver todas →
            </ViewAllButton>
          </Section>
        )}

        {/* Offers */}
        {offers.length > 0 && (
          <Section>
            <SectionTitle>🔥 Ofertas que te pueden interesar</SectionTitle>
            <RacketsGrid>
              {offers.map((racket) => (
                <RacketCard key={racket.id} onClick={() => navigate(`/racket-detail?id=${racket.id}`)}>
                  {racket.imagen && <RacketImage src={racket.imagen} alt={racket.nombre} />}
                  <RacketName>{racket.nombre}</RacketName>
                  <RacketBrand>{racket.marca}</RacketBrand>
                  {racket.precio_actual && (
                    <RacketPrice>{racket.precio_actual}€</RacketPrice>
                  )}
                </RacketCard>
              ))}
            </RacketsGrid>
          </Section>
        )}

        {loading && (
          <EmptyState>
            <p>Cargando tu dashboard personalizado...</p>
          </EmptyState>
        )}
      </MaxWidth>
    </Container>
  );
};
