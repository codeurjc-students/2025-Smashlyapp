import React, { useState } from "react";
import styled from "styled-components";
import { FiX, FiTrash2, FiExternalLink } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { ListWithRackets } from "../../types/list";
import { useNavigate } from "react-router-dom";

interface ViewListModalProps {
  isOpen: boolean;
  onClose: () => void;
  list: ListWithRackets | null;
  onRemoveRacket: (racketId: number) => Promise<void>;
  loading?: boolean;
}

const Overlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
`;

const Modal = styled(motion.div)`
  background: white;
  border-radius: 16px;
  padding: 2rem;
  max-width: 800px;
  width: 100%;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #f3f4f6;
`;

const HeaderContent = styled.div`
  flex: 1;
`;

const Title = styled.h2`
  font-size: 1.75rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
`;

const Description = styled.p`
  font-size: 0.95rem;
  color: #6b7280;
  margin: 0;
`;

const RacketCount = styled.div`
  font-size: 0.875rem;
  color: #16a34a;
  font-weight: 600;
  margin-top: 0.5rem;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: #6b7280;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  border-radius: 8px;

  &:hover {
    background: #f3f4f6;
    color: #1f2937;
  }
`;

const Content = styled.div`
  flex: 1;
  overflow-y: auto;
  margin: 0 -2rem;
  padding: 0 2rem;

  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: #f3f4f6;
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: #d1d5db;
    border-radius: 4px;

    &:hover {
      background: #9ca3af;
    }
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem 1rem;
  color: #6b7280;
`;

const EmptyIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
`;

const EmptyText = styled.p`
  font-size: 1rem;
  margin: 0;
`;

const RacketsList = styled.div`
  display: grid;
  gap: 1rem;
`;

const RacketCard = styled.div`
  background: #f9fafb;
  border: 2px solid #f3f4f6;
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  gap: 1rem;
  transition: all 0.2s ease;

  &:hover {
    border-color: #16a34a;
    box-shadow: 0 4px 12px rgba(22, 163, 74, 0.1);
  }
`;

const RacketImage = styled.img`
  width: 80px;
  height: 80px;
  object-fit: contain;
  border-radius: 8px;
  background: white;
`;

const RacketInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

const RacketBrand = styled.div`
  font-size: 0.75rem;
  font-weight: 600;
  color: #16a34a;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const RacketName = styled.div`
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0.25rem 0;
`;

const RacketPrice = styled.div`
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
`;

const RacketActions = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
`;

const ActionButton = styled.button<{ variant?: "danger" | "primary" }>`
  padding: 0.5rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;

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
    background: #dbeafe;
    color: #2563eb;
    &:hover {
      background: #bfdbfe;
    }
  `}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const LoadingState = styled.div`
  text-align: center;
  padding: 3rem 1rem;
  color: #6b7280;
`;

export const ViewListModal: React.FC<ViewListModalProps> = ({
  isOpen,
  onClose,
  list,
  onRemoveRacket,
  loading = false,
}) => {
  const navigate = useNavigate();
  const [removingRacketId, setRemovingRacketId] = useState<number | null>(null);

  const handleRemoveRacket = async (racketId: number) => {
    if (removingRacketId) return;

    setRemovingRacketId(racketId);
    try {
      await onRemoveRacket(racketId);
    } catch (error) {
      // Error handled by parent
    } finally {
      setRemovingRacketId(null);
    }
  };

  const handleViewRacket = (racketName: string) => {
    navigate(`/racket-detail?id=${encodeURIComponent(racketName)}`);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && list && (
        <Overlay
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <Modal
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <Header>
              <HeaderContent>
                <Title>{list.name}</Title>
                {list.description && (
                  <Description>{list.description}</Description>
                )}
                <RacketCount>
                  {list.rackets?.length || 0}{" "}
                  {list.rackets?.length === 1 ? "pala" : "palas"}
                </RacketCount>
              </HeaderContent>
              <CloseButton onClick={onClose}>
                <FiX size={24} />
              </CloseButton>
            </Header>

            <Content>
              {loading ? (
                <LoadingState>Cargando palas...</LoadingState>
              ) : !list.rackets || list.rackets.length === 0 ? (
                <EmptyState>
                  <EmptyIcon>🎾</EmptyIcon>
                  <EmptyText>
                    Esta lista está vacía. Añade palas desde el catálogo.
                  </EmptyText>
                </EmptyState>
              ) : (
                <RacketsList>
                  {list.rackets.map((racket: any) => {
                    // Debug log
                    console.log('🎾 Racket data:', racket);
                    
                    return (
                      <RacketCard key={racket.id}>
                        <RacketImage
                          src={racket.imagen || "/placeholder-racket.png"}
                          alt={racket.modelo || racket.nombre}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "/placeholder-racket.png";
                          }}
                        />
                        <RacketInfo>
                          <RacketBrand>{racket.marca || 'Marca desconocida'}</RacketBrand>
                          <RacketName>{racket.modelo || racket.nombre}</RacketName>
                          <RacketPrice>
                            {racket.precio_actual 
                              ? `${racket.precio_actual}€` 
                              : (racket.padelnuestro_precio_actual 
                                ? `${racket.padelnuestro_precio_actual}€` 
                                : 'Precio no disponible')}
                          </RacketPrice>
                        </RacketInfo>
                        <RacketActions>
                          <ActionButton
                            variant="primary"
                            onClick={() => handleViewRacket(racket.nombre)}
                            title="Ver detalles"
                          >
                            <FiExternalLink size={18} />
                          </ActionButton>
                          <ActionButton
                            variant="danger"
                            onClick={() =>
                              racket.id && handleRemoveRacket(racket.id)
                            }
                            disabled={removingRacketId === racket.id}
                            title="Eliminar de la lista"
                          >
                            <FiTrash2 size={18} />
                          </ActionButton>
                        </RacketActions>
                      </RacketCard>
                    );
                  })}
                </RacketsList>
              )}
            </Content>
          </Modal>
        </Overlay>
      )}
    </AnimatePresence>
  );
};
