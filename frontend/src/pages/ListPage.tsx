import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiList, FiLock, FiGlobe, FiLoader } from 'react-icons/fi';
import { ListService } from '../services/listService';
import { ListWithRackets } from '../types/list';
import RacketCard from '../components/features/RacketCard';
import { sileo } from 'sileo';

const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  padding: 2rem 1rem;
`;

const Content = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.div`
  margin-bottom: 2.5rem;
`;

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: #64748b;
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 1.5rem;
  transition: color 0.2s ease;

  &:hover {
    color: #16a34a;
  }
`;

const TitleSection = styled.div`
  display: flex;
  align-items: baseline;
  gap: 1rem;
  flex-wrap: wrap;
`;

const Title = styled.h1`
  font-size: clamp(1.5rem, 4vw, 2.5rem);
  font-weight: 800;
  color: #1e293b;
  margin: 0;
`;

const Badge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  background: white;
  color: #64748b;
  border: 1px solid #e2e8f0;
`;

const ListMeta = styled.p`
  color: #64748b;
  margin-top: 0.5rem;
  font-size: 1rem;
`;

const RacketsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
`;

const LoadingState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  gap: 1rem;
  color: #64748b;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 20px;
  border: 2px dashed #e2e8f0;
  color: #64748b;
`;

const Spin = styled(motion.div)`
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ListPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [list, setList] = useState<ListWithRackets | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadList(id);
    }
  }, [id]);

  const loadList = async (listId: string) => {
    try {
      setLoading(true);
      const data = await ListService.getListById(listId);
      setList(data);
    } catch (error: any) {
      console.error('Error loading list:', error);
      sileo.error({ 
        title: 'Error', 
        description: 'No se pudo cargar la lista. Es posible que no tengas permisos o que ya no exista.' 
      });
      // Si es un error de no encontrado o permisos, redirigir al perfil podría ser buena idea, 
      // pero el 404 del ruteador ya hará su trabajo si la ruta base es incorrecta.
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container>
        <LoadingState>
          <Spin
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <FiLoader size={32} color="#16a34a" />
          </Spin>
          <p>Cargando tu colección...</p>
        </LoadingState>
      </Container>
    );
  }

  if (!list) {
    return (
      <Container>
        <Content>
          <BackLink to="/profile">
            <FiArrowLeft /> Volver al perfil
          </BackLink>
          <EmptyState>
            <FiList size={48} style={{ marginBottom: '1rem', opacity: 0.2 }} />
            <h2>No se encontró la lista</h2>
            <p>La lista que buscas no existe o no tienes permiso para verla.</p>
          </EmptyState>
        </Content>
      </Container>
    );
  }

  return (
    <Container>
      <Content>
        <Header>
          <BackLink to="/profile">
            <FiArrowLeft /> Volver al perfil
          </BackLink>
          <TitleSection>
            <Title>{list.name}</Title>
            <Badge>
              {list.is_public ? <FiGlobe size={12} /> : <FiLock size={12} />}
              {list.is_public ? 'Pública' : 'Privada'}
            </Badge>
          </TitleSection>
          {list.description && <ListMeta>{list.description}</ListMeta>}
          <ListMeta>
            {list.rackets?.length || 0} palas en esta colección
          </ListMeta>
        </Header>

        {(!list.rackets || list.rackets.length === 0) ? (
          <EmptyState>
            <FiList size={48} style={{ marginBottom: '1rem', opacity: 0.2 }} />
            <h3>Esta lista está vacía</h3>
            <p>Empieza a añadir palas desde el catálogo para verlas aquí.</p>
            <Link 
              to="/catalog" 
              style={{ 
                marginTop: '1.5rem', 
                display: 'inline-block',
                color: '#16a34a',
                fontWeight: 600,
                textDecoration: 'none'
              }}
            >
              Explorar Catálogo →
            </Link>
          </EmptyState>
        ) : (
          <RacketsGrid>
            {list.rackets.map((racket, index) => (
              <RacketCard 
                key={racket.id} 
                racket={racket} 
                view="grid"
                index={index}
                onClick={() => navigate(`/racket-detail?id=${encodeURIComponent(racket.nombre)}`)}
              />
            ))}
          </RacketsGrid>
        )}
      </Content>
    </Container>
  );
};

export default ListPage;
