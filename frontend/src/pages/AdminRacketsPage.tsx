import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { FiArrowLeft, FiEdit2, FiTrash2, FiSearch, FiPackage, FiTag } from 'react-icons/fi';
import { Racket } from '@/types/racket';
import { RacketService } from '@/services/racketService';
import { EditRacketModal } from '@/components/admin/EditRacketModal';
import { sileo } from 'sileo';

const PageContainer = styled.div`
  min-height: 100vh;
  background: #f9fafb;
  padding: 2rem;
`;

const Header = styled.div`
  max-width: 1400px;
  margin: 0 auto 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
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
  color: #4b5563;
  text-decoration: none;
  font-weight: 500;
  padding: 0.5rem 1rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.2s;

  &:hover {
    background: #f3f4f6;
  }
`;

const Title = styled.h1`
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
`;

const SearchContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: white;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  flex: 1;
  max-width: 400px;
`;

const SearchInput = styled.input`
  border: none;
  outline: none;
  flex: 1;
  font-size: 0.875rem;
  color: #374151;

  &::placeholder {
    color: #9ca3af;
  }
`;

const SearchIcon = styled.div`
  color: #9ca3af;
  display: flex;
  align-items: center;
`;

const Content = styled.div`
  max-width: 1400px;
  margin: 0 auto;
`;

const TableContainer = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  border: 1px solid #e5e7eb;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const Th = styled.th`
  text-align: left;
  padding: 1rem;
  background: #f9fafb;
  font-weight: 600;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #6b7280;
  border-bottom: 1px solid #e5e7eb;
`;

const Td = styled.td`
  padding: 1rem;
  border-bottom: 1px solid #f3f4f6;
  font-size: 0.875rem;
  color: #374151;
  vertical-align: middle;
`;

const RacketInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const RacketImage = styled.img`
  width: 48px;
  height: 48px;
  object-fit: cover;
  border-radius: 8px;
  background: #f3f4f6;
`;

const RacketName = styled.div`
  font-weight: 600;
  color: #111827;
`;

const RacketDetails = styled.div`
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 0.25rem;
`;

const Price = styled.span<{ sale?: boolean }>`
  font-weight: 600;
  color: ${props => (props.sale ? '#16a34a' : '#374151')};
`;

const Badge = styled.span<{ variant: 'success' | 'warning' | 'default' }>`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;

  ${props => {
    switch (props.variant) {
      case 'success':
        return `
          background: #dcfce7;
          color: #166534;
        `;
      case 'warning':
        return `
          background: #fef3c7;
          color: #92400e;
        `;
      default:
        return `
          background: #f3f4f6;
          color: #4b5563;
        `;
    }
  }}
`;

const Actions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ActionButton = styled.button<{ variant?: 'edit' | 'delete' }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: all 0.2s;

  ${props =>
    props.variant === 'edit'
      ? `
        background: #eff6ff;
        color: #3b82f6;
        &:hover { background: #dbeafe; }
      `
      : `
        background: #fef2f2;
        color: #ef4444;
        &:hover { background: #fee2e2; }
      `}
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 4rem;
  color: #6b7280;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 4rem;
  color: #6b7280;
`;

const StatsBar = styled.div`
  display: flex;
  gap: 2rem;
  margin-bottom: 1rem;
  padding: 1rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const Stat = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #6b7280;

  span {
    font-weight: 600;
    color: #111827;
  }
`;

const AdminRacketsPage: React.FC = () => {
  const [rackets, setRackets] = useState<Racket[]>([]);
  const [filteredRackets, setFilteredRackets] = useState<Racket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingRacket, setEditingRacket] = useState<Racket | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    loadRackets();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredRackets(rackets);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredRackets(
        rackets.filter(
          r =>
            r.marca?.toLowerCase().includes(query) ||
            r.modelo?.toLowerCase().includes(query) ||
            r.nombre?.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, rackets]);

  const loadRackets = async () => {
    try {
      setLoading(true);
      const data = await RacketService.getAllRackets();
      console.log('API Response:', data);
      const racketsArray = Array.isArray(data) ? data : [];
      console.log('Rackets array:', racketsArray);
      setRackets(racketsArray);
      setFilteredRackets(racketsArray);
    } catch (error) {
      console.error('Error loading rackets:', error);
      sileo.error({ title: 'Error', description: 'Error al cargar las palas' });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (racket: Racket) => {
    setEditingRacket(racket);
    setIsEditModalOpen(true);
  };

  const handleUpdate = (updatedRacket: Racket) => {
    setRackets(prev => prev.map(r => (r.id === updatedRacket.id ? updatedRacket : r)));
    setFilteredRackets(prev => prev.map(r => (r.id === updatedRacket.id ? updatedRacket : r)));
  };

  const handleDelete = async (racket: Racket) => {
    if (!racket.id) return;

    const confirmed = window.confirm(
      `¿Estás seguro de que quieres eliminar la pala "${racket.nombre || racket.modelo}"?`
    );
    if (!confirmed) return;

    try {
      await RacketService.deleteRacket(racket.id);
      setRackets(prev => prev.filter(r => r.id !== racket.id));
      setFilteredRackets(prev => prev.filter(r => r.id !== racket.id));
      sileo.success({ title: 'Éxito', description: 'Pala eliminada correctamente' });
    } catch (error) {
      console.error('Error deleting racket:', error);
      sileo.error({ title: 'Error', description: 'Error al eliminar la pala' });
    }
  };

  const totalOnSale = rackets.filter(r => r.en_oferta).length;
  const totalBrands = new Set(rackets.map(r => r.marca).filter(Boolean)).size;

  if (loading) {
    return (
      <PageContainer>
        <LoadingContainer>Cargando palas...</LoadingContainer>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Header>
        <HeaderLeft>
          <BackButton to='/admin'>
            <FiArrowLeft /> Volver
          </BackButton>
          <Title>Gestión de Palas ({rackets.length})</Title>
        </HeaderLeft>
        <SearchContainer>
          <SearchIcon>
            <FiSearch />
          </SearchIcon>
          <SearchInput
            placeholder='Buscar por marca, modelo o nombre...'
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </SearchContainer>
      </Header>

      <Content>
        <StatsBar>
          <Stat>
            <FiPackage size={16} />
            <span>{rackets.length}</span> Total Palas
          </Stat>
          <Stat>
            <FiTag size={16} />
            <span>{totalOnSale}</span> En Oferta
          </Stat>
          <Stat>
            <span>{totalBrands}</span> Marcas
          </Stat>
        </StatsBar>

        <TableContainer>
          <Table>
            <thead>
              <tr>
                <Th>Pala</Th>
                <Th>Marca</Th>
                <Th>Precio</Th>
                <Th>Estado</Th>
                <Th>Acciones</Th>
              </tr>
            </thead>
            <tbody>
              {filteredRackets.length === 0 ? (
                <tr>
                  <Td colSpan={5}>
                    <EmptyState>
                      {searchQuery ? 'No se encontraron palas' : 'No hay palas disponibles'}
                    </EmptyState>
                  </Td>
                </tr>
              ) : (
                filteredRackets.map(racket => (
                  <tr key={racket.id}>
                    <Td>
                      <RacketInfo>
                        {racket.imagenes && racket.imagenes.length > 0 && racket.imagenes[0] ? (
                          <RacketImage src={racket.imagenes[0]} alt={racket.modelo || 'Pala'} />
                        ) : (
                          <RacketImage
                            src='data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" fill="%23d1d5db" viewBox="0 0 24 24"%3E%3Cpath d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z"/%3E%3C/svg%3E'
                            alt='Sin imagen'
                          />
                        )}
                        <div>
                          <RacketName>{racket.nombre || racket.modelo || 'Sin nombre'}</RacketName>
                          <RacketDetails>
                            {racket.caracteristicas_forma || '-'} • {racket.caracteristicas_balance || '-'}
                          </RacketDetails>
                        </div>
                      </RacketInfo>
                    </Td>
                    <Td>{racket.marca || '-'}</Td>
                    <Td>
                      {racket.padelnuestro_precio_actual != null ? (
                        <Price sale={racket.en_oferta}>
                          {Number(racket.padelnuestro_precio_actual).toFixed(2)}€
                        </Price>
                      ) : (
                        '-'
                      )}
                    </Td>
                    <Td>
                      {racket.en_oferta ? (
                        <Badge variant='success'>
                          <FiTag size={12} /> En Oferta
                        </Badge>
                      ) : (
                        <Badge variant='default'>Normal</Badge>
                      )}
                    </Td>
                    <Td>
                      <Actions>
                        <ActionButton variant='edit' onClick={() => handleEdit(racket)} title='Editar'>
                          <FiEdit2 size={16} />
                        </ActionButton>
                        <ActionButton variant='delete' onClick={() => handleDelete(racket)} title='Eliminar'>
                          <FiTrash2 size={16} />
                        </ActionButton>
                      </Actions>
                    </Td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </TableContainer>
      </Content>

      {editingRacket && (
        <EditRacketModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingRacket(null);
          }}
          racket={editingRacket}
          onUpdate={handleUpdate}
        />
      )}
    </PageContainer>
  );
};

export default AdminRacketsPage;
