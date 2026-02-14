import React from 'react';
import styled from 'styled-components';
import { FiStar } from 'react-icons/fi';

interface StarRatingProps {
  rating: number;
  maxStars?: number;
  size?: number;
  showValue?: boolean;
}

const RatingContainer = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
`;

const StarsWrapper = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 2px;
`;

const StarContainer = styled.div`
  position: relative;
  display: inline-flex;
  line-height: 0;
`;

const StarBackground = styled(FiStar)<{ $size: number }>`
  color: #e5e7eb;
  stroke-width: 1.5px;
`;

const StarForeground = styled(FiStar)<{ $size: number; $fillPercentage: number }>`
  position: absolute;
  top: 0;
  left: 0;
  color: #fdb022;
  stroke-width: 1.5px;
  clip-path: ${props => `inset(0 ${100 - props.$fillPercentage}% 0 0)`};
`;

const RatingValue = styled.span`
  font-size: 0.9375rem;
  font-weight: 600;
  color: #1f2937;
  line-height: 1;
`;

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  maxStars = 5,
  size = 20,
  showValue = false,
}) => {
  const clampedRating = Math.max(0, Math.min(maxStars, rating));

  const stars = Array.from({ length: maxStars }, (_, index) => {
    const fillPercentage = Math.max(0, Math.min(100, (clampedRating - index) * 100));

    return (
      <StarContainer key={index}>
        <StarBackground $size={size} size={size} />
        <StarForeground $size={size} size={size} $fillPercentage={fillPercentage} fill='#FDB022' />
      </StarContainer>
    );
  });

  return (
    <RatingContainer>
      <StarsWrapper>{stars}</StarsWrapper>
      {showValue && <RatingValue>{clampedRating.toFixed(1)}</RatingValue>}
    </RatingContainer>
  );
};
