import React, { useEffect } from 'react';
import styled from 'styled-components';
import { FiX, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

interface ImageLightboxProps {
  images: string[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
  alt: string;
}

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.95);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.2s ease;

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 2rem;
  right: 2rem;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  z-index: 10001;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: scale(1.1);
  }
`;

const NavigationButton = styled.button<{ direction: 'left' | 'right' }>`
  position: absolute;
  top: 50%;
  ${props => (props.direction === 'left' ? 'left: 2rem' : 'right: 2rem')};
  transform: translateY(-50%);
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  z-index: 10001;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-50%) scale(1.1);
  }

  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  @media (max-width: 768px) {
    width: 44px;
    height: 44px;
    ${props => (props.direction === 'left' ? 'left: 1rem' : 'right: 1rem')};
  }
`;

const ImageContainer = styled.div`
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
`;

const LightboxImage = styled.img`
  max-width: 100%;
  max-height: 90vh;
  object-fit: contain;
  animation: zoomIn 0.3s ease;
  user-select: none;

  @keyframes zoomIn {
    from {
      transform: scale(0.9);
      opacity: 0;
    }
    to {
      transform: scale(1);
      opacity: 1;
    }
  }
`;

const Counter = styled.div`
  position: absolute;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 99px;
  font-size: 0.875rem;
  font-weight: 600;
  z-index: 10001;
`;

export const ImageLightbox: React.FC<ImageLightboxProps> = ({
  images,
  currentIndex,
  onClose,
  onNavigate,
  alt,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
        onNavigate(currentIndex - 1);
      } else if (e.key === 'ArrowRight' && currentIndex < images.length - 1) {
        onNavigate(currentIndex + 1);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [currentIndex, images.length, onClose, onNavigate]);

  return (
    <Overlay onClick={onClose}>
      <CloseButton onClick={onClose}>
        <FiX size={24} />
      </CloseButton>

      {images.length > 1 && (
        <>
          <NavigationButton
            direction='left'
            onClick={e => {
              e.stopPropagation();
              if (currentIndex > 0) onNavigate(currentIndex - 1);
            }}
            disabled={currentIndex === 0}
          >
            <FiChevronLeft size={24} />
          </NavigationButton>

          <NavigationButton
            direction='right'
            onClick={e => {
              e.stopPropagation();
              if (currentIndex < images.length - 1) onNavigate(currentIndex + 1);
            }}
            disabled={currentIndex === images.length - 1}
          >
            <FiChevronRight size={24} />
          </NavigationButton>

          <Counter>
            {currentIndex + 1} / {images.length}
          </Counter>
        </>
      )}

      <ImageContainer onClick={e => e.stopPropagation()}>
        <LightboxImage src={images[currentIndex]} alt={`${alt} - imagen ${currentIndex + 1}`} />
      </ImageContainer>
    </Overlay>
  );
};
