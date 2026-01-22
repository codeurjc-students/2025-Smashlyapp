import React from 'react';
import styled, { keyframes } from 'styled-components';

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

const SpinnerContainer = styled.div<{ size?: 'small' | 'medium' | 'large'; fullScreen?: boolean }>`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  ${props => props.fullScreen && 'min-height: 100vh;'}
  padding: ${props => props.fullScreen ? '2rem' : '1rem'};
  gap: 1rem;
`;

const Spinner = styled.div<{ size?: 'small' | 'medium' | 'large' }>`
  border: 3px solid rgba(22, 163, 74, 0.1);
  border-top: 3px solid #16a34a;
  border-radius: 50%;
  width: ${props => {
    switch (props.size) {
      case 'small': return '24px';
      case 'large': return '64px';
      default: return '40px';
    }
  }};
  height: ${props => {
    switch (props.size) {
      case 'small': return '24px';
      case 'large': return '64px';
      default: return '40px';
    }
  }};
  animation: ${spin} 1s linear infinite;
`;

const LoadingText = styled.p<{ size?: 'small' | 'medium' | 'large' }>`
  color: #6b7280;
  font-size: ${props => {
    switch (props.size) {
      case 'small': return '0.875rem';
      case 'large': return '1.25rem';
      default: return '1rem';
    }
  }};
  font-weight: 500;
  margin: 0;
  animation: ${pulse} 1.5s ease-in-out infinite;
`;

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  text?: string;
  fullScreen?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  text = 'Cargando...',
  fullScreen = false
}) => {
  return (
    <SpinnerContainer size={size} fullScreen={fullScreen}>
      <Spinner size={size} />
      {text && <LoadingText size={size}>{text}</LoadingText>}
    </SpinnerContainer>
  );
};

export default LoadingSpinner;
