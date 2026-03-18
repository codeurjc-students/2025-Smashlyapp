import styled, { keyframes } from 'styled-components';
import LoadingSpinner from './LoadingSpinner';
import PageSkeleton from './PageSkeleton';

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const FallbackContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #f8faf8 0%, #e8f5e8 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: ${fadeIn} 0.3s ease-in-out;
`;

const SkeletonWrapper = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #f8faf8 0%, #e8f5e8 100%);
  padding: 2rem 0;
  animation: ${fadeIn} 0.3s ease-in-out;
`;

export const RouteLoadingFallback = () => (
  <FallbackContainer>
    <LoadingSpinner fullScreen text='Cargando página...' />
  </FallbackContainer>
);

export const CatalogSkeleton = () => (
  <SkeletonWrapper>
    <PageSkeleton count={9} showHeader />
  </SkeletonWrapper>
);
