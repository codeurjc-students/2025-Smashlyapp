import React, { useEffect, useState } from "react";
import styled from "styled-components";
import {
  FiList,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiEye,
  FiPackage,
} from "react-icons/fi";
import { useList } from "../../contexts/ListsContext";
import { CreateListModal } from "./CreateListModal";
import { ViewListModal } from "./ViewListModal";
import { ListWithRackets } from "../../types/list";

const Section = styled.div`
  background: white;
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  margin-bottom: 2rem;
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #f3f4f6;
`;

const SectionTitle = styled.h2`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
`;

const CreateButton = styled.button`
  background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
  font-size: 0.95rem;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(22, 163, 74, 0.3);
  }
`;

const ListsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const ListCard = styled.div`
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  border: 2px solid #bbf7d0;
  border-radius: 16px;
  padding: 1.5rem;
  transition: all 0.2s ease;
  cursor: pointer;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(22, 163, 74, 0.15);
    border-color: #16a34a;
  }
`;

const ListHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
`;

const ListIcon = styled.div`
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;
`;

const ListActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ActionButton = styled.button<{ variant?: "danger" | "primary" }>`
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  ${(props) =>
    props.variant === "danger"
      ? `
    background: #fee2e2;
    color: #dc2626;
    &:hover {
      background: #fecaca;
    }
  `
      : `
    background: white;
    color: #16a34a;
    &:hover {
      background: #f0fdf4;
    }
  `}
`;

const ListContent = styled.div``;

const ListName = styled.h3`
  font-size: 1.125rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const ListDescription = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0 0 1rem 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 2.5rem;
`;

const ListMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding-top: 1rem;
  border-top: 1px solid #bbf7d0;
`;

const RacketCount = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #16a34a;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem 1rem;
  color: #6b7280;
`;

const EmptyIcon = styled.div`
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.5;
`;

const EmptyText = styled.p`
  font-size: 1.125rem;
  margin: 0 0 1.5rem 0;
`;

const LoadingState = styled.div`
  text-align: center;
  padding: 3rem 1rem;
  color: #6b7280;
`;

const Spinner = styled.div`
  width: 50px;
  height: 50px;
  border: 4px solid #e5e7eb;
  border-top: 4px solid #16a34a;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

export const MyListsSection: React.FC = () => {
  const {
    lists,
    loading,
    fetchLists,
    deleteList,
    getListById,
    removeRacketFromList,
    createList,
  } = useList();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedList, setSelectedList] = useState<ListWithRackets | null>(
    null
  );
  const [loadingListDetail, setLoadingListDetail] = useState(false);

  useEffect(() => {
    fetchLists();
  }, []);

  const handleViewList = async (listId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setLoadingListDetail(true);
    const list = await getListById(listId);
    setSelectedList(list);
    setLoadingListDetail(false);
    setShowViewModal(true);
  };

  const handleDeleteList = async (listId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("¿Estás seguro de que quieres eliminar esta lista?")) {
      await deleteList(listId);
    }
  };

  const handleRemoveRacket = async (racketId: number) => {
    if (selectedList) {
      await removeRacketFromList(selectedList.id, racketId);
      // Recargar la lista para actualizar
      const updatedList = await getListById(selectedList.id);
      setSelectedList(updatedList);
    }
  };

  const handleCreateList = async (name: string, description?: string) => {
    await createList({ name, description });
  };

  return (
    <>
      <Section>
        <SectionHeader>
          <SectionTitle>
            <FiList />
            Mis Listas
          </SectionTitle>
          <CreateButton onClick={() => setShowCreateModal(true)}>
            <FiPlus size={20} />
            Nueva Lista
          </CreateButton>
        </SectionHeader>

        {loading ? (
          <LoadingState>
            <Spinner />
            <p>Cargando tus listas...</p>
          </LoadingState>
        ) : (
          <ListsGrid>
            {lists.map((list) => (
              <ListCard
                key={list.id}
                onClick={(e) => handleViewList(list.id, e)}
              >
                <ListHeader>
                  <ListIcon>
                    <FiList />
                  </ListIcon>
                  <ListActions>
                    <ActionButton
                      onClick={(e) => handleViewList(list.id, e)}
                      title="Ver lista"
                    >
                      <FiEye size={16} />
                    </ActionButton>
                    <ActionButton
                      variant="danger"
                      onClick={(e) => handleDeleteList(list.id, e)}
                      title="Eliminar lista"
                    >
                      <FiTrash2 size={16} />
                    </ActionButton>
                  </ListActions>
                </ListHeader>
                <ListContent>
                  <ListName>{list.name}</ListName>
                  <ListDescription>
                    {list.description || "Sin descripción"}
                  </ListDescription>
                </ListContent>
                <ListMeta>
                  <RacketCount>
                    <FiPackage />
                    {list.racket_count || 0}{" "}
                    {list.racket_count === 1 ? "pala" : "palas"}
                  </RacketCount>
                </ListMeta>
              </ListCard>
            ))}
          </ListsGrid>
        )}
      </Section>

      <CreateListModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreateList={handleCreateList}
      />

      <ViewListModal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedList(null);
        }}
        list={selectedList}
        onRemoveRacket={handleRemoveRacket}
        loading={loadingListDetail}
      />
    </>
  );
};
