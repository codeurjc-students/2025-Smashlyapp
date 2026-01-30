import { useState, useEffect } from "react";
import styled from "styled-components";
import { Link } from "react-router-dom";
import { reviewService } from "../../services/reviewService";
import type { ReviewsResponse } from "../../types/review";
import { ReviewItem } from "./ReviewItem";
import { ReviewForm } from "./ReviewForm";
import { useAuth } from "../../contexts/AuthContext";

interface ProductReviewsProps {
  racketId: number;
}

export const ProductReviews: React.FC<ProductReviewsProps> = ({ racketId }) => {
  const { user } = useAuth();
  const [reviewsData, setReviewsData] = useState<ReviewsResponse | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [page, setPage] = useState(1);

  const loadReviews = async () => {
    if (!user) return;

    try {
      const data = await reviewService.getReviewsByRacket(racketId, {
        page,
        limit: 5,
      });
      setReviewsData(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [racketId, page, user]);

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
  const userHasReview = reviewsData?.reviews.some(
    (review) => review.user_id === user?.id
  );

  // Calculate stats if not provided by backend
  const hasReviews = reviewsData?.reviews && reviewsData.reviews.length > 0;
  const totalReviews = reviewsData?.stats?.totalReviews || reviewsData?.reviews?.length || 0;
  const averageRating = reviewsData?.stats?.averageRating || 
    (hasReviews ? reviewsData.reviews.reduce((acc, r) => acc + r.rating, 0) / reviewsData.reviews.length : 0);
  
  // Calculate distribution if not provided
  const ratingDistribution = reviewsData?.stats?.ratingDistribution || 
    (hasReviews ? {
      5: reviewsData.reviews.filter(r => r.rating === 5).length,
      4: reviewsData.reviews.filter(r => r.rating === 4).length,
      3: reviewsData.reviews.filter(r => r.rating === 3).length,
      2: reviewsData.reviews.filter(r => r.rating === 2).length,
      1: reviewsData.reviews.filter(r => r.rating === 1).length,
    } : { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });

  return (
    <SectionContainer>
      <SectionTitle>Reviews & Valoraciones </SectionTitle>

      <ContentGrid>
        {/* Left Column: Summary Card */}
        <SummaryCard>
          {hasReviews && totalReviews > 0 ? (
            <>
              <RatingHeader>
                <BigRating>{averageRating.toFixed(1)}</BigRating>
                <RatingMeta>
                  <StarsContainer>
                    {[...Array(5)].map((_, i) => (
                      <StarIcon
                        key={i}
                        filled={i < Math.round(averageRating)}
                      >
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
                {[5, 4, 3, 2, 1].map((star) => {
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
                )})}
              </DistributionContainer>
            </>
          ) : (
            <EmptySummary>No reviews yet.</EmptySummary>
          )}

          <WriteActionArea>
            {user && !userHasReview && (
              <WriteReviewButton onClick={() => setShowForm(!showForm)}>
                {showForm ? "Cancel" : "Write a Review"}
              </WriteReviewButton>
            )}
            {!user && (
              <LoginPrompt to="/login">
                Log in to write a review
              </LoginPrompt>
            )}
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

          {hasReviews ? (
            reviewsData.reviews.map((review) => (
              <ReviewItem
                key={review.id}
                review={review}
                onDelete={handleReviewDeleted}
                onUpdate={handleReviewUpdated}
                showProductInfo={false} 
              />
            ))
          ) : (
            !showForm && (
              <NoReviewsMessage>
                Be the first to review this product!
              </NoReviewsMessage>
            )
          )}
        </ReviewsColumn>
      </ContentGrid>
    </SectionContainer>
  );
};

// --- Styled Components ---

const SectionContainer = styled.div`
  margin-top: 3rem;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
`;

const SectionTitle = styled.h2`
  font-size: 1.75rem;
  font-weight: 800;
  color: #111827;
  margin-bottom: 2rem;
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
  box-shadow: 0 0 0 1px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.05);
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
  color: #FFC107;
`;

const StarIcon = styled.span<{ filled: boolean }>`
  color: ${p => p.filled ? '#FFC107' : '#E5E7EB'};
`;

const TotalReviews = styled.div`
  color: #6B7280;
  font-size: 0.95rem;
  margin-top: 0.5rem;
`;

const DistributionContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 2rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid #F3F4F6;
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
  background: #F3F4F6;
  border-radius: 99px;
  overflow: hidden;
`;

const BarFill = styled.div<{ width: number }>`
  height: 100%;
  background: #FFC107;
  width: ${(p) => p.width}%;
  border-radius: 99px;
  transition: width 0.5s ease-out;
`;

const Percent = styled.span`
  color: #9CA3AF;
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
  background: #ECFDF5;
  color: #059669;
  font-weight: 700;
  font-size: 1rem;
  border: 1px solid transparent;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: #D1FAE5;
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
  background: #F3F4F6;
  color: #4B5563;
  font-weight: 600;
  border-radius: 12px;
  text-decoration: none;
  transition: background 0.2s;

  &:hover {
    background: #E5E7EB;
  }
`;

const EmptySummary = styled.div`
  text-align: center;
  color: #9CA3AF;
  margin: 2rem 0;
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
  border: 1px solid #E5E7EB;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
`;

const NoReviewsMessage = styled.div`
  padding: 3rem;
  text-align: center;
  background: white;
  border-radius: 16px;
  border: 1px dashed #E5E7EB;
  color: #6B7280;
  font-size: 1.1rem;
`;
