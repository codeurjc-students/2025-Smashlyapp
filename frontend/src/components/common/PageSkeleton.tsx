import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';

const shimmer = () => `
  @keyframes shimmer {
    0% { background-position: -1000px 0; }
    100% { background-position: 1000px 0; }
  }
`;

const SkeletonContainer = styled.div`
  width: 100%;
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
`;

const SkeletonHeader = styled.div`
  margin-bottom: 2rem;
`;

const SkeletonTitle = styled.div`
  height: 2.5rem;
  width: 300px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 1000px 100%;
  ${shimmer()}
  animation: shimmer 2s infinite;
  border-radius: 8px;
  margin-bottom: 1rem;
`;

const SkeletonSubtitle = styled.div`
  height: 1rem;
  width: 500px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 1000px 100%;
  ${shimmer()}
  animation: shimmer 2s infinite;
  border-radius: 6px;
`;

const SkeletonGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
`;

const SkeletonCard = styled(motion.div)`
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  height: 380px;
  border: 1px solid #e5e7eb;
`;

const SkeletonImage = styled.div`
  width: 100%;
  height: 200px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 1000px 100%;
  ${shimmer()}
  animation: shimmer 2s infinite;
  border-radius: 8px;
  margin-bottom: 1rem;
`;

const SkeletonText = styled.div<{ width?: string; height?: string }>`
  width: ${props => props.width || '100%'};
  height: ${props => props.height || '1rem'};
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 1000px 100%;
  ${shimmer()}
  animation: shimmer 2s infinite;
  border-radius: 4px;
  margin-bottom: 0.75rem;
`;

const SkeletonButton = styled.div`
  height: 2.5rem;
  width: 100%;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 1000px 100%;
  ${shimmer()}
  animation: shimmer 2s infinite;
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
  return (
    <SkeletonContainer>
      {showHeader && (
        <SkeletonHeader>
          <SkeletonTitle />
          <SkeletonSubtitle />
        </SkeletonHeader>
      )}

      <SkeletonGrid>
        {Array.from({ length: count }).map((_, index) => (
          <SkeletonCard
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <SkeletonImage />
            <SkeletonText width="70%" height="1.25rem" />
            <SkeletonText width="40%" />
            <SkeletonButton />
          </SkeletonCard>
        ))}
      </SkeletonGrid>
    </SkeletonContainer>
  );
};

export default PageSkeleton;
