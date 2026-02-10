/**
 * UserReviews Component
 * Componente para mostrar las reviews de un usuario en su perfil
 */

import { useState, useEffect } from "react";
import styled from "styled-components";
import { reviewService } from "../../services/reviewService";
import type { ReviewWithUser } from "../../types/review";
import { ReviewItem } from "./ReviewItem";

interface UserReviewsProps {
  userId: string;
}

// Tipo extendido que incluye la información de la pala
interface ReviewWithUserAndRacket extends ReviewWithUser {
  racket?: {
    id: number;
    nombre: string;
    marca?: string;
    modelo?: string;
    imagen?: string;
  };
}

export const UserReviews: React.FC<UserReviewsProps> = ({ userId }) => {
  const [reviews, setReviews] = useState<ReviewWithUserAndRacket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedReview, setSelectedReview] =
    useState<ReviewWithUserAndRacket | null>(null);

  console.log("🔍 UserReviews component mounted with userId:", userId);

  const loadReviews = async () => {
    try {
      console.log("📥 Loading reviews for user:", userId);
      setLoading(true);
      setError(null);
      const data = await reviewService.getReviewsByUser(userId, {
        page,
        limit: 12, // Cambiado a 12 para mejor distribución en galería
      });
      console.log("✅ Reviews loaded:", data);
      // El backend devuelve la información de la pala, hacemos cast al tipo correcto
      setReviews(data.reviews as ReviewWithUserAndRacket[]);
      setTotalPages(data.pagination.totalPages);
      setTotal(data.pagination.total);
    } catch (err) {
      console.error("❌ Error loading reviews:", err);
      setError(
        err instanceof Error ? err.message : "Error al cargar las reviews"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [userId, page]);

  const handleReviewDeleted = () => {
    setSelectedReview(null);
    loadReviews();
  };

  const handleReviewUpdated = () => {
    setSelectedReview(null);
    loadReviews();
  };

  const handleCloseModal = () => {
    setSelectedReview(null);
  };

  return (
    <Container>
      <Header>
        <Title>
          Mis Opiniones
          {total > 0 && <Count>({total})</Count>}
        </Title>
      </Header>

      {loading && <LoadingMessage>Cargando tus opiniones...</LoadingMessage>}
      {error && <ErrorMessage>{error}</ErrorMessage>}

      {!loading && reviews.length === 0 && (
        <EmptyMessage>
          <EmptyIcon>📝</EmptyIcon>
          <EmptyTitle>Aún no has escrito ninguna opinión</EmptyTitle>
          <EmptyText>
            Visita la página de una pala y comparte tu experiencia con la
            comunidad
          </EmptyText>
        </EmptyMessage>
      )}

      {!loading && reviews.length > 0 && (
        <>
          {/* Vista de galería compacta */}
          <GalleryGrid>
            {reviews.map((review) => (
              <ReviewCard
                key={review.id}
                onClick={() => setSelectedReview(review)}
              >
                {/* Imagen de la pala */}
                <RacketImageContainer>
                  {review.racket?.imagen ? (
                    <RacketImage
                      src={review.racket.imagenes?.[0]}
                      alt={review.racket.nombre}
                    />
                  ) : (
                    <PlaceholderImage>🎾</PlaceholderImage>
                  )}
                </RacketImageContainer>

                {/* Información compacta */}
                <CardContent>
                  <RacketName>
                    {review.racket?.marca}{" "}
                    {review.racket?.modelo || review.racket?.nombre}
                  </RacketName>

                  <Rating>
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} filled={i < review.rating}>
                        ⭐
                      </Star>
                    ))}
                  </Rating>

                  <ReviewTitle>{review.title}</ReviewTitle>

                  <ReviewDate>
                    {new Date(review.created_at).toLocaleDateString("es-ES", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </ReviewDate>
                </CardContent>
              </ReviewCard>
            ))}
          </GalleryGrid>

          {/* Paginación */}
          {totalPages > 1 && (
            <Pagination>
              <PaginationButton
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
              >
                ← Anterior
              </PaginationButton>

              <PageInfo>
                Página {page} de {totalPages}
              </PageInfo>

              <PaginationButton
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
              >
                Siguiente →
              </PaginationButton>
            </Pagination>
          )}
        </>
      )}

      {/* Modal con detalles completos */}
      {selectedReview && (
        <ModalOverlay onClick={handleCloseModal}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <CloseButton onClick={handleCloseModal}>✕</CloseButton>
            <ReviewItem
              review={selectedReview}
              onDelete={handleReviewDeleted}
              onUpdate={handleReviewUpdated}
            />
          </ModalContent>
        </ModalOverlay>
      )}
    </Container>
  );
};

// Styled Components
const Container = styled.div`
  margin-top: 2rem;
  padding: 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const Header = styled.div`
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #f0f0f0;
`;

const Title = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  color: #1a1a1a;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Count = styled.span`
  font-size: 1.125rem;
  color: #666;
  font-weight: 400;
`;

// Vista de galería
const GalleryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;

  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 1rem;
  }
`;

const ReviewCard = styled.div`
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
    border-color: #667eea;
  }
`;

const RacketImageContainer = styled.div`
  width: 100%;
  height: 180px;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
`;

const RacketImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: 1rem;
`;

const PlaceholderImage = styled.div`
  font-size: 4rem;
  opacity: 0.3;
`;

const CardContent = styled.div`
  padding: 1rem;
`;

const RacketName = styled.div`
  font-size: 0.875rem;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
  margin-bottom: 0.5rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Rating = styled.div`
  display: flex;
  gap: 0.125rem;
  margin-bottom: 0.5rem;
  font-size: 1rem;
`;

const Star = styled.span<{ filled: boolean }>`
  opacity: ${(props) => (props.filled ? 1 : 0.3)};
`;

const ReviewTitle = styled.h3`
  font-size: 1rem;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 0.5rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  min-height: 2.4em;
`;

const ReviewDate = styled.div`
  font-size: 0.75rem;
  color: #999;
`;

// Modal
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
  overflow-y: auto;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 12px;
  max-width: 800px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  margin: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
`;

const CloseButton = styled.button`
  position: sticky;
  top: 1rem;
  right: 1rem;
  float: right;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: white;
  border: 2px solid #e0e0e0;
  color: #666;
  font-size: 1.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  z-index: 10;
  margin: 1rem 1rem 0 0;

  &:hover {
    background: #f5f5f5;
    border-color: #d32f2f;
    color: #d32f2f;
    transform: rotate(90deg);
  }
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 3rem 2rem;
  color: #666;
  font-size: 1rem;
`;

const ErrorMessage = styled.div`
  text-align: center;
  padding: 2rem;
  color: #d32f2f;
  background: #ffebee;
  border-radius: 8px;
  font-size: 1rem;
`;

const EmptyMessage = styled.div`
  text-align: center;
  padding: 4rem 2rem;
`;

const EmptyIcon = styled.div`
  font-size: 4rem;
  margin-bottom: 1rem;
`;

const EmptyTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.5rem;
`;

const EmptyText = styled.p`
  font-size: 1rem;
  color: #666;
  max-width: 400px;
  margin: 0 auto;
`;

const Pagination = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #e0e0e0;
`;

const PaginationButton = styled.button`
  padding: 0.5rem 1rem;
  background: white;
  border: 1px solid #ddd;
  border-radius: 6px;
  color: #333;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: #f5f5f5;
    border-color: #bbb;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const PageInfo = styled.div`
  font-size: 0.875rem;
  color: #666;
`;
