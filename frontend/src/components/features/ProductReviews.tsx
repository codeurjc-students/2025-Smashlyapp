import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { reviewService } from '../../services/reviewService';
import type { ReviewsResponse } from '../../types/review';
import { ReviewItem } from './ReviewItem';
import { ReviewForm } from './ReviewForm';
import { useAuth } from '../../contexts/AuthContext';

interface ProductReviewsProps {
  racketId: number;
}

export const ProductReviews: React.FC<ProductReviewsProps> = ({ racketId }) => {
  const { user } = useAuth();
  const [reviewsData, setReviewsData] = useState<ReviewsResponse | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [page, setPage] = useState(1);

  const loadReviews = async () => {
    try {
      const data = await reviewService.getReviewsByRacket(racketId, {
        page,
        limit: 5,
      });
      console.log('🔍 ProductReviews API Response:', data);
      console.log('🔍 Number of reviews:', data?.reviews?.length);
      console.log('🔍 Stats:', data?.stats);
      setReviewsData(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [racketId, page]);

  const handleReviewCreated = () => {
    setShowForm(false);
    setPage(1);
    loadReviews();
  };

  const handleReviewDeleted = () => {
    loadReviews();
  };

  const handleReviewUpdated = () => {
    loadReviews();
  };

  /* -------------------------------------------------------------------------- */
  /*                               Logic & Render                               */
  /* -------------------------------------------------------------------------- */

  // Check if user already has a review
  const userHasReview = reviewsData?.reviews.some(review => review.user_id === user?.id);

  // Calculate stats if not provided by backend
  const hasReviews = reviewsData?.reviews && reviewsData.reviews.length > 0;
  const totalReviews = reviewsData?.stats?.totalReviews || reviewsData?.reviews?.length || 0;
  const averageRating =
    reviewsData?.stats?.averageRating ||
    (hasReviews
      ? reviewsData.reviews.reduce((acc, r) => acc + r.rating, 0) / reviewsData.reviews.length
      : 0);

  // Calculate distribution if not provided
  const ratingDistribution =
    reviewsData?.stats?.ratingDistribution ||
    (hasReviews
      ? {
          5: reviewsData.reviews.filter(r => r.rating === 5).length,
          4: reviewsData.reviews.filter(r => r.rating === 4).length,
          3: reviewsData.reviews.filter(r => r.rating === 3).length,
          2: reviewsData.reviews.filter(r => r.rating === 2).length,
          1: reviewsData.reviews.filter(r => r.rating === 1).length,
        }
      : { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });

  return (
    <SectionContainer>
      <SectionTitle>Reviews & Valoraciones</SectionTitle>

      {hasReviews && totalReviews > 0 ? (
        <ContentGrid>
          {/* Left Column: Summary Card */}
          <SummaryCard>
            <RatingHeader>
              <BigRating>{averageRating.toFixed(1)}</BigRating>
              <RatingMeta>
                <StarsContainer>
                  {[...Array(5)].map((_, i) => (
                    <StarIcon key={i} filled={i < Math.round(averageRating)}>
                      ★
                    </StarIcon>
                  ))}
                </StarsContainer>
                <TotalReviews>
                  Basado en {totalReviews} review{totalReviews !== 1 ? 's' : ''}
                </TotalReviews>
              </RatingMeta>
            </RatingHeader>

            <DistributionContainer>
              {[5, 4, 3, 2, 1].map(star => {
                const count = ratingDistribution[star as keyof typeof ratingDistribution] || 0;
                const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;

                return (
                  <DistRow key={star}>
                    <StarNum>{star}</StarNum>
                    <BarTrack>
                      <BarFill width={percentage} />
                    </BarTrack>
                    <Percent>{Math.round(percentage)}%</Percent>
                  </DistRow>
                );
              })}
            </DistributionContainer>

            <WriteActionArea>
              {user && !userHasReview && (
                <WriteReviewButton onClick={() => setShowForm(!showForm)}>
                  {showForm ? 'Cancel' : 'Write a Review'}
                </WriteReviewButton>
              )}
              {!user && <LoginPrompt to='/login'>Log in to write a review</LoginPrompt>}
            </WriteActionArea>
          </SummaryCard>

          {/* Right Column: Reviews List */}
          <ReviewsColumn>
            {showForm && user && (
              <FormContainer>
                <ReviewForm
                  racketId={racketId}
                  onSuccess={handleReviewCreated}
                  onCancel={() => setShowForm(false)}
                />
              </FormContainer>
            )}

            {reviewsData.reviews.map(review => (
              <ReviewItem
                key={review.id}
                review={review}
                onDelete={handleReviewDeleted}
                onUpdate={handleReviewUpdated}
                showProductInfo={false}
              />
            ))}
          </ReviewsColumn>
        </ContentGrid>
      ) : (
        <>
          <EmptyStateBanner>
            <EmptyStateIcon>⭐</EmptyStateIcon>
            <div style={{ flex: 1, textAlign: 'left' }}>
              <EmptyStateTitle>¡Sé el primero en valorar!</EmptyStateTitle>
              <EmptyStateText>
                Comparte tu experiencia con esta pala y ayuda a otros jugadores a tomar la mejor
                decisión.
              </EmptyStateText>
            </div>
            <div style={{ flexShrink: 0, minWidth: '200px' }}>
              {user && !userHasReview && (
                <WriteReviewButton onClick={() => setShowForm(!showForm)}>
                  {showForm ? 'Cancelar' : 'Escribir Valoración'}
                </WriteReviewButton>
              )}
              {!user && (
                <LoginPrompt to='/login'>Inicia sesión para escribir una valoración</LoginPrompt>
              )}
            </div>
          </EmptyStateBanner>

          {showForm && user && (
            <FormContainer style={{ marginTop: '1.5rem' }}>
              <ReviewForm
                racketId={racketId}
                onSuccess={handleReviewCreated}
                onCancel={() => setShowForm(false)}
              />
            </FormContainer>
          )}
        </>
      )}
    </SectionContainer>
  );
};

// --- Styled Components ---

const SectionContainer = styled.div`
  margin-top: 3rem;
  font-family:
    'Inter',
    system-ui,
    -apple-system,
    sans-serif;
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-gray-900);
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;

  &::before {
    content: '';
    width: 4px;
    height: 24px;
    background: var(--color-primary);
    border-radius: 2px;
  }
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 3rem;
  align-items: start;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
`;

// -- Summary Card --

const SummaryCard = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 20px;
  box-shadow:
    0 0 0 1px rgba(0, 0, 0, 0.06),
    0 4px 12px rgba(0, 0, 0, 0.05);
  position: sticky;
  top: 2rem;
`;

const RatingHeader = styled.div`
  text-align: center;
  margin-bottom: 2rem;
`;

const BigRating = styled.div`
  font-size: 4rem;
  font-weight: 800;
  color: #111827;
  line-height: 1;
  margin-bottom: 0.5rem;
  letter-spacing: -0.05em;
`;

const RatingMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  align-items: center;
`;

const StarsContainer = styled.div`
  display: flex;
  gap: 4px;
  font-size: 1.5rem;
  color: #ffc107;
`;

const StarIcon = styled.span<{ filled: boolean }>`
  color: ${p => (p.filled ? '#FFC107' : '#E5E7EB')};
`;

const TotalReviews = styled.div`
  color: #6b7280;
  font-size: 0.95rem;
  margin-top: 0.5rem;
`;

const DistributionContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 2rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid #f3f4f6;
`;

const DistRow = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 0.9rem;
  color: #374151;
`;

const StarNum = styled.span`
  font-weight: 600;
  min-width: 12px;
`;

const BarTrack = styled.div`
  flex: 1;
  height: 10px;
  background: #f3f4f6;
  border-radius: 99px;
  overflow: hidden;
`;

const BarFill = styled.div<{ width: number }>`
  height: 100%;
  background: #ffc107;
  width: ${p => p.width}%;
  border-radius: 99px;
  transition: width 0.5s ease-out;
`;

const Percent = styled.span`
  color: #9ca3af;
  min-width: 35px;
  text-align: right;
  font-variant-numeric: tabular-nums;
`;

const WriteActionArea = styled.div`
  margin-top: auto;
`;

const WriteReviewButton = styled.button`
  width: 100%;
  padding: 1rem;
  background: #ecfdf5;
  color: #059669;
  font-weight: 700;
  font-size: 1rem;
  border: 1px solid transparent;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #d1fae5;
    transform: translateY(-1px);
    box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.1);
  }

  &:active {
    transform: translateY(0);
  }
`;

const LoginPrompt = styled(Link)`
  display: block;
  width: 100%;
  padding: 1rem;
  text-align: center;
  background: #f3f4f6;
  color: #4b5563;
  font-weight: 600;
  border-radius: 12px;
  text-decoration: none;
  transition: background 0.2s;

  &:hover {
    background: #e5e7eb;
  }
`;

// -- Reviews List --

const ReviewsColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const FormContainer = styled.div`
  background: white;
  padding: 1.5rem;
  border-radius: 16px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
`;

const EmptyStateBanner = styled.div`
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  border: 2px solid #bbf7d0;
  border-radius: 16px;
  padding: 2rem 2.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  margin: 2rem 0;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.08);

  @media (max-width: 768px) {
    flex-direction: column;
    text-align: center;
    padding: 2rem 1.5rem;
  }
`;

const EmptyStateIcon = styled.div`
  font-size: 2.5rem;
  line-height: 1;
  filter: drop-shadow(0 2px 4px rgba(16, 185, 129, 0.2));
  flex-shrink: 0;
`;

const EmptyStateTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 700;
  color: #065f46;
  margin: 0 0 0.25rem 0;
`;

const EmptyStateText = styled.p`
  font-size: 0.95rem;
  color: #047857;
  line-height: 1.5;
  margin: 0;
`;
