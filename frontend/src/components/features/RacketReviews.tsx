/**
 * RacketReviews Component
 * Componente principal para mostrar y gestionar reviews de una pala
 */

import { useState, useEffect } from "react";
import styled from "styled-components";
import { reviewService } from "../../services/reviewService";
import type { ReviewsResponse, ReviewWithUser } from "../../types/review";
import { ReviewItem } from "./ReviewItem";
import { ReviewForm } from "./ReviewForm";
import { ReviewFilters } from "./ReviewFilters";
import { useAuth } from "../../contexts/AuthContext";

interface RacketReviewsProps {
  racketId: number;
}

export const RacketReviews: React.FC<RacketReviewsProps> = ({ racketId }) => {
  const { user } = useAuth();
  const [reviewsData, setReviewsData] = useState<ReviewsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Filtros
  const [rating, setRating] = useState<number | undefined>();
  const [sort, setSort] = useState<
    "recent" | "rating_high" | "rating_low" | "most_liked"
  >("recent");
  const [page, setPage] = useState(1);

  const loadReviews = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await reviewService.getReviewsByRacket(racketId, {
        rating,
        sort,
        page,
        limit: 5,
      });
      setReviewsData(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al cargar las reviews"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [racketId, rating, sort, page]);

  const handleReviewCreated = () => {
    setShowForm(false);
    setPage(1); // Volver a la primera página
    loadReviews();
  };

  const handleReviewDeleted = () => {
    loadReviews();
  };

  const handleReviewUpdated = () => {
    loadReviews();
  };

  // Verificar si el usuario ya dejó una review
  const userHasReview = reviewsData?.reviews.some(
    (review) => review.user_id === user?.id
  );

  return (
    <Container>
      <Header>
        <Title>
          Opiniones de usuarios
          {reviewsData && <Count>({reviewsData.stats.totalReviews})</Count>}
        </Title>

        {user && !userHasReview && (
          <AddButton onClick={() => setShowForm(!showForm)}>
            {showForm ? "Cancelar" : "✍️ Escribir opinión"}
          </AddButton>
        )}
      </Header>

      {/* Formulario para crear review */}
      {showForm && user && (
        <ReviewForm
          racketId={racketId}
          onSuccess={handleReviewCreated}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Estadísticas */}
      {reviewsData && reviewsData.stats.totalReviews > 0 && (
        <Stats>
          <AverageRating>
            <RatingValue>
              {reviewsData.stats.averageRating.toFixed(1)}
            </RatingValue>
            <Stars>
              {"⭐".repeat(Math.round(reviewsData.stats.averageRating))}
            </Stars>
            <RatingText>Valoración media</RatingText>
          </AverageRating>

          <Distribution>
            {[5, 4, 3, 2, 1].map((star) => (
              <DistributionRow key={star}>
                <StarLabel>{star} ⭐</StarLabel>
                <BarContainer>
                  <Bar
                    width={
                      reviewsData.stats.totalReviews > 0
                        ? (reviewsData.stats.ratingDistribution[
                            star as keyof typeof reviewsData.stats.ratingDistribution
                          ] /
                            reviewsData.stats.totalReviews) *
                          100
                        : 0
                    }
                  />
                </BarContainer>
                <Count>
                  (
                  {
                    reviewsData.stats.ratingDistribution[
                      star as keyof typeof reviewsData.stats.ratingDistribution
                    ]
                  }
                  )
                </Count>
              </DistributionRow>
            ))}
          </Distribution>
        </Stats>
      )}

      {/* Filtros */}
      <ReviewFilters
        rating={rating}
        sort={sort}
        onRatingChange={setRating}
        onSortChange={setSort}
      />

      {/* Lista de reviews */}
      {loading && <LoadingMessage>Cargando opiniones...</LoadingMessage>}
      {error && <ErrorMessage>{error}</ErrorMessage>}

      {!loading && reviewsData && reviewsData.reviews.length === 0 && (
        <EmptyMessage>
          {rating
            ? `No hay opiniones con ${rating} estrellas`
            : "Sé el primero en dejar tu opinión sobre esta pala"}
        </EmptyMessage>
      )}

      {!loading && reviewsData && reviewsData.reviews.length > 0 && (
        <>
          <ReviewsList>
            {reviewsData.reviews.map((review) => (
              <ReviewItem
                key={review.id}
                review={review}
                onDelete={handleReviewDeleted}
                onUpdate={handleReviewUpdated}
              />
            ))}
          </ReviewsList>

          {/* Paginación */}
          {reviewsData.pagination.totalPages > 1 && (
            <Pagination>
              <PaginationButton
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
              >
                ← Anterior
              </PaginationButton>

              <PageInfo>
                Página {page} de {reviewsData.pagination.totalPages}
              </PageInfo>

              <PaginationButton
                onClick={() => setPage(page + 1)}
                disabled={page === reviewsData.pagination.totalPages}
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
  margin-top: 3rem;
  padding: 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  gap: 1rem;
  flex-wrap: wrap;
`;

const Title = styled.h2`
  font-size: 1.75rem;
  font-weight: 700;
  color: #1a1a1a;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Count = styled.span`
  font-size: 1.25rem;
  color: #666;
  font-weight: 400;
`;

const AddButton = styled.button`
  padding: 0.75rem 1.5rem;
  background: #4caf50;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #45a049;
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(0);
  }
`;

const Stats = styled.div`
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 2rem;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 2rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const AverageRating = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
`;

const RatingValue = styled.div`
  font-size: 3rem;
  font-weight: 700;
  color: #1a1a1a;
`;

const Stars = styled.div`
  font-size: 1.5rem;
`;

const RatingText = styled.div`
  font-size: 0.875rem;
  color: #666;
`;

const Distribution = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const DistributionRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const StarLabel = styled.div`
  min-width: 60px;
  font-size: 0.875rem;
  color: #666;
`;

const BarContainer = styled.div`
  flex: 1;
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
`;

const Bar = styled.div<{ width: number }>`
  height: 100%;
  background: #ffb300;
  width: ${(props) => props.width}%;
  transition: width 0.3s ease;
`;

const ReviewsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 2rem;
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
  padding: 3rem 2rem;
  color: #666;
  font-size: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
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
