import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { FiLock, FiLogIn, FiUserPlus } from 'react-icons/fi';

interface ContentLockProps {
  isLocked: boolean;
  children: ReactNode;
  title?: string;
  description?: string;
  feature?: string;
}

/**
 * ContentLock - Auth gate component for premium content
 * 
 * Wraps content and displays a blur overlay with login CTA when locked.
 * Modern, professional design with smooth transitions.
 */
export const ContentLock: React.FC<ContentLockProps> = ({
  isLocked,
  children,
  title = "Premium Feature",
  description = "Sign in to access this feature",
}) => {
  if (!isLocked) {
    return <>{children}</>;
  }

  return (
    <LockContainer>
      {/* Blurred content underneath */}
      <BlurredContent aria-hidden="true">
        {children}
      </BlurredContent>

      {/* Lock overlay */}
      <LockOverlay>
        <LockCard>
          <IconWrapper>
            <FiLock size={48} />
          </IconWrapper>
          
          <LockTitle>{title}</LockTitle>
          <LockDescription>{description}</LockDescription>

          <ButtonGroup>
            <LoginButton to="/login">
              <FiLogIn size={20} />
              Log In
            </LoginButton>
            <SignUpButton to="/register">
              <FiUserPlus size={20} />
              Sign Up
            </SignUpButton>
          </ButtonGroup>

          <SubText>
            Get access to price tracking, reviews, and more
          </SubText>
        </LockCard>
      </LockOverlay>
    </LockContainer>
  );
};

// --- Styled Components ---

const LockContainer = styled.div`
  position: relative;
  min-height: 300px;
`;

const BlurredContent = styled.div`
  filter: blur(8px);
  pointer-events: none;
  user-select: none;
  opacity: 0.6;
`;

const LockOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(4px);
  z-index: 10;
  padding: 2rem;
`;

const LockCard = styled.div`
  background: white;
  border-radius: 24px;
  padding: 3rem 2.5rem;
  max-width: 500px;
  width: 100%;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.05);
  text-align: center;
  animation: slideUp 0.3s ease-out;

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (max-width: 640px) {
    padding: 2rem 1.5rem;
  }
`;

const IconWrapper = styled.div`
  width: 80px;
  height: 80px;
  margin: 0 auto 1.5rem;
  background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 8px 20px rgba(22, 163, 74, 0.3);
`;

const LockTitle = styled.h3`
  font-size: 1.75rem;
  font-weight: 800;
  color: #111827;
  margin: 0 0 0.75rem 0;
  line-height: 1.2;

  @media (max-width: 640px) {
    font-size: 1.5rem;
  }
`;

const LockDescription = styled.p`
  font-size: 1.05rem;
  color: #6b7280;
  margin: 0 0 2rem 0;
  line-height: 1.5;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;

  @media (max-width: 480px) {
    flex-direction: column;
  }
`;

const LoginButton = styled(Link)`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem 1.5rem;
  background: #16a34a;
  color: white;
  border-radius: 12px;
  font-weight: 700;
  font-size: 1rem;
  text-decoration: none;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(22, 163, 74, 0.25);

  &:hover {
    background: #15803d;
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(22, 163, 74, 0.35);
    color: white;
  }

  &:active {
    transform: translateY(0);
  }
`;

const SignUpButton = styled(Link)`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem 1.5rem;
  background: white;
  color: #16a34a;
  border: 2px solid #16a34a;
  border-radius: 12px;
  font-weight: 700;
  font-size: 1rem;
  text-decoration: none;
  transition: all 0.2s;

  &:hover {
    background: #f0fdf4;
    color: #15803d;
    border-color: #15803d;
  }

  &:active {
    transform: scale(0.98);
  }
`;

const SubText = styled.p`
  font-size: 0.875rem;
  color: #9ca3af;
  margin: 0;
  font-weight: 500;
`;
