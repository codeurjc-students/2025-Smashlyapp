import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';

const shimmer = (reduced: boolean) => `
  @keyframes shimmer {
    0% { background-position: -1000px 0; }
    100% { background-position: 1000px 0; }
  }
  ${reduced ? '@keyframes shimmer { 0% { opacity: 0.5; } 50% { opacity: 0.7; } 100% { opacity: 0.5; } }' : ''}
`;

const getShimmerAnimation = (reduced: boolean) => {
  if (reduced) {
    return 'shimmer 3s ease-in-out infinite';
  }
  return 'shimmer 2s infinite';
};

const SkeletonContainer = styled.div`
  width: 100%;
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
`;

const SkeletonHeader = styled.div`
  margin-bottom: 2rem;
`;

const SkeletonTitle = styled.div<{ $reduced: boolean }>`
  height: 2.5rem;
  width: 300px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 1000px 100%;
  ${shimmer(false)}
  animation: ${props => getShimmerAnimation(props.$reduced)};
  border-radius: 8px;
  margin-bottom: 1rem;
`;

const SkeletonSubtitle = styled.div<{ $reduced: boolean }>`
  height: 1rem;
  width: 500px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 1000px 100%;
  ${shimmer(false)}
  animation: ${props => getShimmerAnimation(props.$reduced)};
  border-radius: 6px;
`;

const SkeletonGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
`;

const SkeletonCard = styled(motion.div)<{ $reduced: boolean }>`
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  height: 380px;
  border: 1px solid #e5e7eb;
  opacity: ${props => props.$reduced ? 0.6 : 1};
`;

const SkeletonImage = styled.div<{ $reduced: boolean }>`
  width: 100%;
  height: 200px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 1000px 100%;
  ${shimmer(false)}
  animation: ${props => getShimmerAnimation(props.$reduced)};
  border-radius: 8px;
  margin-bottom: 1rem;
`;

const SkeletonText = styled.div<{ width?: string; height?: string; $reduced: boolean }>`
  width: ${props => props.width || '100%'};
  height: ${props => props.height || '1rem'};
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 1000px 100%;
  ${shimmer(false)}
  animation: ${props => getShimmerAnimation(props.$reduced)};
  border-radius: 4px;
  margin-bottom: 0.75rem;
`;

const SkeletonButton = styled.div<{ $reduced: boolean }>`
  height: 2.5rem;
  width: 100%;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 1000px 100%;
  ${shimmer(false)}
  animation: ${props => getShimmerAnimation(props.$reduced)};
  border-radius: 8px;
  margin-top: auto;
`;

interface PageSkeletonProps {
  count?: number;
  showHeader?: boolean;
}

export const PageSkeleton: React.FC<PageSkeletonProps> = ({
  count = 6,
  showHeader = true
}) => {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return (
    <SkeletonContainer>
      {showHeader && (
        <SkeletonHeader>
          <SkeletonTitle $reduced={reducedMotion} />
          <SkeletonSubtitle $reduced={reducedMotion} />
        </SkeletonHeader>
      )}

      <SkeletonGrid>
        {Array.from({ length: count }).map((_, index) => (
          <SkeletonCard
            key={index}
            $reduced={reducedMotion}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reducedMotion ? 0.1 : 0.3, delay: reducedMotion ? 0 : index * 0.05 }}
          >
            <SkeletonImage $reduced={reducedMotion} />
            <SkeletonText width="70%" height="1.25rem" $reduced={reducedMotion} />
            <SkeletonText width="40%" $reduced={reducedMotion} />
            <SkeletonButton $reduced={reducedMotion} />
          </SkeletonCard>
        ))}
      </SkeletonGrid>
    </SkeletonContainer>
  );
};

export default PageSkeleton;
