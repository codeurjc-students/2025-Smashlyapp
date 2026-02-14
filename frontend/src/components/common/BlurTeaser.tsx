import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { FiLock } from 'react-icons/fi';

interface BlurTeaserProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

const TeaserWrapper = styled.div`
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  margin: 3rem auto;
  max-width: 1400px;
  padding: 0 2rem;
`;

const BlurredContent = styled.div`
  filter: blur(8px);
  pointer-events: none;
  user-select: none;
  opacity: 0.6;
`;

const Overlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.7) 0%,
    rgba(255, 255, 255, 0.95) 50%,
    rgba(255, 255, 255, 0.7) 100%
  );
  backdrop-filter: blur(2px);
  padding: 2rem;
  text-align: center;
  gap: 1.5rem;
`;

const LockIcon = styled.div`
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 8px 24px rgba(22, 163, 74, 0.3);
  animation: float 3s ease-in-out infinite;

  @keyframes float {
    0%,
    100% {
      transform: translateY(0px);
    }
    50% {
      transform: translateY(-10px);
    }
  }
`;

const Title = styled.h3`
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--color-gray-900);
  margin: 0;

  @media (max-width: 768px) {
    font-size: 1.5rem;
  }
`;

const Description = styled.p`
  font-size: 1.125rem;
  color: var(--color-gray-600);
  margin: 0;
  max-width: 500px;

  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

const CTAButtons = styled.div`
  display: flex;
  gap: 1rem;

  @media (max-width: 480px) {
    flex-direction: column;
    width: 100%;
  }
`;

const CTAButton = styled(Link)`
  padding: 0.875rem 2rem;
  background: var(--color-primary);
  color: white;
  border-radius: 12px;
  font-weight: 700;
  font-size: 1rem;
  text-decoration: none;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(22, 163, 74, 0.3);

  &:hover {
    background: var(--color-primary-dark);
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(22, 163, 74, 0.4);
    color: white;
    text-decoration: none;
  }
`;

const CTAButtonSecondary = styled(Link)`
  padding: 0.875rem 2rem;
  background: white;
  color: var(--color-primary);
  border: 2px solid var(--color-primary);
  border-radius: 12px;
  font-weight: 700;
  font-size: 1rem;
  text-decoration: none;
  transition: all 0.2s;

  &:hover {
    background: #f0fdf4;
    color: var(--color-primary-dark);
    text-decoration: none;
  }
`;

export const BlurTeaser: React.FC<BlurTeaserProps> = ({
  children,
  title = 'Desbloquea contenido premium',
  description = 'Crea una cuenta gratuita para acceder a comparación de precios, histórico y reviews',
}) => {
  return (
    <TeaserWrapper>
      <BlurredContent>{children}</BlurredContent>
      <Overlay>
        <LockIcon>
          <FiLock size={32} />
        </LockIcon>
        <Title>{title}</Title>
        <Description>{description}</Description>
        <CTAButtons>
          <CTAButton to='/register'>Crear Cuenta Gratis</CTAButton>
          <CTAButtonSecondary to='/login'>Iniciar Sesión</CTAButtonSecondary>
        </CTAButtons>
      </Overlay>
    </TeaserWrapper>
  );
};
