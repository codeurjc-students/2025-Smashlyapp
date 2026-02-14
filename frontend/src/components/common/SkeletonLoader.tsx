import styled, { keyframes } from 'styled-components';

const shimmer = keyframes`
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
`;

const SkeletonBase = styled.div`
  background: linear-gradient(
    90deg,
    var(--color-gray-100) 0%,
    var(--color-gray-50) 50%,
    var(--color-gray-100) 100%
  );
  background-size: 1000px 100%;
  animation: ${shimmer} 2s infinite linear;
  border-radius: 8px;
`;

const SkeletonContainer = styled.div`
  min-height: 100vh;
  background: var(--color-gray-50);
  padding-bottom: 4rem;
`;

const SkeletonBreadcrumbs = styled(SkeletonBase)`
  max-width: 1400px;
  margin: 0 auto;
  padding: 1rem 2rem;
  height: 20px;
  width: 300px;
  margin-bottom: 2rem;
`;

const SkeletonGrid = styled.div`
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 3rem;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2rem;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
`;

const SkeletonGallery = styled.div`
  background: white;
  border-radius: 24px;
  padding: 2rem;
  min-height: 600px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const SkeletonMainImage = styled(SkeletonBase)`
  width: 100%;
  height: 450px;
`;

const SkeletonThumbnails = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
`;

const SkeletonThumbnail = styled(SkeletonBase)`
  width: 70px;
  height: 70px;
  border-radius: 12px;
`;

const SkeletonInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const SkeletonTag = styled(SkeletonBase)`
  width: 120px;
  height: 24px;
  border-radius: 6px;
`;

const SkeletonTitle = styled(SkeletonBase)`
  width: 100%;
  height: 60px;
  border-radius: 12px;
`;

const SkeletonRating = styled(SkeletonBase)`
  width: 200px;
  height: 20px;
`;

const SkeletonPriceCard = styled.div`
  background: white;
  border-radius: 20px;
  padding: 1.5rem;
  border: 1px solid var(--color-gray-200);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const SkeletonPrice = styled(SkeletonBase)`
  height: 60px;
  width: 200px;
`;

const SkeletonButton = styled(SkeletonBase)`
  height: 56px;
  width: 100%;
  border-radius: 12px;
`;

const SkeletonSpecsSection = styled.div`
  max-width: 1400px;
  margin: 3rem auto 0;
  padding: 0 2rem;
`;

const SkeletonSpecsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-top: 1rem;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const SkeletonSpecCard = styled.div`
  background: white;
  padding: 1rem;
  border-radius: 12px;
  border: 1px solid var(--color-gray-100);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const SkeletonSpecLabel = styled(SkeletonBase)`
  width: 80px;
  height: 12px;
`;

const SkeletonSpecValue = styled(SkeletonBase)`
  width: 120px;
  height: 20px;
`;

export const RacketDetailSkeleton: React.FC = () => {
  return (
    <SkeletonContainer>
      <SkeletonBreadcrumbs />

      <SkeletonGrid>
        <SkeletonGallery>
          <SkeletonMainImage />
          <SkeletonThumbnails>
            {[1, 2, 3, 4, 5].map(i => (
              <SkeletonThumbnail key={i} />
            ))}
          </SkeletonThumbnails>
        </SkeletonGallery>

        <SkeletonInfo>
          <SkeletonTag />
          <SkeletonTitle />
          <SkeletonRating />

          <SkeletonPriceCard>
            <SkeletonBase style={{ height: '16px', width: '160px' }} />
            <SkeletonPrice />
            <SkeletonButton />
            <SkeletonButton />
          </SkeletonPriceCard>
        </SkeletonInfo>
      </SkeletonGrid>

      <SkeletonSpecsSection>
        <SkeletonBase style={{ height: '32px', width: '280px', marginBottom: '1rem' }} />
        <SkeletonSpecsGrid>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <SkeletonSpecCard key={i}>
              <SkeletonSpecLabel />
              <SkeletonSpecValue />
            </SkeletonSpecCard>
          ))}
        </SkeletonSpecsGrid>
      </SkeletonSpecsSection>
    </SkeletonContainer>
  );
};
