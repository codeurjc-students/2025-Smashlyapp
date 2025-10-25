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

  console.log("🔍 UserReviews component mounted with userId:", userId);

  const loadReviews = async () => {
    try {
      console.log("📥 Loading reviews for user:", userId);
      setLoading(true);
      setError(null);
      const data = await reviewService.getReviewsByUser(userId, {
        page,
        limit: 5,
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
    loadReviews();
  };

  const handleReviewUpdated = () => {
    loadReviews();
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
          <ReviewsList>
            {reviews.map((review) => (
              <ReviewItem
                key={review.id}
                review={review}
                onDelete={handleReviewDeleted}
                onUpdate={handleReviewUpdated}
              />
            ))}
          </ReviewsList>

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

const ReviewsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
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
