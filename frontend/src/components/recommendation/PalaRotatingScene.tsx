import React from 'react';
import styled, { keyframes } from 'styled-components';
import { FiCheck } from 'react-icons/fi';

const spin3D = keyframes`
  0% {
    transform: rotateY(0deg) rotateX(10deg);
  }
  100% {
    transform: rotateY(360deg) rotateX(10deg);
  }
`;

const pulse = keyframes`
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.8;
  }
`;

const float = keyframes`
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
`;

const SceneContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  position: relative;
  overflow: hidden;
`;

const PalaContainer = styled.div`
  width: 200px;
  height: 280px;
  perspective: 1000px;
  animation: ${spin3D} 8s linear infinite;
`;

const PalaSVG = styled.svg`
  width: 100%;
  height: 100%;
  filter: drop-shadow(0 20px 40px rgba(22, 163, 74, 0.3));
`;

const SuccessRing = styled.div`
  position: absolute;
  width: 300px;
  height: 300px;
  border-radius: 50%;
  border: 3px solid #16a34a;
  opacity: 0;
  animation: ${pulse} 2s ease-in-out infinite;
  animation-delay: 0.5s;
`;

const Checkmark = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: #16a34a;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 40px;
  animation: ${float} 2s ease-in-out infinite;
  animation-delay: 1s;
`;

const LoadingText = styled.p`
  margin-top: 2rem;
  font-size: 1.2rem;
  color: #374151;
  font-weight: 500;
  animation: ${pulse} 1.5s ease-in-out infinite;
`;

interface PalaRotatingSceneProps {
  isComplete?: boolean;
}

export const PalaRotatingScene: React.FC<PalaRotatingSceneProps> = ({ isComplete = false }) => {
  return (
    <SceneContainer>
      <PalaContainer>
        <PalaSVG viewBox="0 0 200 280" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="palaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#16a34a" />
              <stop offset="100%" stopColor="#15803d" />
            </linearGradient>
            <linearGradient id="gripGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1f2937" />
              <stop offset="100%" stopColor="#374151" />
            </linearGradient>
            <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="8" floodOpacity="0.3" />
            </filter>
          </defs>
          
          <ellipse cx="100" cy="100" rx="95" ry="95" fill="url(#palaGradient)" filter="url(#shadow)" />
          
          <ellipse cx="100" cy="100" rx="85" ry="85" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
          
          <ellipse cx="100" cy="100" rx="40" ry="40" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
          
          <circle cx="100" cy="100" r="20" fill="rgba(0,0,0,0.1)" />
          
          <rect x="90" y="195" width="20" height="70" rx="4" fill="url(#gripGradient)" />
          
          <rect x="85" y="260" width="30" height="15" rx="3" fill="#374151" />
          
          <path d="M 60 60 Q 100 80 140 60" stroke="rgba(255,255,255,0.3)" strokeWidth="2" fill="none" />
          <path d="M 50 100 Q 100 120 150 100" stroke="rgba(255,255,255,0.2)" strokeWidth="1" fill="none" />
          <path d="M 60 140 Q 100 160 140 140" stroke="rgba(255,255,255,0.2)" strokeWidth="1" fill="none" />
        </PalaSVG>
      </PalaContainer>
      
      {!isComplete && <LoadingText>Analizando tu perfil...</LoadingText>}
      
      {isComplete && (
        <>
          <SuccessRing />
          <Checkmark>
            <FiCheck />
          </Checkmark>
        </>
      )}
    </SceneContainer>
  );
};

export default PalaRotatingScene;
